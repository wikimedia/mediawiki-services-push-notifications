const express = require('express');
const sUtil = require('../../../src/lib/routing');
const assert = require('assert');
const preq = require('preq');
import Logger from '../../mocks/logger';
const HTTPError = require('../../../src/lib/routing').HTTPError;

const logger: Logger = new Logger();
const app = express();
app.logger = logger;

describe('uncaught errors are validate by setErrorHandler', () => {
    let server;
    before(() => {
        app.get('/err', (req, res) => {
            throw new Error();
        });
        app.get('/http-err', (req, res) => {
            throw new HTTPError([]);
        });
        app.get('/err-object', (req, res) => {
            // eslint-disable-next-line no-throw-literal
            throw { message: 'this is an error' };
        });
        app.get('/err-non-object', (req, res) => {
            // eslint-disable-next-line no-throw-literal
            throw 'error string';
        });
        sUtil.setErrorHandler(app);
        server = app.listen('8887');
    });

    after((done) => {
        server.close();
        done();
    });

    it('thrown Error', () => {
        return preq.get({
            uri: 'http://localhost:8887/err'
        }).catch((res) => {
            assert.deepEqual(res.body.status, 500);
            assert.ok(res instanceof Error);
        });
    });

    it('thrown HTTPError', () => {
        return preq.get({
            uri: 'http://localhost:8887/http-err'
        }).catch((res) => {
            assert.deepEqual(res.body.status, 500);
            assert.deepEqual(res.body.detail, []);
            assert.ok(res instanceof Error);
        });
    });

    it('thrown object variable', () => {
        return preq.get({
            uri: 'http://localhost:8887/err-object'
        }).catch((res) => {
            assert.deepEqual(res.body.status, 500);
            assert.deepEqual(res.body.detail, 'this is an error');
            assert.ok(res instanceof Error);
        });
    });

    it('thrown non-object variable', () => {
        return preq.get({
            uri: 'http://localhost:8887/err-non-object'
        }).catch((res) => {
            assert.deepEqual(res.body.status, 500);
            assert.deepEqual(res.body.detail, 'error string');
            assert.ok(res instanceof Error);
        });
    });
});
