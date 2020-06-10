import * as routing from '../lib/routing';
import { MultiDeviceMessage } from '../outgoing/shared/Message';
import { sendMessage as sendFcmMessage } from '../outgoing/fcm/fcm';
import { sendMessage as sendApnsMessage } from '../outgoing/apns/apns';

// shortcut
const HTTPError = routing.HTTPError;

/**
 * The main router object
 */
const router = routing.router();

/**
 * POST /message/fcm
 * Sends a push notification message to FCM.
 */
router.post('/message/fcm', (req, res) => {
    const message: MultiDeviceMessage = req.body;

    return sendFcmMessage(req.logger, message)
    .then(() => {
        res.status(200).json({});
    })
    .catch((error) => {
        req.logger.log('error/fcm', `Error sending message: ${error}`);
        throw new HTTPError({
            status: 500,
            type: 'fcm_send_failed',
            title: 'Failed to send message to FCM',
            detail: error
        });
    });
});

/**
 * POST /message/apns
 * Sends a push notification message to APNS.
 */
router.post('/message/apns', (req, res) => {
    const message: MultiDeviceMessage = req.body;
    return sendApnsMessage(req.logger, message).then(
        (apnsResponses) => {
            req.logger.log('debug/apns', `Successfully sent messages: ${JSON.stringify(apnsResponses.sent)}`);
            res.status(200).json(apnsResponses);
        }
    ).catch((error) => {
        req.logger.log('error/apns', `Error sending message: ${error}`);
        throw new HTTPError({
            status: 500,
            type: 'apns_send_failed',
            title: 'Failed to send message to APNS',
            detail: error
        });
    });
});

module.exports = () => {
    return {
        path: '/v1/',
        skip_domain: true,
        router
    };
};

export {};
