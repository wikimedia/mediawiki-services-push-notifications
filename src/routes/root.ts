import * as routing from '../lib/routing';
import * as swaggerUi from '../services/swaggerUi';

/**
 * The main router object
 */
const router = routing.router();

/**
 * The main application object reported when this module is require()d
 */
let app;

/**
 * GET /robots.txt
 * Instructs robots no indexing should occur on this domain.
 */
router.get('/robots.txt', (req, res) => {
    res.type('text/plain').end('User-agent: *\nDisallow: /\n');
});

const DOC_CSP = "default-src 'none'; " +
    "script-src 'self' 'unsafe-inline'; connect-src *; " +
    "style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';";

function getSwaggerUI(req, res) {
    return swaggerUi.serve(app.info.name, req.query.path || '/index.html')
    .then(({ contentType, body }) => {
        res.header('content-type', contentType);
        res.header('content-security-policy', DOC_CSP);
        res.header('x-content-security-policy', DOC_CSP);
        res.header('x-webkit-csp', DOC_CSP);
        res.send(body.toString());
    })
    .catch({ code: 'ENOENT' }, () => {
        res.status(404)
            .type('not_found')
            .send('not found');
    });
}

/**
 * GET /
 * Main entry point. Currently it only responds if the spec or doc query
 * parameter is given, otherwise lets the next middleware handle it
 */
router.get('/', (req, res, next) => {
    if ({}.hasOwnProperty.call(req.query || {}, 'spec')) {
        res.json(app.conf.spec);
    } else if ({}.hasOwnProperty.call(req.query || {}, 'doc')) {
        return getSwaggerUI(req, res);
    } else {
        next();
    }
});

module.exports = (appObj) => {
    app = appObj;

    return {
        path: '/',
        skip_domain: true,
        router
    };
};

export {};
