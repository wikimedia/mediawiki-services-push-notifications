// @ts-nocheck
import rewire from 'rewire';
import assert from '../../utils/assert';

const queueConfig = rewire('../../../src/loaders/queueConfig');

describe('unit:config', () => {
    describe('getRandomFlushTimeout', () => {
        const getRandomFlushTimeout = queueConfig.__get__('getRandomFlushTimeout');

        it('generates a random flushTimeout within the specified range', () => {
            const options = { flushTimeoutMs: 'random', flushTimeoutMin: 5, flushTimeoutMax: 10 };
            const flushTimeoutMs = getRandomFlushTimeout(options);
            assert.ok(typeof flushTimeoutMs === 'number');
            assert.ok(flushTimeoutMs >= 5);
            assert.ok(flushTimeoutMs <= 10);
        });
    });
});
