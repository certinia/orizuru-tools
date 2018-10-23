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

	fs = require('fs-extra'),

	properties = require('../../../lib/service/deploy/properties'),

	expect = chai.expect;

chai.use(sinonChai);

describe('service/deploy/properties.js', () => {

	beforeEach(() => {
		sinon.stub(fs, 'readFile');
		sinon.stub(fs, 'writeFile');
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('updateProperties', () => {

		it('should add the properties file with the right content', async () => {
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
							'JWT_SIGNING_KEY="-----BEGIN RSA PRIVATE KEY-----\\nMIIEpQIBAAKCAQEAzzmovbx9CSPO52BxJeE8oPLS1cEKzg+UpMQNpt4oX1rhPnrN\\nCdHiDY5XGE=\\n-----END RSA PRIVATE KEY----"',
							'OPENID_CLIENT_ID=consumerKey',
							'OPENID_ISSUER_URI=https://test.salesforce.com/',
							'OPENID_HTTP_TIMEOUT=4000'
						]
					}
				};

			sinon.stub(process, 'cwd').returns(expectedCwd);
			fs.readFile.resolves();
			fs.writeFile.resolves();

			// When
			const output = await properties.updateProperties(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(fs.readFile).to.have.been.calledOnce;
			expect(fs.writeFile).to.have.been.calledOnce;

		});

		it('should update an existing properties file', async () => {
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
							'JWT_SIGNING_KEY="-----BEGIN RSA PRIVATE KEY-----\\nMIIEpQIBAAKCAQEAzzmovbx9CSPO52BxJeE8oPLS1cEKzg+UpMQNpt4oX1rhPnrN\\nCdHiDY5XGE=\\n-----END RSA PRIVATE KEY----"',
							'OPENID_CLIENT_ID=consumerKey',
							'OPENID_ISSUER_URI=https://test.salesforce.com/',
							'OPENID_HTTP_TIMEOUT=4000'
						]
					}
				};

			sinon.stub(process, 'cwd').returns(expectedCwd);
			fs.readFile.resolves(readOutput);
			fs.writeFile.resolves();

			// When
			const output = await properties.updateProperties(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(fs.readFile).to.have.been.calledOnce;
			expect(fs.writeFile).to.have.been.calledOnce;

		});

	});

});
