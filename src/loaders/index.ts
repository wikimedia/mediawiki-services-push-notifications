import { loadConfig } from './config';
import { loadExpress } from './express';
import { loadRoutes } from './routes';
import { init as apnsInit } from '../outgoing/apns/apns';
import { init as fcmInit } from '../outgoing/fcm/fcm';
import { init as queueInit } from '../services/queueing';

export async function init(app) {
    loadConfig(app);
    loadExpress(app);
    fcmInit(app);
    apnsInit(app);
    queueInit(app);
    return loadRoutes(app, `${__dirname}/../routes`);
}
