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

	logger = require(root + '/src/lib/util/logger'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('deploy/connectedApp.js', () => {

	let mocks, connectedApp;

	beforeEach(() => {

		mocks = {};
		mocks.shell = {};

		mocks.jsforce = {};
		mocks.jsforce.Connection = sandbox.stub();

		logger.logStart = sandbox.stub();
		logger.logFinish = sandbox.stub();

		connectedApp = proxyquire(root + '/src/lib/service/deploy/connectedApp.js', {
			jsforce: mocks.jsforce,
			'./shared/shell': mocks.shell
		});

	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('create', () => {

		it('should execute the correct commands', () => {

			// given
			const
				expectedInput = {
					conn: sandbox.stub(),
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
			expectedInput.conn.metadata.create = sandbox.stub().resolves();
			expectedInput.conn.metadata.read = sandbox.stub().resolves();

			// when - then
			return expect(connectedApp.create(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(expectedInput.conn.metadata.create).to.have.been.calledOnce;
					expect(expectedInput.conn.metadata.read).to.have.been.calledOnce;
				});

		});

	});

	describe('updateClientIdOnHeroku', () => {

		it('should execute the correct commands', () => {

			// given
			const
				expectedInput = {
					connectedApp: {
						oauthConfig: {
							consumerKey: 'testKey'
						}
					}
				},
				expectedCommands = [{
					cmd: 'heroku',
					args: ['config:set', 'OPENID_CLIENT_ID=testKey']
				}],
				expectedOutput = expectedInput;

			mocks.shell.executeCommands = sandbox.stub().resolves({});

			// when - then
			return expect(connectedApp.updateClientIdOnHeroku(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedCommands);
				});

		});

	});

	describe('updateJwtSigningKeyOnHeroku', () => {

		it('should execute the correct commands', () => {

			// given
			const
				expectedInput = {
					certificate: {
						privateKey: 'testKey'
					}
				},
				expectedCommands = [{
					cmd: 'heroku',
					args: ['config:set', 'JWT_SIGNING_KEY=testKey']
				}],
				expectedOutput = expectedInput;

			mocks.shell.executeCommands = sandbox.stub().resolves({});

			// when - then
			return expect(connectedApp.updateJwtSigningKeyOnHeroku(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedCommands);
				});

		});

	});

});
