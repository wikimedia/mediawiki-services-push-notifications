const http = require('http');
const BBPromise = require('bluebird');
import express from 'express';
const addShutdown = require('http-shutdown');
const packageInfo = require('../package.json');
import * as loaders from './loaders';

/**
 * Creates an express app and initialises it
 *
 * @param {Object} options the options to initialise the app with
 * @return {BBPromise} the promise resolving to the app object
 */
function initApp(options) {
    // the main application object
    const app: express.Application = express();

    // get the options and make them available in the app
    app.logger = options.logger;    // the logging device
    app.metrics = options.metrics;  // the metrics
    app.conf = options.config;      // this app's config options
    app.info = packageInfo;         // this app's package info

    return loaders.init(app);
}

/**
 * Creates and start the service's web server
 *
 * @param {Application} app the app object to use in the service
 * @return {BBPromise} a promise creating the web server
 */
function createServer(app) {
    // return a promise which creates an HTTP server,
    // attaches the app to it, and starts accepting
    // incoming client requests
    let server;
    return new BBPromise((resolve) => {
        server = http.createServer(app).listen(
            app.conf.port,
            app.conf.interface,
            resolve
        );
        server = addShutdown(server);
    }).then(() => {
        app.logger.log('info',
            `Worker ${process.pid} listening on ${app.conf.interface || '*'}:${app.conf.port}`);

        // Don't delay incomplete packets for 40ms (Linux default) on
        // pipelined HTTP sockets. We write in large chunks or buffers, so
        // lack of coalescing should not be an issue here.
        server.on('connection', (socket) => {
            socket.setNoDelay(true);
        });

        return server;
    });
}

/**
 * The service's entry point. It takes over the configuration
 * options and the logger- and metrics-reporting objects from
 * service-runner and starts an HTTP server, attaching the application
 * object to it.
 *
 * @param {Object} options the options to initialise the app with
 * @return {BBPromise} HTTP server
 */
module.exports = (options) => {
    return initApp(options).then(createServer);
};

export {};
