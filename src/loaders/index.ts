const BBPromise = require('bluebird');
import { loadConfig } from './config';
import { loadExpress } from './express';
import { loadRoutes } from './routes';
import { init as fcmInit } from '../outgoing/fcm/fcm';

export function init(app) {
    return BBPromise.try(() => {
        return loadConfig(app);
    }).then(() => {
        return loadExpress(app);
    }).then(() => {
        return fcmInit();
    }).then(() => {
        return loadRoutes(app, `${__dirname}/../routes`);
    });
}
