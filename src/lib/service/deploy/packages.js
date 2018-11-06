/**
 * Copyright (c) 2018, FinancialForce.com, inc
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
	path = require('path'),

	configFile = require('./shared/config'),

	logger = require('../../util/logger'),
	sfdx = require('./sfdx');

async function deploy(config) {

	try {

		logger.logStart('Installing packages...')(config);

		_.set(config, 'options.includeNew.sfdx', true);

		await sfdx.checkSfdxInstalled(config);
		await sfdx.checkSfdxProjectFileExists(config);
		await sfdx.checkSfdxFolderExists(config);

		logger.logEvent('Reading .orizuru config')(config);
		await configFile.readSettings(config);

		await sfdx.login(config);

		logger.logEvent('Reading .salesforcedx.yaml')(config);
		await sfdx.readSfdxYaml(config);

		logger.logEvent('Finding existing scratch orgs')(config);
		await sfdx.getAllScratchOrgs(config);
		await sfdx.select(config);

		await sfdx.getInstalledPackageList(config);

		_.set(config, 'sfdx.org.packagesToInstall', fs.readJsonSync(path.resolve(process.cwd(), config.argv.file)));

		await sfdx.installPackages(config);

		logger.logFinish('Finished Installing Packages')(config);

	} catch (error) {
		logger.logError(new Error('Failed to install packages'));
	}

}

module.exports = {
	deploy
};
