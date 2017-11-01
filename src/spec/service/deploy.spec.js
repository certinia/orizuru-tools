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
	chai = require('chai'),
	chaiAsPromised = require('chai-as-promised'),
	root = require('app-root-path'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	configFile = require(root + '/src/lib/service/deploy/shared/config'),
	conn = require(root + '/src/lib/service/deploy/shared/connection'),
	certificate = require(root + '/src/lib/service/deploy/certificate'),
	connectedApp = require(root + '/src/lib/service/deploy/connectedApp'),
	heroku = require(root + '/src/lib/service/deploy/heroku'),
	namedCredential = require(root + '/src/lib/service/deploy/namedCredential'),
	properties = require(root + '/src/lib/service/deploy/properties'),
	sfdx = require(root + '/src/lib/service/deploy/sfdx'),
	logger = require(root + '/src/lib/util/logger'),

	service = require(root + '/src/lib/service/deploy'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/deploy.js', () => {

	afterEach(() => {
		sandbox.restore();
	});

	describe('full', () => {

		it('should call the correct functions', () => {

			// given
			const expectedInput = {
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

			sandbox.stub(logger, 'logStart').resolves(expectedInput);
			sandbox.stub(logger, 'logEvent').resolves(expectedInput);
			sandbox.stub(logger, 'logFinish').resolves(expectedInput);

			sandbox.stub(certificate, 'askQuestions').resolves(expectedInput);
			sandbox.stub(certificate, 'checkOpenSSLInstalled').resolves(expectedInput);
			sandbox.stub(certificate, 'create').resolves(expectedInput);
			sandbox.stub(certificate, 'read').resolves(expectedInput);

			sandbox.stub(configFile, 'readSettings').resolves(expectedInput);
			sandbox.stub(configFile, 'writeSetting').resolves(expectedInput);

			sandbox.stub(conn, 'create').resolves(expectedInput);

			sandbox.stub(connectedApp, 'askQuestions').resolves(expectedInput);
			sandbox.stub(connectedApp, 'create').resolves(expectedInput);
			sandbox.stub(connectedApp, 'updateHerokuConfigVariables').resolves(expectedInput);

			sandbox.stub(heroku, 'addBuildpacks').resolves(expectedInput);
			sandbox.stub(heroku, 'addFormation').resolves(expectedInput);
			sandbox.stub(heroku, 'addAddOns').resolves(expectedInput);
			sandbox.stub(heroku, 'checkHerokuCliInstalled').resolves(expectedInput);
			sandbox.stub(heroku, 'deployCurrentBranch').resolves(expectedInput);
			sandbox.stub(heroku, 'getAllApps').resolves(expectedInput);
			sandbox.stub(heroku, 'selectApp').resolves(expectedInput);
			sandbox.stub(heroku, 'readAppJson').resolves(expectedInput);

			sandbox.stub(namedCredential, 'askQuestions').resolves(expectedInput);
			sandbox.stub(namedCredential, 'create').resolves(expectedInput);

			sandbox.stub(properties, 'updateProperties').resolves(expectedInput);

			sandbox.stub(sfdx, 'checkSfdxInstalled').resolves(expectedInput);
			sandbox.stub(sfdx, 'deploy').resolves(expectedInput);
			sandbox.stub(sfdx, 'getAllScratchOrgs').resolves(expectedInput);
			sandbox.stub(sfdx, 'getConnectionDetails').resolves(expectedInput);
			sandbox.stub(sfdx, 'login').resolves(expectedInput);
			sandbox.stub(sfdx, 'openOrg').resolves(expectedInput);
			sandbox.stub(sfdx, 'readSfdxYaml').resolves(expectedInput);
			sandbox.stub(sfdx, 'selectApp').resolves(expectedInput);

			// when - then
			return expect(service.run({ argv: { full: true } }))
				.to.eventually.be.fulfilled
				.then(() => {

					expect(logger.logStart).to.have.been.calledOnce;
					expect(logger.logEvent).to.have.been.callCount(17);
					expect(logger.logFinish).to.have.been.calledOnce;

					expect(certificate.askQuestions).to.have.been.calledOnce;
					expect(certificate.create).to.have.been.calledOnce;
					expect(certificate.read).to.have.been.calledOnce;

					expect(configFile.readSettings).to.have.been.calledOnce;
					expect(configFile.writeSetting).to.have.been.calledThrice;

					expect(conn.create).to.have.been.calledOnce;

					expect(connectedApp.askQuestions).to.have.been.calledOnce;
					expect(connectedApp.create).to.have.been.calledOnce;
					expect(connectedApp.updateHerokuConfigVariables).to.have.been.calledOnce;

					expect(heroku.checkHerokuCliInstalled).to.have.been.calledOnce;
					expect(heroku.getAllApps).to.have.been.calledOnce;
					expect(heroku.selectApp).to.have.been.calledOnce;
					expect(heroku.readAppJson).to.have.been.calledOnce;
					expect(heroku.addBuildpacks).to.have.been.calledOnce;
					expect(heroku.addFormation).to.have.been.calledOnce;
					expect(heroku.addAddOns).to.have.been.calledOnce;
					expect(heroku.deployCurrentBranch).to.have.been.calledOnce;

					expect(namedCredential.askQuestions).to.have.been.calledOnce;
					expect(namedCredential.create).to.have.been.calledOnce;

					expect(properties.updateProperties).to.have.been.calledOnce;

					expect(sfdx.checkSfdxInstalled).to.have.been.calledOnce;
					expect(sfdx.deploy).to.have.been.calledOnce;
					expect(sfdx.getAllScratchOrgs).to.have.been.calledOnce;
					expect(sfdx.getConnectionDetails).to.have.been.calledOnce;
					expect(sfdx.login).to.have.been.calledOnce;
					expect(sfdx.openOrg).to.have.been.calledOnce;
					expect(sfdx.readSfdxYaml).to.have.been.calledOnce;
					expect(sfdx.selectApp).to.have.been.calledOnce;

				});

		});

	});

});
