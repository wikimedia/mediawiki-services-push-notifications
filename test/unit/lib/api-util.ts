import assert from 'assert';
import nock from 'nock';
import preq from 'preq';
import * as api from '../../../src/lib/api-util';

describe('api-util', () => {
    const req = {
        app: { conf: {} },
        headers: {},
        params: { domain: 'mock.wikipedia.org' },
        issueRequest: (request) => preq(request)
    };

    before(() => {
        api.setupApiTemplates(req.app);
    });

    describe('mwApiGettoken', () => {
        it('gets token', async () => {
            const scope = nock('http://mock.wikipedia.org')
                .post('/w/api.php')
                .reply(200, {
                    batchcomplete: '',
                    query: {
                        tokens: {
                            csrftoken: 'TOKEN+\\'
                        }
                    }
                });

            await api.mwApiGetToken(req).then((token) => {
                assert.deepStrictEqual(token, 'TOKEN+\\');
            });

            scope.done();
        });

        it('throws on token request failure', async () => {
            const scope = nock('http://mock.wikipedia.org')
                .post('/w/api.php')
                .reply(500);

            await api.mwApiGetToken(req).then(() => {
                assert.fail('Should throw on error response from API');
            }).catch((err) => {
                assert.deepStrictEqual(err.status, 500);
            });

            scope.done();
        });
    });

    describe('mwApiLogin', () => {
        it('logs in if correctly configured', async () => {
            const scope = nock('http://mock.wikipedia.org')
                .post('/w/api.php')
                .reply(200, {
                    batchcomplete: '',
                    query: {
                        tokens: {
                            csrftoken: 'TOKEN+\\'
                        }
                    }
                })
                .post('/w/api.php')
                .reply(200, {
                    clientlogin: {
                        status: 'PASS',
                        username: 'Test user'
                    }
                });

            req.app.conf = {
                mw_subscription_manager_username: 'Test user',
                mw_subscription_manager_password: 'Test pass'
            };

            await api.mwApiLogin(req).then((rsp) => {
                assert.deepStrictEqual(rsp.status, 200);
            });

            scope.done();
        });

        it('throws if username and password are not configured', async () => {
            req.app.conf = {};
            // Note: Error will not be caught and handled in BBPromise.catch();
            try {
                await api.mwApiLogin(req).then(() => {
                    assert.fail('Should throw if username and password are not configured');
                });
            } catch (err) {
                assert.ok('Error was caught');
            }
        });
    });
});
