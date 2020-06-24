import { init, sendMessage } from '../../../../src/outgoing/apns/apns';
import { MultiDeviceMessage, MessageType } from '../../../../src/outgoing/shared/Message';
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
        const message: MultiDeviceMessage = {
            messageType: MessageType.CheckEchoV1,
            deviceTokens: ['TOKEN'],
            dryRun: false
        };
        const response = await sendMessage(logger, message);
        const expected = { sent: [{ device: 'TOKEN' }], failed: [] };
        const msg = `Expected APNS response to be ${JSON.stringify(expected)}, but was ${JSON.stringify(response)}`;
        assert.deepEqual(response, expected, msg);
    });

    it('dryRun send APNS message', async () => {
        const message: MultiDeviceMessage = {
            messageType: MessageType.CheckEchoV1,
            deviceTokens: ['TOKEN'],
            dryRun: true
        };
        const response = await sendMessage(logger, message);
        const expected = { sent: [{ device: 'dryRun' }], failed: [] };
        const msg = `Expected APNS response to be ${JSON.stringify(expected)}, but was ${JSON.stringify(response)}`;
        assert.deepEqual(response, expected, msg);
    });
});
