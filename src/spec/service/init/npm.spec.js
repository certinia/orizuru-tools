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

	shell = require('../../../lib/util/shell'),

	npm = require('../../../lib/service/init/npm'),

	expect = chai.expect;

chai.use(sinonChai);

describe('service/init/npm.js', () => {

	beforeEach(() => {
		sinon.stub(shell, 'executeCommand');
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('generateApexTransport', () => {

		it('should run the npm run generate-apex-transport command', async () => {

			// Given
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
				},
				expectedOutput = {
					test: 'input'
				};

			shell.executeCommand.resolves(expectedInput);

			// When
			const output = await npm.generateApexTransport(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

	});

	describe('generateDocumentation', () => {

		it('should run the npm run doc command', async () => {

			// Given
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
				},
				expectedOutput = {
					test: 'input'
				};

			shell.executeCommand.resolves(expectedInput);

			// When
			const output = await npm.generateDocumentation(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

	});

	describe('init', () => {

		it('should run the npm init command', async () => {

			// Given
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
				},
				expectedOutput = {
					test: 'input'
				};

			shell.executeCommand.resolves(expectedInput);

			// When
			const output = await npm.init(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

	});

	describe('install', () => {

		it('should run the npm install command', async () => {

			// Given
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
				},
				expectedOutput = {
					test: 'input'
				};

			shell.executeCommand.resolves(expectedInput);

			// When
			const output = await npm.install(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

	});

	describe('orizuruPostInit', () => {

		it('should run the npm run orizuru-post-init command', async () => {

			// Given
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
				},
				expectedOutput = {
					test: 'input'
				};

			shell.executeCommand.resolves(expectedInput);

			// When
			const output = await npm.orizuruPostInit(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

	});

	describe('test', () => {

		it('should run the npm test command', async () => {

			// Given
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
				},
				expectedOutput = {
					test: 'input'
				};

			shell.executeCommand.resolves(expectedOutput);

			// When
			const output = await npm.test(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

	});

});
