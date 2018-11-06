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

const
	_ = require('lodash'),
	fs = require('fs-extra'),
	inquirer = require('inquirer'),
	path = require('path'),
	yaml = require('js-yaml'),

	configFile = require('./shared/config'),

	logger = require('../../util/logger'),
	questions = require('../../util/questions'),
	shell = require('../../util/shell'),

	defaultSfdxYamlFile = 'scratch-org-def: src/apex/config/project-scratch-def.json\nassign-permset: true\npermset-name: OrizuruAdmin\nrun-apex-tests: true\ndelete-scratch-org: false\nshow-scratch-org-url: true',

	defaultSfdxProjectScratchDefinitionFile = {
		orgName: 'Orizuru Inc',
		edition: 'Developer',
		orgPreferences: {
			enabled: ['S1DesktopEnabled']
		}
	},

	defaultSfdxProjectFile = {
		packageDirectories: [{
			path: 'src/apex/force-app',
			'default': true
		}],
		namespace: '',
		sfdcLoginUrl: 'https://login.salesforce.com',
		sourceApiVersion: '44.0'
	};

function login(config) {

	// Check the Orizuru config file for the hub username
	if (_.get(config, 'orizuru.sfdx.hub.username')) {
		config.sfdx = config.sfdx || {};
		config.sfdx.hub = config.orizuru.sfdx.hub.username;
		return Promise.resolve(config);
	}

	// Prompt the user to log into their SFDX dev hub
	return Promise.resolve(config)
		.then(logger.logEvent('You are about to be asked to log into your SFDX Dev hub'))
		.then(() => shell.executeCommand({ cmd: 'sfdx', args: ['force:auth:web:login', '-s', '--json'] }))
		.then(result => {
			const hub = JSON.parse(result.stdout).result;
			_.set(config, 'sfdx.hub.username', hub.username);
			return configFile.writeSetting(config, 'sfdx.hub.username', config.sfdx.hub.username);
		});

}

function createDefaultSfdxProjectFile(config) {

	return Promise.resolve(config)
		.then(logger.logEvent('The sfdx-project.json file does not exist.'))
		.then(() => inquirer.prompt([
			questions.confirmField('Create default SFDX project configuration?', 'create', undefined, true)
		]))
		.then(answers => {
			if (answers.create === true) {
				return fs.writeJson('./sfdx-project.json', defaultSfdxProjectFile, { spaces: 4 })
					.then(() => _.set(config, 'sfdx.project.file.exists', true));
			}
			return config;
		});
}

function checkSfdxProjectFileExists(config) {

	return shell.executeCommand({ cmd: 'cat', args: ['sfdx-project.json'] })
		.then(() => config)
		.catch(error => {
			return createDefaultSfdxProjectFile(config)
				.then(config => {
					if (!_.get(config, 'sfdx.project.file.exists')) {
						throw error;
					}
					return config;
				});
		});

}

function checkSfdxFolderExists(config) {

	return shell.executeCommand({ cmd: 'cd', args: ['.sfdx'] })
		.then(() => config)
		.catch(() => login(config));

}

function checkSfdxInstalled(config) {

	return Promise.resolve(config)
		.then(logger.logEvent('Check SFDX installed'))
		.then(() => shell.executeCommand({ cmd: 'sfdx', args: ['version'] }))
		.then(() => config);
}

function createNewScratchOrg(config) {

	let scratchOrgDefinitionFile = _.get(config, 'sfdx.yaml[scratch-org-def]');
	if (!scratchOrgDefinitionFile) {
		scratchOrgDefinitionFile = './src/apex/config/project-scratch-def.json';
		_.set(config, 'sfdx.yaml[scratch-org-def]', defaultSfdxProjectScratchDefinitionFile);
		fs.outputJsonSync(scratchOrgDefinitionFile, defaultSfdxProjectScratchDefinitionFile);
	}

	return shell.executeCommand({ cmd: 'sfdx', args: ['force:org:create', '-f', scratchOrgDefinitionFile, '-v', config.orizuru.sfdx.hub.username, '-s', '--json'] })
		.then(result => ({ sfdx: { org: JSON.parse(result.stdout).result } }));
}

function display(config) {

	return shell.executeCommand({ cmd: 'sfdx', args: ['force:org:display', '-u', `${config.parameters.sfdx.org.username}`, '--json'] })
		.then(results => {
			const credentials = JSON.parse(results.stdout);
			_.set(config, 'parameters.sfdx.org.credentials', credentials.result);
			return config;
		});

}

function getAllScratchOrgs(config) {

	return shell.executeCommand({ cmd: 'sfdx', args: ['force:org:list', '--json'] })
		.then(result => {
			const scratchOrgs = JSON.parse(result.stdout).result.scratchOrgs;
			return _.set(config, 'sfdx.scratchOrgs', scratchOrgs);
		});

}

