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
	debug = require('debug-plus')('financialforcedev:orizuru~tools:deploy:sfdx'),

	_ = require('lodash'),
	fs = require('fs'),
	inquirer = require('inquirer'),
	path = require('path'),
	yaml = require('js-yaml'),
	questions = require('../../util/questions'),
	shell = require('./shared/shell'),

	deployCommands = (config) => [
		{ cmd: 'sfdx', args: ['force:source:push', '-u', `${config.parameters.sfdx.org.username}`] },
		{ cmd: 'sfdx', args: ['force:user:permset:assign', '-n', `${config.sfdx.yaml['permset-name']}`, '-u', `${config.parameters.sfdx.org.username}`] },
		{ cmd: 'sfdx', args: ['force:org:display', '-u', `${config.parameters.sfdx.org.username}`, '--json'] }
	],

	orgOpenCommands = [
		{ cmd: 'sfdx', args: ['force:org:open'] }
	],

	createNewScratchOrg = (config) => {
		return shell.executeCommand({ cmd: 'sfdx', args: ['force:org:create', '-f', `${config.sfdx.yaml['scratch-org-def']}`, '-s', '--json'] }, { exitOnError: true })
			.then(result => ({ sfdx: { org: JSON.parse(result.stdout).result } }));
	},

	deploy = (config) => {

		return shell.executeCommands(deployCommands(config), { exitOnError: true })
			.then(results => {
				config.sfdxResults = results;
				config.connectionInfo = JSON.parse(_.values(config.sfdxResults)[2].stdout).result;
				return config;
			});

	},

	getAllScratchOrgs = (config) => {

		return shell.executeCommand({ cmd: 'sfdx', args: ['force:org:list', '--json'] })
			.then(result => {
				const scratchOrgs = JSON.parse(result.stdout).result.scratchOrgs;
				config.sfdx = config.sfdx || {};
				config.sfdx.scratchOrgs = scratchOrgs;
				return config;
			});

	},

	getConnectionDetails = (config) => {

		return shell.executeCommand({ cmd: 'sfdx', args: ['force:org:display', '-u', `${config.parameters.sfdx.org.username}`, '--json'] })
			.then(results => {
				const credentials = JSON.parse(results.stdout);
				config.parameters.sfdx.org.credentials = credentials.result;
				return config;
			});

	},

	openOrg = (result) => {

		debug.log('Open org');
		return shell.executeCommands(orgOpenCommands, { exitOnError: true });

	},

	readSfdxYaml = (config) => {
		const dxYaml = yaml.safeLoad(fs.readFileSync(path.resolve(process.cwd(), '.salesforcedx.yaml')));
		config.sfdx = config.sfdx || {};
		config.sfdx.yaml = dxYaml;
		return config;
	},

	selectApp = (config) => {

		const
			newOrg = '<<Create new SFDX scratch org>>',
			scratchOrgs = _.map(config.sfdx.scratchOrgs, org => ({ name: org.username, value: org }));

		if (config.options && config.options.includeNew && config.options.includeNew.sfdx === true) {
			scratchOrgs.push(newOrg);
		}

		return inquirer.prompt([
			questions.listField('SFDX Scratch Org', 'sfdx.org', undefined, scratchOrgs)
		]).then(answers => {
			if (answers.sfdx.org === newOrg) {
				return createNewScratchOrg(config);
			}
			return answers;
		}).then(answers => {
			config.parameters = config.parameters || {};
			config.parameters.sfdx = answers.sfdx;
			return config;
		});

	};

module.exports = {
	createNewScratchOrg,
	deploy,
	getConnectionDetails,
	getAllScratchOrgs,
	openOrg,
	readSfdxYaml,
	selectApp
};
