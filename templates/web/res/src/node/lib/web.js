/**
 * Copyright (c) 2017-2018, FinancialForce.com, inc
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
 */

'use strict';

const

	CONCURRENCY = process.env.WEB_CONCURRENCY || 1,
	PORT = process.env.PORT || 8080,
	ADVERTISE_HOST = process.env.ADVERTISE_HOST || 'localhost:8080',
	ADVERTISE_SCHEME = process.env.ADVERTISE_SCHEME || 'http',

	OPEN_API_EXT = '.json',

	// get utils
	_ = require('lodash'),
	throng = require('throng'),
	debug = require('debug-plus')('web'),
	openapiGenerator = require('@financialforcedev/orizuru-openapi').generator,

	{ readSchema } = require('./boilerplate/read'),

	// define transport
	transport = require('./boilerplate/transport'),

	// get server
	{ Server } = require('@financialforcedev/orizuru'),

	// get all files in our 'schemas' directory
	schemas = require('./boilerplate/schema').getWebSchemas(),

	// get server middleware
	auth = require('./boilerplate/auth'),
	id = require('./boilerplate/id'),

	middlewares = auth.middleware.concat(id.middleware),

	// prepare routeInfo so we can define a server route for each unique sharedPath
	getRouteInfos = () => {
		// group the schemas by sharedPath
		const schemasBySharedPath = _.groupBy(schemas, 'sharedPath');

		return _.map(schemasBySharedPath, (schemasForPath, sharedPath) => {
			// store each Avro schema's contents against its filename
			const schemaNameToDefinition = _.reduce(schemasForPath, (result, schema) => {
				const
					fileName = schema.fileName,
					path = schema.path;

				debug.log('Found schema \'%s\' at \'%s\'', fileName, sharedPath);
				result[fileName] = readSchema(path);

				return result;
			}, {});

			return {
				schemaNameToDefinition,
				apiEndpoint: sharedPath,
				middlewares,
				responseWriter: id.responseWriter
			};
		});
	},

	// read package.json properties
	getPackageInfo = () => {
		require('pkginfo')(module, 'version', 'name', 'description');

		return {
			version: module.exports.version,
			title: module.exports.name,
			description: module.exports.description
		};
	},

	// add server routes
	addRoutes = (serverInstance, routeInfos) => {
		// read package.json properties
		const info = getPackageInfo();

		_.each(routeInfos, routeInfo => {
			debug.log('Adding route(s) for \'%s\'', routeInfo.apiEndpoint);
			_.each(routeInfo.schemaNameToDefinition, (schemaContent, schemaName) => {
				debug.log('Adding route \'%s\'', schemaName);
			});

			// add the route
			serverInstance.addRoute(routeInfo);

			// add the Open API handler
			serverInstance.addGet({
				path: routeInfo.apiEndpoint + OPEN_API_EXT,
				requestHandler: openapiGenerator.generateV2({
					info,
					host: ADVERTISE_HOST,
					basePath: routeInfo.apiEndpoint,
					schemes: [ADVERTISE_SCHEME]
				}, routeInfo.schemaNameToDefinition)
			});
		});
	},

	// start the web server and start listening for connections
	serve = () => {
		const
			routeInfos = getRouteInfos(),
			serverInstance = new Server(transport);

		addRoutes(serverInstance, routeInfos);

		// get the express server and listen to a port
		serverInstance.getServer().listen(PORT);
	};

// debug out errors and info
Server.emitter.on(Server.emitter.ERROR, debug.error);
Server.emitter.on(Server.emitter.INFO, debug.log);

if (CONCURRENCY > 1) {
	// start multiple web servers
	throng(CONCURRENCY, serve);
} else {
	// start a web server
	serve();
}
