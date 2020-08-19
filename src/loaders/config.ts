import { initCommonConfig } from './commonConfig';
import { initQueue } from './queueConfig';

/**
 * Loads the configuration.
 *
 * Add service-specific configuration here.
 * @param {Express} app Express application
 * @return {BBPromise} the promise resolving to the app object
 */
export function loadConfig(app) {
    app.queue = initQueue(app.logger, app.metrics, app.conf.queueing);
    return initCommonConfig(app);
}
