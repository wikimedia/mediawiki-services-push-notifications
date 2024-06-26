'use strict';

const express = require( 'express' );
const BBPromise = require( 'bluebird' );
const fs = BBPromise.promisifyAll( require( 'fs' ) );
const yaml = require( 'js-yaml' );
const ProxyAgent = require( 'proxy-agent' ).ProxyAgent;
const sUtil = require( '../lib/routing' );
const apiUtil = require( '../lib/api-util' );

/**
 * Loads configuration of common Node service template items.
 *
 * @param {express.Application} app Express application
 */
export function initCommonConfig( app ) {
	// ensure some sane defaults
	app.conf.port = app.conf.port || 8888;
	app.conf.interface = app.conf.interface || '0.0.0.0';
	// eslint-disable-next-line max-len
	app.conf.compression_level = app.conf.compression_level === undefined ? 3 : app.conf.compression_level;
	app.conf.cors = app.conf.cors === undefined ? '*' : app.conf.cors;
	if ( app.conf.csp === undefined ) {
		app.conf.csp = "default-src 'self'; object-src 'none'; media-src 'none'; img-src 'none'; style-src 'none'; frame-ancestors 'self'; base-uri: 'self'";
	}

	// set outgoing proxy
	if ( app.conf.proxy ) {
		app.conf.proxyAgent = new ProxyAgent( app.conf.proxy );
	}

	// set up header whitelisting for logging
	if ( !app.conf.log_header_whitelist ) {
		app.conf.log_header_whitelist = [
			'cache-control', 'content-type', 'content-length', 'if-match',
			'user-agent', 'x-request-id'
		];
	}
	// eslint-disable-next-line security/detect-non-literal-regexp
	app.conf.log_header_whitelist = new RegExp( `^(?:${ app.conf.log_header_whitelist.map( ( item ) => item.trim() ).join( '|' ) })$`, 'i' );

	// set up the request templates for the APIs
	apiUtil.setupApiTemplates( app );

	// set up the spec
	if ( !app.conf.spec ) {
		app.conf.spec = `${ __dirname }/../../spec.yaml`;
		app.logger.log( 'debug/spec', `Spec not defined in config. Using default: ${ app.conf.spec }` );
	}
	if ( app.conf.spec.constructor !== Object ) {
		try {
			app.conf.spec = yaml.safeLoad( fs.readFileSync( app.conf.spec ) );
		} catch ( e ) {
			app.logger.log( 'warn/spec', `Could not load the spec: ${ e }` );
			app.conf.spec = {};
		}
	}
	if ( !app.conf.spec.openapi ) {
		app.conf.spec.openapi = '3.0.0';
	}
	if ( !app.conf.spec.info ) {
		app.conf.spec.info = {
			version: app.info.version,
			title: app.info.name,
			description: app.info.description
		};
	}
	app.conf.spec.info.version = app.info.version;
	if ( !app.conf.spec.paths ) {
		app.conf.spec.paths = {};
	}

	// set the CORS and CSP headers
	app.all( '*', ( req, res, next ) => {
		if ( app.conf.cors !== false ) {
			res.header( 'access-control-allow-origin', app.conf.cors );
			res.header( 'access-control-allow-headers', 'accept, x-requested-with, content-type' );
			res.header( 'access-control-expose-headers', 'etag' );
		}
		if ( app.conf.csp !== false ) {
			res.header( 'x-xss-protection', '1; mode=block' );
			res.header( 'x-content-type-options', 'nosniff' );
			res.header( 'x-frame-options', 'SAMEORIGIN' );
			res.header( 'content-security-policy', app.conf.csp );
		}
		sUtil.initAndLogRequest( req, app );
		next();
	} );

	// set up the user agent header string to use for requests
	app.conf.user_agent = app.conf.user_agent || app.info.name;
}
