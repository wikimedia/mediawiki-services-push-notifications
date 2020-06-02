import * as admin from 'firebase-admin';
import { SingleDeviceMessage } from '../shared/Message';

export function init() {
    if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
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

async function send(logger: Logger, fcmMessage: FcmMessage) {
    return admin.messaging()
        .send(fcmMessage)
        .then((messageId) => {
            logger.log('debug/fcm', `Successfully sent message: ${messageId}`);
            return messageId;
        });
}

export async function sendMessage(logger: Logger, message: SingleDeviceMessage) {
    return send(logger, {
        token: message.deviceToken,
        data: {
            type: message.messageType
        },
        android: {
            collapseKey: message.messageType
        }
    });
}
