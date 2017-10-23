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

	// get utils
	_ = require('lodash'),
	debug = require('debug-plus')('financialforcedev:orizuru~tools:example:boilerplate:web'),
	fs = require('fs'),

	// define transport
	transport = require('./shared/transport'),

	// get server
	{ Server } = require('@financialforcedev/orizuru'),
	serverInstance = new Server(transport),

	// get the auth 
	auth = require('@financialforcedev/orizuru-auth').middleware,

	// get all files in our 'schemas' directory
	schemas = require('./shared/schemas'),

	// define the environment for authentication
	authenticationEnv = {
		jwtSigningKey: process.env.JWT_SIGNING_KEY,
		openidClientId: process.env.OPENID_CLIENT_ID,
		openidHTTPTimeout: parseInt(process.env.OPENID_HTTP_TIMEOUT, 10),
		openidIssuerURI: process.env.OPENID_ISSUER_URI
	};

// function to add a route input object to an object if needed
function addRouteInputObjectToResultIfRequired(sharedPathToAddRouteInput, path) {
	if (!sharedPathToAddRouteInput[path]) {
		sharedPathToAddRouteInput[path] = {
			schemaNameToDefinition: {},
			apiEndpoint: path,
			middlewares: [auth.tokenValidator(authenticationEnv), auth.grantChecker(authenticationEnv)]
		};
	}
}

// add routes for each shared path to the server
_.each(_.reduce(schemas, (sharedPathToAddRouteInput, schema) => {
	addRouteInputObjectToResultIfRequired(sharedPathToAddRouteInput, schema.sharedPath);
	debug.log('Found schema \'%s\' at \'%s\'', schema.fileName, schema.sharedPath);
	sharedPathToAddRouteInput[schema.sharedPath].schemaNameToDefinition[schema.fileName] = JSON.parse(fs.readFileSync(schema.path));
	return sharedPathToAddRouteInput;
}, {}), routeInfo => {
	debug.log('Adding route(s) for \'%s\'', routeInfo.apiEndpoint);
	_.each(routeInfo.schemaNameToDefinition, (value, key) => {
		debug.log('Adding route \'%s\'', key);
	});
	serverInstance.addRoute(routeInfo);
});

// debug out errors and info
Server.emitter.on(Server.emitter.ERROR, error => {
	debug.error('Server error: ' + error);
});
Server.emitter.on(Server.emitter.INFO, info => {
	debug.log('Server info: ' + info);
});

// get the express server and listen to a port
serverInstance
	.getServer()
	.listen(process.env.PORT || 8080);
