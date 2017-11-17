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
	fs = require('fs-extra'),
	inquirer = require('inquirer'),
	path = require('path'),
	questions = require('../../util/questions'),
	shell = require('../../util/shell'),
	validators = require('../../util/validators'),

	addAddOns = (config) => {

		const
			getAddons = {
				cmd: 'heroku',
				args: ['addons', '-a', config.parameters.heroku.app.name, '--json']
			};

		return shell.executeCommand(getAddons, { exitOnError: true })
			.then(result => JSON.parse(result.stdout))
			.then(result => {
				const
					filter = appJsonAddon => !_.reduce(result, (bool, addon) => bool || addon.plan.name === appJsonAddon.plan, false),
					addOnCommands = _.map(_.filter(_.get(config, 'heroku.app.json.addons'), filter), addon => ({
						cmd: 'heroku',
						args: ['addons:create', `${addon.plan}`, '-a', config.parameters.heroku.app.name]
					}));
				return shell.executeCommands(addOnCommands, { exitOnError: true })
					.then(() => config);
			});
	},

	addBuildpacks = (config) => {

		let buildpackIndex = 0;

		const
			buildpacks = _.get(config, 'heroku.app.json.buildpacks'),
			buildpackCommands = _.map(buildpacks, buildpack => {

				buildpackIndex++;
				return {
					cmd: 'heroku',
					args: ['buildpacks:add', '--index', buildpackIndex, `${buildpack.url}`, '-a', config.parameters.heroku.app.name]
				};

			});

		return shell.executeCommands(buildpackCommands, { exitOnError: false })
			.then(() => config);

	},

	checkHerokuCliInstalled = (config) => {
		return shell.executeCommand({ cmd: 'heroku', args: ['version'] }, { exitOnError: true })
			.then(() => config);
	},

	addFormation = (config) => {

		const
			herokuFormation = _.get(config, 'heroku.app.json.formation'),
			formationCommands = _.map(herokuFormation, (formation, key) => {
				return {
					cmd: 'heroku',
					args: ['ps:scale', `${key}=${formation.quantity}:${formation.size}`, '-a', config.parameters.heroku.app.name]
				};
			});

		return shell.executeCommands(formationCommands, { exitOnError: true })
			.then(() => config);

	},

	createNewApp = (config, args) => {

		const commandArgs = args || ['create', '--json'];
		return shell.executeCommand({ cmd: 'heroku', args: commandArgs }, { exitOnError: true })
			.then(result => {
				return ({ heroku: { app: JSON.parse(result.stdout) } });
			});
	},

	removeAutoDeploy = () => {
		return shell.executeCommand({ cmd: 'git', args: ['remote', 'remove', 'autodeploy'], opts: { exitOnError: false } });
	},

	createNewOrganizationApp = (config) => {

		return shell.executeCommand({ cmd: 'heroku', args: ['orgs', '--json'], opts: { exitOnError: true } })
			.then(result => {
				const orgs = JSON.parse(result.stdout);
				return _.map(orgs, org => org.name);
			})
			.then(orgNames => inquirer.prompt([
				questions.listField('Organization', 'heroku.organization', undefined, orgNames)
			]))
			.then(answers => createNewApp(config, ['create', '-t', answers.heroku.organization, '--json']))
			.then(config => config);
	},

	checkWorkingChanges = (config) => {
		return shell.executeCommand({ cmd: 'git', args: ['diff-index', 'HEAD'], opts: { exitOnError: true } })
			.then(output => {
				if (output.stdout.length > 0) {
					return inquirer.prompt([
						questions.confirmField(
							'You have uncommitted changes in your current branch, would you like to continue?',
							'ignoreChanges',
							validators.validateNotEmpty,
							false
						)
					]);
				}

				return { ignoreChanges: true };
			})
			.then(answer => {
				if (!answer.ignoreChanges) {
					throw new Error('Aborting deploy due to uncomitted changes');
				}

				return config;
			});
	},

	deployCurrentBranch = (config) => {

		const gitUrl = _.get(config, 'parameters.heroku.app.git_url');

		return removeAutoDeploy()
			.then(() => shell.executeCommand({ cmd: 'git', args: ['remote', 'add', 'autodeploy', `${gitUrl}`], opts: { exitOnError: true } }))
			.then(() => shell.executeCommand({ cmd: 'git', args: ['rev-parse', '--abbrev-ref', 'HEAD'], opts: { exitOnError: true } }))
			.then(branch => shell.executeCommand({ cmd: 'git', args: ['push', 'autodeploy', `${branch.stdout}:master`, '-f'], opts: { exitOnError: true, namespace: 'deploy' } }))
			.then(() => config);
	},

	getAllApps = (config) => {

		return shell.executeCommand({ cmd: 'heroku', args: ['apps', '--all', '--json'] })
			.then(result => {
				const apps = JSON.parse(result.stdout);
				config.heroku = config.heroku || {};
				config.heroku.apps = apps;
				return config;
			});

	},

	readAppJson = (config) => {

		return Promise.resolve()
			.then(() => path.resolve(process.cwd(), 'app.json'))
			.then(filePath => {
				return fs.readJSON(filePath);
			})
			.then(appJson => {
				config.heroku = config.heroku || {};
				config.heroku.app = config.heroku.app || {};
				config.heroku.app.json = appJson;
				return config;
			})
			.catch(() => {
				throw new Error('app.json is required in the root of your project when deploying to heroku.');
			});

	},

	selectApp = (config) => {

		const
			newApp = '<<Create new Heroku App>>',
			newOrgApp = '<<Create new Heroku Organization App>>',
			apps = _.map(config.heroku.apps, app => ({ name: app.name, value: app }));

		let defaultValue = 0;

		if (_.get(config, 'options.includeNew.heroku') === true) {
			apps.push(newApp);
			apps.push(newOrgApp);
			defaultValue = newApp;
		}

		if (_.get(config, 'orizuru.heroku.app.name')) {
			defaultValue = _.indexOf(_.map(apps, app => app.name), config.orizuru.heroku.app.name);
		}

		return inquirer.prompt([
			questions.listField('Heroku App', 'heroku.app', undefined, apps, defaultValue)
		]).then(answers => {
			if (answers.heroku.app === newApp) {
				return createNewApp(config);
			} else if (answers.heroku.app === newOrgApp) {
				return createNewOrganizationApp(config);
			}
			return answers;
		}).then(answers => {
			config.parameters = config.parameters || {};
			config.parameters.heroku = answers.heroku;
			return config;
		});

	};

module.exports = {
	addAddOns,
	addBuildpacks,
	addFormation,
	checkHerokuCliInstalled,
	createNewApp,
	createNewOrganizationApp,
	checkWorkingChanges,
	deployCurrentBranch,
	getAllApps,
	readAppJson,
	selectApp,
	removeAutoDeploy
};
