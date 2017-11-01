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

describe('service/deploy/heroku.js', () => {

	let mocks, heroku;

	beforeEach(() => {

		mocks = {};
		mocks.fs = sandbox.stub();
		mocks.fs.readJSON = sandbox.stub();
		mocks.inquirer = {};
		mocks.inquirer.prompt = sandbox.stub();
		mocks.shell = {};

		heroku = proxyquire(root + '/src/lib/service/deploy/heroku.js', {
			'fs-extra': mocks.fs,
			inquirer: mocks.inquirer,
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

	describe('addFormation', () => {

		it('should add the dyno formation specified in the app.json', () => {

			// given
			const
				expectedAppName = 'rocky-shore-45862',
				expectedInput = {
					heroku: {
						app: {
							json: {
								formation: {
									web: {
										quantity: 1,
										size: 'standard-1x'
									},
									worker: {
										quantity: 2,
										size: 'standard-2x'
									}
								}
							}
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
				expectedOutput = expectedInput,
				expectedCommand = [{
					cmd: 'heroku',
					args: ['ps:scale', 'web=1:standard-1x', '-a', expectedAppName]
				}, {
					cmd: 'heroku',
					args: ['ps:scale', 'worker=2:standard-2x', '-a', expectedAppName]
				}];

			mocks.shell.executeCommands = sandbox.stub().resolves();

			// when - then
			return expect(heroku.addFormation(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommands).to.have.calledWith(expectedCommand, { exitOnError: true });
				});

		});

	});

	describe('checkHerokuCliInstalled', () => {

		it('should check that the Heroku CLI is installed', () => {

			// given
			const expectedCommand = { cmd: 'heroku', args: ['version'] };

			mocks.shell.executeCommand = sandbox.stub().resolves('heroku-toolbelt/3.43.9999 (x86_64-darwin10.8.0) ruby/1.9.3\nheroku-cli/6.14.36-15f8a25 (darwin-x64) node-v8.7.0');

			// when - then
			return expect(heroku.checkHerokuCliInstalled({}))
				.to.eventually.eql({})
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand);
				});

		});

	});

	describe('createNewApp', () => {

		it('should create a new Heroku app', () => {

			// given
			const
				expectedAppName = 'rocky-shore-45862',
				expectedInput = {
					heroku: {
						app: {
							name: expectedAppName
						}
					}
				},
				expectedCommand = { cmd: 'heroku', args: ['create', '-t', 'research', '--json'] },
				expectedOutput = expectedInput;

			mocks.shell.executeCommand = sandbox.stub().resolves({ stdout: `{"name":"${expectedAppName}"}` });

			// when - then
			return expect(heroku.createNewApp(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand);
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
								name: expectedAppName,
								['git_url']: `https://git.heroku.com/${expectedAppName}.git`
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
					expect(mocks.shell.executeCommand).to.have.been.calledWith({ cmd: 'git', args: ['remote', 'remove', 'autodeploy'], opts: { exitOnError: false } });
					expect(mocks.shell.executeCommand).to.have.been.calledWith({ cmd: 'git', args: ['remote', 'add', 'autodeploy', 'https://git.heroku.com/rocky-shore-45862.git'], opts: { exitOnError: true } });
					expect(mocks.shell.executeCommand).to.have.been.calledWith({ cmd: 'git', args: ['rev-parse', '--abbrev-ref', 'HEAD'], opts: { exitOnError: true } });
					expect(mocks.shell.executeCommand).to.have.been.calledWith({ cmd: 'git', args: ['push', 'autodeploy', 'master:master', '-f'], opts: { exitOnError: true } });
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

			mocks.fs.readJSON.resolves({ name: 'rocky-shore-45862' });

			// when - then
			return expect(heroku.readAppJson(expectedInput)).to.eventually.eql(expectedOutput);

		});

		it('should throw an error if app.json doesn\'t exist', () => {

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
				};

			mocks.fs.readJSON.rejects(new Error('test'));

			// when - then
			return expect(heroku.readAppJson(expectedInput)).to.eventually.be.rejectedWith('app.json is required in the root of your project when deploying to heroku.');

		});

	});

	describe('selectApp', () => {

		it('should prompt the user to select the Heroku application without a new app option', () => {

			// given
			const
				expectedAppName = 'rocky-shore-45862',
				expectedInput = {
					heroku: {
						apps: [{
							name: expectedAppName
						}]
					}
				},
				expectedChoices = [{
					choices: [{
						name: expectedAppName,
						value: {
							name: expectedAppName
						}
					}],
					message: 'Heroku App',
					name: 'heroku.app',
					type: 'list',
					validate: undefined,
					['default']: 0
				}],
				expectedAnswer = {
					heroku: {
						apps: expectedAppName
					}
				},
				expectedOutput = expectedInput;

			mocks.inquirer.prompt.resolves(expectedAnswer);

			// when - then
			return expect(heroku.selectApp(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.inquirer.prompt).to.have.been.calledWith(expectedChoices);
				});

		});

		it('should prompt the user to select the Heroku application with a new app option', () => {

			// given
			const
				expectedAppName = 'rocky-shore-45862',
				expectedAnswer = {
					heroku: {
						app: expectedAppName
					}
				},
				expectedInput = {
					options: {
						includeNew: {
							heroku: true
						}
					},
					heroku: {
						apps: [{
							name: expectedAppName
						}]
					}
				},
				expectedChoices = [{
					choices: [{
						name: expectedAppName,
						value: {
							name: expectedAppName
						}
					}, '<<Create new Heroku App>>'],
					message: 'Heroku App',
					name: 'heroku.app',
					type: 'list',
					validate: undefined,
					['default']: '<<Create new Heroku App>>'
				}],
				expectedOutput = expectedInput;

			mocks.inquirer.prompt.resolves(expectedAnswer);

			// when - then
			return expect(heroku.selectApp(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.inquirer.prompt).to.have.been.calledWith(expectedChoices);
				});

		});

		it('should prompt the user to select the Heroku application with a new app option and create a new app if that option is chosen', () => {

			// given
			const
				expectedAppName = 'rocky-shore-45862',
				expectedAnswer = {
					heroku: {
						app: '<<Create new Heroku App>>'
					}
				},
				expectedInput = {
					options: {
						includeNew: {
							heroku: true
						}
					},
					heroku: {
						apps: [{
							name: expectedAppName
						}]
					}
				},
				expectedChoices = [{
					choices: [{
						name: expectedAppName,
						value: {
							name: expectedAppName
						}
					}, '<<Create new Heroku App>>'],
					message: 'Heroku App',
					name: 'heroku.app',
					type: 'list',
					validate: undefined,
					['default']: '<<Create new Heroku App>>'
				}],
				expectedOutput = expectedInput;

			mocks.inquirer.prompt.resolves(expectedAnswer);
			mocks.shell.executeCommand = sandbox.stub().resolves({ stdout: '{}' });

			// when - then
			return expect(heroku.selectApp(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.inquirer.prompt).to.have.been.calledWith(expectedChoices);
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
				});

		});

		it('should default to the Heroku org provided in the Orizuru config', () => {

			// given
			const
				expectedAppName = 'rocky-shore-45862',
				expectedAppName2 = 'rocky-shore-45861',
				expectedInput = {
					orizuru: {
						heroku: {
							app: {
								name: expectedAppName2
							}
						}
					},
					heroku: {
						apps: [{
							name: expectedAppName
						}, {
							name: expectedAppName2
						}]
					}
				},
				expectedChoices = [{
					choices: [{
						name: expectedAppName,
						value: {
							name: expectedAppName
						}
					}, {
						name: expectedAppName2,
						value: {
							name: expectedAppName2
						}
					}],
					message: 'Heroku App',
					name: 'heroku.app',
					type: 'list',
					validate: undefined,
					['default']: 1
				}],
				expectedAnswer = {
					heroku: {
						apps: expectedAppName
					}
				},
				expectedOutput = expectedInput;

			mocks.inquirer.prompt.resolves(expectedAnswer);

			// when - then
			return expect(heroku.selectApp(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.inquirer.prompt).to.have.been.calledWith(expectedChoices);
				});

		});

	});

});
