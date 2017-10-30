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
	conn = require('./deploy/shared/connection'),
	certificate = require('./deploy/certificate'),
	connectedApp = require('./deploy/connectedApp'),
	heroku = require('./deploy/heroku'),
	namedCredential = require('./deploy/namedCredential'),
	sfdx = require('./deploy/sfdx'),

	{ logEvent, logError, logFinish, logStart } = require('../util/logger'),

	run = (config) => {

		config.options = config.options || {};
		config.options.includeNew = config.options.includeNew || {};
		config.options.includeNew.heroku = true;
		config.options.includeNew.sfdx = true;

		return Promise.resolve(config)
			.then(logStart('Starting full deploy'))
			.then(heroku.getAllApps)
			.then(heroku.selectApp)
			.then(logEvent('Reading app.json'))
			.then(heroku.readAppJson)
			.then(logEvent('Adding buildpacks'))
			.then(heroku.addBuildpacks)
			.then(logEvent('Adding add-ons'))
			.then(heroku.addAddOns)
			.then(logEvent('Deploy code'))
			.then(heroku.deployCurrentBranch)
			.then(logEvent('Generating certificates\nYou are about to be asked to enter information that will be incorporated into your certificate.'))
			.then(certificate.askQuestions)
			.then(certificate.create)
			.then(certificate.read)
			.then(logEvent('\nObtaining SFDX scratch orgs'))
			.then(sfdx.getAllScratchOrgs)
			.then(sfdx.selectApp)
			.then(logEvent('\nDeploy SFDX code'))
			.then(sfdx.deploy)
			.then(logEvent('Get SFDX scratch org credentials'))
			.then(sfdx.getConnectionDetails)
			.then(logEvent('Creating connection'))
			.then(conn.create)
			.then(logEvent('Create Connected App\nYou are about to be asked to enter information that will be incorporated into your connected app.'))
			.then(connectedApp.askQuestions)
			.then(connectedApp.create)
			.then(logEvent('\nUpdate Heroku config variables'))
			.then(connectedApp.updateHerokuConfigVariables)
			.then(logEvent('Create Named Credential'))
			.then(namedCredential.askQuestions)
			.then(namedCredential.create)
			.then(logFinish('Finished full deploy'))
			.catch(logError);

	};

module.exports = {
	run
};
