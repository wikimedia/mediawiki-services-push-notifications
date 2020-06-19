import { init, sendMessage } from '../../../../src/outgoing/apns/apns';
import {
    MessageType,
    MultiDeviceMessage,
    PushProvider
} from '../../../../src/outgoing/shared/Message';
import assert from '../../../utils/assert';
import Logger from '../../../mocks/logger';

const logger: Logger = new Logger();

describe('unit:APNS', () => {
    before(() => {
        const conf = {
            apns: {
                mock: true
            }
        };
        init(conf);
    });

    it('send APNS message', async () => {
        const response = await sendMessage(logger, new MultiDeviceMessage(
            new Set(['TOKEN']),
            PushProvider.APNS,
            MessageType.CheckEchoV1,
            false
        ));
        const expected = { sent: [{ device: 'TOKEN' }], failed: [] };
        const msg = `Expected APNS response to be ${JSON.stringify(expected)}, but was ${JSON.stringify(response)}`;
        assert.deepEqual(response, expected, msg);
    });

    it('dryRun send APNS message', async () => {
        const response = await sendMessage(logger, new MultiDeviceMessage(
            new Set(['TOKEN']),
            PushProvider.APNS,
            MessageType.CheckEchoV1,
            true
        ));
        const expected = { sent: [{ device: 'dryRun' }], failed: [] };
        const msg = `Expected APNS response to be ${JSON.stringify(expected)}, but was ${JSON.stringify(response)}`;
        assert.deepEqual(response, expected, msg);
    });
});
