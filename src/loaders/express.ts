import * as bodyParser from 'body-parser';
const compression = require('compression');
const limiter = require('express-rate-limit');

export function loadExpress(app) {
    // disable the X-Powered-By header
    app.set('x-powered-by', false);
    // disable the ETag header - users should provide them!
    app.set('etag', false);
    // enable compression
    app.use(compression({ level: app.conf.compression_level }));
    // use the JSON body parser
    app.use(bodyParser.json({ limit: app.conf.max_body_size || '100kb' }));
    // use the application/x-www-form-urlencoded parser
    app.use(bodyParser.urlencoded({ extended: true }));
    // apply API rate limiting, if configured
    if (app.conf.express_rate_limiter) {
        app.use(limiter(app.conf.express_rate_limiter));
    }
}
