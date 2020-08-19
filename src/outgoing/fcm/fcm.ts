import * as admin from 'firebase-admin';
import prometheusClient from 'prom-client';
import { MultiDeviceMessage } from '../shared/Message';

export function init(conf): void {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            httpAgent: conf.proxyAgent
        });
    }
}

async function send(logger: Logger,
                    metrics: Metrics,
                    message: admin.messaging.MulticastMessage,
                    dryRun?: boolean):
    Promise<void> {
    const transactionStart = Date.now();
    const response: admin.messaging.BatchResponse = await admin.messaging()
        .sendMulticast(message, dryRun);

    metrics.makeMetric({
        type: 'Histogram',
        name: 'FCMTransactionTiming',
        prometheus: {
            name: 'push_notifications_fcm_transaction_histogram',
            help: 'Time spent on a transaction with the FCM service',
            buckets: prometheusClient.exponentialBuckets(0.005, 2, 15)
        }
    }).observe(Date.now() - transactionStart);

    logger.log('debug/fcm', `Successfully sent ${response.successCount} messages; ` +
        `${response.failureCount} messages failed`);

    metrics.makeMetric({
        type: 'Counter',
        name: 'FCMSendSuccess',
        prometheus: {
            name: 'push_notifications_fcm_send_success',
            help: 'Count of successful FCM notifications sent'
        }
    }).increment(response.successCount);

    metrics.makeMetric({
        type: 'Counter',
        name: 'FCMSendFailure',
        prometheus: {
            name: 'push_notifications_fcm_send_failure',
            help: 'Count of failed FCM notifications sent'
        }
    }).increment(response.failureCount);
}

export async function sendMessage(logger: Logger,
                                  metrics: Metrics,
                                  message: MultiDeviceMessage): Promise<void> {
    return send(logger, metrics, {
            tokens: [...message.deviceTokens],
            data: {
                type: message.type
            },
            android: {
                collapseKey: message.type
            }
    }, message.dryRun);
}
