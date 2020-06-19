import * as admin from 'firebase-admin';
import { MultiDeviceMessage } from '../shared/Message';

export function init(conf): void {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            httpAgent: conf.proxyAgent
        });
    }
}

async function send(logger: Logger, message: admin.messaging.MulticastMessage, dryRun?: boolean):
    Promise<void> {
    const response: admin.messaging.BatchResponse = await admin.messaging()
        .sendMulticast(message, dryRun);
    logger.log('debug/fcm', `Successfully sent ${response.successCount} messages; ` +
        `${response.failureCount} messages failed`);
}

export async function sendMessage(logger: Logger, message: MultiDeviceMessage): Promise<void> {
    return send(logger, {
            tokens: [...message.deviceTokens],
            data: {
                type: message.type
            },
            android: {
                collapseKey: message.type
            }
    }, message.dryRun);
}
