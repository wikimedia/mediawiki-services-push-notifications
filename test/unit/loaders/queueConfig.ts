'use strict';

import rewire from 'rewire';
import assert from '../../utils/assert';

const queueConfig = rewire( '../../../src/loaders/queueConfig' );

describe( 'unit:config', () => {
	describe( 'getRandomFlushTimeout', () => {
		const getRandomFlushTimeout = queueConfig.__get__( 'getRandomFlushTimeout' );

		it( 'generates a random flushTimeout within the specified range', () => {
			const options = { flushTimeoutMs: 'random', flushTimeoutMin: 5, flushTimeoutMax: 10 };
			const flushTimeoutMs = getRandomFlushTimeout( options );

            // Workaround for asserting generic flushTimeoutMs
            type Assert = ( value: boolean ) => asserts value;
            const getAssert = () => assert.ok;
            const ok: Assert = getAssert();

            ok( typeof flushTimeoutMs === 'number' );
            ok( flushTimeoutMs >= 5 );
            ok( flushTimeoutMs <= 10 );
		} );
	} );
} );
