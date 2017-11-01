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
	configFile = require('./deploy/shared/config'),
	conn = require('./deploy/shared/connection'),
	certificate = require('./deploy/certificate'),
	connectedApp = require('./deploy/connectedApp'),
	heroku = require('./deploy/heroku'),
	namedCredential = require('./deploy/namedCredential'),
	sfdx = require('./deploy/sfdx'),

	logger = require('../util/logger'),

	run = (config) => {

		config.options = config.options || {};
		config.options.includeNew = config.options.includeNew || {};
		config.options.includeNew.heroku = true;
		config.options.includeNew.sfdx = true;

		return Promise.resolve(config)
			.then(logger.logStart('Starting full deploy'))
			.then(logger.logEvent('Checking for required installations'))
			.then(sfdx.checkSfdxInstalled)
			.then(heroku.checkHerokuCliInstalled)
			.then(certificate.checkOpenSSLInstalled)
			.then(configFile.readSettings)
			.then(sfdx.login)
			.then(config => configFile.writeSetting(config, 'sfdx.hub.username', config.sfdx.hub.username))
			.then(logger.logEvent('Reading app.json'))
			.then(heroku.readAppJson)
			.then(logger.logEvent('Reading .salesforcedx.yaml'))
			.then(sfdx.readSfdxYaml)
			.then(logger.logEvent('Obtaining Heroku Apps'))
			.then(heroku.getAllApps)
			.then(heroku.selectApp)
			.then(config => configFile.writeSetting(config, 'heroku.app.name', config.parameters.heroku.app.name))
			.then(logger.logEvent('Adding buildpacks'))
			.then(heroku.addBuildpacks)
			.then(logger.logEvent('Adding add-ons'))
			.then(heroku.addAddOns)
			.then(logger.logEvent('Deploy code'))
			.then(heroku.deployCurrentBranch)
			.then(logger.logEvent('Generating certificates\nYou are about to be asked to enter information that will be incorporated into your certificate.'))
			.then(certificate.askQuestions)
			.then(certificate.create)
			.then(certificate.read)
			.then(logger.logEvent('\nObtaining SFDX scratch orgs'))
			.then(sfdx.getAllScratchOrgs)
			.then(sfdx.selectApp)
			.then(config => configFile.writeSetting(config, 'sfdx.org.username', config.parameters.sfdx.org.username))
			.then(logger.logEvent('\nDeploy SFDX code'))
			.then(sfdx.deploy)
			.then(logger.logEvent('Get SFDX scratch org credentials'))
			.then(sfdx.getConnectionDetails)
			.then(logger.logEvent('Creating connection'))
			.then(conn.create)
			.then(logger.logEvent('Create Connected App\nYou are about to be asked to enter information that will be incorporated into your connected app.'))
			.then(connectedApp.askQuestions)
			.then(connectedApp.create)
			.then(logger.logEvent('\nUpdate Heroku config variables'))
			.then(connectedApp.updateHerokuConfigVariables)
			.then(logger.logEvent('Create Named Credential'))
			.then(namedCredential.askQuestions)
			.then(namedCredential.create)
			.then(logger.logEvent('Adding dyno formation'))
			.then(heroku.addFormation)
			.then(sfdx.openOrg)
			.then(logger.logFinish('Finished full deploy'))
			.catch(logger.logError);

	};

module.exports = {
	run
};
