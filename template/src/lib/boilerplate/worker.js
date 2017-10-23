'use strict';

const

	// get utils
	_ = require('lodash'),
	debug = require('debug-plus')('financialforcedev:orizuru~tools:example:boilerplate:worker'),
	fs = require('fs'),

	// define transport
	transport = require('./shared/transport'),

	// get handler
	{ Handler } = require('@financialforcedev/orizuru'),
	handlerInstance = new Handler(transport),

	// get all files in our 'schemas' and 'handlers' directories
	schemas = require('./shared/schemas'),
	handlers = require('./shared/handlers'),

	// create an object to contain the union of schema and handler paths
	schemaAndHandlersFilePathUnion = {};

// function to add a tuple to the union object if needed
function addPathToUnionObjectIfRequired(path) {
	if (!schemaAndHandlersFilePathUnion[path]) {
		schemaAndHandlersFilePathUnion[path] = {
			schema: null,
			handler: null
		};
	}
}

// map schemas on to the union
_.each(schemas, schema => {
	addPathToUnionObjectIfRequired(schema.sharedPath + '/' + schema.fileName);
	schemaAndHandlersFilePathUnion[schema.sharedPath].schema = JSON.parse(fs.readFileSync(schema.path));
});

// map handlers on to the union
_.each(handlers, handler => {
	addPathToUnionObjectIfRequired(handler.sharedPath + '/' + handler.fileName);
	schemaAndHandlersFilePathUnion[handler.sharedPath].handler = require(handler.path);
});

// map tuples to handler promises and catch any errors
Promise.all(_.map(schemaAndHandlersFilePathUnion, (schemaHandlerTuple, sharedPath) => {
	if (!schemaHandlerTuple.schema) {
		debug.warn('no schema found for handler \'%s\'', sharedPath);
		return null;
	}
	if (!schemaHandlerTuple.handler) {
		debug.warn('no handler found for schema \'%s\'', sharedPath);
		return null;
	}
	return handlerInstance.handle({
		schema: schemaHandlerTuple.schema,
		callback: schemaHandlerTuple.handle
	});
})).catch(err => {
	debug.error('Failed to initialise handlers: \'%s\'', err.message);
});
