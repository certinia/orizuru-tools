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
 * Service for processing NPM commands.
 * @module service/init/npm
 * @see module:service/init/npm
 */

const shell = require('../../util/shell');

/**
 * Runs the NPM init command with yes set to true.
 * @instance
 * @param {Object} config - The configuration object passed through the process.
 * @returns {Promise<Object>} config - The __unmodified__ configuration object.
 */
function init(config) {

	const command = {
		cmd: 'npm',
		args: ['init', '-y'],
		opts: {
			logging: {
				start: 'Generating default package.json',
				finish: 'Generated default package.json'
			},
			namespace: 'npm~init'
		}
	};

	return shell.executeCommand(command, config);
}

/**
 * Runs the NPM install command.
 * @instance
 * @param {Object} config - The configuration object passed through the process.
 * @returns {Promise<Object>} config - The __unmodified__ configuration object.
 */
function install(config) {

	const command = {
		cmd: 'npm',
		args: ['install'],
		opts: {
			logging: {
				start: 'Installing NPM dependencies',
				finish: 'Installed NPM dependencies'
			},
			namespace: 'npm~install'
		}
	};

	return shell.executeCommand(command, config);

}

/**
 * Runs the NPM script for the Orizuru generate-apex-transport step.
 * @instance
 * @param {Object} config - The configuration object passed through the process.
 * @returns {Promise<Object>} config - The __unmodified__ configuration object.
 */
function generateApexTransport(config) {

	const command = {
		cmd: 'npm',
		args: ['run', 'generate-apex-transport'],
		opts: {
			logging: {
				start: 'Generating Apex transport classes',
				finish: 'Generated Apex transport classes'
			},
			namespace: 'npm~generate~apex~transport'
		}
	};

	return shell.executeCommand(command, config);

}

/**
 * Runs the NPM script to generate Javascript documentation.
 * @instance
 * @param {Object} config - The configuration object passed through the process.
 * @returns {Promise<Object>} config - The __unmodified__ configuration object.
 */
function generateDocumentation(config) {

	const command = {
		cmd: 'npm',
		args: ['run', 'doc'],
		opts: {
			logging: {
				start: 'Generating documentation',
				finish: 'Generated documentation'
			},
			namespace: 'npm~generate~documentation'
		}
	};

	return shell.executeCommand(command, config);

}

/**
 * Runs the NPM script for the Orizuru post-init step.
 * @instance
 * @param {Object} config - The configuration object passed through the process.
 * @returns {Promise<Object>} config - The __unmodified__ configuration object.
 */
function orizuruPostInit(config) {

	const command = {
		cmd: 'npm',
		args: ['run', 'orizuru-post-init'],
		opts: {
			logging: {
				start: 'Started Orizuru post init',
				finish: 'Finished Orizuru post init'
			},
			namespace: 'npm~orizuru~post~init'
		}
	};

	return shell.executeCommand(command, config);

}

/**
 * Runs the NPM test command.
 * @instance
 * @param {Object} config - The configuration object passed through the process.
 * @returns {Promise<Object>} config - The __unmodified__ configuration object.
 */
function test(config) {

	const command = {
		cmd: 'npm',
		args: ['test'],
		opts: {
			logging: {
				start: 'Started tests',
				finish: 'Finished tests'
			},
			namespace: 'npm~test'
		}
	};

	return shell.executeCommand(command, config);

}

module.exports = {
	init,
	install,
	generateApexTransport,
	generateDocumentation,
	orizuruPostInit,
	test
};
