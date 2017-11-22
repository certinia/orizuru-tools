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
 * Service for generating the Apex transport classes.
 * @module service/generateApexTransport
 * @see module:service/generateApexTransport
 */

'use strict';

const
	_ = require('lodash'),
	path = require('path'),

	getAvscFilesOnPathRecursively = require('./generateApexTransport/getAvscFilesOnPathRecursively').getAvscFilesOnPathRecursively,
	generate = require('./generateApexTransport/generate').generate,
	overwriteFile = require('./generateApexTransport/overwriteFile'),

	logger = require('../util/logger');

function validateArgs(config) {
	if (!_.isString(config.inputUrl)) {
		throw new Error('Please set inputUrl as the first argument.');
	}
	if (!_.isString(config.outputUrl)) {
		throw new Error('Please set outputUrl as the second argument.');
	}
	return config;
}

function parseSchemas(files) {

	return _.map(files, file => {
		try {
			return JSON.parse(file.file);
		} catch (err) {
			throw new Error('Contents of .avsc files should be valid json.');
		}
	});

}

function generateClasses(config) {

	const
		files = getAvscFilesOnPathRecursively(path.resolve(process.cwd(), config.inputUrl)),
		parsedSchemas = parseSchemas(files),
		result = generate(parsedSchemas),
		outputPath = path.resolve(process.cwd(), config.outputUrl);

	return overwriteFile(outputPath, 'OrizuruTransport.cls', result.cls)
		.then(() => overwriteFile(outputPath, 'OrizuruTransport.cls-meta.xml', result.xml))
		.then(() => config);
}

/**
 * Generates the OrizuruTransport class file with the required Apex Transport classes.
 * @instance
 * @param {Object} config - The command line arguments.
 */
function generateApexTransport(config) {

	return Promise.resolve(config)
		.then(validateArgs)
		.then(logger.logStart('Generating apex transport classes'))
		.then(generateClasses)
		.then((config) => logger.log('\nGenerated apex transport classes (OrizuruTransport.cls) in: ' + path.resolve(process.cwd(), config.outputUrl)))
		.catch(logger.logError);

}

module.exports = {
	generateApexTransport
};
