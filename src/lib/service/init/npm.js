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
 * Service for processing NPM commands.
 * @module service/init/npm
 * @see module:service/init/npm
 */

const
	_ = require('lodash'),
	fs = require('fs-extra'),
	inquirer = require('inquirer'),
	path = require('path'),
	logger = require('../../util/logger'),
	questions = require('../../util/questions'),
	shell = require('../../util/shell'),
	validators = require('../../util/validators'),

	SELECTED_TEMPLATE_PACKAGE_CONFIGURATION = 'selectedTemplate.configuration.file.package',
	SELECTED_TEMPLATE_EXTENSION_CONFIGURATION_FILES = 'selectedTemplate.configuration.extensions',

	defaults = {
		['package']: {
			name: 'Orizuru',
			version: '1.0.0',
			description: '',
			main: 'index.js',
			author: 'FinancialForce',
			license: 'BSD-3-Clause'
		}
	};

/**
 * Replicates the questions asked by the `npm init` command to initialise a project.
 * @instance
 * @param {object} config - The configuration object passed through the process.<br/>_This is mutable_ and should contain the following properties for this part of the process:
 * @param {object} config.argv - The arguments passed in on the command line.
 * @param {object} config.package - The package.json file contents.
 * @returns config - The __modified__ configuration object.
 */
function askQuestions(config) {

	if (config.argv.useDefaults) {
		config.package = defaults.package;
		return config;
	}

	return inquirer.prompt([
		questions.inputField('Package Name', 'package.name', validators.validateNotEmpty, defaults.package.name),
		questions.inputField('Version', 'package.version', validators.validateNotEmpty, defaults.package.version),
		questions.inputField('Description', 'package.description', validators.valid, defaults.package.description),
		questions.inputField('Entry point', 'package.main', validators.validateNotEmpty, defaults.package.main),
		questions.inputField('Author', 'package.author', validators.valid, defaults.package.author),
		questions.inputField('License', 'package.license', validators.valid, defaults.package.license)
	]).then(answers => {
		config.package = answers.package;
		return config;
	});

}

/**
 * Reads the package.json file from the file system.
 * @instance
 * @param {object} config - The configuration object passed through the process.<br/>_This is mutable_ and is modified with this command.
 * @returns config - The __modified__ configuration object.
 */
function readPackageJson(config) {
	return fs.readJson(path.resolve(process.cwd(), 'package.json'))
		.then(result => {
			config.package = _.merge(result, config.package);
			return config;
		});
}

/**
 * Writes the package.json file to the file system. 
 * @instance
 */
function writePackageJson(config) {
	return fs.writeJSON(path.resolve(process.cwd(), 'package.json'), config.package, { spaces: 2 })
		.then(() => config);
}

/**
 * @description Builds the package.json file.
 * 
 * This uses the process:
 * 
 * 1. Check for the templates that this template extends; i.e. check for the `extends` property within the template `.config.json` file.
 * 1. For each of the extension templates:
 * 	- find the template configuration file; the `.config.json` file.
 * 	- check for the `package` property within the configuration file.
 * 	- merge the `package` property into the configuration `package` property.
 * 1. Merge in the `package` property from the current template configuration file.
 * @instance
 * @param {object} config - The configuration object passed through the process.<br/>_This is mutable_ and should contain the following properties for this part of the process:
 * @param {object} config.selectedTemplate - The selected template.
 * @param {object} config.selectedTemplate.configuration - The configuration for the selected template.
 * @param {object} config.selectedTemplate.configuration.file - The configuration file contents.
 * @param {object} config.selectedTemplate.configuration.file.package - The package properties.
 * @param {object} [config.selectedTemplate.configuration.extensions] - The extension.
 * @param {object} [config.selectedTemplate.configuration.extensions.package] - The package properties.
 * @returns config - The __modified__ configuration object.
 */
function buildPackageJson(config) {

	const
		extensionConfigurationFiles = _.values(_.get(config, SELECTED_TEMPLATE_EXTENSION_CONFIGURATION_FILES)),
		extensionConfigurationPackageFiles = _.map(extensionConfigurationFiles, configurationFile => configurationFile.package || {}),
		selectedTemplateConfigurationFilePackage = _.get(config, SELECTED_TEMPLATE_PACKAGE_CONFIGURATION);

	_.reduce(extensionConfigurationPackageFiles, (result, fileContents) => {
		_.merge(result, fileContents);
		return result;
	}, config.package);

	_.merge(config.package, selectedTemplateConfigurationFilePackage);

	return writePackageJson(config);
}

/**
 * Runs the NPM init command with yes set to true.
 * @instance
 * @param {object} config - The configuration object passed through the process.
 * @returns config - The __unmodified__ configuration object.
 */
function init(config) {
	return Promise.resolve(config)
		.then(logger.logStart('Generating default package.json'))
		.then(() => shell.executeCommand({ cmd: 'npm', args: ['init', '-y'], opts: { exitOnError: true } }))
		.then(() => config);
}

/**
 * Runs the NPM install command.
 * @instance
 * @param {object} config - The configuration object passed through the process.
 * @returns config - The __unmodified__ configuration object.
 */
function install(config) {
	return Promise.resolve(config)
		.then(logger.logStart('Installing NPM dependencies'))
		.then(() => shell.executeCommand({ cmd: 'npm', args: ['install'], opts: { exitOnError: true, namespace: 'npm~install' } }))
		.then(() => config);
}

/**
 * Runs the NPM script for the Orizuru generate-apex-transport step.
 * @instance
 * @param {object} config - The configuration object passed through the process.
 * @returns config - The __unmodified__ configuration object.
 */
function generateApexTransport(config) {
	return Promise.resolve(config)
		.then(logger.logStart('Generating Apex transport classes'))
		.then(() => shell.executeCommand({ cmd: 'npm', args: ['run', 'generate-apex-transport'], opts: { exitOnError: true, namespace: 'npm~generate~apex~transport' } }))
		.then(() => config);
}

/**
 * Runs the NPM script to generate Javascript documentation.
 * @instance
 * @param {object} config - The configuration object passed through the process.
 * @returns config - The __unmodified__ configuration object.
 */
function generateDocumentation(config) {
	return Promise.resolve(config)
		.then(logger.logStart('Generating documentation'))
		.then(() => shell.executeCommand({ cmd: 'npm', args: ['run', 'doc'], opts: { exitOnError: true, namespace: 'npm~generate~apex~transport' } }))
		.then(() => config);
}

/**
 * Runs the NPM script for the Orizuru post-init step.
 * @instance
 * @param {object} config - The configuration object passed through the process.
 * @returns config - The __unmodified__ configuration object.
 */
function orizuruPostInit(config) {
	return Promise.resolve(config)
		.then(logger.logStart('Running Orizuru post init'))
		.then(() => shell.executeCommand({ cmd: 'npm', args: ['run', 'orizuru-post-init'], opts: { exitOnError: true, namespace: 'npm~orizuru~post~init' } }))
		.then(() => config);
}

/**
 * Runs the NPM test command.
 * @instance
 * @param {object} config - The configuration object passed through the process.
 * @returns config - The __unmodified__ configuration object.
 */
function test(config) {
	return Promise.resolve(config)
		.then(logger.logStart('Running tests'))
		.then(() => shell.executeCommand({ cmd: 'npm', args: ['test'], opts: { exitOnError: true, namespace: 'npm~test' } }))
		.then(() => config);
}

module.exports = {
	askQuestions,
	buildPackageJson,
	init,
	install,
	generateApexTransport,
	generateDocumentation,
	orizuruPostInit,
	readPackageJson,
	test
};
