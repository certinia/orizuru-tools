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

	// get all files in our 'schemas' directory
	schemas = require('./shared/schemas');

// function to add a route input object to an object if needed
function addRouteInputObjectToResultIfRequired(sharedPathToAddRouteInput, path) {
	if (!sharedPathToAddRouteInput[path]) {
		sharedPathToAddRouteInput[path] = {
			schemaNameToDefinition: {},
			apiEndpoint: path,
			middlewares: []
		};
	}
}

// add routes for each shared path to the server
_(schemas)
	.reduce((sharedPathToAddRouteInput, schema) => {
		addRouteInputObjectToResultIfRequired(sharedPathToAddRouteInput, schema.sharedPath);
		debug.log('Found schema \'%s\' at \'%s\'', schema.fileName, schema.sharedPath);
		sharedPathToAddRouteInput.get(schema.sharedPath).schemaNameToDefinition[schema.fileName] = JSON.parse(fs.readFileSync(schema.path));
		return sharedPathToAddRouteInput;
	}, {})
	.each(routeInfo => {
		debug.log('Adding route(s) for \'%s\'', routeInfo.apiEndpoint);
		_.each(routeInfo.schemaNameToDefinition, (value, key) => {
			debug.log('Adding route \'%s\'', key);
		});
		serverInstance.addRoute(routeInfo);
	});

// get the express server and listen to a port
serverInstance
	.getServer()
	.listen(process.env.PORT || 8080);
