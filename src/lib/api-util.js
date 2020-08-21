const BBPromise = require('bluebird');
const sUtil = require('./routing');
const Template = require('swagger-router').Template;
const HTTPError = sUtil.HTTPError;

/**
 * Calls the MW API with the supplied query as its body
 * @param {!Object} req the incoming request object
 * @param {?Object} query an object with all the query parameters for the MW API
 * @param {?Object} headers additional headers to pass to the MW API
 * @return {!Promise} a promise resolving as the response object from the MW API
 */
function mwApiPost(req, query, headers) {
    const app = req.app;
    const request = app.mwapi_tpl.expand({
        request: {
            params: { domain: req.params.domain },
            headers: req.headers,
            query
        }
    });
    Object.assign(request.headers, headers);

    return req.issueRequest(request).then((response) => {
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
 * Sets up the request template for MW API requests
 * @param {!Application} app the application object
 */
function setupApiTemplates(app) {
    if (!app.conf.mwapi_req) {
        app.conf.mwapi_req = {
            method: 'post',
            uri: 'http://{{domain}}/w/api.php',
            headers: '{{request.headers}}',
            body: '{{ default(request.query, {}) }}'
        };
    }
    app.mwapi_tpl = new Template(app.conf.mwapi_req);
}

module.exports = {
    mwApiPost,
    setupApiTemplates
};
