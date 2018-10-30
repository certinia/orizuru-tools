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
	_ = require('lodash'),
	walk = require('./walk'),

	EMPTY = '',
	INCOMING = '_incoming',
	OUTGOING = '_outgoing';

/**
 * Gets all the schemas for a web dyno.
 *
 * Web dyno schemas are identified as any file without the suffixes `_incoming` and `_outgoing`.
 * @returns {Object} - Map of schema name to schema object.
 */
function getWebSchemas() {

	const schemas = walk.walk('schema', '.avsc');

	return _.reduce(schemas, (results, schema) => {

		const fileName = schema.fileName;

		if (!fileName.endsWith(INCOMING) && !fileName.endsWith(OUTGOING)) {
			results[fileName] = schema;
		}

		return results;

	}, {});

}

/**
 * @typedef FileInfo
 * @property {string} path - The full path to the file.
 * @property {string} sharedPath - The relative path to the file.
 * @property {string} fileName - The last portion of the file path without the extension.
 */

/**
 * @typedef Schema
 * @property {FileInfo} incoming
 * @property {FileInfo} outgoing
 */

/**
 * @typedef {Object.<string, Schema>} WorkerSchema
 */

/**
 * Gets all the schemas for a worker dyno.
 *
 * Worker dyno schemas are identified via the file name suffixes `_incoming` and `_outgoing`.
 *
 * An `_incoming` schema is always required.
 *
 * An `_outgoing` schema is optional. It is used for publishing onward messages to other worker dynos.
 *
 * @returns {WorkerSchema} - The map of names to schemas.
 */
function getWorkerSchemas() {

	const schemas = walk.walk('schema', '.avsc');

	return _.reduce(schemas, (results, schema) => {

		const fileName = schema.fileName;

		let property;

		if (fileName.endsWith(INCOMING)) {
			const incomingFileName = fileName.replace(INCOMING, EMPTY);
			property = incomingFileName + '.incoming';
		} else if (fileName.endsWith(OUTGOING)) {
			const outgoingFileName = fileName.replace(OUTGOING, EMPTY);
			property = outgoingFileName + '.outgoing';
		}

		if (property) {
			_.set(results, property, schema);
		}

		return results;

	}, {});

}

module.exports = {
	getWebSchemas,
	getWorkerSchemas
};