function deleteAllScratchOrgs(config) {

	return getAllScratchOrgs(config)
		.then(config => {
			const
				scratchOrgs = _.get(config, 'sfdx.scratchOrgs'),
				commands = _.map(scratchOrgs, scratchOrg => {
					return { cmd: 'sfdx', args: ['force:org:delete', '-u', scratchOrg.username, '-p'] };
				});
			return shell.executeCommands(commands);
		});

}

function deploy(config) {

	const deployCommands = [
		{ cmd: 'sfdx', args: ['force:source:push', '-u', `${config.parameters.sfdx.org.username}`], opts: { namespace: 'deploy' } },
		{ cmd: 'sfdx', args: ['force:user:permset:assign', '-n', `${config.sfdx.yaml['permset-name']}`, '-u', `${config.parameters.sfdx.org.username}`] },
		{ cmd: 'sfdx', args: ['force:org:display', '-u', `${config.parameters.sfdx.org.username}`, '--json'] }
	];

	return Promise.resolve(config)
		.then(logger.logEvent('\nDeploy SFDX code'))
		.then(() => shell.executeCommands(deployCommands, { exitOnError: true }))
		.then(results => {
			config.sfdxResults = results;
			config.connectionInfo = JSON.parse(_.values(config.sfdxResults)[2].stdout).result;
			return config;
		});

}

async function getInstalledPackageList(config) {

	const
		username = config.orizuru.sfdx.org.username,
		installedPackageListCommand = { cmd: 'sfdx', args: ['force:package:installed:list', '-u', username, '--json'] },
		result = await shell.executeCommand(installedPackageListCommand),
		installedPackages = JSON.parse(result.stdout).result;

	logger.logEvent(`Finding existing packages installed in org: ${username}`)(config);

	_.set(config, 'sfdx.org.username', username);
	_.set(config, 'sfdx.org.installedPackages', installedPackages);
	return _.set(config, 'sfdx.org.installedPackageVersionIds', installedPackages.map((installedPackage) => installedPackage.SubscriberPackageVersionId));

}

function getInstallPackageCommand(packageId, username) {
	return {
		cmd: 'sfdx',
		args: ['force:package:install', '-p', packageId, '-u', username, '-r', '-w', '100', '--json'],
		opts: {
			logging: {
				start: `Installing package ${packageId}`,
				finish: `Installed package ${packageId}`
			}
		}
	};
}

async function installPackages(config) {

	const
		packagesToInstallFromConfigFile = Object.keys(config.sfdx.org.packagesToInstall),
		installedPackages = config.sfdx.org.installedPackageVersionIds,

		alreadyInstalledPackages = _.intersection(packagesToInstallFromConfigFile, installedPackages),

		packagesToInstall = _.difference(packagesToInstallFromConfigFile, installedPackages),
		installPackageCommands = packagesToInstall.map((packageToInstall) => getInstallPackageCommand(packageToInstall, config.orizuru.sfdx.org.username));

	alreadyInstalledPackages.forEach((installedPackage) => {
		logger.logEvent(`Already installed package: ${installedPackage}`)(config);
	});

	if (installPackageCommands.length > 0) {
		await shell.executeCommands(installPackageCommands, { exitOnError: true }, config);
	}

	return config;

}

function openOrg(config) {
	const orgOpenCommands = { cmd: 'sfdx', args: ['force:org:open', '-u', `${config.parameters.sfdx.org.username}`] };
	return shell.executeCommand(orgOpenCommands, config);
}

async function readSfdxYaml(config) {

	try {

		const
			result = await fs.readFile(path.resolve(process.cwd(), '.salesforcedx.yaml')),
			dxYaml = yaml.safeLoad(result);
		return _.set(config, 'sfdx.yaml', dxYaml);

	} catch (error) {
		await fs.outputFile('./.salesforcedx.yaml', defaultSfdxYamlFile, { spaces: 4 });
		return _.set(config, 'sfdx.yaml', yaml.safeLoad(defaultSfdxYamlFile));
	}

}

function select(config) {

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
		questions.listField('Select SFDX Scratch Org', 'sfdx.org', undefined, scratchOrgs, defaultValue)
	]).then(answers => {
		if (answers.sfdx.org === newOrg) {
			return createNewScratchOrg(config);
		}
		return answers;
	}).then(answers => {
		_.set(config, 'parameters.sfdx', answers.sfdx);
		return configFile.writeSetting(config, 'sfdx.org.username', config.parameters.sfdx.org.username);
	});

}

module.exports = {
	checkSfdxFolderExists,
	checkSfdxInstalled,
	checkSfdxProjectFileExists,
	createNewScratchOrg,
	deleteAllScratchOrgs,
	deploy,
	display,
	getAllScratchOrgs,
	getInstalledPackageList,
	installPackages,
	login,
	openOrg,
	readSfdxYaml,
	select
};
