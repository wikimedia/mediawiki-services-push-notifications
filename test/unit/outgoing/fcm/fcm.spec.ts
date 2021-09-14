import * as sinon from 'sinon';
import nock from 'nock';
import * as MockCredential from '../../../mocks/credential';
import Logger from '../../../mocks/logger';
import * as admin from 'firebase-admin';
import { getMulticastMessage, init, sendMessage } from '../../../../src/outgoing/fcm/fcm';
import {
	MessageType,
	MultiDeviceMessage,
	PushProvider
} from '../../../../src/outgoing/shared/Message';

const { createMultipartPayload } = require('../../../utils/fcm.ts');
const makeMetrics = require('service-runner/lib/metrics');

describe('unit:FCM', () => {
	const logger = new Logger();
	const app: any = {
		conf: { apns: { mock: true } },
		logger
	};
	let adminCredentialStub, scope;

	before(async () => {
		adminCredentialStub = sinon.stub(admin.credential, 'applicationDefault').callsFake(MockCredential.applicationDefault);
		/** The service creates an app when loading FCM
         * we need to delete and re-initialize FCM app */
		if (admin.apps.length) {
			await admin.app().delete();
		}
		admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'fir-test' });
		scope = nock('https://fcm.googleapis.com')
			.post('/batch')
			.reply(200, createMultipartPayload(), {
				'Content-type': 'multipart/mixed; boundary=boundary'
			});
		init(app);
	});

	after(async () => {
		adminCredentialStub.restore();
		// Delete mocked FCM app otherwise mocha will hang
		await admin.app().delete();
		scope.done();
		nock.cleanAll();
	});

	it('fcmSendMessage', async () => {
		app.metrics = sinon.spy(makeMetrics([{
			type: 'prometheus',
			port: 9000,
			name: 'test'
		}], logger));
		const multicastMessage = getMulticastMessage(new MultiDeviceMessage(
			new Set(['TOKEN']),
			PushProvider.FCM,
			MessageType.CheckEchoV1,
			{},
			true
		));
		await sendMessage(app, multicastMessage);
	});
});
