// @ts-nocheck
import Queue from 'buffered-queue';
import rewire from 'rewire';
import assert from '../../utils/assert';
import Logger from '../../mocks/logger';

const makeMetrics = require('service-runner/lib/metrics');

const queueConfig = rewire('../../../src/loaders/queueConfig');
const logger: Logger = new Logger();
const metrics = makeMetrics([{
    type: 'prometheus',
    port: 9000,
    name: 'test'
}], logger);

describe('unit:config', () => {
    describe('initQueue', () => {
        const initQueue = queueConfig.__get__('initQueue');
        it('initializes queue', () => {
            const queue = initQueue(logger, metrics, {});
            assert.ok(queue instanceof Queue);
            assert.deepEqual(queue.name, 'push');
        });
        it('initializes queue with options for random flush timeout', () => {
            const queue = initQueue(logger, metrics, {
                flushTimeoutMs: 'random', flushTimeoutMin: 5, flushTimeoutMax: 10
            });
            assert.ok(queue instanceof Queue);
            assert.deepEqual(queue.name, 'push');
        });
    });

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
