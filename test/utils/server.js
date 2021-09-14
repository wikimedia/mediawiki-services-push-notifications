const preq   = require('preq');
const TestRunner = require('service-runner/test/TestServer');

class TestServiceTemplateNodeRunner extends TestRunner {
	constructor(configPath = `${__dirname}/../../config.test.yaml`) {
		super(configPath);
		this._spec = null;
	}

	get config() {
		if (!this._running) {
			throw new Error('Accessing test service config before starting the service');
		}

		// build the API endpoint URI by supposing the actual service
		// is the last one in the 'services' list in the config file
		const myServiceIdx = this._runner._impl.config.services.length - 1;
		const myService = this._runner._impl.config.services[myServiceIdx];
		const uri = `http://localhost:${myService.conf.port}/`;
		if (!this._spec) {
			// We only want to load this once.
			preq.get(`${uri}?spec`)
				.then((res) => {
					if (!res.body) {
						throw new Error('Failed to get spec');
					}
					// save a copy
					this._spec = res.body;
				})
				.catch(() => {
					// this error will be detected later, so ignore it
					this._spec = { paths: {}, 'x-default-params': {} };
				})
				.then(() => {
					return {
						uri,
						service: myService,
						conf: this._runner._impl.config,
						spec: this._spec
					};
				});
		}

		return {
			uri,
			service: myService,
			conf: this._runner._impl.config,
			spec: this._spec
		};
	}

	// Add start stub to avoid CI error
	start() {
		return super.start();
	}

	// Add stop stub to avoid CI error
	stop() {
		return super.stop();
	}
}

/**
 * Helper function for express app unit testing.
 * Extracts the Express app object from a test server instance
 * to allow access to a test object instantiated by service-runner.
 */
async function getTestingApp() {
	const server = new TestServiceTemplateNodeRunner();
	await server.start();
	const app =  server._services[0][0]._events.request[0];
	await server.stop();
	return app;
}

module.exports = TestServiceTemplateNodeRunner;
module.exports.getTestingApp = getTestingApp;
