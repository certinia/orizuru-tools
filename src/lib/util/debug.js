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

/**
 * Utility module to handle debugging.
 * @module util/debug
 * @see module:util/debug
 */

'use strict';

const
	_ = require('lodash'),
	coreDebug = require('debug'),
	debugStream = require('debug-stream');

/**
 * Adds the buffer formatter to the debugger.
 * @instance
 * @param {*} debug - The debug instance
 */
function addBufferFormatter(debug) {

	coreDebug.formatters.b = (buffer) => {
		const lines = _.compact(_.split(buffer, '\n'));
		_.each(_.initial(lines), (value) => {
			debug(value);
		});
		return _.last(lines) || '';
	};

}

function enableLogging(config, namespace) {

	const log = coreDebug(namespace);

	if (!_.get(config, 'silent', false) && _.get(config, 'debug', false)) {
		coreDebug.enable(namespace);
	}

	return log;

}

function log(config, namespace, message) {
	enableLogging(config, namespace)(message);
}

function stringify(config, namespace, message) {
	enableLogging(config, namespace)(JSON.stringify(message, undefined, 2));
}

module.exports = {
	create: coreDebug,
	log,
	stringify,
	debugStream,
	addBufferFormatter
};
