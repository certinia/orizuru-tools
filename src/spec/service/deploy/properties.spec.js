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
	proxyquire = require('proxyquire'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/deploy/properties.js', () => {

	let mocks, properties;

	beforeEach(() => {

		mocks = {};

		mocks.fsextra = {};
		mocks.fsextra.readFile = sandbox.stub();
		mocks.fsextra.writeFile = sandbox.stub();

		properties = proxyquire(root + '/src/lib/service/deploy/properties.js', {
			'fs-extra': mocks.fsextra
		});
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('updateProperties', () => {

		it('should add the properties file with the right content', () => {
			const
				expectedCwd = '/Users/test/git/orizuru-tools',
				expectedInput = {
					certificate: {
						privateKey: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQEAzzmovbx9CSPO52BxJeE8oPLS1cEKzg+UpMQNpt4oX1rhPnrN\nCdHiDY5XGE=\n-----END RSA PRIVATE KEY----'
					},
					connectedApp: {
						oauthConfig: {
							consumerKey: 'consumerKey'
						}
					}
				},
				expectedOutput = {
					certificate: {
						privateKey: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQEAzzmovbx9CSPO52BxJeE8oPLS1cEKzg+UpMQNpt4oX1rhPnrN\nCdHiDY5XGE=\n-----END RSA PRIVATE KEY----'
					},
					connectedApp: {
						oauthConfig: {
							consumerKey: 'consumerKey'
						}
					},
					properties: {
						filepath: '/Users/test/git/orizuru-tools/local.run.properties',
						content: [
							'JWT_SIGNING_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQEAzzmovbx9CSPO52BxJeE8oPLS1cEKzg+UpMQNpt4oX1rhPnrN\nCdHiDY5XGE=\n-----END RSA PRIVATE KEY----"',
							'OPENID_CLIENT_ID=consumerKey',
							'OPENID_ISSUER_URI=https://test.salesforce.com/',
							'OPENID_HTTP_TIMEOUT=4000'
						]
					}
				};

			sandbox.stub(process, 'cwd').returns(expectedCwd);
			mocks.fsextra.readFile.resolves();
			mocks.fsextra.writeFile.resolves();

			// when - then
			return expect(properties.updateProperties(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.fsextra.readFile).to.have.been.calledOnce;
					expect(mocks.fsextra.writeFile).to.have.been.calledOnce;
				});
		});

		it('should update an existing properties file', () => {
			const
				expectedCwd = '/Users/test/git/orizuru-tools',
				expectedInput = {
					certificate: {
						privateKey: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQEAzzmovbx9CSPO52BxJeE8oPLS1cEKzg+UpMQNpt4oX1rhPnrN\nCdHiDY5XGE=\n-----END RSA PRIVATE KEY----'
					},
					connectedApp: {
						oauthConfig: {
							consumerKey: 'consumerKey'
						}
					}
				},
				readOutput =
				'JWT_SIGNING_KEY="notSameKey"\nOPENID_CLIENT_ID=anotherKey\nOPENID_ISSUER_URI=https://test.salesforce.com/\nOPENID_HTTP_TIMEOUT=4000\nDEBUG=*',
				expectedOutput = {
					certificate: {
						privateKey: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQEAzzmovbx9CSPO52BxJeE8oPLS1cEKzg+UpMQNpt4oX1rhPnrN\nCdHiDY5XGE=\n-----END RSA PRIVATE KEY----'
					},
					connectedApp: {
						oauthConfig: {
							consumerKey: 'consumerKey'
						}
					},
					properties: {
						filepath: '/Users/test/git/orizuru-tools/local.run.properties',
						content: [
							'#JWT_SIGNING_KEY="notSameKey"',
							'#OPENID_CLIENT_ID=anotherKey',
							'DEBUG=*',
							'JWT_SIGNING_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQEAzzmovbx9CSPO52BxJeE8oPLS1cEKzg+UpMQNpt4oX1rhPnrN\nCdHiDY5XGE=\n-----END RSA PRIVATE KEY----"',
							'OPENID_CLIENT_ID=consumerKey',
							'OPENID_ISSUER_URI=https://test.salesforce.com/',
							'OPENID_HTTP_TIMEOUT=4000'
						]
					}
				};

			sandbox.stub(process, 'cwd').returns(expectedCwd);
			mocks.fsextra.readFile.resolves(readOutput);
			mocks.fsextra.writeFile.resolves();

			// when - then
			return expect(properties.updateProperties(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.fsextra.readFile).to.have.been.calledOnce;
					expect(mocks.fsextra.writeFile).to.have.been.calledOnce;
				});
		});
	});
});
