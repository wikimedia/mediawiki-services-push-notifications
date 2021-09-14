import preq from 'preq';
import assert from '../../utils/assert';
import Server from '../../utils/server';

describe('APNS feature testing', () => {
	const server = new Server();
	before(() => server.start());
	after(() => server.stop());
	it('send notification', async () => {
		const res = await preq
			.post({
				uri: `${server.config.uri}v1/message/apns`,
				body: {
					messageType: 'checkEchoV1',
					topic: '123-apns-topic',
					dryRun: false,
					deviceTokens: ['TOKEN-1', 'TOKEN-2', 'TOKEN-3']
				}
			});
		assert.deepEqual(res.status, 200);
	});
});
