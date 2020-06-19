import Queue from 'buffered-queue';
import assert from 'assert';
import { onQueueFlush } from '../services/queueing';

export const DEFAULT_FLUSH_TIMEOUT_MS = 10000; // 10 seconds
export const DEFAULT_MAX_QUEUE_SIZE = 5000;

class QueueOptions {
    flushTimeoutMs?: string | number;
    flushTimeoutMin?: number;
    flushTimeoutMax?: number;
    maxSize?: number;
    verbose?: boolean;
}

function isUsingRandomFlushTimeout(options: QueueOptions): boolean {
    return !!(options && options.flushTimeoutMs && options.flushTimeoutMs === 'random');
}

function assertSafeNonNegativeInteger(val: any, name = 'value') {
    assert.deepStrictEqual('number', typeof val, `${name} must be a number`);
    assert(val <= Number.MAX_SAFE_INTEGER, `${name} must be a safe integer`);
    assert(val >= 0, `${name} must be >= 0`);
    assert.deepStrictEqual(val, Math.floor(val), `${name} must be an integer`);
}

/**
 * Validate randomized flush timeout settings.
 * Assumes that the existence of the options has already been checked.
 * @param {!QueueOptions} options queue options
 * @throws AssertionError
 */
function validateRandomFlushTimeout(options: QueueOptions): void {
    const flushTimeoutMin = options.flushTimeoutMin;
    const flushTimeoutMax = options.flushTimeoutMax;
    assert(flushTimeoutMin, 'flushTimeoutMin must be defined when using random flush timeout');
    assert(flushTimeoutMax, 'flushTimeoutMax must be defined when using random flush timeout');
    assertSafeNonNegativeInteger(flushTimeoutMin, 'flushTimeoutMin');
    assertSafeNonNegativeInteger(flushTimeoutMax, 'flushTimeoutMax');
    assert(flushTimeoutMax >= flushTimeoutMin, 'flushTimeoutMax must be >= flushTimeoutMin');
}

/**
 * Validate flush timeout settings. The value of flushTimeout may be either an integer or 'random'.
 * Assumes that the existence of the options has already been checked.
 * @param {!QueueOptions} options queue options
 * @throws AssertionError
 */
function validateFlushTimeout(options: QueueOptions): void {
    if (isUsingRandomFlushTimeout(options)) {
        validateRandomFlushTimeout(options);
    } else {
        const flushTimeoutMs = options.flushTimeoutMs;
        assert.deepStrictEqual('number', typeof flushTimeoutMs, 'flushTimeout must be a number ' +
            'or \'random\'');
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore: flushTimeout is a number per the above assert
        assertSafeNonNegativeInteger(flushTimeoutMs, 'flushTimeout');
    }
}

/**
 * Validate the queueing options, if any.
 * @param {?QueueOptions} options
 * @throws AssertionError
 */
function validateQueueingConfig(options: QueueOptions = null): void {
    if (!options) {
        return;
    }
    if (options.flushTimeoutMs) {
        validateFlushTimeout(options);
    }
    if (options.maxSize) {
        assertSafeNonNegativeInteger(options.maxSize, 'maxSize');
    }
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Get a random flush timeout value based on the configured min/max.
 * Assumes that the queueing options have been validated at load time.
 * @param {!QueueOptions} options
 * @return {!number}
 */
function getRandomFlushTimeout(options: QueueOptions): number {
    return getRandomInt(options.flushTimeoutMin, options.flushTimeoutMax);
}

/**
 * Attempt to get a flush timeout value from the application configuration.
 * Assumes that the queueing options have been validated at load time.
 * Defaults to DEFAULT_FLUSH_TIMEOUT.
 * @param {!QueueOptions} options
 * @return {!number}
 */
function getFlushTimeout(options: QueueOptions): number {
    if (options.flushTimeoutMs === 'random') {
        return getRandomFlushTimeout(options);
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore: flushTimeoutMs is either a number or 'random'
    return options.flushTimeoutMs;
}

/**
 * Initialize and return a queue for the provider and message type.
 * @param {!Logger} logger
 * @param {!QueueOptions} options
 * @return {!Queue}
 */
export function initQueue(logger: Logger, options: QueueOptions): Queue {
    validateQueueingConfig(options);
    const flushTimeoutMs = getFlushTimeout(options) || DEFAULT_FLUSH_TIMEOUT_MS;
    const maxSize = options.maxSize || DEFAULT_MAX_QUEUE_SIZE;
    const queue = new Queue('push', {
        size: maxSize,
        flushTimeout: flushTimeoutMs,
        verbose: options.verbose
    });
    queue.on('flush', async (data) => {
        return onQueueFlush(logger, data);
    });
    logger.log('debug/queueing',
        `Initialized queue: max size: ${maxSize}, flush timeout (ms): ${flushTimeoutMs}`);
    return queue;
}
