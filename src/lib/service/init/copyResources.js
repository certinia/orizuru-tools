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

/**
 * Service for copying resources when creating Orizuru templates.
 * @module service/init/copyResources
 * @see module:service/init/copyResources
 */

const
	_ = require('lodash'),
	path = require('path'),
	fs = require('fs-extra'),
	logger = require('../../util/logger'),

	Promise = require('bluebird'),

	SELECTED_TEMPLATE_CONFIGURATION_FILE_EXTENSIONS = 'selectedTemplate.configuration.extensions',
	SELECTED_TEMPLATE_PATH = 'selectedTemplate.fullPath',
	TEMPLATE_FOLDER = 'templateFolder',

	CWD = process.cwd(),
	log = logger.logLn;

/**
 * Copy an individual resource folder.
 */
function copyResource(results, resource) {

	return Promise.resolve()
		.then(() => log(`Copying ${resource}`))
		.then(() => fs.copy(resource, CWD))
		.then(result => {
			results.push(resource);
			return results;
		});

}

/**
 * Copy the resources required for this template.
 * @instance
 */
function copyResources(config) {

	log('Copying resources to ' + CWD);

	const
		templateFolder = _.get(config, TEMPLATE_FOLDER),
		templateSelectedPath = _.get(config, SELECTED_TEMPLATE_PATH),
		extensions = _.get(config, SELECTED_TEMPLATE_CONFIGURATION_FILE_EXTENSIONS),
		resourcePath = path.resolve(templateSelectedPath, 'res'),
		extensionResources = _.map(extensions, (extensionPackage, extension) => {
			return path.resolve(templateFolder, extension, 'res');
		});

	return Promise.reduce(extensionResources, copyResource, [])
		.then(() => copyResource([], resourcePath))
		.then(() => config);
}

module.exports = copyResources;
