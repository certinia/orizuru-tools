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

	fs = require('fs'),

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

	describe('addAddOns', () => {

		it('should create the add-ons specified in the app.json', () => {

			// given
			const
				expectedAppName = 'rocky-shore-45862',
				expectedInput = {
					parameters: {
						heroku: {
							app: {
								name: expectedAppName
							}
						}
					},
					heroku: {
						app: {
							json: {
								addons: [{
									plan: 'cloudamqp:lemur'
								}]
							}
						}
					}
				},
				expectedOutput = expectedInput,
				expectedCommand = [{
					args: ['addons:create', 'cloudamqp:lemur', '-a', 'rocky-shore-45862'],
					cmd: 'heroku'
				}];

			mocks.shell.executeCommands = sandbox.stub().resolves();

			// when - then
			return expect(heroku.addAddOns(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommands).to.have.calledWith(expectedCommand, { exitOnError: true });
				});

		});

	});

	describe('addBuildpacks', () => {

		it('should add the build packs specified in the app.json', () => {

			// given
			const
				expectedAppName = 'rocky-shore-45862',
				expectedInput = {
					parameters: {
						heroku: {
							app: {
								name: expectedAppName
							}
						}
					},
					heroku: {
						app: {
							json: {
								buildpacks: [{
									url: 'heroku/nodejs'
								}, {
									url: 'heroku/java'
								}]
							}
						}
					}
				},
				expectedOutput = expectedInput,
				expectedCommand = [{
					args: ['buildpacks:add', '--index', 1, 'heroku/nodejs', '-a', 'rocky-shore-45862'],
					cmd: 'heroku'
				}, {
					args: ['buildpacks:add', '--index', 2, 'heroku/java', '-a', 'rocky-shore-45862'],
					cmd: 'heroku'
				}];

			mocks.shell.executeCommands = sandbox.stub().resolves();

			// when - then
			return expect(heroku.addBuildpacks(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommands).to.have.calledWith(expectedCommand, { exitOnError: false });
				});

		});

	});

	describe('deployCurrentBranch', () => {

		it('should deploy the current branch to Heroku', () => {

			// given
			const
				expectedAppName = 'rocky-shore-45862',
				expectedInput = {
					parameters: {
						heroku: {
							app: {
								name: expectedAppName
							}
						}
					},
					heroku: {
						app: {
							json: {
								buildpacks: [{
									url: 'heroku/nodejs'
								}, {
									url: 'heroku/java'
								}]
							}
						}
					}
				},
				expectedOutput = expectedInput;

			mocks.shell.executeCommand = sandbox.stub().resolves();
			mocks.shell.executeCommand = sandbox.stub().withArgs({ cmd: 'git', args: ['rev-parse', '--abbrev-ref', 'HEAD'], opts: { exitOnError: true } }).resolves({ stdout: 'master' });

			// when - then
			return expect(heroku.deployCurrentBranch(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.callCount(4);
				});

		});

	});

	describe('getAllApps', () => {

		it('should get all the current Heroku apps', () => {

			// given
			const
				expectedAppName = 'rocky-shore-45862',
				expectedInput = {
					parameters: {
						heroku: {
							app: {
								name: expectedAppName
							}
						}
					}
				},
				expectedCommand = { cmd: 'heroku', args: ['apps', '--all', '--json'] },
				expectedOutput = expectedInput;

			mocks.shell.executeCommand = sandbox.stub().resolves({ stdout: '{}' });

			// when - then
			return expect(heroku.getAllApps(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand);
				});

		});

	});

	describe('readAppJson', () => {

		it('should read the app.json file', () => {

			// given
			const
				expectedAppName = 'rocky-shore-45862',
				expectedInput = {
					parameters: {
						heroku: {
							app: {
								name: expectedAppName
							}
						}
					}
				},
				expectedOutput = {
					heroku: {
						app: {
							json: {
								name: 'rocky-shore-45862'
							}
						}
					},
					parameters: {
						heroku: {
							app: {
								name: 'rocky-shore-45862'
							}
						}
					}
				};

			sandbox.stub(fs, 'readFileSync').returns('{"name":"rocky-shore-45862"}');

			// when - then
			expect(heroku.readAppJson(expectedInput)).to.eql(expectedOutput);

		});

	});

});
