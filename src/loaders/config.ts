import { initCommonConfig } from './commonConfig';

/**
 * Loads the configuration.
 *
 * Add service-specific configuration here.
 * @param {Express} app Express application
 * @param {Object} options the options to initialise the app with
 */
export function loadConfig(app, options) {
    initCommonConfig(app, options);
}
