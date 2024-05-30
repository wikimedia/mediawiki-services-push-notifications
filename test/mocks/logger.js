'use strict';

class Logger {
	constructor( confOrLogger = null, args = null ) {}

	log( level, info ) {}

	child( args ) {
		return new Logger();
	}

	close() {}
}

export default Logger;
