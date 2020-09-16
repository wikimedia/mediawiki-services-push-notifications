const BBPromise = require('bluebird');
const fs = BBPromise.promisifyAll(require('fs'));
const path = require('path');
const sUtil = require('../lib/routing');

/**
 * Loads all routes declared in routes/ into the app
 *
 * @param {Application} app the application object to load routes into
 * @param {string} dir routes folder
 * @return {BBPromise} a promise resolving to the app object
 */
export function loadRoutes(app, dir) {
    // recursively load routes from .js files under routes/
    return fs.readdirAsync(dir).map((fname) => {
        return BBPromise.try(() => {
            const resolvedPath = path.resolve(dir, fname);
            const isDirectory = fs.statSync(resolvedPath).isDirectory();
            if (isDirectory) {
                loadRoutes(app, resolvedPath);
            // support .ts files for the test suite execution and code coverage report
            // note: only the ts route files are loaded and run (via ts-node) when running
            // tests, and only the js files in dist/ are loaded when running the app
            } else if (/\.(js|ts)$/.test(fname)) {
                // import the route file
                const route = require(`${dir}/${fname}`);
                return route(app);
            }
        }).then((route) => {
            if (route === undefined) {
                return undefined;
            }
            // check that the route exports the object we need
            if (route.constructor !== Object || !route.path || !route.router ||
                !(route.api_version || route.skip_domain)) {
                throw new TypeError(`routes/${fname} does not export the correct object!`);
            }
            // normalise the path to be used as the mount point
            if (route.path[0] !== '/') {
                route.path = `/${route.path}`;
            }
            if (route.path[route.path.length - 1] !== '/') {
                route.path = `${route.path}/`;
            }
            if (!route.skip_domain) {
                route.path = `/:domain/v${route.api_version}${route.path}`;
            }
            // wrap the route handlers with Promise.try() blocks
            sUtil.wrapRouteHandlers(route, app);
            // all good, use that route
            app.use(route.path, route.router);
        });
    }).then(() => {
        // catch errors
        sUtil.setErrorHandler(app);
        // route loading is now complete, return the app object
        return BBPromise.resolve(app);
    });
}
