import { init, sendMessage } from '../../../../src/outgoing/apns/apns';
import {
    MessageType,
    MultiDeviceMessage,
    PushProvider
} from '../../../../src/outgoing/shared/Message';
import assert from '../../../utils/assert';
import Logger from '../../../mocks/logger';
import sinon from 'sinon';
import { Client as MockClient } from 'apn/mock';

const makeMetrics = require('service-runner/lib/metrics');

describe('unit:APNS', () => {
    const logger = new Logger();
    const app: any = {
        conf: { apns: { mock: true } },
        logger
    };
    let sandbox;

    before(() => {
        init(app);
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        app.metrics = sandbox.spy(makeMetrics([{
            type: 'prometheus',
            port: 9000,
            name: 'test'
        }], logger));
    });

    afterEach(() => {
        sandbox.restore();
        app.metrics.clients[0].client.register.clear();
    });

    it('send APNS message', async () => {
        await sendMessage(app, new MultiDeviceMessage(
            new Set(['TOKEN']),
            PushProvider.APNS,
            MessageType.CheckEchoV1,
            {},
            false
        ));
    });

    it('dryRun send APNS message', async () => {
        await sendMessage(app, new MultiDeviceMessage(
            new Set(['TOKEN']),
            PushProvider.APNS,
            MessageType.CheckEchoV1,
            {},
            true
        ));
    });

    it('send APNS message with defined topic', async () => {
        const meta = {
            topic: '123-apns-topic'
        };
        const spy = sandbox.spy(MockClient.prototype, 'write');
        await sendMessage(app, new MultiDeviceMessage(
            new Set(['TOKEN']),
            PushProvider.APNS,
            MessageType.CheckEchoV1,
            meta,
            false
        ));
        sinon.assert.calledOnce(spy);
        const expectedHeaders = { 'apns-topic': '123-apns-topic' };
        assert.deepEqual(spy.firstCall.args[0].headers, expectedHeaders);
    });
    it('send APNS message with undefined topic', async () => {
        const meta = {};
        const spy = sandbox.spy(MockClient.prototype, 'write');
        await sendMessage(app, new MultiDeviceMessage(
            new Set(['TOKEN']),
            PushProvider.APNS,
            MessageType.CheckEchoV1,
            meta,
            false
        ));
        sinon.assert.calledOnce(spy);
        assert.deepEqual(spy.firstCall.args[0].headers, {});
    });
});
