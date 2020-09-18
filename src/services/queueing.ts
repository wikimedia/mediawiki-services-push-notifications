/**
 * The purpose of this module is to provide means by which to increase the difficulty of
 * inferring connections between on-wiki actions and traffic on the public internet, in order to
 * mitigate user privacy risks associated with push notifications. It does so by providing
 * for batching requests up to a configurable max count and/or length of time before submission.
 * Further, the max length of time for batching may be randomized within configurable bounds.
 * Note that randomization will apply on a per-worker basis; in other words, if queue flush
 * timeouts are randomized, each worker node will have a different random flush timeout per
 * notification provider and type.
 */
import Queue from 'buffered-queue';
import prometheusClient from 'prom-client';
import { Responses } from '@wikimedia/apn';
import {
    getFailedTokens as getFcmFailedTokens,
    getMulticastMessage,
    sendMessage as sendFcmMessage
} from '../outgoing/fcm/fcm';
import {
    getFailedTokens as getApnsFailedTokens,
    sendMessage as sendApnsMessage
} from '../outgoing/apns/apns';
import * as admin from 'firebase-admin';
import { MultiDeviceMessage, PushProvider, SingleDeviceMessage } from '../outgoing/shared/Message';
import {
    DEFAULT_FLUSH_TIMEOUT_MS,
    DEFAULT_MAX_QUEUE_SIZE,
    getFlushTimeout,
    QueueOptions,
    validateQueueingConfig
} from '../loaders/queueConfig';
import { sendSubscriptionDeleteRequest } from '../outgoing/shared/mwapi';

// TODO: Drop the shim and use the native Promise.allSettled when we migrate to Node 12
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
import allSettled from 'promise.allsettled';
import messaging = admin.messaging;
import BatchResponse = messaging.BatchResponse;

allSettled.shim();

// Max recipients per sendAll or sendMulticast request according to FCM docs.
// We'll also use it for APNS, even though APNS does not specify any limit, because there appears to
// be an issue with sending large numbers of tokens per request via node-apn.
// https://github.com/node-apn/node-apn/issues/557
export const MAX_MULTICAST_RECIPIENTS = 500;

/**
 * Adds an enqueued message to a batch for submission to a provider gateway. Messages are
 * batched in MultiDeviceMessages per provider, type, and whether or not the message is for dry
 * run, according to the following logic:
 * 1) A message batching key is constructed from the message's provider, type, and dryRun status.
 *    This batching key will correspond to an array of MultiDeviceMessages containing batched
 *    messages with the same provider, type, and dryRun properties.
 * 2) If this key has not yet been encountered, create a new batch (i.e., set the value for the
 *    key to a new array containing a new MultiDeviceMessage constructed from the current
 *    SingleDeviceMessage.
 * 3) If the MultiDeviceMessage at the tail of the array for the batching key is full (i.e., has >=
 *    MAX_MULTICAST_RECIPIENTS tokens in its deviceTokens property), then append a new
 *    MultiDeviceMessage constructed from the current SingleDeviceMessage.
 * 4) Otherwise, add the current message's deviceToken to the deviceTokens set for the
 *    MultiDeviceMessage at the tail of the batched message array.
 * N.B. This function returns void but updates the state of the batchedMessages object passed in
 * from outside the function scope.
 *
 * @param {!any} batchedMessages
 * @param {!SingleDeviceMessage} message
 */
function addBatchableMessage(batchedMessages: any, message: SingleDeviceMessage): void {
    const topic = message.meta && message.meta.topic || '';
    const dryRun = message.dryRun ? 'dryRun' : '';
    const key = `${message.provider}:${message.type}:${topic}:${dryRun}`;
    if (!batchedMessages[key]) {
        batchedMessages[key] = [ new MultiDeviceMessage(
            new Set([ message.deviceToken ]),
            message.provider,
            message.type,
            message.meta,
            message.dryRun
        ) ];
        return;
    }
    if (batchedMessages[key][batchedMessages[key].length - 1].deviceTokens.size >=
        MAX_MULTICAST_RECIPIENTS) {
        batchedMessages[key].push(new MultiDeviceMessage(
            new Set([ message.deviceToken ]),
            message.provider,
            message.type,
            message.meta,
            message.dryRun
        ));
        return;
    }
    batchedMessages[key][batchedMessages[key].length - 1].deviceTokens.add(message.deviceToken);
}

