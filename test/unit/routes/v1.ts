import * as queueing from '../../../src/services/queueing';
import { MultiDeviceMessage, PushProvider, MessageType } from '../../../src/outgoing/shared/Message';
import request from 'supertest';
import sinon from 'sinon';

const v1 = require('../../../src/routes/v1');
const getTestingApp = require('../../utils/server').getTestingApp;

describe('unit:route:v1:apns', () => {
    let sandbox, appObj, stub;
    before(async () => {
        sandbox = sinon.createSandbox();
        stub = sandbox.stub(queueing, 'enqueueMessages');
        appObj = await getTestingApp();
        appObj.use(v1(appObj).router);
     });

    after(() => sandbox.restore());

    it('should enqueue a message', (done) => {
        const deviceTokens: any = ['TOKEN'];
        request(appObj).post('/message/apns')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({
                deviceTokens: deviceTokens,
                messageType: MessageType.CheckEchoV1,
                dryRun: false
            }).expect(200).end(() => {
                const message = new MultiDeviceMessage(
                    deviceTokens,
                    PushProvider.APNS,
                    MessageType.CheckEchoV1,
                    false
                );
                sinon.assert.calledOnce(stub);
                sinon.assert.calledWith(stub, appObj.queue, message);
                done();
            });
    });
});

describe('unit:route:v1:fcm', () => {
    let sandbox, appObj, stub;

    before(async () => {
        sandbox = sinon.createSandbox();
        stub = sandbox.stub(queueing, 'enqueueMessages');
        appObj = await getTestingApp();
        appObj.use(v1(appObj).router);
    });

    after(() => sandbox.restore());

    it('should enqueue a message', (done) => {
        const deviceTokens: any = ['TOKEN'];
        request(appObj).post('/message/fcm')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({
                deviceTokens: deviceTokens,
                messageType: MessageType.CheckEchoV1,
                dryRun: false
            }).expect(200).end(() => {
                const message = new MultiDeviceMessage(
                    deviceTokens,
                    PushProvider.FCM,
                    MessageType.CheckEchoV1,
                    false
                );
                sinon.assert.calledOnce(stub);
                sinon.assert.calledWith(stub, appObj.queue, message);
                done();
            });
    });
});
