const preq = require('preq');
const requestLib = require('request');
const sUtil = require('./routing');
const Template = require('swagger-router').Template;
const HTTPError = sUtil.HTTPError;
// Debug requests for badtoken issues in beta/prod (T260247)
requestLib.debug = true;

const TokenType = {
    CSRF: 'csrf',
    LOGIN: 'login'
};

/**
 * Extract Cookie Domain
 *
 * @param {!Request} request expressjs request object
 * @return {!string} return host header if it exists
 */
function extractCookieDomain(request) {
    const hostname = request.headers?.host;
    if (!hostname) {
        return request.uri;
    }
    // The cookie domain needs to be an URL formatted with a protocol
    return `http://${hostname}`;
}

/**
 * Calls the MW API with the supplied query as its body
 *
 * @param {!Application} app the incoming request object
 * @param {!Object} query an object with all the query parameters for the MW API
 * @param {?Object} headers additional headers to pass to the MW API
 * @return {!Promise} a promise resolving as the response object from the MW API
 */
function mwApiPost(app, query, headers = {}) {
    const request = app.mwapi_tpl.expand({
        request: {
            headers: {
                'user-agent': app.conf.user_agent,
                'X-Forwarded-Proto': 'https'
            },
            query
        }
    });
    Object.assign(request.headers, headers,  app.cookies?.headers || {});
    // Use custom cookie jar if it exists
    request.jar = app.cookies?.jar || true;
    return preq(request).then((response) => {
        if (app.cookies && response.headers['set-cookie']) {
            const cookieDomain = extractCookieDomain(request);
            if (cookieDomain) {
                const cookie = response.headers['set-cookie'].map((c) => {
                    return app.cookies.jar.setCookie(c, cookieDomain);
                });
                // the cookies need to be passed as request headers too
                app.cookies.headers = { cookie };
            }
        }
        // Server error
        if (response.status < 200 || response.status > 399) {
            throw new HTTPError({
                status: response.status,
                type: 'api_error',
                title: 'MW API error',
                detail: response.body
            });
        }
        // MW API Error
        if (response.body.error) {
            throw new HTTPError({
                status: response.status,
                type: 'api_error',
                title: response.body.error.code,
                detail: response.body.error.info
            });
        }
        return response;
    });
}

/**
 * Get a token from MediaWiki.
 *
 * @param {!Application} app the application object
 * @param {!TokenType} type token type to request
 * @return {!Promise}
 */
function mwApiGetToken(app, type = TokenType.CSRF) {
    return mwApiPost(app, { action: 'query', format: 'json', meta: 'tokens', type })
        .then((rsp) => {
        return rsp && rsp.body && rsp.body.query && rsp.body.query.tokens &&
            rsp.body.query.tokens[`${type}token`];
        })
        .catch((err) => {
            app.logger.log('error/mwapi', err);
            throw err;
        });
}

/**
 * Log in to MediaWiki.
 *
 * @param {!Application} app the application object
 * @return {!Promise}
 */
function mwApiLogin(app) {
    if (!app.conf.mw_subscription_manager_username || !app.conf.mw_subscription_manager_password) {
        throw new Error('mw_subscription_manager_username and mw_subscription_manager_password' +
            ' must be defined in the app configuration!');
    }
    // Everytime login is called, recreate cookie object and expose in the app object
    // The cookie jar and headers will only be used when executing mwApiLogin and config is enabled
    if (app.conf.enable_custom_cookie_jar) {
        app.cookies = {
            jar: requestLib.jar(),
            headers: {}
        };
    }
    return mwApiGetToken(app, TokenType.LOGIN).then((logintoken) => mwApiPost(
        app, {
            action: 'clientlogin',
            format: 'json',
            username: app.conf.mw_subscription_manager_username,
            password: app.conf.mw_subscription_manager_password,
            loginreturnurl: 'https://example.com',
            logintoken
        }
    )).catch((err) => {
        app.logger.log('error/login', err);
        throw err;
    });
}

/**
 * Sets up the request template for MW API requests
 *
 * @param {!Application} app the application object
 */
function setupApiTemplates(app) {
    if (!app.conf.mwapi_req) {
        app.conf.mwapi_req = {
            method: 'post',
            uri: 'https://meta.wikimedia.org/w/api.php',
            headers: '{{request.headers}}',
            body: '{{ default(request.query, {}) }}'
        };
    }
    app.mwapi_tpl = new Template(app.conf.mwapi_req);
}

module.exports = {
    mwApiGetToken,
    mwApiLogin,
    mwApiPost,
    setupApiTemplates,
    extractCookieDomain
};
