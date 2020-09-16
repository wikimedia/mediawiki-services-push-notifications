/**
 * ServiceAccountCredential mock to be used by firebase admin library
 */
class ServiceAccountCredential {
    /**
     * getAccessToken mock
     *
     * @return {{access_token: string, expires_in: number}}
     */
    getAccessToken() {
        return {
            access_token: 'TOKEN',
            expires_in: 10000
        };
    }
}

/**
 * Mock of the applicationDefault function provided by the firebase admin library
 * https://firebase.google.com/docs/reference/admin/node/admin.credential#applicationdefault
 *
 * @return {ServiceAccountCredential}
 */
export function applicationDefault() {
    return new ServiceAccountCredential();
}
