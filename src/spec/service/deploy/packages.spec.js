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
	chai = require('chai'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	fs = require('fs-extra'),

	logger = require('../../../lib/util/logger'),
	sfdx = require('../../../lib/service/deploy/sfdx'),
	configFile = require('../../../lib/service/deploy/shared/config'),

	packages = require('../../../lib/service/deploy/packages'),

	expect = chai.expect;

chai.use(sinonChai);

describe('service/deploy/packages.js', () => {

	beforeEach(() => {

		sinon.stub(fs, 'readJsonSync');

		sinon.stub(configFile, 'readSettings');

		sinon.stub(sfdx, 'checkSfdxInstalled');
		sinon.stub(sfdx, 'checkSfdxProjectFileExists');
		sinon.stub(sfdx, 'checkSfdxFolderExists');
		sinon.stub(sfdx, 'readSfdxYaml');
		sinon.stub(sfdx, 'login');
		sinon.stub(sfdx, 'getAllScratchOrgs');
		sinon.stub(sfdx, 'select');
		sinon.stub(sfdx, 'getInstalledPackageList');
		sinon.stub(sfdx, 'installPackages');

		sinon.stub(logger, 'logError');
		sinon.stub(logger, 'logEvent').returns(sinon.stub());
		sinon.stub(logger, 'logFinish').returns(sinon.stub());
		sinon.stub(logger, 'logStart').returns(sinon.stub());

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('deploy', () => {

		it('should handle an error in the process', async () => {

			// Given
			configFile.readSettings.rejects('error');

			// When
			await packages.deploy({
				argv: {
					file: 'testFile'
				}
			});

			// Then
			expect(logger.logError).to.have.been.calledOnce;

		});

		it('should invoke the correct commands', async () => {

			// Given

			// When
			await packages.deploy({
				argv: {
					file: 'testFile'
				}
			});

			// Then
			expect(configFile.readSettings).to.have.been.calledOnce;

			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logEvent).to.have.been.calledThrice;
			expect(logger.logFinish).to.have.been.calledOnce;

			expect(sfdx.checkSfdxInstalled).to.have.been.calledOnce;
			expect(sfdx.checkSfdxProjectFileExists).to.have.been.calledOnce;
			expect(sfdx.checkSfdxFolderExists).to.have.been.calledOnce;
			expect(sfdx.readSfdxYaml).to.have.been.calledOnce;
			expect(sfdx.login).to.have.been.calledOnce;
			expect(sfdx.getAllScratchOrgs).to.have.been.calledOnce;
			expect(sfdx.select).to.have.been.calledOnce;
			expect(sfdx.getInstalledPackageList).to.have.been.calledOnce;
			expect(sfdx.installPackages).to.have.been.calledOnce;

		});

	});

});
