import * as routing from '../lib/routing';
import { MultiDeviceMessage } from '../outgoing/shared/Message';
import { sendMessage as sendFcmMessage } from '../outgoing/fcm/fcm';

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

module.exports = () => {
    return {
        path: '/v1/',
        skip_domain: true,
        router
    };
};

export {};
