const BBPromise = require('bluebird');
import { loadConfig } from './config';
import { loadExpress } from './express';

export function init({ app, options }) {
    return BBPromise.try(() => {
        return loadConfig(app, options);
    }).then(() => {
        return loadExpress(app);
    });
}
