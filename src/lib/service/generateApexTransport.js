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

/**
 * Service for generating the Apex transport classes.
 * @module service/generateApexTransport
 * @see module:service/generateApexTransport
 */

'use strict';

const
	_ = require('lodash'),
	path = require('path'),

	generate = require('./generateApexTransport/generate'),
	writer = require('./generateApexTransport/overwriteFile'),

	logger = require('../util/logger'),
	read = require('../util/read');

function validateArgs(config) {
	if (!_.isString(_.get(config, 'argv.inputUrl'))) {
		throw new Error('Please set inputUrl as the first argument.');
	}
	if (!_.isString(_.get(config, 'argv.outputUrl'))) {
		throw new Error('Please set outputUrl as the second argument.');
	}
	return config;
}

function parseSchemas(files) {

	return Object.values(files).map((file) => {
		try {
			return JSON.parse(file);
		} catch (err) {
			throw new Error('Contents of .avsc files should be valid json.');
		}
	});

}

function generateClasses(config) {

	const
		avscFilesPath = path.resolve(process.cwd(), config.argv.inputUrl),
		files = read.readFilesWithExtension(avscFilesPath, '.avsc'),
		parsedSchemas = parseSchemas(files),
		result = generate.generate(parsedSchemas),
		outputPath = path.resolve(process.cwd(), config.argv.outputUrl);

	return writer.overwriteFile(outputPath, 'OrizuruTransport.cls', result.cls)
		.then(() => writer.overwriteFile(outputPath, 'OrizuruTransport.cls-meta.xml', result.xml))
		.then(() => config);
}

/**
 * Generates the OrizuruTransport class file with the required Apex Transport classes.
 * @instance
 * @param {Object} config - The command line arguments.
 * @returns {Promise<Object>} - The passed in config.
 */
function generateApexTransport(config) {

	return Promise.resolve(config)
		.then(validateArgs)
		.then(logger.logEvent('Generating apex transport classes'))
		.then(generateClasses)
		.then(config => logger.log('\nGenerated apex transport classes (OrizuruTransport.cls) in: ' + path.resolve(process.cwd(), config.argv.outputUrl)))
		.then(() => config)
		.catch(logger.logError);

}

module.exports = {
	generateApexTransport
};
