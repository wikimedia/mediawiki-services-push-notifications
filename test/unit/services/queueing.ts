import assert from 'assert';
import rewire from 'rewire';
import Queue from 'buffered-queue';
import {
	MessageType,
	MultiDeviceMessage,
	PushProvider,
	SingleDeviceMessage
} from '../../../src/outgoing/shared/Message';
const makeMetrics = require('service-runner/lib/metrics');
import Logger from '../../mocks/logger';

const queueing = rewire('../../../src/services/queueing');

describe('unit:queueing', () => {
	describe('init', () => {
		const init = queueing.__get__('init');
		const logger = new Logger();
		const app: any = {
			conf: {},
			logger,
			metrics: makeMetrics([{
				type: 'prometheus',
				port: 9000,
				name: 'test'
			}], logger)
		};

		it('initializes queue', () => {
			init(app);
			assert.ok(app.queue instanceof Queue);
			assert.deepEqual(app.queue.name, 'push');
		});
	});

	describe('getBatchedMessages', () => {
		const getBatchedMessages = queueing.__get__('getBatchedMessages');

		it('batches messages (same provider & dryRun status)', () => {
			const tokens = ['a', 'b', 'c'];
			const queuedMessages = tokens.map((token) => {
				return new SingleDeviceMessage(token, PushProvider.APNS, MessageType.CheckEchoV1, {},
					false);
			});
			assert.deepStrictEqual(getBatchedMessages(queuedMessages), [ new MultiDeviceMessage(
				new Set(tokens),
				PushProvider.APNS,
				MessageType.CheckEchoV1,
				{},
				false
			) ]);
		});

		it('deduplicates messages (same provider & dryRun status)', () => {
			const tokens = ['a', 'a', 'a'];
			const queuedMessages = tokens.map((token) => {
				return new SingleDeviceMessage(token, PushProvider.APNS, MessageType.CheckEchoV1, {},
					false);
			});
			assert.deepStrictEqual(getBatchedMessages(queuedMessages), [ new MultiDeviceMessage(
				new Set(['a']),
				PushProvider.APNS,
				MessageType.CheckEchoV1,
				{},
				false
			) ]);
		});

		it('batches messages (different provider, topic, & dryRun status)', () => {
			const queuedMessages = [
				new SingleDeviceMessage('a', PushProvider.FCM, MessageType.CheckEchoV1, {}, true),
				new SingleDeviceMessage('a', PushProvider.FCM, MessageType.CheckEchoV1, {}, false),
				new SingleDeviceMessage('a', PushProvider.APNS, MessageType.CheckEchoV1, { topic: 'foo' }),
				new SingleDeviceMessage('a', PushProvider.APNS, MessageType.CheckEchoV1, { topic: 'bar' })
			];
			assert.deepStrictEqual(getBatchedMessages(queuedMessages), [
				new MultiDeviceMessage(new Set(['a']), PushProvider.FCM, MessageType.CheckEchoV1, {}, true),
				new MultiDeviceMessage(new Set(['a']), PushProvider.FCM, MessageType.CheckEchoV1, {}, false),
				new MultiDeviceMessage(new Set(['a']), PushProvider.APNS, MessageType.CheckEchoV1, { topic: 'foo' }),
				new MultiDeviceMessage(new Set(['a']), PushProvider.APNS, MessageType.CheckEchoV1, { topic: 'bar' })
			]);
		});

		it('respects max batch size', () => {
			const queuedMessages = [];
			const randomToken = () => Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
			for (let i = 0; i < queueing.MAX_MULTICAST_RECIPIENTS * 2; i++) {
				queuedMessages.push(new SingleDeviceMessage(
					randomToken(),
					PushProvider.APNS,
					MessageType.CheckEchoV1,
					{},
					false
				));
			}
			const batchedMessages = getBatchedMessages(queuedMessages);
			assert.deepStrictEqual(batchedMessages.length, 2);
			batchedMessages.forEach((message) => {
				assert.deepStrictEqual(message.deviceTokens.size, queueing.MAX_MULTICAST_RECIPIENTS);
			});
		});
	});
});
