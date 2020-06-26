import * as admin from 'firebase-admin';
import { MultiDeviceMessage } from '../shared/Message';

export function init(conf) {
    if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.applicationDefault(), httpAgent: conf.proxyAgent });
    }
}

/** Shape of message sent to FCM */
export interface FcmMessage {
    token: string;
    data: {
        type: string;
    };
    android: {
        collapseKey: string;
    };
}

async function send(logger: Logger, fcmMessages: Array<FcmMessage>, dryRun?: boolean) {
    return admin.messaging()
        .sendAll(fcmMessages, dryRun)
        .then((response) => {
            logger.log('debug/fcm', `Successfully sent ${response.successCount} messages; ` +
                `${response.failureCount} messages failed`);
        });
}

export async function sendMessage(logger: Logger, message: MultiDeviceMessage) {
    return send(logger, message.deviceTokens.map((deviceToken) => {
        return {
            token: deviceToken,
            data: {
                type: message.messageType
            },
            android: {
                collapseKey: message.messageType
            }
        };
    }), message.dryRun);
}
