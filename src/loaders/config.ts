'use strict';
import { Express } from 'express';
import Promise from 'bluebird';
import { initCommonConfig } from './commonConfig';

/**
 * Loads the configuration.
 *
 * Add service-specific configuration here.
 *
 * @param {Express.Application} app Express application
 * @return {Promise} the promise resolving to the app object
 */
export function loadConfig( app ) {
	return initCommonConfig( app );
}
