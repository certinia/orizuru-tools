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
	inquirer = require('inquirer'),
	questions = require('../../util/questions'),
	shell = require('./shared/shell'),
	validators = require('../../util/validators'),

	askQuestions = (config) => {

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

	},

	create = (config) => {

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

	},

	updateHerokuConfigVariables = (config) => {

		const commands = [{
			cmd: 'heroku',
			args: ['config:set', `OPENID_CLIENT_ID=${config.connectedApp.oauthConfig.consumerKey}`, '-a', config.parameters.heroku.app.name]
		}, {
			cmd: 'heroku',
			args: ['config:set', 'OPENID_HTTP_TIMEOUT=4000', '-a', config.parameters.heroku.app.name]
		}, {
			cmd: 'heroku',
			args: ['config:set', 'OPENID_ISSUER_URI=https://test.salesforce.com/', '-a', config.parameters.heroku.app.name]
		}, {
			// Important: to correctly add the JWT_SIGNING_KEY to Heroku the IFS (Input Field Separators) 
			// need to be removed so that spaces are not treated as a delimiter.
			// This command takes a copy of the current IFS and resets it to this when the command is complete.
			// You cannot wrap the key in quotes as the quotes are then added to the Heroku config variable.
			// For more details of IFS see:
			// http://pubs.opengroup.org/onlinepubs/009695399/utilities/xcu_chap02.html#tag_02_06_05
			// https://unix.stackexchange.com/questions/26784/understanding-ifs
			cmd: '/bin/sh',
			args: ['-c', 'OLDIFS=$IFS', '&&', 'IFS=', '&&', 'heroku', 'config:set', `JWT_SIGNING_KEY=${config.certificate.privateKey}`, '-a', config.parameters.heroku.app.name, '&&', 'IFS=$OLDIFS']
		}];

		return shell.executeCommands(commands, { exitOnError: true })
			.then(() => config);

	};

module.exports = {
	askQuestions,
	create,
	updateHerokuConfigVariables
};
