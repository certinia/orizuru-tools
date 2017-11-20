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
 * Utility module to handle logging.
 * @module util/logger
 * @see module:util/logger
 */

'use strict';

const
	_ = require('lodash'),
	ui = require('cliui'),

	EMPTY = '',
	NEW_LINE = '\n';

function addOutput(output, message) {

	if (_.isArray(message)) {
		message.forEach((line) => {
			addOutput(output, line);
		});
	} else {
		output.div(message);
	}

}

function log(message, config) {

	const silent = _.get(config, 'silent') || _.get(config, 'argv.silent') || false;
	if (!silent && message) {
		const output = ui({ width: 200 });
		addOutput(output, message);
		output.div(EMPTY);
		process.stdout.write(output.toString());
	}

	return config;

}

function logLn(message) {
	return log(message + NEW_LINE);
}

function logLns(message) {
	return log(NEW_LINE + message);
}

function logError(error) {
	logLn(error.message);
}

function logEvent(message) {
	return function (config) {
		return log(message, config);
	};
}

function logStart(message) {

	message = message ? NEW_LINE + message : undefined;

	return function (config) {
		return log(message, config);
	};

}

function logFinish(message) {

	message = message ? message + NEW_LINE : undefined;

	return function (config) {
		return log(message, config);
	};

}

module.exports = {
	log,
	logLn,
	logLns,
	logError,
	logEvent,
	logStart,
	logFinish
};
