# Apple push notifications service
## Information
This module implements the communication to APNS to allow the service to send
push notifications.

## Auth

* JWT token based
  * Make sure its enabled on production
    * Tokens are shortlived
    * No need to rotate the cert per year
  * Given a key, a key ID and a team ID generated from the apple developers account
    * Allows sending notifications to all device tokens generated in this account
* Cert based
  * Preferred for development
  * Can be scoped to a specific app identifier
  * Needs to be renewed after expiry

App initialization tries first the token based auth config and then falls back to cert
based.

## Configuration
### APNS environment

APNS provides 2 environments to send notifications:

* Sandbox
* Production

In order to choose which environment to use add the following config entry:

```
apns:
  production: <true|false>
```

If not defined, `apn-node` uses production if `NODE_ENV=production` else it
falls back to sandbox.

### Development

In case you want to configure the `push-notifications` service to use a mock client instead
of sending API requests to the APNS backend add the following entries in the configuration.

```
apns:
  mock: true
```

In case you want to develop using the APNS backend then you need to configure authentication.
Make sure a folder named `certs` exists in the project root. In order for our local instance
to be functional we need to populate this with the cert `.p12` file named `apns.p12` and define
if its going to be using sandbox or production APNS backend.

Then make sure the `apns` section of `config.yml` is properly configured:
```
apns:
  mock: false
  cert: '/etc/mediawiki-services-push-notifications/certs/apns.p12'
  production: true  # in case you are using https://tools-static.wmflabs.org/push-notifications-helper/
```

#### Test client

We currently run a simple test client on `https://tools-static.wmflabs.org/push-notifications-helper/`.
This is targeting push notifications on Safari desktop. To send an APNS notification:

* Make sure your local environment uses the `tools-static.wmflabs.org/push-notifications-helper cert`.
* Make sure your local environment is configured to use the APNS production backend.
* Visit the [test client](`https://tools-static.wmflabs.org/push-notifications-helper/`) using Safari on Desktop
* Click `Subscribe`
* Accept the prompt for push notifications permissions
* Get the device token
* Visit `/?doc#/Push notifications/post_v1_message_apns` on `push-notifications` service and trigger
  an API request after replacing the token under `deviceTokens`.

### Production

The app is expecting the `.p8` token key named `apns.p8` to exist under
`/etc/mediawiki-services-push-notifications/certs`.

Then make sure the `apns` section of `config.yml` is properly configured:

```
# Apple Push Notification Service configuration
apns:
  mock: false
  production: true
  token:
    key: '/etc/mediawiki-services-push-notifications/certs/apns.p8'
    keyId: '_KEY_ID_'
    teamId: '_TEAM_ID_'
```