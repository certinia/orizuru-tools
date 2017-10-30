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

describe('deploy/shell.js', () => {

	let mocks, heroku;

	beforeEach(() => {

		mocks = {};
		mocks.shell = {};

		heroku = proxyquire(root + '/src/lib/service/deploy/heroku.js', {
			'./shared/shell': mocks.shell
		});

	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('deployToHeroku', () => {

		it('should execute the correct commands', () => {

			// given
			const
				expectedCreateHerokuAppCommand = { cmd: 'heroku', args: ['create', '-t', 'research', '--json'] },
				expectedCurrentBranchCommand = { cmd: 'git', args: ['rev-parse', '--abbrev-ref', 'HEAD'], opts: { exitOnError: true } },
				expectedSetupHerokuAppCommands = [
					{ cmd: 'heroku', args: ['buildpacks:add', '--index', '1', 'heroku/nodejs'] },
					{ cmd: 'heroku', args: ['buildpacks:add', '--index', '2', 'heroku/java'] },
					{ cmd: 'heroku', args: ['addons:create', 'cloudamqp:lemur'] },
					{ cmd: 'heroku', args: ['config:set', 'MAVEN_CUSTOM_OPTS=-DskipTests=false;maven.javadoc.skip=true'] },
					{ cmd: 'heroku', args: ['config:set', 'NODE_MODULES_CACHE=false'] },
					{ cmd: 'heroku', args: ['config:set', 'OPENID_HTTP_TIMEOUT=4000'] },
					{ cmd: 'heroku', args: ['config:set', 'OPENID_ISSUER_URI=https://test.salesforce.com/'] }
				],
				expectedDeployToHerokuCommands = [
					{ cmd: 'git', args: ['push', 'heroku', 'master:master'] }
				],
				expectedScaleHerokuCommands = [
					{ cmd: 'heroku', args: ['ps:scale', 'dataCreator=1'] },
					{ cmd: 'heroku', args: ['ps:scale', 'questionBuilder=1'] },
					{ cmd: 'heroku', args: ['ps:scale', 'resultWriter=1'] },
					{ cmd: 'heroku', args: ['ps:scale', 'routeSolver=1'] }
				],
				expectedOutput = {
					herokuApp: {}
				};

			mocks.shell.executeCommand = sandbox.stub();
			mocks.shell.executeCommand.withArgs(expectedCreateHerokuAppCommand).resolves({ stdout: '{}' });
			mocks.shell.executeCommand.withArgs(expectedCurrentBranchCommand).resolves({ stdout: 'master' });

			mocks.shell.executeCommands = sandbox.stub();
			mocks.shell.executeCommands.withArgs(expectedDeployToHerokuCommands).resolves();
			mocks.shell.executeCommands.withArgs(expectedSetupHerokuAppCommands).resolves();
			mocks.shell.executeCommands.withArgs(expectedScaleHerokuCommands).resolves();

			mocks.shell.executeCommands.rejects({});

			// when - then
			return expect(heroku.deploy({}))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCreateHerokuAppCommand);
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCurrentBranchCommand);
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedDeployToHerokuCommands);
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedSetupHerokuAppCommands);
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedScaleHerokuCommands);
				});

		});

	});

});
