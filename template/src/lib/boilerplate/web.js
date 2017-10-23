'use strict';

const


	// get utils
	debug = require('debug-plus')('financialforcedev:orizuru~tools:example:boilerplate:web'),
	fs = require('fs'),

	// define transport
	transport = require('./shared/transport'),

	// get server
	{ Server } = require('@financialforcedev/orizuru'),
	serverInstance = new Server(transport),

	// get all files in our 'schemas' directory
	schemas = require('./shared/schemas');

schemas
	.reduce((sharedPathToAddRouteInput, { path, sharedPath, filename }) => {
		// create route input object if it doesn't exist for the path
		if (!sharedPathToAddRouteInput.get(sharedPath)) {
			sharedPathToAddRouteInput.set(sharedPath, {
				schemaNameToDefinition: {},
				apiEndpoint: sharedPath,
				middlewares: []
			});
		}
		// debug out the schema name and address
		debug.log('Found schema \'%s\' at \'%s\'', filename, sharedPath);
		// add the schema json to the sharedPath schemaNameToDefinition map
		sharedPathToAddRouteInput.get(sharedPath).schemaNameToDefinition[filename] = JSON.parse(fs.readFileSync(path));
		// return the reduce object
		return sharedPathToAddRouteInput;
	}, new Map())
	.forEach(routeInfo => {
		// add a route to the server for each result
		debug.log('Adding route for \'%s\'', routeInfo.apiEndpoint);
		serverInstance.addRoute(routeInfo);
	});

// get the express server and listen to a port
serverInstance
	.getServer()
	.listen(process.env.PORT || 8080);
