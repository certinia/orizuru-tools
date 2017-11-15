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
	proxyquire = require('proxyquire'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/init/npm.js', () => {

	let mocks, npm;

	beforeEach(() => {

		mocks = {};

		mocks.logger = sandbox.stub();
		mocks.logger.logStart = sandbox.stub();

		mocks.shell = sandbox.stub();
		mocks.shell.executeCommand = sandbox.stub();

		npm = proxyquire('../../../lib/service/init/npm', {
			'../../util/logger': mocks.logger,
			'../../util/shell': mocks.shell
		});

	});

	afterEach(() => sandbox.restore());

	describe('install', () => {

		it('should run the npm install command', () => {

			// given
			const
				expectedInput = { test: 'input' },
				expectedCommand = {
					args: ['install'],
					cmd: 'npm',
					opts: { exitOnError: true, namespace: 'npm~install' }
				};

			// when - then
			return expect(npm.install(expectedInput))
				.to.eventually.eql(expectedInput)
				.then(() => {
					expect(mocks.logger.logStart).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;

					expect(mocks.logger.logStart).to.have.been.calledWith('Installing NPM dependencies');
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand);
				});

		});

	});

});
