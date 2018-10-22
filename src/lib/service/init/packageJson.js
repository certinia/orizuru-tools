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
 * Service for handling the package.json file.
 * @module service/init/packageJson
 * @see module:service/init/packageJson
 */

const
	_ = require('lodash'),
	fs = require('fs-extra'),
	inquirer = require('inquirer'),
	path = require('path'),

	logger = require('../../util/logger'),
	questions = require('../../util/questions'),
	validators = require('../../util/validators'),

	SELECTED_TEMPLATE_PACKAGE_CONFIGURATION = 'selectedTemplate.configuration.file.package',
	SELECTED_TEMPLATE_EXTENSION_CONFIGURATION_FILES = 'selectedTemplate.configuration.extensions',

	defaults = {
		['package']: {
			name: 'Orizuru',
			version: '1.0.0',
			description: '',
			main: 'src/node/lib/web.js',
			author: 'FinancialForce',
			license: 'BSD-3-Clause'
		}
	};

/**
 * Replicates the questions asked by the `npm init` command to initialise a project.
 * @instance
 * @param {Object} config - The configuration object passed through the process.<br/>_This is mutable_ and should contain the following properties for this part of the process:
 * @param {Object} config.argv - The arguments passed in on the command line.
 * @param {Object} config.package - The package.json file contents.
 * @returns {Promise<Object>} config - The __modified__ configuration object.
 */
function askQuestions(config) {

	if (_.get(config, 'argv.useDefaults')) {
		_.set(config, 'package', defaults.package);
		return config;
	}

	return inquirer.prompt([
		questions.inputField('Package Name', 'package.name', validators.validateNotEmpty, defaults.package.name),
		questions.inputField('Version', 'package.version', validators.validateNotEmpty, defaults.package.version),
		questions.inputField('Description', 'package.description', validators.valid, defaults.package.description),
		questions.inputField('Entry point', 'package.main', validators.validateNotEmpty, defaults.package.main),
		questions.inputField('Author', 'package.author', validators.valid, defaults.package.author),
		questions.inputField('License', 'package.license', validators.valid, defaults.package.license)
	]).then(answers => _.merge(config, answers));

}

/**
 * Builds the package.json file.
 *
 * This uses the process.
 *
 * 1. Check for the templates that this template extends; i.e. check for the `extends` property within the template `.config.json` file.
 * 1. For each of the extension templates:
 * 	- find the template configuration file; the `.config.json` file.
 * 	- check for the `package` property within the configuration file.
 * 	- merge the `package` property into the configuration `package` property.
 * 1. Merge in the `package` property from the current template configuration file.
 * @instance
 * @param {Object} config - The configuration object passed through the process.<br/>_This is mutable_ and should contain the following properties for this part of the process.
 * @param {Object} config.package - The existing package.json file.
 * @param {Object} config.selectedTemplate - The selected template.
 * @param {Object} config.selectedTemplate.configuration - The configuration for the selected template.
 * @param {Object} config.selectedTemplate.configuration.file - The configuration file contents.
 * @param {Object} config.selectedTemplate.configuration.file.package - The package properties.
 * @param {Object} [config.selectedTemplate.configuration.extensions] - The extensions for this template.
 * @param {Object} [config.selectedTemplate.configuration.extensions.package] - The package properties.
 * @returns {Object} config - The __modified__ configuration object.
 */
function build(config) {

	const
		extensionConfigurationFiles = _.values(_.get(config, SELECTED_TEMPLATE_EXTENSION_CONFIGURATION_FILES)),
		extensionConfigurationPackageFiles = _.map(extensionConfigurationFiles, configurationFile => configurationFile.package || {}),
		selectedTemplateConfigurationFilePackage = _.get(config, SELECTED_TEMPLATE_PACKAGE_CONFIGURATION);

	_.reduce(extensionConfigurationPackageFiles, (result, fileContents) => {
		return _.merge(result, fileContents);
	}, config.package);

	return _.merge(config, { 'package': selectedTemplateConfigurationFilePackage });

}

/**
 * Log out the package.json.
 * @instance
 * @param {Object} config - The configuration object passed through the process.
 * @returns {Object} config - The __unmodified__ configuration object.
 */
function debugPackageJson(config) {
	logger.logEvent(`Wrote to ${config.path.package}:`);
	logger.logEvent(JSON.stringify(config.package, '\t'));
	return config;
}

/**
 * Reads the package.json file from the file system.
 * @instance
 * @param {Object} config - The configuration object passed through the process.<br/>_This is mutable_ and is modified with this command.
 * @returns {Promise<Object>} config - The __modified__ configuration object.
 */
function read(config) {

	const filePath = path.resolve(process.cwd(), 'package.json');
	_.set(config, 'path.package', filePath);

	return fs.readJson(filePath)
		.then(result => _.merge(config, { 'package': result }));
}

/**
 * Writes the package.json file to the file system.
 * @instance
 * @param {Object} config - The configuration object passed through the process.
 * @returns {Promise<Object>} config - The __unmodified__ configuration object.
 */
function write(config) {

	return Promise.resolve(config)
		.then(logger.logEvent('Merging template data into package.json'))
		.then(config => fs.writeJson(config.path.package, config.package, { spaces: '\t' }))
		.then(() => debugPackageJson(config))
		.then(logger.logEvent('Merged template data into package.json'));

}

/**
 * Creates the package.json file.
 *
 * This follows the process:
 * 1. Ask the NPM init questions.
 * 1. Read the existing package.json file.
 * 1. Merge the package.json information from the selected template and its extensions into the existing paclagae.json file.
 * 1. Write the package.json file to the file system.
 * @instance
 * @param {Object} config - The configuration object passed through the process.<br/>_This is mutable_ and is modified with this command.
 * @returns {Promise<Object>} config - The __modified__ configuration object.
 */
function create(config) {

	return Promise.resolve(config)
		.then(read)
		.then(askQuestions)
		.then(build)
		.then(write);

}

module.exports = {
	askQuestions,
	build,
	create,
	read,
	write
};
