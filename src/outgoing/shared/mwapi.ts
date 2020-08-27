import { mwApiGetToken, mwApiLogin, mwApiPost } from '../../lib/api-util';

/**
 * Send a request to the MediaWiki API to delete the subscriptions associated with a set of
 * tokens.
 * Intended for use when provider APIs identify tokens as invalid.
 * @param {!Application} app
 * @param {!Array<string>} tokens
 * @param {?boolean} loginRetry
 */
export async function sendSubscriptionDeleteRequest(
    app,
    tokens: string[],
    loginRetry = false
): Promise<any> {
    return mwApiGetToken(app).then((token) => {
        if (token === '+\\') {
            if (loginRetry) {
                throw new Error('Received anon token after attempting to log in; aborting.');
            }
            return mwApiLogin(app).then(() =>
                this.sendSubscriptionDeleteRequest(app, tokens, true));
        }
        const query = {
            action: 'echopushsubscriptions',
            command: 'delete',
            providertoken: tokens.join('|'),
            token
        };
        return mwApiPost(app, query);
    });
}
