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
	inquirer = require('inquirer'),

	configFile = require('./deploy/shared/config'),
	connection = require('./deploy/shared/connection'),

	certificate = require('./deploy/certificate'),
	connectedApp = require('./deploy/connectedApp'),
	heroku = require('./deploy/heroku'),
	sfdx = require('./deploy/sfdx'),

	logger = require('../util/logger'),
	questions = require('../util/questions'),

	NEW_CONNECTED_APP = 'New Connected App',
	EXISTING_CONNECTED_APP_IN_SCRATCH_ORG = 'Existing Connected App In Scratch Org';

function askQuestions(config) {

	const choices = [NEW_CONNECTED_APP, EXISTING_CONNECTED_APP_IN_SCRATCH_ORG];

	return inquirer.prompt([
		questions.listField('What Connected App do you want to use?', 'type', undefined, choices, NEW_CONNECTED_APP)
	]).then(answers => _.set(config, 'connected.app.type', answers.type));

}

function handleNewConnectedApp(config) {

	_.set(config, 'options.includeNew.heroku', true);
	_.set(config, 'options.includeNew.sfdx', true);

	return Promise.resolve(config)
		.then(heroku.getAllApps)
		.then(sfdx.getAllScratchOrgs)
		.then(sfdx.select)
		.then(certificate.getOrCreate)
		.then(logger.logEvent('Create Connected App\nYou are about to be asked to enter information about the Connected App'))
		.then(connectedApp.askQuestions)
		.then(logger.logEvent('Get SFDX scratch org credentials'))
		.then(sfdx.display)
		.then(logger.logEvent('Creating connection'))
		.then(connection.create)
		.then(logger.logEvent('Create Connected App'))
		.then(connectedApp.create)
		.then(connectedApp.list)
		.then(connectedApp.select)
		.then(connectedApp.generateInstallUrl)
		.then(heroku.select)
		.then(logger.logEvent('Update Heroku config variables'))
		.then(connectedApp.updateHerokuConfigVariables)
		.then(logger.logEvent('Deployed Connected App'));

}

function handleExistingConnectedAppInScratchOrg(config) {

	return Promise.resolve(config)
		.then(sfdx.getAllScratchOrgs)
		.then(sfdx.select)
		.then(sfdx.display)
		.then(connection.create)
		.then(connectedApp.list)
		.then(connectedApp.select)
		.then(connectedApp.generateInstallUrl)
		.then(config => _.set(config, 'options.includeNew.sfdx', true))
		.then(sfdx.select)
		.then(sfdx.display)
		.then(sfdx.openOrg)
		.then(connectedApp.install);

}

function handleConnectedAppType(config) {

	const connectedAppType = _.get(config, 'connected.app.type');

	switch (connectedAppType) {
		case NEW_CONNECTED_APP:
			return handleNewConnectedApp(config);
		case EXISTING_CONNECTED_APP_IN_SCRATCH_ORG:
			return handleExistingConnectedAppInScratchOrg(config);
	}

	throw new Error('Unexpected type' + connectedAppType);

}

function create(config) {

	return Promise.resolve(config)
		.then(logger.logEvent('Connected App'))
		.then(sfdx.checkSfdxInstalled)
		.then(sfdx.checkSfdxProjectFileExists)
		.then(sfdx.checkSfdxFolderExists)
		.then(configFile.readSettings)
		.then(sfdx.login)
		.then(askQuestions)
		.then(handleConnectedAppType)
		.catch(logger.logError);

}

module.exports = {
	create
};
