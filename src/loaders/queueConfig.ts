'use strict';

import assert from 'assert';

export const DEFAULT_FLUSH_TIMEOUT_MS = 10000; // 10 seconds
export const DEFAULT_MAX_QUEUE_SIZE = Number.MAX_SAFE_INTEGER;

export class QueueOptions {
	flushTimeoutMs?: string | number;

	flushTimeoutMin?: number;

	flushTimeoutMax?: number;

	maxSize?: number;

	verbose?: boolean;
}

function isUsingRandomFlushTimeout( options: QueueOptions ): boolean {
	return !!( options && options.flushTimeoutMs && options.flushTimeoutMs === 'random' );
}

function assertSafeNonNegativeInteger( val: any, name = 'value' ) {
	assert.deepStrictEqual( 'number', typeof val, `${ name } must be a number` );
	assert( val <= Number.MAX_SAFE_INTEGER, `${ name } must be a safe integer` );
	assert( val >= 0, `${ name } must be >= 0` );
	assert.deepStrictEqual( val, Math.floor( val ), `${ name } must be an integer` );
}

/**
 * Validate randomized flush timeout settings.
 * Assumes that the existence of the options has already been checked.
 *
 * @param {!QueueOptions} options queue options
 * @throws AssertionError
 */
function validateRandomFlushTimeout( options: QueueOptions ): void {
	const flushTimeoutMin = options.flushTimeoutMin;
	const flushTimeoutMax = options.flushTimeoutMax;
	assert( flushTimeoutMin, 'flushTimeoutMin must be defined when using random flush timeout' );
	assert( flushTimeoutMax, 'flushTimeoutMax must be defined when using random flush timeout' );
	assertSafeNonNegativeInteger( flushTimeoutMin, 'flushTimeoutMin' );
	assertSafeNonNegativeInteger( flushTimeoutMax, 'flushTimeoutMax' );
	assert( flushTimeoutMax >= flushTimeoutMin, 'flushTimeoutMax must be >= flushTimeoutMin' );
}

/**
 * Validate flush timeout settings. The value of flushTimeout may be either an integer or 'random'.
 * Assumes that the existence of the options has already been checked.
 *
 * @param {!QueueOptions} options queue options
 * @throws AssertionError
 */
function validateFlushTimeout( options: QueueOptions ): void {
	if ( isUsingRandomFlushTimeout( options ) ) {
		validateRandomFlushTimeout( options );
	} else {
		const flushTimeoutMs = options.flushTimeoutMs;
		assert.deepStrictEqual( 'number', typeof flushTimeoutMs, 'flushTimeout must be a number ' +
            'or \'random\'' );
		assertSafeNonNegativeInteger( flushTimeoutMs, 'flushTimeout' );
	}
}

/**
 * Validate the queueing options, if any.
 *
 * @param {?QueueOptions} options
 * @throws AssertionError
 */
export function validateQueueingConfig( options: QueueOptions = null ): void {
	if ( !options ) {
		return;
	}
	if ( options.flushTimeoutMs ) {
		validateFlushTimeout( options );
	}
	if ( options.maxSize ) {
		assertSafeNonNegativeInteger( options.maxSize, 'maxSize' );
	}
}

function getRandomInt( min: number, max: number ): number {
	return Math.floor( Math.random() * ( max - min ) ) + min;
}

/**
 * Get a random flush timeout value based on the configured min/max.
 * Assumes that the queueing options have been validated at load time.
 *
 * @param {!QueueOptions} options
 * @return {!number}
 */
function getRandomFlushTimeout( options: QueueOptions ): number {
	return getRandomInt( options.flushTimeoutMin, options.flushTimeoutMax );
}

/**
 * Attempt to get a flush timeout value from the application configuration.
 * Assumes that the queueing options have been validated at load time.
 * Defaults to DEFAULT_FLUSH_TIMEOUT.
 *
 * @param {!QueueOptions} options
 * @return {!number}
 */
export function getFlushTimeout( options: QueueOptions ): number {
	if ( options.flushTimeoutMs === 'random' ) {
		return getRandomFlushTimeout( options );
	}

	return options.flushTimeoutMs as number;
}
