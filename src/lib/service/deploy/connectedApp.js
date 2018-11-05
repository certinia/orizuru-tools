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
	inquirer = require('inquirer'),
	openUrl = require('openurl'),
	request = require('request-promise'),

	configFile = require('./shared/config'),

	htmlParser = require('../../util/htmlParser'),
	questions = require('../../util/questions'),
	shell = require('../../util/shell'),
	validators = require('../../util/validators');

function askQuestions(config) {

	return inquirer.prompt([
		questions.inputField('Connected App Name', 'name', validators.validateNotEmpty, 'Orizuru'),
		questions.inputField('Connected App Email', 'email', validators.validateNotEmpty, 'test@test.com')
	]).then(answers => {
		config.parameters = config.parameters || {};
		config.parameters.connectedApp = config.parameters.connectedApp || {};
		config.parameters.connectedApp.name = answers.name;
		config.parameters.connectedApp.email = answers.email;
		return config;
	});

}

function create(config) {

	const
		conn = config.conn,
		name = config.parameters.connectedApp.name,
		email = config.parameters.connectedApp.email,
		certificate = config.certificate.publicKey,

		connectedApp = {
			contactEmail: email,
			label: name,
			fullName: name,
			oauthConfig: {
				callbackUrl: 'https://login.salesforce.com/success',
				scopes: ['Api', 'RefreshToken'],
				certificate
			}
		};

	return conn.metadata.upsert('ConnectedApp', connectedApp)
		.then(connectedApp => conn.metadata.read('ConnectedApp', name))
		.then(connectedApp => {
			config.connectedApp = connectedApp;
			return config;
		});
}

function install(config) {

	const
		installLink = _.get(config, 'connected.app.install.link'),
		instanceUrl = _.get(config, 'parameters.sfdx.org.credentials.instanceUrl');

	openUrl.open(`${instanceUrl}${installLink}`);
	return config;

}

function list(config) {

	const conn = config.conn;
	return conn.query('SELECT Id, Name FROM ConnectedApplication')
		.then(result => {
			_.set(config, 'connected.apps', result.records);
			return config;
		});

}

function select(config) {

	const
		appList = _.get(config, 'connected.apps'),
		apps = _.map(appList, app => ({ name: app.Name, value: app }));

	return inquirer.prompt([
		questions.listField('Connected App', 'connected.app', undefined, apps)
	]).then(answers => {
		_.set(config, 'connected.app.selected', answers.connected.app);
		return configFile.writeSetting(config, 'connected.app.id', config.connected.app.selected.Id);
	});

}

function generateInstallUrl(config) {

	const
		connectedAppId = _.get(config, 'connected.app.selected.Id'),
		instanceUrl = _.get(config, 'parameters.sfdx.org.credentials.instanceUrl'),
		accessToken = _.get(config, 'parameters.sfdx.org.credentials.accessToken'),

		uri = instanceUrl + '/' + connectedAppId,

		options = {
			uri,
			headers: {
				Cookie: 'sid=' + accessToken
			}
		};

	return request.get(options)
		.then(html => {

			const
				scripts = htmlParser.parseScripts({ html }),
				applicationId = scripts[0].split('applicationId=')[1].split('\'')[0],
				uri = instanceUrl + '/app/mgmt/forceconnectedapps/forceAppDetail.apexp?applicationId=' + applicationId,

				options = {
					uri,
					headers: {
						Cookie: 'sid=' + accessToken
					}
				};

			return request.get(options);

		})
		.then(html => {

			const
				scripts = htmlParser.parseScripts({ html }),
				installAppId = scripts[0].split('&id=')[1].split('\'')[0];

			configFile.writeSetting(config, 'connected.app.installLink', '/identity/app/AppInstallApprovalPage.apexp?app_id=' + installAppId);
			_.set(config, 'connected.app.install.link', '/identity/app/AppInstallApprovalPage.apexp?app_id=' + installAppId);
			return config;

		});

}

function updateHerokuConfigVariables(config) {

	const
		consumerKey = _.get(config, 'connectedApp.oauthConfig.consumerKey'),
		herokuAppName = _.get(config, 'parameters.heroku.app.name'),
		privateKey = _.get(config, 'certificate.privateKey'),
		commands = [{
			cmd: 'heroku',
			args: ['config:set', `OPENID_CLIENT_ID=${consumerKey}`, '-a', herokuAppName]
		}, {
			cmd: 'heroku',
			args: ['config:set', 'OPENID_HTTP_TIMEOUT=4000', '-a', herokuAppName]
		}, {
			cmd: 'heroku',
			args: ['config:set', 'OPENID_ISSUER_URI=https://test.salesforce.com/', '-a', herokuAppName]
		}, {
			cmd: 'heroku',
			args: ['config:set', `JWT_SIGNING_KEY=${privateKey}`, '-a', herokuAppName]
		}];

	return shell.executeCommands(commands, { exitOnError: true })
		.then(() => config);

}

module.exports = {
	askQuestions,
	create,
	generateInstallUrl,
	install,
	list,
	select,
	updateHerokuConfigVariables
};
