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

	logger = require(root + '/src/lib/util/logger'),

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/deploy/sfdx.js', () => {

	let mocks, sfdx;

	beforeEach(() => {

		mocks = {};

		mocks.config = sandbox.stub();
		mocks.config.writeSetting = sandbox.stub();

		mocks.inquirer = {};
		mocks.inquirer.prompt = sandbox.stub();

		mocks.jsforce = {};
		mocks.jsforce.Connection = sandbox.stub();

		mocks.shell = {};

		sandbox.stub(logger, 'logEvent').resolves();

		sfdx = proxyquire(root + '/src/lib/service/deploy/sfdx.js', {
			inquirer: mocks.inquirer,
			'./shared/config': mocks.config,
			'./shared/shell': mocks.shell
		});

	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('checkSfdxInstalled', () => {

		it('should check that SFDX is installed', () => {

			// given
			const expectedCommand = { cmd: 'sfdx', args: ['version'], opts: { exitOnError: true } };

			mocks.shell.executeCommand = sandbox.stub().resolves('sfdx-cli/6.0.13-a52f73c (darwin-x64) node-v8.6.0');

			// when - then
			return expect(sfdx.checkSfdxInstalled({}))
				.to.eventually.eql({})
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand);
				});

		});

	});

	describe('createNewScratchOrg', () => {

		it('should create a new scratch org', () => {

			// given
			const
				expectedUsername = 'test-ki9yknei6emv@orizuru.net',
				expectedHubUsername = 'dev-hub@orizuru.net',
				expectedOrgDef = 'src/apex/config/project-scratch-def.json',
				expectedAlias = 'alias',
				expectedInput = {
					orizuru: {
						sfdx: {
							hub: {
								username: expectedHubUsername
							}
						},
						heroku: {
							app: {
								name: expectedAlias
							}
						}
					},
					sfdx: {
						yaml: {
							['scratch-org-def']: expectedOrgDef
						}
					}
				},
				expectedCommand = { cmd: 'sfdx', args: ['force:org:create', '-f', expectedOrgDef, '-v', expectedHubUsername, '-a', expectedAlias, '-s', '--json'], opts: { exitOnError: true } },
				expectedOutput = {
					sfdx: {
						org: {
							username: expectedUsername
						}
					}
				};

			mocks.shell.executeCommand = sandbox.stub().resolves({
				stdout: `{"result":{"username":"${expectedUsername}"}}`
			});

			// when - then
			return expect(sfdx.createNewScratchOrg(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand);
				});

		});

	});

	describe('deploy', () => {

		it('should execute the correct commands', () => {

			// given
			const
				expectedUsername = 'test',
				expectedPermset = 'OrizuruAdmin',
				expectedCommands = [
					{ cmd: 'sfdx', args: ['force:source:push', '-u', expectedUsername], opts: { namespace: 'deploy' } },
					{ cmd: 'sfdx', args: ['force:user:permset:assign', '-n', expectedPermset, '-u', expectedUsername] },
					{ cmd: 'sfdx', args: ['force:org:display', '-u', expectedUsername, '--json'] }
				],
				expectedInput = {
					parameters: {
						sfdx: {
							org: {
								username: expectedUsername
							}
						}
					},
					sfdx: {
						yaml: {
							['permset-name']: expectedPermset
						}
					}
				},
				expectedOutput = {
					parameters: expectedInput.parameters,
					sfdx: expectedInput.sfdx,
					connectionInfo: undefined,
					sfdxResults: {
						command0: {
							stdout: '{"command0Out":"testing"}'
						},
						command1: {
							stdout: '{"command1Out":"testing"}'
						},
						command2: {
							stdout: '{"command2Out":"testing"}'
						},
						command3: {
							stdout: '{"command3Out":"testing"}'
						}
					}
				};

			mocks.shell.executeCommands = sandbox.stub().resolves({
				command0: { stdout: '{"command0Out":"testing"}' },
				command1: { stdout: '{"command1Out":"testing"}' },
				command2: { stdout: '{"command2Out":"testing"}' },
				command3: { stdout: '{"command3Out":"testing"}' }
			});

			// when - then
			return expect(sfdx.deploy(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedCommands, { exitOnError: true });
				});

		});

	});

	describe('getAllScratchOrgs', () => {

		it('should execute the correct commands', () => {

			// given
			const
				expectedCommand = { cmd: 'sfdx', args: ['force:org:list', '--json'] },
				expectedOutput = {
					sfdx: {
						scratchOrgs: [{
							username: 'test-0wygrz0l4fyt@orizuru.net'
						}]
					}
				};

			mocks.shell.executeCommand = sandbox.stub().resolves({ stdout: '{"result":{"scratchOrgs":[{"username":"test-0wygrz0l4fyt@orizuru.net"}]}}' });

			// when - then
			return expect(sfdx.getAllScratchOrgs({}))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand);
				});

		});

	});

	describe('getConnectionDetails', () => {

		it('should execute the correct commands', () => {

			// given
			const
				expectedScratchOrgUsername = 'testUsername',
				expectedInput = {
					parameters: {
						sfdx: {
							org: {
								username: expectedScratchOrgUsername
							}
						}
					}
				},
				expectedCommand = { cmd: 'sfdx', args: ['force:org:display', '-u', 'testUsername', '--json'] },
				expectedOutput = {
					parameters: {
						sfdx: {
							org: {
								credentials: {
									accessToken: '00Dd0000004aIWe!ARoAQMU1KjrCMZVbSxrPd8xQe5vxktUdTWllFWKM5C05KsVT817.uKkVQZdVm4xC22rknAb5G0SdBp4GsKfWBXcZsUFv_PFa',
									instanceUrl: 'https://random-velocity-3672-dev-ed.cs16.my.salesforce.com'
								},
								username: expectedScratchOrgUsername
							}
						}
					}
				};

			mocks.shell.executeCommand = sandbox.stub().resolves({ stdout: '{"result":{"accessToken":"00Dd0000004aIWe!ARoAQMU1KjrCMZVbSxrPd8xQe5vxktUdTWllFWKM5C05KsVT817.uKkVQZdVm4xC22rknAb5G0SdBp4GsKfWBXcZsUFv_PFa","instanceUrl":"https://random-velocity-3672-dev-ed.cs16.my.salesforce.com"}}' });

			// when - then
			return expect(sfdx.getConnectionDetails(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand);
				});

		});

	});

	describe('login', () => {

		it('should login to the SFDX dev hub', () => {

			// given
			const
				expectedCommand = { cmd: 'sfdx', args: ['force:auth:web:login', '-s', '--json'], opts: { exitOnError: true } },
				expectedOutput = {
					sfdx: {
						hub: {
							username: 'test@financialforce.com'
						}
					}
				};

			mocks.shell.executeCommand = sandbox.stub().resolves({ stdout: '{"result":{"username":"test@financialforce.com"}}' });

			// when - then
			return expect(sfdx.login({}))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand);
				});

		});

		it('should use the Orizuru config file to get the dev hub if the file exists', () => {

			// given
			const
				expectedInput = {
					orizuru: {
						sfdx: {
							hub: {
								username: 'test@financialforce.com'
							}
						}
					}
				},
				expectedOutput = {
					orizuru: {
						sfdx: {
							hub: {
								username: 'test@financialforce.com'
							}
						}
					},
					sfdx: {
						hub: 'test@financialforce.com'
					}
				};

			mocks.shell.executeCommand = sandbox.stub();

			// when - then
			return expect(sfdx.login(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.not.have.been.called;
				});

		});

	});

	describe('openOrg', () => {

		it('should execute the correct commands', () => {

			// given
			const
				expectedInput = {
					parameters: {
						sfdx: {
							org: {
								username: 'test@financialforce.com'
							}
						}
					}
				},
				expectedCommands = [
					{ cmd: 'sfdx', args: ['force:org:open', '-u', 'test@financialforce.com'] }
				],
				expectedOutput = {};

			mocks.shell.executeCommands = sandbox.stub().resolves({});

			// when - then
			return expect(sfdx.openOrg(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedCommands);
				});

		});

	});

	describe('readSfdxYaml', () => {

		it('should execute the correct commands', () => {

			// given
			const expectedOutput = {
				sfdx: {
					yaml: {
						'scratch-org-def': 'src/apex/config/project-scratch-def.json',
						'assign-permset': true,
						'permset-name': 'OrizuruAdmin',
						'run-apex-tests': true,
						'delete-scratch-org': false,
						'show-scratch-org-url': true
					}
				}
			};

			sandbox.stub(fs, 'readFileSync').returns('scratch-org-def: src/apex/config/project-scratch-def.json\nassign-permset: true\npermset-name: OrizuruAdmin\nrun-apex-tests: true\ndelete-scratch-org: false\nshow-scratch-org-url: true\n');

			// when - then
			return expect(sfdx.readSfdxYaml({})).to.eql(expectedOutput);

		});

	});

	describe('selectApp', () => {

		it('should prompt the user to select the SFDX scratch org application without a new app option', () => {

			// given
			const
				expectedScratchOrgUsername = 'testUsername',
				expectedInput = {
					sfdx: {
						scratchOrgs: [{
							username: expectedScratchOrgUsername
						}]
					}
				},
				expectedChoices = [{
					choices: [{ name: 'testUsername', value: { username: 'testUsername' } }],
					message: 'SFDX Scratch Org',
					name: 'sfdx.org',
					type: 'list',
					['default']: 0,
					validate: undefined
				}],
				expectedAnswer = {
					sfdx: {
						org: expectedScratchOrgUsername
					}
				},
				expectedOutput = expectedInput;

			mocks.inquirer.prompt.resolves(expectedAnswer);

			// when - then
			return expect(sfdx.selectApp(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.inquirer.prompt).to.have.been.calledWith(expectedChoices);
				});

		});

		it('should prompt the user to select the SFDX scratch org application with a new app option', () => {

			// given
			const
				expectedScratchOrgUsername = 'testUsername',
				expectedInput = {
					options: {
						includeNew: {
							sfdx: true
						}
					},
					sfdx: {
						scratchOrgs: [{
							username: expectedScratchOrgUsername
						}]
					}
				},
				expectedChoices = [{
					choices: [
						{ name: 'testUsername', value: { username: 'testUsername' } },
						'<<Create new SFDX scratch org>>'
					],
					message: 'SFDX Scratch Org',
					name: 'sfdx.org',
					type: 'list',
					['default']: 0,
					validate: undefined
				}],
				expectedAnswer = {
					sfdx: {
						org: expectedScratchOrgUsername
					}
				},
				expectedOutput = expectedInput;

			mocks.inquirer.prompt.resolves(expectedAnswer);

			// when - then
			return expect(sfdx.selectApp(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.inquirer.prompt).to.have.been.calledWith(expectedChoices);
				});

		});

		it('should prompt the user to select the SFDX scratch org with a new app option and create a new app if that option is chosen', () => {

			// given
			const
				expectedScratchOrgUsername = 'testUsername',
				expectedHubUsername = 'dev-hub@orizuru.net',
				expectedOrgDef = 'src/apex/config/project-scratch-def.json',
				expectedInput = {
					options: {
						includeNew: {
							sfdx: true
						}
					},
					orizuru: {
						sfdx: {
							hub: {
								username: expectedHubUsername
							}
						},
						heroku: {
							app: {
								name: 'test'
							}
						}
					},
					sfdx: {
						scratchOrgs: [{
							username: expectedScratchOrgUsername
						}],
						yaml: {
							['scratch-org-def']: expectedOrgDef
						}
					}
				},
				expectedChoices = [{
					choices: [{
						name: expectedScratchOrgUsername,
						value: {
							username: expectedScratchOrgUsername
						}
					}, '<<Create new SFDX scratch org>>'],
					message: 'SFDX Scratch Org',
					name: 'sfdx.org',
					type: 'list',
					['default']: 0,
					validate: undefined
				}],
				expectedAnswer = {
					sfdx: {
						org: '<<Create new SFDX scratch org>>'
					}
				},
				expectedOutput = expectedInput;

			mocks.inquirer.prompt.resolves(expectedAnswer);
			mocks.shell.executeCommand = sandbox.stub().resolves({ stdout: '{}' });

			// when - then
			return expect(sfdx.selectApp(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.inquirer.prompt).to.have.been.calledWith(expectedChoices);
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
				});

		});

		it('should default to the SFDX org provided in the Orizuru config', () => {

			// given
			const
				expectedScratchOrgUsername = 'testUsername1',
				expectedScratchOrgUsername2 = 'testUsername2',
				expectedHubUsername = 'dev-hub@orizuru.net',
				expectedOrgDef = 'src/apex/config/project-scratch-def.json',
				expectedInput = {
					options: {
						includeNew: {
							sfdx: true
						}
					},
					orizuru: {
						sfdx: {
							hub: {
								username: expectedHubUsername
							},
							org: {
								username: expectedScratchOrgUsername2
							}
						}
					},
					sfdx: {
						scratchOrgs: [{
							username: expectedScratchOrgUsername
						}, {
							username: expectedScratchOrgUsername2
						}],
						yaml: {
							['scratch-org-def']: expectedOrgDef
						}
					}
				},
				expectedChoices = [{
					choices: [{
						name: expectedScratchOrgUsername,
						value: {
							username: expectedScratchOrgUsername
						}
					}, {
						name: expectedScratchOrgUsername2,
						value: {
							username: expectedScratchOrgUsername2
						}
					}, '<<Create new SFDX scratch org>>'],
					message: 'SFDX Scratch Org',
					name: 'sfdx.org',
					type: 'list',
					['default']: 1,
					validate: undefined
				}],
				expectedAnswer = {
					sfdx: {
						org: '<<Create new SFDX scratch org>>'
					}
				},
				expectedOutput = expectedInput;

			mocks.inquirer.prompt.resolves(expectedAnswer);
			mocks.shell.executeCommand = sandbox.stub().resolves({ stdout: '{}' });

			// when - then
			return expect(sfdx.selectApp(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.inquirer.prompt).to.have.been.calledWith(expectedChoices);
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
				});

		});

	});

});
