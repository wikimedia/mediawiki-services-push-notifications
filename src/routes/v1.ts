import * as routing from '../lib/routing';
import { MessageMeta, MultiDeviceMessage, PushProvider } from '../outgoing/shared/Message';
import { enqueueMessages } from '../services/queueing';

const router = routing.router();

let app;

/**
 * POST /message/fcm
 * Sends or enqueues a push notification message to FCM.
 */
router.post('/message/fcm', async (req, res) => {
	const meta = {};
	const message: MultiDeviceMessage = new MultiDeviceMessage(
		req.body.deviceTokens,
		PushProvider.FCM,
		req.body.messageType,
		meta,
		!!req.body.dryRun
	);
	await enqueueMessages(app.queue, message);
	res.status(200).json({});
});

/**
 * POST /message/apns
 * Sends or enqueues a push notification message to APNS.
 */
router.post('/message/apns', async (req, res) => {
	const meta: MessageMeta = ((req.body.topic) ? { topic: req.body.topic } : {});
	const message: MultiDeviceMessage = new MultiDeviceMessage(
		req.body.deviceTokens,
		PushProvider.APNS,
		req.body.messageType,
		meta,
		!!req.body.dryRun
	);
	await enqueueMessages(app.queue, message);
	res.status(200).json({});
});

module.exports = (appObj) => {
	app = appObj;
	return {
		path: '/v1/',
		skip_domain: true,
		router
	};
};

export {};
