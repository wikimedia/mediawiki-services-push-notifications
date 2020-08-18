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

const logger: Logger = new Logger();

describe('unit:APNS', () => {
    let sandbox, metrics;

    before(() => {
        const conf = {
            apns: {
                mock: true
            }
        };
        init(conf);
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        metrics = sandbox.spy(makeMetrics([{
            type: 'prometheus',
            port: 9000,
            name: 'test'
        }], logger));
    });

    afterEach(() => {
        sandbox.restore();
        metrics.clients[0].client.register.clear();
    });

    it('send APNS message', async () => {
        const response = await sendMessage(logger, metrics, new MultiDeviceMessage(
            new Set(['TOKEN']),
            PushProvider.APNS,
            MessageType.CheckEchoV1,
            {},
            false
        ));
        const expected = { sent: [{ device: 'TOKEN' }], failed: [] };
        const msg = `Expected APNS response to be ${JSON.stringify(expected)}, but was ${JSON.stringify(response)}`;
        assert.deepEqual(response, expected, msg);
    });

    it('dryRun send APNS message', async () => {
        const response = await sendMessage(logger, metrics, new MultiDeviceMessage(
            new Set(['TOKEN']),
            PushProvider.APNS,
            MessageType.CheckEchoV1,
            {},
            true
        ));
        const expected = { sent: [{ device: 'dryRun' }], failed: [] };
        const msg = `Expected APNS response to be ${JSON.stringify(expected)}, but was ${JSON.stringify(response)}`;
        assert.deepEqual(response, expected, msg);
    });

    it('send APNS message with defined topic', async () => {
        const meta = {
            topic: '123-apns-topic'
        };
        const spy = sandbox.spy(MockClient.prototype, 'write');
        await sendMessage(
            logger,
            metrics,
            new MultiDeviceMessage(
                new Set(['TOKEN']),
                PushProvider.APNS,
                MessageType.CheckEchoV1,
                meta,
                false
            )
        );
        sinon.assert.calledOnce(spy);
        const expectedHeaders = { 'apns-topic': '123-apns-topic' };
        assert.deepEqual(spy.firstCall.args[0].headers, expectedHeaders);
    });
    it('send APNS message with undefined topic', async () => {
        const meta = {};
        const spy = sandbox.spy(MockClient.prototype, 'write');
        await sendMessage(
            logger,
            metrics,
            new MultiDeviceMessage(
                new Set(['TOKEN']),
                PushProvider.APNS,
                MessageType.CheckEchoV1,
                meta,
                false
            )
        );
        sinon.assert.calledOnce(spy);
        assert.deepEqual(spy.firstCall.args[0].headers, {});
    });
});
