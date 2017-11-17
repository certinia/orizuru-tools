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
	fs = require('fs'),
	inquirer = require('inquirer'),
	path = require('path'),
	yaml = require('js-yaml'),
	logger = require('../../util/logger'),
	questions = require('../../util/questions'),
	shell = require('../../util/shell'),

	checkSfdxInstalled = (config) => {
		return shell.executeCommand({ cmd: 'sfdx', args: ['version'], opts: { exitOnError: true } })
			.then(() => config);
	},

	login = (config) => {

		// Check the Orizuru config file for the hub username
		if (_.get(config, 'orizuru.sfdx.hub.username')) {
			config.sfdx = config.sfdx || {};
			config.sfdx.hub = config.orizuru.sfdx.hub.username;
			return Promise.resolve(config);
		}

		// Prompt the user to log into their SFDX dev hub
		return Promise.resolve(config)
			.then(logger.logEvent('You are about to be asked to log into your SFDX Dev hub'))
			.then(() => shell.executeCommand({ cmd: 'sfdx', args: ['force:auth:web:login', '-s', '--json'], opts: { exitOnError: true } }))
			.then(result => {
				const hub = JSON.parse(result.stdout).result;
				config.sfdx = config.sfdx || {};
				config.sfdx.hub = hub;
				return config;
			});

	},

	createNewScratchOrg = (config) => {
		return shell.executeCommand({ cmd: 'sfdx', args: ['force:org:create', '-f', config.sfdx.yaml['scratch-org-def'], '-v', config.orizuru.sfdx.hub.username, '-a', config.orizuru.heroku.app.name, '-s', '--json'], opts: { exitOnError: true } })
			.then(result => ({ sfdx: { org: JSON.parse(result.stdout).result } }));
	},

	deploy = (config) => {

		const deployCommands = [
			{ cmd: 'sfdx', args: ['force:source:push', '-u', `${config.parameters.sfdx.org.username}`], opts: { namespace: 'deploy' } },
			{ cmd: 'sfdx', args: ['force:user:permset:assign', '-n', `${config.sfdx.yaml['permset-name']}`, '-u', `${config.parameters.sfdx.org.username}`] },
			{ cmd: 'sfdx', args: ['force:org:display', '-u', `${config.parameters.sfdx.org.username}`, '--json'] }
		];

		return shell.executeCommands(deployCommands, { exitOnError: true })
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

	openOrg = (config) => {

		const orgOpenCommands = [
			{ cmd: 'sfdx', args: ['force:org:open', '-u', `${config.parameters.sfdx.org.username}`] }
		];

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
			allScratchOrgs = _.get(config, 'sfdx.scratchOrgs'),
			scratchOrgs = _.map(allScratchOrgs, org => ({ name: org.username, value: org }));

		let defaultValue = 0;

		if (config.options && config.options.includeNew && config.options.includeNew.sfdx === true) {
			scratchOrgs.push(newOrg);
		}

		if (_.get(config, 'orizuru.sfdx.org.username')) {
			defaultValue = _.indexOf(_.map(allScratchOrgs, org => org.username), config.orizuru.sfdx.org.username);
		}

		return inquirer.prompt([
			questions.listField('SFDX Scratch Org', 'sfdx.org', undefined, scratchOrgs, defaultValue)
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
	checkSfdxInstalled,
	createNewScratchOrg,
	deploy,
	getConnectionDetails,
	getAllScratchOrgs,
	login,
	openOrg,
	readSfdxYaml,
	selectApp
};
