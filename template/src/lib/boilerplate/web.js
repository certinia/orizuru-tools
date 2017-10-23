'use strict';

const

	// get utils
	debug = require('debug-plus')('financialforcedev:orizuru~tools:example:boilerplate:web'),
	fs = require('fs'),
	{ dirname, basename, resolve } = require('path'),
	klawSync = require('klaw-sync'),

	// define transport
	transport = require('./shared/transport'),

	// get server
	{ Server } = require('@financialforcedev/orizuru'),
	serverInstance = new Server(transport),

	// define paths and filters
	SCHEMA_DIR = resolve(__dirname, '..', 'schemas'),
	SCHEMA_EXT = '.avsc',
	SEARCH_FILTER = ({ path }) => path.endsWith(SCHEMA_EXT);

// get all files in our 'schemas' directory
klawSync(SCHEMA_DIR, { nodir: true, filter: SEARCH_FILTER })

	// reduce these down to commonRoute => { schemaNameToDefinition, apiEndpoint, middlewares }
	.reduce((result, { path }) => {

		// get folder and filename
		const
			commonRoute = dirname(path).substring(SCHEMA_DIR.length),
			filename = basename(path, SCHEMA_EXT);

		// initialise the commonRoute if it doesn't already exist
		if (!result.get(commonRoute)) {
			result.set(commonRoute, {
				schemaNameToDefinition: {},
				apiEndpoint: commonRoute,
				middlewares: []
			});
		}

		// debug out the schema name and address
		debug.log('Found schema \'%s\' at \'%s\'', filename, commonRoute);

		// add the schema json to the commonRoute schemaNameToDefinition map
		result.get(commonRoute).schemaNameToDefinition[filename] = JSON.parse(fs.readFileSync(path));

		// return the reduce object
		return result;

	}, new Map())

	// add a route to the server for each result
	.forEach(routeInfo => {
		debug.log('Adding route for \'%s\'', routeInfo.apiEndpoint);
		serverInstance.addRoute(routeInfo);
	});

// get the express server and listen to a port
serverInstance
	.getServer()
	.listen(process.env.PORT || 8080);
