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

		it('should ask the correct questions', async () => {

			// Given
			const
				expectedAnswers = {
					name: 'test',
					email: 'test@test.com'
				},
				expectedOutput = {
					parameters: {
						connectedApp: expectedAnswers
					}
				};

			inquirer.prompt.resolves(expectedAnswers);

			// When
			const output = await connectedApp.askQuestions({});

			// Then
			expect(output).to.eql(expectedOutput);

		});

	});

	describe('create', () => {

		it('should execute the correct commands', async () => {

			// Given
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

			// When
			const result = await connectedApp.create(expectedInput);

			// Then
			expect(result).to.eql(expectedOutput);
			expect(expectedInput.conn.metadata.upsert).to.have.been.calledOnce;
			expect(expectedInput.conn.metadata.read).to.have.been.calledOnce;

		});

	});

	describe('install', () => {

		it('should navigate to the correct url', async () => {

			// Given
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
				},
				expectedOutput = expectedInput;

			// When
			const result = await connectedApp.install(expectedInput);

			// Then
			expect(result).to.eql(expectedOutput);

		});

	});

	describe('list', () => {

		it('should query the Salesforce org for the ConnectedApplications', async () => {

			// Given
			const
				expectedRecords = {
					records: [{
						name: 'test',
						email: 'test@test.com'
					}]
				},
				expectedOutput = {
					conn: connectionStub,
					connected: {
						apps: expectedRecords.records
					}
				};

			connectionStub.query.resolves(expectedRecords);

			// When
			const result = await connectedApp.list({ conn: connectionStub });

			// Then
			expect(result).to.eql(expectedOutput);

		});

	});

	describe('generateInstallUrl', () => {

		it('should create the installUrl for the connected app', async () => {

			// Given
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

			// When
			const result = await connectedApp.generateInstallUrl({});

			// Then
			expect(result).to.eql(expectedOutput);
			expect(request.get).to.have.been.calledTwice;
			expect(htmlParser.parseScripts).to.have.been.calledTwice;

		});

	});

	describe('select', () => {

		it('should prompt the user to select a connecte app', async () => {

			// Given
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

			// When
			const result = await connectedApp.select(expectedInput);

			// Then
			expect(result).to.eql(expectedOutput);
			expect(configFile.writeSetting).to.have.been.calledWith(expectedOutput, 'connected.app.id', expectedConnectedAppId);

		});

	});

	describe('updateHerokuConfigVariables', () => {

		it('should execute the correct commands', async () => {

			// Given
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

			// When
			const result = await connectedApp.updateHerokuConfigVariables(expectedInput);

			// Then
			expect(result).to.eql(expectedOutput);
			expect(shell.executeCommands).to.have.been.calledWith(expectedCommands);

		});

	});

});
