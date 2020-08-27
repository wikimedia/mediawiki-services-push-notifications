import { Provider, ProviderOptions, Notification, Responses } from 'apn';
import { Provider as MockProvider } from 'apn/mock';
import { MultiDeviceMessage } from '../shared/Message';
import prometheusClient from 'prom-client';
import { Application } from 'express';

let apn: Provider;

interface ProviderOptionsProxy {
    proxy?: any;
}

/**
 * Get the options to initialize APNS client
 * If token based auth is defined in config then its preferred
 * Fallback to cert based auth
 * @param {*} conf
 * @return {ProviderOptions}
 */
function getOptions(conf): ProviderOptions {
    let options: ProviderOptions & ProviderOptionsProxy = {};

    if (conf.apns.production) {
        options = { production: conf.apns.production };
    }

    if (conf.proxy) {
        options = {
            ...options,
            proxy: {
                host: conf.proxy.host,
                port: conf.proxy.port
            }
        };
    }

    if (conf.apns.token) {
        return {
            ...options, ...{
                token: {
                    key: conf.apns.token.key,
                    keyId: conf.apns.token.keyId,
                    teamId: conf.apns.token.teamId
                }
            }
        };
    }

    return {
        ...options, ...{
            pfx: conf.apns.cert
        }
    };
}

/**
 * Initialize APNS client. Uses mock if configured accordingly.
 * @export
 * @param {!Application} app Express app
 */
export function init(app: Application): void {
    if (!apn) {
        if (app.conf.apns.mock) {
            apn = new MockProvider();
        } else {
            apn = new Provider(getOptions(app.conf));
        }
    }
}

/**
 * Send notification to APNS
 * @param {!Application} app
 * @param {!MultiDeviceMessage} message Notification to be pushed to device
 * @return {!Promise<Responses>}
 */
export async function sendMessage(app: Application, message: MultiDeviceMessage):
    Promise<Responses> {
    const transactionHistogramArgs = {
        type: 'Histogram',
        name: 'APNSTransactionHistogram',
        prometheus: {
            name: 'push_notifications_apns_transaction_histogram',
            help: 'Time spent on a transaction with the APNS service',
            buckets: prometheusClient.exponentialBuckets(0.005, 2, 15)
        }
    };
    const transactionStart = Date.now();

    if (message.dryRun) {
        const message: Responses = {
            sent: [{ device: 'dryRun' }],
            failed: []
        };
        app.logger.log('debug/apns', JSON.stringify(message));
        app.metrics.makeMetric(transactionHistogramArgs).observe(Date.now() - transactionStart);
        return message;
    }

    const notification = new Notification();
    notification.payload = { data: { type: message.type } };
    notification.threadId = message.type;
    notification.topic = message.meta.topic;
    const response: Responses = await apn.send(notification, [...message.deviceTokens]);

    app.logger.log('debug/apns', `Successfully sent ${(response.sent.length)} messages; ` +
        `${response.failed.length} messages failed`);

    app.metrics.makeMetric(transactionHistogramArgs).observe(Date.now() - transactionStart);

    const successCount = response.sent.length;
    app.metrics.makeMetric({
        type: 'Counter',
        name: 'APNSSendSuccess',
        prometheus: {
            name: 'push_notifications_apns_send_success',
            help: 'Count of successful APNS notifications sent'
        }
    }).increment(
        successCount === null || successCount === undefined ? 0 : successCount
    );

    const failureCount = response.failed.length;
    app.metrics.makeMetric({
        type: 'Counter',
        name: 'APNSSendFailure',
        prometheus: {
            name: 'push_notifications_apns_send_failure',
            help: 'Count of failed APNS notifications sent'
        }
    }).increment(
        failureCount === null || failureCount === undefined ? 0 : failureCount
    );

    return response;
}

export function getFailedTokens(response: Responses): string[] {
    return response.failed.map((rsp) => rsp.device);
}
