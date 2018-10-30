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

	// get utils
	_ = require('lodash'),
	throng = require('throng'),
	debug = require('debug-plus')('worker'),
	{ readSchema, readHandler } = require('./boilerplate/read'),

	// define transport
	transport = require('./boilerplate/transport'),

	// get orizuru classes
	{ Handler, Publisher } = require('@financialforcedev/orizuru'),
	handlerInstance = new Handler(transport),
	publisherInstance = new Publisher(transport),

	// get all files in our 'schemas' and 'handlers' directories
	schemas = require('./boilerplate/schema').getWorkerSchemas(),
	handler = require('./boilerplate/handler'),
	handlers = handler.get(),

	// create an object to contain the union of schema and handler paths
	schemasAndHandlers = {};

// map schemas on to the union
_.each(schemas, (schema, schemaName) => {

	const fullyQualifiedName = schema.incoming.sharedPath + '/' + schemaName;
	_.set(schemasAndHandlers, fullyQualifiedName + '.schema.incoming', readSchema(schema.incoming.path));

	if (_.get(schema, 'outgoing.path')) {
		_.set(schemasAndHandlers, fullyQualifiedName + '.schema.outgoing', readSchema(schema.outgoing.path));
	}

});

// map handlers on to the union
_.each(handlers, handler => {
	const fullyQualifiedName = handler.sharedPath + '/' + handler.fileName;
	_.set(schemasAndHandlers, fullyQualifiedName + '.handler', readHandler(handler.path));
});

// debug out errors and info
Handler.emitter.on(Handler.emitter.ERROR, debug.error);
Handler.emitter.on(Handler.emitter.INFO, debug.log);

function handle() {
	// map tuples to handler handle promises and swallow any errors
	Promise.all(_.map(schemasAndHandlers, (schemasAndHandler, sharedPath) => {

		if (!schemasAndHandler.schema) {
			debug.warn('no schema found for handler \'%s\'', sharedPath);
			return null;
		}

		if (!schemasAndHandler.handler) {
			debug.warn('no handler found for schema \'%s\'', sharedPath);
			return null;
		}

		let callback = schemasAndHandler.handler;

		if (schemasAndHandler.schema.outgoing) {

			callback = handler.publishHandler({
				schemasAndHandler,
				publisherInstance
			});

		}

		return handlerInstance.handle({
			schema: schemasAndHandler.schema.incoming,
			callback
		});
	}));
}

if (CONCURRENCY > 1) {
	throng(CONCURRENCY, handle);
} else {
	handle();
}
