import assert from 'assert';
import nock from 'nock';
import * as api from '../../../src/lib/api-util';
import Logger from '../../mocks/logger';

describe('api-util', () => {
    const app = {
        conf: {},
        logger: new Logger()
    };

    before(() => {
        api.setupApiTemplates(app);
    });

    describe('mwApiGettoken', () => {
        it('gets token', async () => {
            const scope = nock('https://meta.wikimedia.org')
                .post('/w/api.php')
                .reply(200, {
                    batchcomplete: '',
                    query: {
                        tokens: {
                            csrftoken: 'TOKEN+\\'
                        }
                    }
                });

            await api.mwApiGetToken(app).then((token) => {
                assert.deepStrictEqual(token, 'TOKEN+\\');
            });

            scope.done();
        });

        it('throws on token request failure', async () => {
            const scope = nock('https://meta.wikimedia.org')
                .post('/w/api.php')
                .reply(500);

            await api.mwApiGetToken(app).then(() => {
                assert.fail('Should throw on error response from API');
            }).catch((err) => {
                assert.deepStrictEqual(err.status, 500);
            });

            scope.done();
        });
    });

    describe('mwApiLogin', () => {
        it('logs in if correctly configured', async () => {
            const scope = nock('https://meta.wikimedia.org')
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

            app.conf = {
                mw_subscription_manager_username: 'Test user',
                mw_subscription_manager_password: 'Test pass'
            };

            await api.mwApiLogin(app).then((rsp) => {
                assert.deepStrictEqual(rsp.status, 200);
            });

            scope.done();
        });

        it('throws if username and password are not configured', async () => {
            app.conf = {};
            // Note: Error will not be caught and handled in BBPromise.catch();
            try {
                await api.mwApiLogin(app).then(() => {
                    assert.fail('Should throw if username and password are not configured');
                });
            } catch (err) {
                assert.ok('Error was caught');
            }
        });
    });

    describe('extractCookieDomain', () => {
        it('host header supersedes req uri', () => {
            const req : any = {
                uri: 'http://do.not.extract.this.url',
                headers: {
                    host: 'extract.this.url'
                }
            };
            assert.deepStrictEqual(api.extractCookieDomain(req), 'http://extract.this.url');
        });
        it('get req uri when host header is not present', () => {
            const req : any = {
                uri: 'http://extract.this.url'
            };
            assert.deepStrictEqual(api.extractCookieDomain(req), 'http://extract.this.url');
        });
        it('returns undefined in case uri and host header are not present', () => {
            const req : any = {};
            assert.deepStrictEqual(api.extractCookieDomain(req), undefined);
        });
    });

    after(() => nock.cleanAll());
});

describe('api-util internal requests', () => {
    const app = {
        conf: {
            enable_custom_cookie_jar: true,
            mwapi_req: {
                body: '{{ default(request.query, {}) }}',
                headers: {
                    host: 'meta.wikimedia.beta.wmflabs.org',
                    'user-agent': '{{user-agent}}',
                    'x-forwarded-proto': 'https'
                },
                method: 'post',
                uri: 'http://mediawiki.wikimedia.cloud/w/api.php'
            },
            mw_subscription_manager_username: 'Test user',
            mw_subscription_manager_password: 'Test pass'
        },
        logger: new Logger()
    };

    const matchCookieHeader = (cookieHeader) => {
        const expected = 'ss0-metawikiSession=session; Path=/; Secure; HttpOnly,' +
            'metawikiSession=session; Path=/; Secure; HttpOnly; SameSite=None';
        return cookieHeader === expected;
    };

    before(() => {
        api.setupApiTemplates(app);
    });

    describe('mwApiLogin', () => {
        it('logs in if correctly configured', async () => {
            const scope = nock('http://mediawiki.wikimedia.cloud')
                .post('/w/api.php')
                .reply(200, {
                    batchcomplete: '',
                    query: {
                        tokens: {
                            csrftoken: 'TOKEN+\\'
                        }
                    }
                }, {
                    'set-cookie': [
                        'ss0-metawikiSession=session; path=/; secure; HttpOnly',
                        'metawikiSession=session; path=/; secure; HttpOnly; SameSite=None'
                    ]
                });
            // Make sure login request contains cookie header
            const loginScope = nock('http://mediawiki.wikimedia.cloud', {
                reqheaders: {
                    host: 'meta.wikimedia.beta.wmflabs.org',
                    'x-forwarded-proto': 'https',
                    cookie: (cookie) => matchCookieHeader(cookie)
                }
            })
                .post('/w/api.php')
                .reply(200, {
                    clientlogin: {
                        status: 'PASS',
                        username: 'Test user'
                    }
                });

            await api.mwApiLogin(app).then((rsp) => {
                assert.deepStrictEqual(rsp.status, 200);
            });

            loginScope.done();
            scope.done();
        });
    });

    after(() => nock.cleanAll());
});