/**
 * Consolidates messages for efficient batched sending by provider, type, and dryRun status.
 *
 * @param {!Array<SingleDeviceMessage>} messages
 * @return {!Array<MultiDeviceMessage>}
 */
function getBatchedMessages(messages: Array<SingleDeviceMessage>): Array<MultiDeviceMessage> {
    const batchedMessages = {};

    messages.forEach((message: SingleDeviceMessage) => {
        addBatchableMessage(batchedMessages, message);
    });

    return [].concat(...Object.values(batchedMessages));
}

/**
 * Enqueue messages for one or more device tokens. If a queue does not yet exist for the provider
 * and message type, a new queue is lazily initialized.
 *
 * @param {!Queue} queue the app's message queue
 * @param {!MultiDeviceMessage} message
 */
export function enqueueMessages(queue: Queue, message: MultiDeviceMessage): void {
    message.toSingleDeviceMessages().forEach((msg) => {
        msg.enqueueTimestamp = Date.now();
        queue.add(msg);
    });
}

/**
 * Initialize and return a queue for the provider and message type.
 *
 * @param {!Application} app
 */
export function init(app: any): Queue {
    const options: QueueOptions = app.conf && app.conf.queueing || {};
    const flushTimeoutMs = getFlushTimeout(options) || DEFAULT_FLUSH_TIMEOUT_MS;
    const maxSize = options.maxSize || DEFAULT_MAX_QUEUE_SIZE;
    const queue = new Queue('push', {
        size: maxSize,
        flushTimeout: flushTimeoutMs,
        verbose: options.verbose
    });

    validateQueueingConfig(options);

    queue.on('flush', async (messages) => {
        const histogram = app.metrics.makeMetric({
            type: 'Histogram',
            name: 'NotificationQueueTime',
            prometheus: {
                name: 'push_notifications_notification_queue_time',
                help: 'Time the notification spent in the queue',
                buckets: prometheusClient.linearBuckets(0, flushTimeoutMs / 20, 20)
            }
        });

        messages.forEach((message: SingleDeviceMessage) => {
            histogram.observe(Date.now() - message.enqueueTimestamp);
        });

        app.metrics.makeMetric({
            type: 'Gauge',
            name: 'QueueSizeOnFlush',
            prometheus: {
                name: 'push_notifications_queue_size_on_flush',
                help: 'Reported size of queue on flush'
            }
        }).set(messages.length);

        const batchedMessages = getBatchedMessages(messages);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: method added by shim
        // eslint-disable-next-line es/no-promise-all-settled
        return Promise.allSettled(batchedMessages.map(async (message: MultiDeviceMessage) => {
            switch (message.provider) {
                case PushProvider.FCM: {
                    const multicastMessage = getMulticastMessage(message);
                    const response: BatchResponse = await sendFcmMessage(app, multicastMessage,
                        message.dryRun);
                    const failedTokens = getFcmFailedTokens(multicastMessage, response);
                    if (failedTokens.length) {
                        return sendSubscriptionDeleteRequest(app, failedTokens);
                    }
                    return;
                }
                case PushProvider.APNS: {
                    const response: Responses = await sendApnsMessage(app, message);
                    const failedTokens = getApnsFailedTokens(response);
                    if (failedTokens.length) {
                        return sendSubscriptionDeleteRequest(app, failedTokens);
                    }
                    return;
                }
                default:
                    throw new Error(`Found unknown provider ${message.provider}`);
            }
        }));
    });

    app.queue = queue;
    app.logger.log('debug/queueing',
        `Initialized queue: max size: ${maxSize}, flush timeout (ms): ${flushTimeoutMs}`);
}
