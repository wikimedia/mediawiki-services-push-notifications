import * as sinon from 'sinon';
import nock from 'nock';
const { createMultipartPayload } = require('../../../utils/fcm.ts');
import * as MockCredential from '../../../mocks/credential';
import Logger from '../../../mocks/logger';
import * as admin from 'firebase-admin';
import { sendMessage as fcmSendMessage } from '../../../../src/outgoing/fcm/fcm';
import { MessageType, MultiDeviceMessage } from '../../../../src/outgoing/shared/Message';

const logger: Logger = new Logger();

describe('unit:FCM', () => {
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
    });

    after(async () => {
        adminCredentialStub.restore();
        // Delete mocked FCM app otherwise mocha will hang
        await admin.app().delete();
        scope.done();
        nock.restore();
    });

    it('fcmSendMessage', async () => {
        const message: MultiDeviceMessage = {
            messageType: MessageType.CheckEchoV1,
            deviceTokens: ['TOKEN'],
            dryRun: true
        };

        await fcmSendMessage(logger, message);
    });
});