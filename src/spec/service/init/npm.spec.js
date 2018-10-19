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
	proxyquire = require('proxyquire'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/init/npm.js', () => {

	let mocks, npm;

	beforeEach(() => {

		mocks = {};

		mocks.shell = sinon.stub();
		mocks.shell.executeCommand = sinon.stub();

		npm = proxyquire('../../../lib/service/init/npm', {
			'../../util/shell': mocks.shell
		});

	});

	afterEach(() => sinon.restore());

	describe('generateApexTransport', () => {

		it('should run the npm run generate-apex-transport command', () => {

			// given
			const
				expectedInput = {
					test: 'input'
				},
				expectedCommand = {
					cmd: 'npm',
					args: ['run', 'generate-apex-transport'],
					opts: {
						logging: {
							start: 'Generating Apex transport classes',
							finish: 'Generated Apex transport classes'
						},
						namespace: 'npm~generate~apex~transport'
					}
				};

			mocks.shell.executeCommand.resolves(expectedInput);

			// when - then
			return expect(npm.generateApexTransport(expectedInput))
				.to.eventually.eql(expectedInput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

	});

	describe('generateDocumentation', () => {

		it('should run the npm run doc command', () => {

			// given
			const
				expectedInput = {
					test: 'input'
				},
				expectedCommand = {
					cmd: 'npm',
					args: ['run', 'doc'],
					opts: {
						logging: {
							start: 'Generating documentation',
							finish: 'Generated documentation'
						},
						namespace: 'npm~generate~documentation'
					}
				};

			mocks.shell.executeCommand.resolves(expectedInput);

			// when - then
			return expect(npm.generateDocumentation(expectedInput))
				.to.eventually.eql(expectedInput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

	});

	describe('init', () => {

		it('should run the npm init command', () => {

			// given
			const
				expectedInput = {
					test: 'input'
				},
				expectedCommand = {
					cmd: 'npm',
					args: ['init', '-y'],
					opts: {
						logging: {
							start: 'Generating default package.json',
							finish: 'Generated default package.json'
						},
						namespace: 'npm~init'
					}
				};

			mocks.shell.executeCommand.resolves(expectedInput);

			// when - then
			return expect(npm.init(expectedInput))
				.to.eventually.eql(expectedInput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

	});

	describe('install', () => {

		it('should run the npm install command', () => {

			// given
			const
				expectedInput = {
					test: 'input'
				},
				expectedCommand = {
					cmd: 'npm',
					args: ['install'],
					opts: {
						logging: {
							start: 'Installing NPM dependencies',
							finish: 'Installed NPM dependencies'
						},
						namespace: 'npm~install'
					}
				};

			mocks.shell.executeCommand.resolves(expectedInput);

			// when - then
			return expect(npm.install(expectedInput))
				.to.eventually.eql(expectedInput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

	});

	describe('orizuruPostInit', () => {

		it('should run the npm run orizuru-post-init command', () => {

			// given
			const
				expectedInput = {
					test: 'input'
				},
				expectedCommand = {
					cmd: 'npm',
					args: ['run', 'orizuru-post-init'],
					opts: {
						logging: {
							start: 'Started Orizuru post init',
							finish: 'Finished Orizuru post init'
						},
						namespace: 'npm~orizuru~post~init'
					}
				};

			mocks.shell.executeCommand.resolves(expectedInput);

			// when - then
			return expect(npm.orizuruPostInit(expectedInput))
				.to.eventually.eql(expectedInput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

	});

	describe('test', () => {

		it('should run the npm test command', () => {

			// given
			const
				expectedInput = {
					test: 'input'
				},
				expectedCommand = {
					cmd: 'npm',
					args: ['test'],
					opts: {
						logging: {
							start: 'Started tests',
							finish: 'Finished tests'
						},
						namespace: 'npm~test'
					}
				};

			mocks.shell.executeCommand.resolves(expectedInput);

			// when - then
			return expect(npm.test(expectedInput))
				.to.eventually.eql(expectedInput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

	});

});
