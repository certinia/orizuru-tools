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
	proxyquire = require('proxyquire'),

	expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(sinonChai);

function createMocks() {

	const
		execa = sinon.stub(),
		childProcess = {
			spawn: sinon.stub()
		},
		execaStdout = {
			stdout: {
				pipe: sinon.stub()
			},
			on: sinon.stub()
		},
		onComplete = sinon.stub(),
		onFailure = sinon.stub(),
		logging = sinon.stub();

	execaStdout.stdout.pipe.resume = sinon.stub();
	execaStdout.stdout.pipe.returns(execaStdout.stdout.pipe);

	return { childProcess, execa, execaStdout, logging, onComplete, onFailure };

}

describe('util/shell.js', () => {

	let mocks, shell;

	beforeEach(() => {

		mocks = createMocks();

		mocks.debug = sinon.stub().returns(sinon.stub());
		mocks.debug.create = sinon.stub().returnsThis();
		mocks.debug.create.enable = sinon.stub();

		const spawn = mocks.childProcess.spawn;
		spawn.returns(spawn);

		spawn.stdout = sinon.stub();
		spawn.stdout.pipe = sinon.stub();
		spawn.stdout.pipe.returns(spawn.stdout.pipe);
		spawn.stdout.pipe.resume = sinon.stub();
		spawn.stdout.on = sinon.stub();

		spawn.stderr = sinon.stub();
		spawn.stderr.pipe = sinon.stub();
		spawn.stderr.pipe.returns(spawn.stderr.pipe);
		spawn.stderr.pipe.resume = sinon.stub();
		spawn.stderr.on = sinon.stub();

		shell = proxyquire('../../lib/util/shell', {
			['child_process']: mocks.childProcess,
			'./debug': mocks.debug
		});

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('executeCommand', () => {

		it('should handle config', () => {

			// given
			const
				expectedConfig = sinon.stub(),
				expectedCommand = 'command',
				expectedArgs = ['args'],
				expectedOptions = { exitOnError: true },
				command = { cmd: expectedCommand, args: expectedArgs, opts: expectedOptions };

			mocks.childProcess.spawn.on = sinon.stub().yields(0);

			// when - then
			return expect(shell.executeCommand(command, expectedConfig))
				.to.eventually.eql(expectedConfig);

		});

		describe('should handle exit codes', () => {

			afterEach(() => {
				expect(mocks.childProcess.spawn).to.have.been.calledOnce;
				expect(mocks.childProcess.spawn.stdout.on).to.have.been.calledOnce;
				expect(mocks.childProcess.spawn.stderr.on).to.have.been.calledOnce;
				expect(mocks.childProcess.spawn.on).to.have.been.calledOnce;
			});

			it('if the exitOnError option is false', () => {

				// given
				const
					expectedCommand = 'command',
					expectedArgs = ['args'],
					command = { cmd: expectedCommand, args: expectedArgs, opts: { exitOnError: false } },
					expectedResult = {
						exitCode: 1,
						formattedCommand: 'command args',
						stderr: '',
						stdout: ''
					};

				mocks.childProcess.spawn.on = sinon.stub().yields(1);

				// when - then
				return expect(shell.executeCommand(command))
					.to.eventually.eql(expectedResult)
					.then(() => {
						expect(mocks.childProcess.spawn).to.have.been.calledWithExactly(expectedCommand, expectedArgs);
					});

			});

			it('if the exitOnError option is true', () => {

				// given
				const
					expectedCommand = 'command',
					expectedArgs = ['args'],
					expectedOptions = { exitOnError: true },
					command = { cmd: expectedCommand, args: expectedArgs, opts: expectedOptions };

				mocks.childProcess.spawn.on = sinon.stub().yields(1);

				// when - then
				return expect(shell.executeCommand(command))
					.to.eventually.be.rejectedWith('Command failed')
					.then(() => {
						expect(mocks.childProcess.spawn).to.have.been.calledWithExactly(expectedCommand, expectedArgs);
					});

			});

			it('a success code', () => {

				// given
				const
					expectedCommand = 'command',
					expectedArgs = ['args'],
					expectedOptions = {},
					command = { cmd: expectedCommand, args: expectedArgs, opts: expectedOptions },
					expectedResult = {
						exitCode: 0,
						formattedCommand: 'command args',
						stderr: '',
						stdout: ''
					};

				mocks.childProcess.spawn.on = sinon.stub().yields(0);

				// when - then
				return expect(shell.executeCommand(command))
					.to.eventually.eql(expectedResult)
					.then(() => {
						expect(mocks.childProcess.spawn).to.have.been.calledWithExactly(expectedCommand, expectedArgs);
					});

			});

		});

		describe('should handle logging', () => {

			it('and log out everything in verbose mode', () => {

				// given
				const
					expectedCommand = 'command',
					expectedArgs = ['args'],
					expectedOptions = { verbose: true },
					command = { cmd: expectedCommand, args: expectedArgs, opts: expectedOptions },
					expectedResult = {
						exitCode: 0,
						formattedCommand: 'command args',
						stderr: '',
						stdout: 'test'
					};

				mocks.childProcess.spawn.on = sinon.stub().yields(0);
				mocks.childProcess.spawn.stdout.on.withArgs('data').yields('test');

				// when - then
				return expect(shell.executeCommand(command))
					.to.eventually.eql(expectedResult)
					.then(() => {
						expect(mocks.debug.create.enable).to.have.been.calledOnce;
						expect(mocks.debug.create.enable).to.have.been.calledWith('shell,shell:output');
					});

			});

			it('and log out nothing in silent mode', () => {

				// given
				const
					expectedCommand = 'command',
					expectedArgs = ['args'],
					expectedOptions = { silent: true },
					command = { cmd: expectedCommand, args: expectedArgs, opts: expectedOptions },
					expectedResult = {
						exitCode: 0,
						formattedCommand: 'command args',
						stderr: '',
						stdout: 'test'
					};

				mocks.childProcess.spawn.on = sinon.stub().yields(0);
				mocks.childProcess.spawn.stdout.on.withArgs('data').yields('test');

				// when - then
				return expect(shell.executeCommand(command))
					.to.eventually.eql(expectedResult)
					.then(() => {
						expect(mocks.debug.create.enable).to.not.have.been.called;
					});

			});

			it('and capture stdout', () => {

				// given
				const
					expectedCommand = 'command',
					expectedArgs = ['args'],
					expectedOptions = {},
					command = { cmd: expectedCommand, args: expectedArgs, opts: expectedOptions },
					expectedResult = {
						exitCode: 0,
						formattedCommand: 'command args',
						stderr: '',
						stdout: 'test'
					};

				mocks.childProcess.spawn.on = sinon.stub().yields(0);
				mocks.childProcess.spawn.stdout.on.withArgs('data').yields('test');

				// when - then
				return expect(shell.executeCommand(command))
					.to.eventually.eql(expectedResult);

			});

			it('and capture stderr', () => {

				// given
				const
					expectedCommand = 'command',
					expectedArgs = ['args'],
					expectedOptions = {},
					command = { cmd: expectedCommand, args: expectedArgs, opts: expectedOptions },
					expectedResult = {
						exitCode: 0,
						formattedCommand: 'command args',
						stderr: 'test',
						stdout: ''
					};

				mocks.childProcess.spawn.on = sinon.stub().yields(0);
				mocks.childProcess.spawn.stderr.on.withArgs('data').yields('test');

				// when - then
				return expect(shell.executeCommand(command))
					.to.eventually.eql(expectedResult);

			});

			it('and log out if the namespace option is set and debug is true', () => {

				// given
				const
					expectedCommand = 'command',
					expectedArgs = ['args'],
					expectedOptions = { namespace: 'testing', debug: true },
					command = { cmd: expectedCommand, args: expectedArgs, opts: expectedOptions },
					expectedResult = {
						exitCode: 0,
						formattedCommand: 'command args',
						stderr: 'test',
						stdout: ''
					};

				mocks.childProcess.spawn.on = sinon.stub().yields(0);
				mocks.childProcess.spawn.stderr.on.withArgs('data').yields('test');

				// when - then
				return expect(shell.executeCommand(command))
					.to.eventually.eql(expectedResult)
					.then(() => {
						expect(mocks.debug.create.enable).to.have.been.calledOnce;
					});

			});

		});

	});

	describe('executeCommands', () => {

		it('should execute each command in turn', () => {

			// given
			const
				expectedCommands = [{
					cmd: 'ls',
					args: ['-a']
				}, {
					cmd: 'ls',
					opts: { exitOnError: false }
				}],
				expectedOptions = {},
				expectedResults = {
					'ls -a': {
						exitCode: 0,
						formattedCommand: 'ls -a',
						stderr: '',
						stdout: ''
					},
					ls: {
						exitCode: 1,
						formattedCommand: 'ls',
						stderr: '',
						stdout: ''
					}
				};

			mocks.childProcess.spawn.on = sinon.stub()
				.onFirstCall().yields(0)
				.onSecondCall().yields(1);

			// when - then
			return expect(shell.executeCommands(expectedCommands, expectedOptions))
				.to.eventually.eql(expectedResults);

		});

	});

});
