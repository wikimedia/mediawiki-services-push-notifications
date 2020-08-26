import { Provider, ProviderOptions, Notification, Responses } from 'apn';
import { Provider as MockProvider } from 'apn/mock';
import { MultiDeviceMessage } from '../shared/Message';
import prometheusClient from 'prom-client';

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
 * @param {*} conf App conf
 */
export function init(conf: any): void {
    if (!apn) {
        if (conf.apns.mock) {
            apn = new MockProvider();
        } else {
            apn = new Provider(getOptions(conf));
        }
    }
}

/**
 * Send notification to APNS
 * @export
 * @param {!Logger} logger
 * @param {!Metrics} metrics
 * @param {!MultiDeviceMessage} message Notification to be pushed to device
 * @return {!Promise<Responses>}
 */
export async function sendMessage(logger: Logger,
                                  metrics: Metrics,
                                  message: MultiDeviceMessage): Promise<Responses> {
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
        logger.log('debug/apns', JSON.stringify(message));
        metrics.makeMetric(transactionHistogramArgs).observe(Date.now() - transactionStart);
        return message;
    }

    const notification = new Notification();
    notification.payload = { data: { type: message.type } };
    notification.threadId = message.type;
    notification.topic = message.meta.topic;
    const response: Responses = await apn.send(notification, [...message.deviceTokens]);

    metrics.makeMetric(transactionHistogramArgs).observe(Date.now() - transactionStart);

    logger.log('debug/apns', `Successfully sent ${(response.sent.length)} messages; ` +
        `${response.failed.length} messages failed`);

    metrics.makeMetric({
        type: 'Counter',
        name: 'APNSSendSuccess',
        prometheus: {
            name: 'push_notifications_apns_send_success',
            help: 'Count of successful APNS notifications sent'
        }
    }).increment(response.sent.length);

    metrics.makeMetric({
        type: 'Counter',
        name: 'APNSSendFailure',
        prometheus: {
            name: 'push_notifications_apns_send_failure',
            help: 'Count of failed APNS notifications sent'
        }
    }).increment(response.failed.length);

    return response;
}
