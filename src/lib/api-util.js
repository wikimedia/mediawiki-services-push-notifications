const preq = require('preq');
const BBPromise = require('bluebird');
const sUtil = require('./routing');
const Template = require('swagger-router').Template;
const HTTPError = sUtil.HTTPError;

const TokenType = {
    CSRF: 'csrf',
    LOGIN: 'login'
};

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
            headers: { 'user-agent': app.conf.user_agent },
            query
        }
    });
    Object.assign(request.headers, headers);

    // Use the default cookie jar
    request.jar = true;

    return preq(request).then((response) => {
        // TODO: Even MW API error responses come back with status 200. Check for error response
        //  format instead.
        if (response.status < 200 || response.status > 399) {
            return BBPromise.reject(new HTTPError({
                status: response.status,
                type: 'api_error',
                title: 'MW API error',
                detail: response.body
            }));
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
    return mwApiGetToken(app, TokenType.LOGIN).then((logintoken) => mwApiPost(
        app, {
            action: 'clientlogin',
            format: 'json',
            username: app.conf.mw_subscription_manager_username,
            password: app.conf.mw_subscription_manager_password,
            loginreturnurl: 'https://example.com',
            logintoken
        }
    ));
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
    setupApiTemplates
};
