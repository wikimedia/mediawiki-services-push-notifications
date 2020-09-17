# push-notifications

A service for sending push notification messages to Firebase Cloud Messaging (FCM), Apple Push Notifications Service (APNS) and to more push notifications vendors in the future.

## Getting Started

### Installation

First, clone the repository. Get the link from [Gerrit](https://gerrit.wikimedia.org/r/admin/projects/mediawiki/services/push-notifications) or use the one from [Github](https://github.com/wikimedia/mediawiki-services-push-notifications).

```shell script
git clone git@github.com:wikimedia/mediawiki-services-push-notifications.git push-notifications-service
```

Install the dependencies

```shell script
cd push-notifications
npm install
```

You are now ready to get to work!

* Inspect/modify/configure `src/app.ts`
* Add routes by placing files in `src/routes/` (look at the files there for examples)
* The codebase for outgoing requests to push vendors lives under `src/outgoing/{apns,fcm}`
* The codebase for outgoing requests queueing lives under `src/services/queueing.ts`

For more information about the project you can read [the push notification service documentation](https://www.mediawiki.org/wiki/Wikimedia_Product_Infrastructure_team/Push_Notifications_Infrastructure).

### Build the project
Since this project is using TypeScript please run the build first before starting the service. To automatically rebuild the project and restart the service when the source code changes you can run:

```shell script
npm run watch
```

Note: this does not happen when a file in the `test` folder changes.

### Running the examples

The template is a fully-working example, so you may try it right away. To
start the server hosting the REST API, simply run (inside the repo's directory)

```shell script
npm start
```

This starts an HTTP server listening on `localhost:8900`. There are several
routes you may query (with a browser, or `curl` and friends):

* `http://localhost:8900/?doc`
* `http://localhost:8900/_info/`
* `http://localhost:8900/_info/name`
* `http://localhost:8900/_info/version`
* `http://localhost:8900/_info/home`
* `http://localhost:8900/{domain}/v1/siteinfo{/prop}`
* `http://localhost:8900/{domain}/v1/page/{title}`
* `http://localhost:8900/{domain}/v1/page/{title}/lead`
* `http://localhost:8900/ex/err/array`
* `http://localhost:8900/ex/err/file`
* `http://localhost:8900/ex/err/manual/error`
* `http://localhost:8900/ex/err/manual/deny`
* `http://localhost:8900/ex/err/auth`
* `http://localhost:8900/v1/message/fcm`
* `http://localhost:8900/v1/message/apns`

All outgoing requests to push vendors support `dryRun` calls for local development.

For more information on the push backend implementations:
* [APNS backend docs](src/outgoing/apns/readme.md)
* [FCM backend docs](src/outgoing/fcm/readme.md)

### Push notifications flow

The service act as an abstraction layer to allow mediawiki and other services to send
push notifications to users. Currently supported backends:

* Apple Push Notifications
* Firebase Cloud Messaging

The service API endpoints allows consumers to send notifications in a non-blocking way.
Each worker initializes a queue that after a defined queue size or a timeout flushes
the messages and send the notifications to the push providers in batches.

#### Token invalidation

On a failed response from the provider, if it indicates that the device token is not valid
anymore, the service calls back to mediawiki API (meta.wikimedia.org) and unregisters
the token from the user subscriptions.

### Tests

The template also includes a small set of executable tests. To fire them up,
simply run:

```shell script
npm test
```

If you haven't changed anything in the code (and you have a working Internet
connection), you should see all the tests passing. As testing most of the code
is an important aspect of service development, there is also a bundled tool
reporting the percentage of code covered. Start it with:

```shell script
npm run-script coverage
```

### Metrics

The service uses prometheus (directly) for exposing metrics. Here are the operational
metrics we keep track of:

* Traffic (req/sec)
    * by HTTP method
    * by HTTP status
    * by endpoint
* Errors
    * Total
    * Current error rate
    * Current error %
* Latency
    * Total
        * by HTTP method
        * by HTTP status
        * by endpoint
    * Quantiles
        * by HTTP method
        * by HTTP status
        * by endpoint
* Saturation
    * Total CPU
    * Total memory
    * Total network
    * Avg CPU per container
    * Avg memory per container
    * Top 5 pods (network/memory/traffic)
    * Garbage collection (total, duration, quantiles)

On top of that we keep track of the following app metrics:

* Request duration handled by router in seconds
* Queue
    * Time the notification spent in the queue
    * Reported size of queue on flush
* FCM
    * Count of failed FCM notifications sent
    * Time spent on a transaction with the FCM service
    * Count of successful FCM notifications sent
* APNS
    * Time spent on a transaction with the APNS service
    * Count of successful APNS notifications sent
    * Count of failed APNS notifications sent

### Deployment

Service is deployed in Kubernetes and the setup is maintained using helm.

* [Here you can find](https://gerrit.wikimedia.org/r/plugins/gitiles/operations/deployment-charts/)
more information about the deployment-charts that we use to maintain the Kubernetes setup.
* [Here you can find](https://wikitech.wikimedia.org/wiki/Deployments_on_kubernetes)
more information on how to deploy a new version of the service.


### Troubleshooting

In a lot of cases when there is an issue with node it helps to recreate the
`node_modules` and `dist` directories:

```shell script
rm -r node_modules dist
npm install
npm run build
```

Enjoy!
