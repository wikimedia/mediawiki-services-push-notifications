import { initCommonConfig } from './commonConfig';

/**
 * Loads the configuration.
 *
 * Add service-specific configuration here.
 *
 * @param {Express} app Express application
 * @return {BBPromise} the promise resolving to the app object
 */
export function loadConfig(app) {
    return initCommonConfig(app);
}
