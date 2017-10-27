/**
 * Copyright (c) 2017, FinancialForce.com, inc
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, 
 *   are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, 
 *      this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice, 
 *      this list of conditions and the following disclaimer in the documentation 
 *      and/or other materials provided with the distribution.
 * - Neither the name of the FinancialForce.com, inc nor the names of its contributors 
 *      may be used to endorse or promote products derived from this software without 
 *      specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
 *  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES 
 *  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL 
 *  THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, 
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 *  OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 *  OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **/

'use strict';

const

	CONCURRENCY = process.env.WEB_CONCURRENCY || 1,
	PORT = process.env.PORT || 8080,
	ADVERTISE_HOST = process.env.ADVERTISE_HOST || 'localhost:8080',
	ADVERTISE_SCHEME = process.env.ADVERTISE_SCHEME || 'http',

	JWT_SIGNING_KEY = process.env.JWT_SIGNING_KEY,
	OPENID_CLIENT_ID = process.env.OPENID_CLIENT_ID,
	OPENID_HTTP_TIMEOUT = process.env.OPENID_HTTP_TIMEOUT || 4000,
	OPENID_ISSUER_URI = process.env.OPENID_ISSUER_URI || 'https://test.salesforce.com/',

	authEnv = {
		jwtSigningKey: JWT_SIGNING_KEY,
		openidClientId: OPENID_CLIENT_ID,
		openidHTTPTimeout: OPENID_HTTP_TIMEOUT,
		openidIssuerURI: OPENID_ISSUER_URI
	},

	authMiddleware = require('@financialforcedev/orizuru-auth').middleware,

	OPEN_API_EXT = '.json',

	// get utils
	_ = require('lodash'),
	throng = require('throng'),
	uuid = require('uuid'),
	debug = require('debug-plus')('boilerplate:web'),
	openapiGenerator = require('@financialforcedev/orizuru-openapi').generator,

	{ readSchema } = require('./shared/read'),

	// define transport
	transport = require('./shared/transport'),

	// get server
	{ Server } = require('@financialforcedev/orizuru'),

	// get all files in our 'schemas' directory
	schemas = require('./shared/schemas').get(),

	idMiddleware = (req, res, next) => {
		const
			orizuru = req.orizuru || {};

		req.orizuru = orizuru;
		orizuru.id = uuid();
		next();
	},

	responseWriter = (err, response, orizuru) => {
		if (err) {
			response.status(400).send(err.message);
		} else {
			response.json({
				id: orizuru.id
			});
		}
	},

	middlewares = [
		idMiddleware,
		authMiddleware.tokenValidator(authEnv),
		authMiddleware.grantChecker(authEnv)
	],

	// function to add a route input object to an object if needed
	addRouteInputObjectToResultIfRequired = (sharedPathToAddRouteInput, path) => {
		if (!sharedPathToAddRouteInput[path]) {
			sharedPathToAddRouteInput[path] = {
				schemaNameToDefinition: {},
				apiEndpoint: path,
				middlewares,
				responseWriter: responseWriter
			};
		}
	},

	serve = () => {
		const
			serverInstance = new Server(transport);

		require('pkginfo')(module, 'version', 'name', 'description');

		// add routes for each shared path to the server
		_.each(_.reduce(schemas, (sharedPathToAddRouteInput, schema) => {
			addRouteInputObjectToResultIfRequired(sharedPathToAddRouteInput, schema.sharedPath);
			debug.log('Found schema \'%s\' at \'%s\'', schema.fileName, schema.sharedPath);
			sharedPathToAddRouteInput[schema.sharedPath].schemaNameToDefinition[schema.fileName] = readSchema(schema.path);
			return sharedPathToAddRouteInput;
		}, {}), routeInfo => {
			debug.log('Adding route(s) for \'%s\'', routeInfo.apiEndpoint);
			_.each(routeInfo.schemaNameToDefinition, (value, key) => {
				debug.log('Adding route \'%s\'', key);
			});
			serverInstance.addRoute(routeInfo);
			serverInstance.addGet({
				path: routeInfo.apiEndpoint + OPEN_API_EXT,
				requestHandler: openapiGenerator.generateV2({
					info: {
						version: module.exports.version,
						title: module.exports.name,
						description: module.exports.description
					},
					host: ADVERTISE_HOST,
					basePath: routeInfo.apiEndpoint,
					schemes: [ADVERTISE_SCHEME]
				}, routeInfo.schemaNameToDefinition)
			});

		});

		// get the express server and listen to a port
		serverInstance
			.getServer()
			.listen(PORT);
	};

// debug out errors and info
Server.emitter.on(Server.emitter.ERROR, debug.error);
Server.emitter.on(Server.emitter.INFO, debug.log);

if (CONCURRENCY > 1) {
	throng(CONCURRENCY, serve);
} else {
	serve();
}
