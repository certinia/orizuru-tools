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
	shell = require('./shared/shell'),


	addAddOns = (config) => {

		const addOnCommands = _.map(_.get(config, 'heroku.app.json.addons'), addon => ({
			cmd: 'heroku',
			args: ['addons:create', `${addon.plan}`, '-a', config.parameters.heroku.app.name]
		}));

		return shell.executeCommands(addOnCommands, { exitOnError: true })
			.then(() => config);

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

	createNewApp = (config) => {

		return shell.executeCommand({ cmd: 'heroku', args: ['create', '-t', 'research', '--json'] }, { exitOnError: true })
			.then(result => {
				return ({ heroku: { app: JSON.parse(result.stdout) } });
			});

	},

	removeAutoDeploy = () => {
		return shell.executeCommand({ cmd: 'git', args: ['remote', 'remove', 'autodeploy'], opts: { exitOnError: false } });
	},

	deployCurrentBranch = (config) => {

		const gitUrl = _.get(config, 'parameters.heroku.app.git_url');

		return removeAutoDeploy()
			.then(() => shell.executeCommand({ cmd: 'git', args: ['remote', 'add', 'autodeploy', `${gitUrl}`], opts: { exitOnError: false } }))
			.then(() => shell.executeCommand({ cmd: 'git', args: ['rev-parse', '--abbrev-ref', 'HEAD'], opts: { exitOnError: true } }))
			.then(branch => shell.executeCommand({ cmd: 'git', args: ['push', 'autodeploy', `${branch.stdout}:master`, '-f'], opts: { exitOnError: true } }))
			.then(() => config)
			.catch((error) => {
				removeAutoDeploy();
				throw error;
			});
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
			apps = _.map(config.heroku.apps, app => ({ name: app.name, value: app }));

		let defaultValue = 0;

		if (_.get(config, 'options.includeNew.heroku') === true) {
			apps.push(newApp);
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
	deployCurrentBranch,
	getAllApps,
	readAppJson,
	selectApp,
	removeAutoDeploy
};
