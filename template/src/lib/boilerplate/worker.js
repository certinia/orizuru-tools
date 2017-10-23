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
	debug = require('debug-plus')('financialforcedev:orizuru~tools:example:boilerplate:worker'),
	{ readSchema, readHandler } = require('./shared/read'),

	// define transport
	transport = require('./shared/transport'),

	// get handler
	{ Handler } = require('@financialforcedev/orizuru'),
	handlerInstance = new Handler(transport),

	// get all files in our 'schemas' and 'handlers' directories
	schemas = require('./shared/schemas').get(),
	handlers = require('./shared/handlers').get(),

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
	const fullyQualifiedName = schema.sharedPath + '/' + schema.fileName;
	addPathToUnionObjectIfRequired(fullyQualifiedName);
	schemaAndHandlersFilePathUnion[fullyQualifiedName].schema = readSchema(schema.path);
});

// map handlers on to the union
_.each(handlers, handler => {
	const fullyQualifiedName = handler.sharedPath + '/' + handler.fileName;
	addPathToUnionObjectIfRequired(fullyQualifiedName);
	schemaAndHandlersFilePathUnion[fullyQualifiedName].handler = readHandler(handler.path);
});

// debug out errors and info
Handler.emitter.on(Handler.emitter.ERROR, debug.error);
Handler.emitter.on(Handler.emitter.INFO, debug.log);

// map tuples to handler handle promises and swallow any errors
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
		callback: schemaHandlerTuple.handler
	});
})).catch(err => {});
