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
	chai = require('chai'),
	chaiAsPromised = require('chai-as-promised'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	configFile = require('../../lib/service/deploy/shared/config'),
	conn = require('../../lib/service/deploy/shared/connection'),
	certificate = require('../../lib/service/deploy/certificate'),
	connectedApp = require('../../lib/service/deploy/connectedApp'),
	heroku = require('../../lib/service/deploy/heroku'),
	namedCredential = require('../../lib/service/deploy/namedCredential'),
	properties = require('../../lib/service/deploy/properties'),
	sfdx = require('../../lib/service/deploy/sfdx'),

	logger = require('../../lib/util/logger'),

	service = require('../../lib/service/deploy'),

	expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/deploy.js', () => {

	beforeEach(() => {

		sinon.stub(certificate, 'getOrCreate');

		sinon.stub(configFile, 'readSettings');

		sinon.stub(conn, 'create');

		sinon.stub(connectedApp, 'askQuestions');
		sinon.stub(connectedApp, 'create');
		sinon.stub(connectedApp, 'updateHerokuConfigVariables');

		sinon.stub(heroku, 'addBuildpacks');
		sinon.stub(heroku, 'addFormation');
		sinon.stub(heroku, 'addAddOns');
		sinon.stub(heroku, 'checkHerokuCliInstalled');
		sinon.stub(heroku, 'checkWorkingChanges');
		sinon.stub(heroku, 'deployCurrentBranch');
		sinon.stub(heroku, 'getAllApps');
		sinon.stub(heroku, 'select');
		sinon.stub(heroku, 'readAppJson');

		sinon.stub(logger, 'logStart').returns(sinon.stub());
		sinon.stub(logger, 'logEvent').returns(sinon.stub());
		sinon.stub(logger, 'logFinish').returns(sinon.stub());

		sinon.stub(namedCredential, 'askQuestions');
		sinon.stub(namedCredential, 'create');

		sinon.stub(properties, 'updateProperties');

		sinon.stub(sfdx, 'checkSfdxInstalled');
		sinon.stub(sfdx, 'deploy');
		sinon.stub(sfdx, 'display');
		sinon.stub(sfdx, 'getAllScratchOrgs');
		sinon.stub(sfdx, 'login');
		sinon.stub(sfdx, 'openOrg');
		sinon.stub(sfdx, 'readSfdxYaml');
		sinon.stub(sfdx, 'select');

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('apex', () => {

		it('should call the correct functions', async () => {

			// Given
			const expectedInput = {
				argv: {
					apex: true,
					silent: true
				},
				parameters: {
					heroku: {
						app: {
							name: 'herokuApp'
						}
					},
					sfdx: {
						org: {
							username: 'testUsername'
						}
					}
				},
				sfdx: {
					hub: 'hubOrg'
				}
			};

			// When
			await service.run(expectedInput);

			// Then
			expect(certificate.getOrCreate).to.have.been.calledOnce;

			expect(configFile.readSettings).to.have.been.calledOnce;

			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logEvent).to.have.callCount(5);
			expect(logger.logFinish).to.have.been.calledOnce;

			expect(sfdx.checkSfdxInstalled).to.have.been.calledOnce;
			expect(sfdx.deploy).to.have.been.calledOnce;
			expect(sfdx.getAllScratchOrgs).to.have.been.calledOnce;
			expect(sfdx.login).to.have.been.calledOnce;
			expect(sfdx.openOrg).to.have.been.calledOnce;
			expect(sfdx.readSfdxYaml).to.have.been.calledOnce;
			expect(sfdx.select).to.have.been.calledOnce;

			expect(conn.create).to.not.have.been.called;

			expect(connectedApp.askQuestions).to.not.have.been.called;
			expect(connectedApp.create).to.not.have.been.called;
			expect(connectedApp.updateHerokuConfigVariables).to.not.have.been.called;

			expect(heroku.checkHerokuCliInstalled).to.not.have.been.called;
			expect(heroku.getAllApps).to.not.have.been.called;
			expect(heroku.select).to.not.have.been.called;
			expect(heroku.readAppJson).to.not.have.been.called;
			expect(heroku.addBuildpacks).to.not.have.been.called;
			expect(heroku.addFormation).to.not.have.been.called;
			expect(heroku.addAddOns).to.not.have.been.called;
			expect(heroku.checkWorkingChanges).to.not.have.been.called;
			expect(heroku.deployCurrentBranch).to.not.have.been.called;

			expect(namedCredential.askQuestions).to.not.have.been.called;
			expect(namedCredential.create).to.not.have.been.called;

			expect(properties.updateProperties).to.not.have.been.called;

			expect(sfdx.display).to.not.have.been.called;

		});

	});

	describe('full', () => {

		it('should call the correct functions', async () => {

			// Given
			const expectedInput = {
				argv: {
					silent: true
				},
				parameters: {
					heroku: {
						app: {
							name: 'herokuApp'
						}
					},
					sfdx: {
						org: {
							username: 'testUsername'
						}
					}
				},
				sfdx: {
					hub: 'hubOrg'
				}
			};

			// When
			await service.run(expectedInput);

			// Then
			expect(certificate.getOrCreate).to.have.been.calledOnce;

			expect(configFile.readSettings).to.have.been.calledOnce;

			expect(conn.create).to.have.been.calledOnce;

			expect(connectedApp.askQuestions).to.have.been.calledOnce;
			expect(connectedApp.create).to.have.been.calledOnce;
			expect(connectedApp.updateHerokuConfigVariables).to.have.been.calledOnce;

			expect(heroku.checkHerokuCliInstalled).to.have.been.calledOnce;
			expect(heroku.getAllApps).to.have.been.calledOnce;
			expect(heroku.select).to.have.been.calledOnce;
			expect(heroku.readAppJson).to.have.been.calledOnce;
			expect(heroku.addBuildpacks).to.have.been.calledOnce;
			expect(heroku.addFormation).to.have.been.calledOnce;
			expect(heroku.addAddOns).to.have.been.calledOnce;
			expect(heroku.checkWorkingChanges).to.have.been.calledOnce;
			expect(heroku.deployCurrentBranch).to.have.been.calledOnce;

			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logEvent).to.have.callCount(17);
			expect(logger.logFinish).to.have.been.calledOnce;

			expect(namedCredential.askQuestions).to.have.been.calledOnce;
			expect(namedCredential.create).to.have.been.calledOnce;

			expect(properties.updateProperties).to.have.been.calledOnce;

			expect(sfdx.checkSfdxInstalled).to.have.been.calledOnce;
			expect(sfdx.deploy).to.have.been.calledOnce;
			expect(sfdx.display).to.have.been.calledOnce;
			expect(sfdx.getAllScratchOrgs).to.have.been.calledOnce;
			expect(sfdx.login).to.have.been.calledOnce;
			expect(sfdx.openOrg).to.have.been.calledOnce;
			expect(sfdx.readSfdxYaml).to.have.been.calledOnce;
			expect(sfdx.select).to.have.been.calledOnce;

		});

	});

});
