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

	inquirer = require('inquirer'),
	jsforce = require('jsforce'),
	openUrl = require('openurl'),
	request = require('request-promise'),

	configFile = require('../../../lib/service/deploy/shared/config'),
	htmlParser = require('../../../lib/util/htmlParser'),
	shell = require('../../../lib/util/shell'),

	connectedApp = require('../../../lib/service/deploy/connectedApp'),

	expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/deploy/connectedApp.js', () => {

	let connectionStub;

	beforeEach(() => {

		connectionStub = sinon.createStubInstance(jsforce.Connection);
		sinon.stub(jsforce, 'Connection').returns(connectionStub);

		sinon.stub(openUrl, 'open');

		sinon.stub(configFile, 'writeSetting');
		sinon.stub(inquirer, 'prompt');
		sinon.stub(htmlParser, 'parseScripts');
		sinon.stub(request, 'get');

		sinon.stub(shell, 'executeCommands');

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('askQuestions', () => {

		it('should ask the correct questions', () => {

			// given
			const
				expectedAnswers = {
					name: 'test',
					email: 'test@test.com'
				},
				expectedResults = {
					parameters: {
						connectedApp: expectedAnswers
					}
				};

			inquirer.prompt.resolves(expectedAnswers);

			// when - then
			return expect(connectedApp.askQuestions({})).to.eventually.eql(expectedResults);

		});

	});

	describe('create', () => {

		it('should execute the correct commands', () => {

			// given
			const
				expectedInput = {
					conn: sinon.stub(),
					parameters: {
						connectedApp: {
							name: 'TestApp',
							contactEmail: 'contactEmail'
						}
					},
					certificate: {
						publicKey: 'testKey'
					}
				},
				expectedOutput = {
					conn: expectedInput.conn,
					connectedApp: undefined,
					certificate: {
						publicKey: 'testKey'
					},
					parameters: expectedInput.parameters
				};

			expectedInput.conn.metadata = {};
			expectedInput.conn.metadata.upsert = sinon.stub().resolves();
			expectedInput.conn.metadata.read = sinon.stub().resolves();

			// when - then
			return expect(connectedApp.create(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(expectedInput.conn.metadata.upsert).to.have.been.calledOnce;
					expect(expectedInput.conn.metadata.read).to.have.been.calledOnce;
				});

		});

	});

	describe('install', () => {

		it('should navigate to the correct url', () => {

			// given
			const
				expectedInstanceUrl = 'testInstance',
				expectedInstallLink = '/testLink',
				expectedInput = {
					connected: {
						app: {
							install: {
								link: expectedInstallLink
							}
						}
					},
					parameters: {
						sfdx: {
							org: {
								credentials: {
									instanceUrl: expectedInstanceUrl
								}
							}
						}
					}
				};

			// when - then
			expect(connectedApp.install(expectedInput)).to.eql(expectedInput);

		});

	});

	describe('list', () => {

		it('should query the Salesforce org for the ConnectedApplications', () => {

			// given
			const
				expectedRecords = {
					records: [{
						name: 'test',
						email: 'test@test.com'
					}]
				},
				expectedResults = {
					conn: connectionStub,
					connected: {
						apps: expectedRecords.records
					}
				};

			connectionStub.query.resolves(expectedRecords);

			// when - then
			return expect(connectedApp.list({ conn: connectionStub }))
				.to.eventually.eql(expectedResults);

		});

	});

	describe('generateInstallUrl', () => {

		it('should create the installUrl for the connected app', () => {

			// given
			const
				expectedConnectedAppId = 'testConnectedAppId',
				expectedOutput = {
					connected: {
						app: {
							install: {
								link: `/identity/app/AppInstallApprovalPage.apexp?app_id=${expectedConnectedAppId}`
							}
						}
					}
				};

			request.get.resolves();
			htmlParser.parseScripts
				.onFirstCall().returns([
					'\nif (this.SfdcApp && this.SfdcApp.projectOneNavigator) { SfdcApp.projectOneNavigator.handleRedirect(\'/_ui/core/application/force/connectedapp/ForceConnectedApplicationPage/d?applicationId=06P1D00000000Er\'); }  else \nif (window.location.replace){ \nwindow.location.replace(\'/_ui/core/application/force/connectedapp/ForceConnectedApplicationPage/d?applicationId=06P1D00000000Er\');\n} else {;\nwindow.location.href =\'/_ui/core/application/force/connectedapp/ForceConnectedApplicationPage/d?applicationId=06P1D00000000Er\';\n} \n'
				])
				.onSecondCall().returns([
					`\nif (this.SfdcApp && this.SfdcApp.projectOneNavigator) { SfdcApp.projectOneNavigator.handleRedirect('/app/mgmt/forceconnectedapps/forceAppDetail.apexp?applicationId=06P1D00000000Er&id=${expectedConnectedAppId}'); }  else \nif (window.location.replace){ \nwindow.location.replace('/app/mgmt/forceconnectedapps/forceAppDetail.apexp?applicationId=06P1D00000000Er&id=${expectedConnectedAppId}');\n} else {;\nwindow.location.href ='/app/mgmt/forceconnectedapps/forceAppDetail.apexp?applicationId=06P1D00000000Er&id=${expectedConnectedAppId}';\n} \n`
				]);

			// when then
			return expect(connectedApp.generateInstallUrl({}))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(request.get).to.have.been.calledTwice;
					expect(htmlParser.parseScripts).to.have.been.calledTwice;
				});

		});

	});

	describe('select', () => {

		it('should prompt the user to select a connecte app', () => {

			// given
			const
				expectedConnectedAppId = 'testId',
				expectedConnectedApp = {
					attributes: {
						type: 'ConnectedApplication',
						url: '/services/data/v39.0/sobjects/ConnectedApplication/testId'
					},
					Id: expectedConnectedAppId,
					Name: 'Orizuru'
				},
				expectedInput = {
					connected: {
						apps: [expectedConnectedApp]
					}
				},
				expectedAnswers = {
					connected: {
						app: expectedConnectedApp
					}
				},
				expectedOutput = {
					connected: {
						app: {
							selected: {
								Id: expectedConnectedAppId,
								Name: 'Orizuru',
								attributes: {
									type: 'ConnectedApplication',
									url: '/services/data/v39.0/sobjects/ConnectedApplication/testId'
								}
							}
						},
						apps: [{
							Id: expectedConnectedAppId,
							Name: 'Orizuru',
							attributes: {
								type: 'ConnectedApplication',
								url: '/services/data/v39.0/sobjects/ConnectedApplication/testId'
							}
						}]
					}
				};

			configFile.writeSetting.resolves(expectedOutput);
			inquirer.prompt.resolves(expectedAnswers);

			// when - then
			return expect(connectedApp.select(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(configFile.writeSetting).to.have.been.calledWith(expectedOutput, 'connected.app.id', expectedConnectedAppId);
				});

		});

	});

	describe('updateHerokuConfigVariables', () => {

		it('should execute the correct commands', () => {

			// given
			const
				expectedAppName = 'rocky-shore-45862',
				expectedInput = {
					certificate: {
						privateKey: 'privateKey'
					},
					connectedApp: {
						oauthConfig: {
							consumerKey: 'testKey'
						}
					},
					parameters: {
						heroku: {
							app: {
								name: expectedAppName
							}
						}
					}
				},
				expectedCommands = [{
					args: ['config:set', 'OPENID_CLIENT_ID=testKey', '-a', expectedAppName],
					cmd: 'heroku'
				}, {
					args: ['config:set', 'OPENID_HTTP_TIMEOUT=4000', '-a', expectedAppName],
					cmd: 'heroku'
				}, {
					args: ['config:set', 'OPENID_ISSUER_URI=https://test.salesforce.com/', '-a', expectedAppName],
					cmd: 'heroku'
				}, {
					args: ['config:set', 'JWT_SIGNING_KEY=privateKey', '-a', expectedAppName],
					cmd: 'heroku'
				}],
				expectedOutput = expectedInput;

			shell.executeCommands = sinon.stub().resolves({});

			// when - then
			return expect(connectedApp.updateHerokuConfigVariables(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(shell.executeCommands).to.have.been.calledWith(expectedCommands);
				});

		});

	});

});
