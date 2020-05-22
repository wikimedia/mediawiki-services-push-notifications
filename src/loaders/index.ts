const BBPromise = require('bluebird');
import { loadConfig } from './config';
import { loadExpress } from './express';
import { loadRoutes } from './routes';

export function init(app) {
    return BBPromise.try(() => {
        return loadConfig(app);
    }).then(() => {
        return loadExpress(app);
    }).then(() => {
        return loadRoutes(app, `${__dirname}/../routes`);
    });
}
