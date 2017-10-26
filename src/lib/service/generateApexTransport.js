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
	_ = require('lodash'),
	{ resolve } = require('path'),

	{ getAvscFilesOnPathRecursively } = require('./generateApexTransport/getAvscFilesOnPathRecursively'),
	{ generate } = require('./generateApexTransport/generate'),
	{ overwriteFile } = require('./generateApexTransport/overwriteFile'),

	{ log, logStart, logFinish, logError } = require('../util/logger');

function validateArgs(options) {
	if (!_.isString(options.inputUrl)) {
		throw new Error('Please set inputUrl as the first argument.');
	}
	if (!_.isString(options.outputUrl)) {
		throw new Error('Please set outputUrl as the second argument.');
	}
	return options;
}

function generateClasses(options) {
	const
		files = getAvscFilesOnPathRecursively(resolve(process.cwd(), options.inputUrl)),
		parsedSchemas = [];
	log(_.map(files, file => file.path));
	_.each(files, file => {
		try {
			parsedSchemas.push(JSON.parse(file.file));
		} catch (err) {
			throw new Error('Contents of .avsc files should be valid json.')
		}
	});
	// eslint-disable-next-line one-var
	const
		result = generate(parsedSchemas),
		outputPath = resolve(process.cwd(), options.outputUrl);
	overwriteFile(resolve(outputPath, 'OrizuruTransport.cls'), result.cls);
	overwriteFile(resolve(outputPath, 'OrizuruTransport.xml'), result.xml);
}

class GenerateApexTransport {

	static generateApexTransport(argv) {
		return Promise
			.resolve(argv)
			.then(validateArgs)
			.then(logStart('Generating apex transport classes'))
			.then(generateClasses)
			.then(logFinish('\nGenerated apex transport classes (OrizuruTransport.cls) in: ' + resolve(process.cwd(), argv.outputUrl)))
			.catch(logError);
	}

}

module.exports = GenerateApexTransport;
