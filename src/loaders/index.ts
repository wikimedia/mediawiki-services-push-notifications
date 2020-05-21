const BBPromise = require('bluebird');
import { loadConfig } from './config';
import { loadExpress } from './express';
import { loadRoutes } from './routes';

export function init({ app, options }) {
    return BBPromise.try(() => {
        return loadConfig(app, options);
    }).then(() => {
        return loadExpress(app);
    }).then(() => {
        return loadRoutes(app, `${__dirname}/../routes`);
    });
}
