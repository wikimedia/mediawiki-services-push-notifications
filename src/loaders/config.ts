import { initCommonConfig } from './commonConfig';

/**
 * Loads the configuration.
 *
 * Add service-specific configuration here.
 * @param {Express} app Express application
 * @param {Object} options the options to initialise the app with
 * @return {BBPromise} the promise resolving to the app object
 */
export function loadConfig(app, options) {
    return initCommonConfig(app, options);
}
