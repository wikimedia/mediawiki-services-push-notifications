import * as assert from 'assert';

const HTTPError = require('../../../src/lib/routing').HTTPError;
const validateRequestObject = require('../../../src/lib/routing').testing.validateRequestObject;
const errForLog = require('../../../src/lib/routing').testing.errForLog;

describe('lib:routing', () => {
    it('HTTPError', () => {
        let response = {};
        response = {
            status: 418,
            type: 'test_error',
            detail: response
        };
        const err = new HTTPError(response);
        assert.ok(err instanceof Error);
        assert.deepEqual(err.name, 'HTTPError');
        assert.deepEqual(err.message, '418: test_error');
    });
    it('HTTPError constructor !== object', () => {
        const err = new HTTPError([]);
        assert.ok(err instanceof Error);
        assert.deepEqual(err.name, 'HTTPError');
        assert.deepEqual(err.message, '500: internal_error');
    });

    it('validateRequestObject do not allow invalid request object', async () => {
        validateRequestObject({})
            .then(() => assert.fail('validateRequestObject should return an error for invalid object'))
            .catch((err) => {
                assert.ok(err instanceof Error);
                assert.deepEqual(err.name, 'HTTPError');
                assert.deepEqual(err.message, '500: internal_error');
            });
    });

    it('validateRequestObject test all valid parameters', async () => {
        const expected = {
            headers: {
                'header-test': 'test'
            },
            method: 'get',
            uri: 'http://test'
        };
        let request = validateRequestObject({ uri: 'http://test' }, { 'header-test': 'test' });
        assert.deepEqual(request, expected);
        request = validateRequestObject({ url: 'http://test' }, { 'header-test': 'test' });
        assert.deepEqual(request, expected);
        request = validateRequestObject('http://test', { 'header-test': 'test' });
        assert.deepEqual(request, expected);
    });

    it('errForLog conform to schema', () => {
        const err = errForLog(new HTTPError([]));
        assert.deepEqual(Object.keys(err), [
            'message',
            'name',
            'stack',
            'code',
            'signal',
            'status',
            'type',
            'detail'
        ]);
    });
    it('errForLog have stack trace for status === 500', () => {
        let response = {};
        response = {
            status: 500,
            type: 'test_error',
            detail: response
        };
        const err = errForLog(new HTTPError(response));
        assert.notEqual(err.stack, undefined);
    });
    it('errForLog does not have stack trace for status !== 500', () => {
        let response = {};
        response = {
            status: 418,
            type: 'test_error',
            detail: response
        };
        const err = errForLog(new HTTPError(response));
        assert.deepEqual(err.stack, undefined);
    });
});
