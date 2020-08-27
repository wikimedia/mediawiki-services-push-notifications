import assert from 'assert';
import nock from 'nock';
import * as api from '../../../../src/lib/api-util';
import { sendSubscriptionDeleteRequest } from '../../../../src/outgoing/shared/mwapi';

describe('unit:mwapi', () => {
    const app = {
        conf: {
            mw_subscription_manager_username: 'Test user',
            mw_subscription_manager_password: 'Test pass'
        }
    };

    before(() => api.setupApiTemplates(app));

    it('sendSubscriptionDeleteRequest: success', async () => {
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
                delete: {
                    result: 'Success'
                }
            });

        await sendSubscriptionDeleteRequest(app, ['TOKEN']).then((rsp) => {
            assert.deepStrictEqual(rsp.status, 200);
        });

        scope.done();
    });

    it('sendSubscriptionDeleteRequest: failure', async () => {
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
                error: {
                    code: 'api-error-code',
                    info: 'API error message'
                },
                servedby: 'mw9999'
            });

        await sendSubscriptionDeleteRequest(app, ['TOKEN']).then((rsp) => {
            // Currently we just move on.
            assert.deepStrictEqual(rsp.status, 200);
        });

        scope.done();
    });

    it('sendSubscriptionDeleteRequest: success with login', async () => {
        const scope = nock('https://meta.wikimedia.org')
            .post('/w/api.php')
            .reply(200, {
                batchcomplete: '',
                query: {
                    tokens: {
                        csrftoken: '+\\'
                    }
                }
            })
            .post('/w/api.php')
            .reply(200, {
                batchcomplete: '',
                query: {
                    tokens: {
                        logintoken: 'TOKEN+\\'
                    }
                }
            })
            .post('/w/api.php')
            .reply(200, {
                clientlogin: {
                    status: 'PASS',
                    username: 'SubscriptionManager'
                }
            })
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
                delete: {
                    result: 'Success'
                }
            });

        await sendSubscriptionDeleteRequest(app, ['TOKEN']).then((rsp) => {
            assert.deepStrictEqual(rsp.status, 200);
        });

        scope.done();
    });

    it('sendSubscriptionDeleteRequest: failed login', async () => {
        const scope = nock('https://meta.wikimedia.org')
            .post('/w/api.php')
            .reply(200, {
                batchcomplete: '',
                query: {
                    tokens: {
                        csrftoken: '+\\'
                    }
                }
            })
            .post('/w/api.php')
            .reply(200, {
                batchcomplete: '',
                query: {
                    tokens: {
                        logintoken: 'TOKEN+\\'
                    }
                }
            })
            .post('/w/api.php')
            .reply(200, {
                error: {
                    code: 'badtoken',
                    info: 'Invalid CSRF token.'
                },
                servedby: 'mw9999'
            });

        // Note: Error will not be caught and handled in BBPromise.catch();
        try {
            await sendSubscriptionDeleteRequest(app, ['TOKEN']).then(() => {
                assert.fail('Should throw on login failure');
            });
        } catch (err) {
            assert.ok('Error was caught');
        }

        scope.done();
    });

    after(() => nock.cleanAll());
});
