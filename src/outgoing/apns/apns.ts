import { Provider, ProviderOptions, Notification, Responses } from 'apn';
import { Provider as MockProvider } from 'apn/mock';
import { MultiDeviceMessage } from '../shared/Message';

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
export function init(conf) {
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
 * @param {Logger} logger App logger instance
 * @param {SingleDeviceMessage} message Notification to be pushed to device
 */
export async function sendMessage(logger: Logger, message: MultiDeviceMessage) {
    let result: Promise<Responses>;

    if (!message.dryRun) {
        const notification = new Notification();
        notification.payload = { data: { type: message.messageType } };
        notification.threadId = message.messageType;
        result = apn.send(notification, message.deviceTokens);
    } else {
        const responses: Responses = {
            sent: [{ device: 'dryRun' }],
            failed: []
        };
        result = new Promise((resolve) => resolve(responses));
    }

    return result;
}
