import { sendMessage } from '../../../../src/outgoing/apns/apns';
import {
    MessageType,
    MultiDeviceMessage,
    PushProvider
} from '../../../../src/outgoing/shared/Message';
import assert from '../../../utils/assert';
import * as nodeAssert from 'assert';
import Logger from '../../../mocks/logger';
import rewire from 'rewire';
import sinon from 'sinon';
import { Client as MockClient } from '@wikimedia/apn/mock';

const makeMetrics = require('service-runner/lib/metrics');
const apnsRewired = rewire('../../../../src/outgoing/apns/apns.ts');

describe('unit:APNS', () => {
    const logger = new Logger();
    const app: any = {
        conf: { apns: { mock: true } },
        logger
    };
    let sandbox;

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

    it('should return a proxy object', () => {
        const getProxy = apnsRewired.__get__('getProxy');
        const result = getProxy('http://proxyhost:1234');
        assert.deepEqual(result, { host: 'proxyhost', port: 1234 });
    });

    it('should return a proxy object with port 80', () => {
        const getProxy = apnsRewired.__get__('getProxy');
        const result = getProxy('http://proxyhost');
        assert.deepEqual(result, { host: 'proxyhost', port: 80 });
    });

    it('should return a proxy object with port 443', () => {
        const getProxy = apnsRewired.__get__('getProxy');
        const result = getProxy('https://proxyhost');
        assert.deepEqual(result, { host: 'proxyhost', port: 443 });
    });

    it('should raise an error because proxy is not well-defined', () => {
        const getProxy = apnsRewired.__get__('getProxy');
        const errorMsg = 'Proxy port is missing and protocol not known';
        nodeAssert.throws(() => getProxy('foo://proxyhost'), Error, errorMsg);
    });

    it('config should enable production environment', () => {
        const getOptions = apnsRewired.__get__('getOptions');
        const conf = { apns: { production: true } };
        const result = getOptions(conf);
        assert.deepEqual(result.production, true);
    });

    it('config should enable sandbox environment', () => {
        const getOptions = apnsRewired.__get__('getOptions');
        const conf = { apns: { production: false } };
        const result = getOptions(conf);
        assert.deepEqual(result.production, false);
    });

    it('config should default to sandbox environment', () => {
        const getOptions = apnsRewired.__get__('getOptions');
        const conf = { apns: { foo: 'bar' } };
        const result = getOptions(conf);
        assert.deepEqual(result.production, false);
    });
});
