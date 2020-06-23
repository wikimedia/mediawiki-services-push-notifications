import * as assert from 'assert';

const HTTPError = require('../../../src/lib/routing').HTTPError;

describe('lib:routing', () => {
    it('HTTPError', () => {
        let response = {};
        response = {
            status: 418,
            type: 'test_error',
            detail: response
        }
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
});
