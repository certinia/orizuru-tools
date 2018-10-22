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

/**
 * Service for copying resources when creating Orizuru templates.
 * @module service/init/copyResources
 * @see module:service/init/copyResources
 */

const
	_ = require('lodash'),
	path = require('path'),

	Promise = require('bluebird'),

	shell = require('../../util/shell'),

	SELECTED_TEMPLATE_CONFIGURATION_FILE_EXTENSIONS = 'selectedTemplate.configuration.extensions',
	SELECTED_TEMPLATE_PATH = 'selectedTemplate.fullPath',
	TEMPLATE_FOLDER = 'templateFolder';

function copySingleResource(config, resource) {

	const
		cwd = process.cwd(),
		command = {
			cmd: 'cp',
			args: ['-r', resource + '/.', cwd],
			opts: {
				logging: {
					finish: `Copied ${resource}/. to ${cwd}`
				}
			}
		};

	return shell.executeCommand(command, config);

}

/**
 * Copy the resources required for this template.
 * @instance
 * @param {Object} config - The configuration object passed through the process.
 * @returns {Promise<Object>} config - The __unmodified__ configuration object.
 */
function copy(config) {

	const
		templateFolder = _.get(config, TEMPLATE_FOLDER),
		templateSelectedPath = _.get(config, SELECTED_TEMPLATE_PATH),
		extensions = _.get(config, SELECTED_TEMPLATE_CONFIGURATION_FILE_EXTENSIONS),
		resourcePath = path.resolve(templateSelectedPath, 'res'),
		extensionResources = _.map(extensions, (extensionPackage, extension) => {
			return path.resolve(templateFolder, extension, 'res');
		});

	return Promise.reduce(extensionResources, copySingleResource, config)
		.then(() => copySingleResource(config, resourcePath))
		.then(() => shell.executeCommand({ cmd: 'ls', args: ['-a', process.cwd()] }))
		.then(() => config);
}

/**
 * Renames the gitignore resource file to .gitignore.
 *
 * When publishing a node module all .git files are removed.
 * We need to be able to publish the .gitignore file as part of each template,
 * hence, we publish it as gitignore and then rename it as part of the init process.
 * @instance
 * @param {Object} config - The configuration object passed through the process.
 * @returns {Promise<Object>} config - The __unmodified__ configuration object.
 */
function renameGitIgnore(config) {

	const
		cwd = process.cwd(),
		oldPath = path.resolve(cwd, 'gitignore'),
		newPath = path.resolve(cwd, '.gitignore'),
		command = {
			cmd: 'mv',
			args: [oldPath, newPath],
			opts: {
				logging: {
					finish: `Renamed ${oldPath} to ${newPath}`
				}
			}
		};

	return shell.executeCommand(command, config);

}

module.exports = {
	copy,
	renameGitIgnore
};
