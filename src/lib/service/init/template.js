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
 * Service for handling Orizuru templates.
 * @module service/init/template
 * @see module:service/init/template
 */

'use strict';

const
	_ = require('lodash'),
	fs = require('fs-extra'),
	inquirer = require('inquirer'),
	path = require('path'),

	questions = require('../../util/questions'),
	validators = require('../../util/validators'),

	AVAILABLE_TEMPLATES = 'availableTemplates',
	CLI_SELECTED_TEMPLATE = 'argv.template',
	CONFIGURATION_FILE = '.config.json',
	QUESTION = 'Select app to create:',
	SELECTED_TEMPLATE = 'selectedTemplate.folder',
	SELECTED_TEMPLATE_CONFIGURATION_FILE = 'selectedTemplate.configuration.file',
	SELECTED_TEMPLATE_CONFIGURATION_FILE_EXTENSIONS = 'selectedTemplate.configuration.file.extends',
	SELECTED_TEMPLATE_EXTENSION_CONFIGURATION_FILES = 'selectedTemplate.configuration.extensions',
	SELECTED_TEMPLATE_PATH = 'selectedTemplate.fullPath',
	TEMPLATE_FOLDER = 'templateFolder';

function isDirectory(source) {
	return fs.lstatSync(source).isDirectory();
}

/**
 * Finds all the templates in the default Orizuru templates folder.
 * @instance
 * @param {Object} config - The configuration object passed through the process.<br/>This is mutable and should contain the following properties for this part of the process:
 * @param {string} config.templateFolder - The folder to search for templates.
 * @returns {Promise<Object>} config - The modified configuration object.
 */
function findTemplates(config) {

	const source = _.get(config, TEMPLATE_FOLDER);
	return fs.readdir(source)
		.then(files => _.filter(files, file => isDirectory(path.resolve(source, file))))
		.then(choices => _.set(config, AVAILABLE_TEMPLATES, choices));

}

/*
 * Reads the template configuration file.
 */
function readTemplateConfigurationFile(config, template) {

	const
		source = _.get(config, TEMPLATE_FOLDER),
		templatePath = path.resolve(source, template),
		configFilePath = path.resolve(templatePath, CONFIGURATION_FILE);

	return fs.readJson(configFilePath);

}

/*
 * Reads the selected template configuration file.
 */
function readSelectedTemplateConfigurationFile(config) {
	const selectedTemplate = _.get(config, SELECTED_TEMPLATE);
	return readTemplateConfigurationFile(config, selectedTemplate);
}

/*
 * Read extension configuration files for the selected template.
 */
function readExtensionConfigurationFiles(config) {

	const
		extensions = _.get(config, SELECTED_TEMPLATE_CONFIGURATION_FILE_EXTENSIONS),
		extensionTemplateConfigurationFiles = _.map(extensions, extension => {
			return readTemplateConfigurationFile(config, extension)
				.then(configuration => ({
					[extension]: configuration
				}));
		});

	return Promise.all(extensionTemplateConfigurationFiles);

}

/*
 * Reads all the configuration files for the selected template.
 */
function readAllConfigurationFiles(config) {

	return readSelectedTemplateConfigurationFile(config)
		.then(configurationFile => _.set(config, SELECTED_TEMPLATE_CONFIGURATION_FILE, configurationFile))
		.then(config => {
			return readExtensionConfigurationFiles(config)
				.then(contents => {
					const mergedContents = _.assign.apply(_, contents);
					return _.set(config, SELECTED_TEMPLATE_EXTENSION_CONFIGURATION_FILES, mergedContents);
				});
		});

}

/**
 * Uses the template provided from the command line arguments or prompts the user to select a template
 * from the available list of templates.
 * @instance
 * @param {Object} config - The configuration object passed through the process.<br/>This is mutable and should contain the following properties for this part of the process:
 * @param {string} [config.argv.template] - The selected template from the command line arguments.<br/>The user is prompted to select a template when this property is not present.
 * @param {string} config.templateFolder - The folder containing all the templates.
 * @param {string} config.availableTemplates - The templates that are available from the template folder.
 * @returns {Promise<Object>} config - The modified configuration object.
 */
function askQuestions(config) {

	const
		selectedTemplate = _.get(config, CLI_SELECTED_TEMPLATE),
		availableTemplates = _.get(config, AVAILABLE_TEMPLATES),
		source = _.get(config, TEMPLATE_FOLDER),
		askQuestions = [questions.listField(QUESTION, SELECTED_TEMPLATE, validators.valid, availableTemplates)];

	if (selectedTemplate && _.indexOf(availableTemplates, selectedTemplate) !== -1) {
		_.set(config, SELECTED_TEMPLATE, selectedTemplate);
		_.set(config, SELECTED_TEMPLATE_PATH, path.resolve(source, selectedTemplate));
		return readAllConfigurationFiles(config);
	}

	return inquirer.prompt(askQuestions)
		.then(answers => _.merge(config, answers))
		.then(config => _.set(config, SELECTED_TEMPLATE_PATH, path.resolve(source, config.selectedTemplate.folder)));
}

/**
 * Allows the selection of an Orizuru template.
 * @instance
 * @param {Object} config - The configuration object passed through the process.<br/>This is mutable and is modified during this process.
 * @returns {Promise<Object>} - The passed config.
 */
function select(config) {
	return Promise.resolve(_.set(config, TEMPLATE_FOLDER, path.resolve(__dirname, '..', '..', '..', '..', 'templates')))
		.then(findTemplates)
		.then(askQuestions)
		.then(readAllConfigurationFiles)
		.then(config => config);
}

module.exports = {
	select
};
