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
	inquirer = require('inquirer'),
	jsforce = require('jsforce'),

	config = require('../../../lib/service/deploy/shared/config'),

	logger = require('../../../lib/util/logger'),
	shell = require('../../../lib/util/shell'),

	sfdx = require('../../../lib/service/deploy/sfdx.js'),

	expect = chai.expect;

chai.use(sinonChai);

describe('service/deploy/sfdx.js', () => {

	let connectionStub;

	beforeEach(() => {

		sinon.stub(config, 'writeSetting');

		connectionStub = sinon.createStubInstance(jsforce.Connection);
		sinon.stub(jsforce, 'Connection').returns(connectionStub);

		sinon.stub(inquirer, 'prompt');

		sinon.stub(shell, 'executeCommand');
		sinon.stub(shell, 'executeCommands');

		sinon.stub(fs, 'outputFile');
		sinon.stub(fs, 'outputJsonSync');
		sinon.stub(fs, 'readFile');
		sinon.stub(fs, 'readFileSync');
		sinon.stub(fs, 'writeJson');

		sinon.stub(logger, 'logEvent').returns(sinon.stub());

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('checkSfdxInstalled', () => {

		it('should check that SFDX is installed', async () => {

			// Given
			const expectedCommand = { cmd: 'sfdx', args: ['version'] };

			shell.executeCommand.resolves('sfdx-cli/6.0.13-a52f73c (darwin-x64) node-v8.6.0');

			// When
			const output = await sfdx.checkSfdxInstalled({});

			// Then
			expect(output).to.eql({});
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand);

		});

	});

	describe('checkSfdxFolderExists', () => {

		it('should return the config if the folder exists', async () => {

			// Given
			const
				expectedInput = 'test',
				expectedCommand = { cmd: 'cd', args: ['.sfdx'] };

			shell.executeCommand.resolves();

			// When
			const output = await sfdx.checkSfdxFolderExists(expectedInput);

			// Then
			expect(output).to.eql(expectedInput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand);

		});

		it('should call the login function if the folder does not exist', async () => {

			// Given
			const
				expectedUsername = 'test@financialforce.com',
				expectedInput = {},
				expectedCommand1 = { cmd: 'cd', args: ['.sfdx'] },
				expectedCommand2 = { cmd: 'sfdx', args: ['force:auth:web:login', '-s', '--json'] },
				expectedLoginResult = { stdout: `{"status":0,"result":{"orgId":"orgId","accessToken":"token","refreshToken":"refreshToken","instanceUrl":"https://eu9.salesforce.com","loginUrl":"https://login.salesforce.com","username":"${expectedUsername}","clientId":"SalesforceDevelopmentExperience","clientSecret":"clientSecret"}}` },
				expectedOutput = {
					sfdx: {
						hub: {
							username: expectedUsername
						}
					}
				};

			shell.executeCommand.onCall(0).rejects();
			shell.executeCommand.onCall(1).resolves(expectedLoginResult);
			config.writeSetting.resolves(expectedOutput);

			// When
			const output = await sfdx.checkSfdxFolderExists(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledTwice;
			expect(config.writeSetting).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand1);
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand2);
			expect(config.writeSetting).to.have.been.calledWith(expectedOutput, 'sfdx.hub.username', expectedUsername);

		});

	});

	describe('checkSfdxProjectFileExists', () => {

		it('should return the config if the folder exists', async () => {

			// Given
			const
				expectedInput = 'test',
				expectedCommand = { cmd: 'cat', args: ['sfdx-project.json'] };

			shell.executeCommand.resolves();

			// When
			const output = await sfdx.checkSfdxProjectFileExists(expectedInput);

			// Then
			expect(output).to.eql(expectedInput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand);

		});

		it('should ask the user if they want to create the default file if it doesn\'t exist (user confirms)', async () => {

			// Given
			const
				expectedInput = {},
				expectedCommand = { cmd: 'cat', args: ['sfdx-project.json'] };

			inquirer.prompt.resolves({ create: true });
			shell.executeCommand.rejects();
			fs.writeJson.resolves();

			// When
			const output = await sfdx.checkSfdxProjectFileExists(expectedInput);

			// Then
			expect(output).to.eql(expectedInput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand);

		});

		it('should ask the user if they want to create the default file if it doesn\'t exist (user rejects)', async () => {

			// Given
			const
				expectedInput = {},
				expectedCommand = { cmd: 'cat', args: ['sfdx-project.json'] };

			inquirer.prompt.resolves({ create: false });
			shell.executeCommand.rejects();
			fs.writeJson.resolves();

			// When
			await expect(sfdx.checkSfdxProjectFileExists(expectedInput)).to.be.rejected;

			// Then
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand);

		});

	});

	describe('createNewScratchOrg', () => {

		it('should create the default scratch org definition file if it does nto exist', async () => {

			// Given
			const
				expectedUsername = 'test-ki9yknei6emv@orizuru.net',
				expectedHubUsername = 'dev-hub@orizuru.net',
				expectedOrgDef = './src/apex/config/project-scratch-def.json',
				expectedInput = {
					orizuru: {
						sfdx: {
							hub: {
								username: expectedHubUsername
							}
						}
					}
				},
				expectedCommand = { cmd: 'sfdx', args: ['force:org:create', '-f', expectedOrgDef, '-v', expectedHubUsername, '-s', '--json'] },
				expectedOutput = {
					sfdx: {
						org: {
							username: expectedUsername
						}
					}
				};

			shell.executeCommand.resolves({
				stdout: `{"result":{"username":"${expectedUsername}"}}`
			});

			// When
			const output = await sfdx.createNewScratchOrg(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(fs.outputJsonSync).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand);

		});

		it('should create a new scratch org', async () => {

			// Given
			const
				expectedUsername = 'test-ki9yknei6emv@orizuru.net',
				expectedHubUsername = 'dev-hub@orizuru.net',
				expectedOrgDef = 'src/apex/config/project-scratch-def.json',
				expectedInput = {
					orizuru: {
						sfdx: {
							hub: {
								username: expectedHubUsername
							}
						}
					},
					sfdx: {
						yaml: {
							['scratch-org-def']: expectedOrgDef
						}
					}
				},
				expectedCommand = { cmd: 'sfdx', args: ['force:org:create', '-f', expectedOrgDef, '-v', expectedHubUsername, '-s', '--json'] },
				expectedOutput = {
					sfdx: {
						org: {
							username: expectedUsername
						}
					}
				};

			shell.executeCommand.resolves({
				stdout: `{"result":{"username":"${expectedUsername}"}}`
			});

			// When
			const output = await sfdx.createNewScratchOrg(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand);

		});

	});

	describe('deleteAllScratchOrgs', () => {

		it('should execute the correct commands', async () => {

			// Given
			shell.executeCommand = sinon.stub().resolves({ stdout: '{"result":{"scratchOrgs":[{"username":"test-0wygrz0l4fyt@orizuru.net"}]}}' });
			shell.executeCommands = sinon.stub().resolves({});

			// When
			const output = await sfdx.deleteAllScratchOrgs({});

			// Then
			expect(output).to.eql({});
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommands).to.have.been.calledOnce;

		});

	});

	describe('deploy', () => {

		it('should execute the correct commands', async () => {

			// Given
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

			shell.executeCommands.resolves({
				command0: { stdout: '{"command0Out":"testing"}' },
				command1: { stdout: '{"command1Out":"testing"}' },
				command2: { stdout: '{"command2Out":"testing"}' },
				command3: { stdout: '{"command3Out":"testing"}' }
			});

			// When
			const output = await sfdx.deploy(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommands).to.have.been.calledWith(expectedCommands, { exitOnError: true });

		});

	});

	describe('display', () => {

		it('should execute the correct commands', async () => {

			// Given
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

			shell.executeCommand.resolves({ stdout: '{"result":{"accessToken":"00Dd0000004aIWe!ARoAQMU1KjrCMZVbSxrPd8xQe5vxktUdTWllFWKM5C05KsVT817.uKkVQZdVm4xC22rknAb5G0SdBp4GsKfWBXcZsUFv_PFa","instanceUrl":"https://random-velocity-3672-dev-ed.cs16.my.salesforce.com"}}' });

			// When
			const output = await sfdx.display(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand);

		});

	});

	describe('getAllScratchOrgs', () => {

		it('should execute the correct commands', async () => {

			// Given
			const
				expectedCommand = { cmd: 'sfdx', args: ['force:org:list', '--json'] },
				expectedOutput = {
					sfdx: {
						scratchOrgs: [{
							username: 'test-0wygrz0l4fyt@orizuru.net'
						}]
					}
				};

			shell.executeCommand.resolves({ stdout: '{"result":{"scratchOrgs":[{"username":"test-0wygrz0l4fyt@orizuru.net"}]}}' });

			// When
			const output = await sfdx.getAllScratchOrgs({});

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand);

		});

	});

	describe('getInstalledPackageList', () => {

		it('should execute the correct commands', async () => {

			// Given
			const
				input = {
					orizuru: {
						sfdx: {
							org: {
								username: 'testUsername'
							}
						}
					}
				},
				expectedCommand = { cmd: 'sfdx', args: ['force:package:installed:list', '-u', 'testUsername', '--json'] },
				expectedOutput = {
					orizuru: {
						sfdx: {
							org: {
								username: 'testUsername'
							}
						}
					},
					sfdx: {
						org: {
							installedPackageVersionIds: [
								'testSubscriberPackageVersionId'
							],
							installedPackages: [
								{
									Id: 'testId',
									SubscriberPackageVersionId: 'testSubscriberPackageVersionId'
								}
							],
							username: 'testUsername'
						}
					}
				};

			shell.executeCommand.resolves({ stdout: '{"status": 0,"result": [{"Id": "testId","SubscriberPackageVersionId": "testSubscriberPackageVersionId"}]}' });

			// When
			const output = await sfdx.getInstalledPackageList(input);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand);

		});

	});

	describe('installPackages', () => {

		it('should ignore any packages that have been installed in the org already', async () => {

			// Given
			const
				input = {
					orizuru: {
						sfdx: {
							org: {
								username: 'testUsername'
							}
						}
					},
					sfdx: {
						org: {
							installedPackageVersionIds: [
								'testPackageId'
							],
							packagesToInstall: {
								testPackageId: 'testPackageName'
							}
						}
					}
				},
				expectedOutput = {
					orizuru: {
						sfdx: {
							org: {
								username: 'testUsername'
							}
						}
					},
					sfdx: {
						org: {
							installedPackageVersionIds: [
								'testPackageId'
							],
							packagesToInstall: {
								testPackageId: 'testPackageName'
							}
						}
					}
				};

			shell.executeCommands.resolves();

			// When
			const output = await sfdx.installPackages(input);

			// Then
			expect(output).to.eql(expectedOutput);

			expect(shell.executeCommands).to.not.have.been.called;

		});

		it('should install any packages that have not been installed in the org already', async () => {

			// Given
			const
				input = {
					orizuru: {
						sfdx: {
							org: {
								username: 'testUsername'
							}
						}
					},
					sfdx: {
						org: {
							packagesToInstall: {
								testPackageId: 'testPackageName'
							}
						}
					}
				},
				expectedCommands = [{
					cmd: 'sfdx',
					args: ['force:package:install', '-p', 'testPackageId', '-u', 'testUsername', '-r', '-w', '100', '--json'],
					opts: {
						logging: {
							finish: 'Installed package testPackageId',
							start: 'Installing package testPackageId'
						}
					}
				}],
				expectedOutput = {
					orizuru: {
						sfdx: {
							org: {
								username: 'testUsername'
							}
						}
					},
					sfdx: {
						org: {
							packagesToInstall: {
								testPackageId: 'testPackageName'
							}
						}
					}
				};

			shell.executeCommands.resolves();

			// When
			const output = await sfdx.installPackages(input);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommands).to.have.been.calledWith(expectedCommands);

		});

	});

	describe('login', () => {

		it('should login to the SFDX dev hub', async () => {

			// Given
			const
				expectedUsername = 'test@financialforce.com',
				expectedCommand = { cmd: 'sfdx', args: ['force:auth:web:login', '-s', '--json'] },
				expectedLoginResult = { stdout: `{"status":0,"result":{"orgId":"orgId","accessToken":"token","refreshToken":"refreshToken","instanceUrl":"https://eu9.salesforce.com","loginUrl":"https://login.salesforce.com","username":"${expectedUsername}","clientId":"SalesforceDevelopmentExperience","clientSecret":"clientSecret"}}` },
				expectedOutput = {
					sfdx: {
						hub: {
							username: expectedUsername
						}
					}
				};

			config.writeSetting.resolves(expectedOutput);
			shell.executeCommand.resolves(expectedLoginResult);

			// When
			const output = await sfdx.login({});

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(config.writeSetting).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand);
			expect(config.writeSetting).to.have.been.calledWith(expectedOutput, 'sfdx.hub.username', expectedUsername);

		});

		it('should use the Orizuru config file to get the dev hub if the file exists', async () => {

			// Given
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

			shell.executeCommand = sinon.stub();

			// When
			const output = await sfdx.login(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.not.have.been.called;

		});

	});

	describe('openOrg', () => {

		it('should execute the correct commands', async () => {

			// Given
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
				expectedCommand = { cmd: 'sfdx', args: ['force:org:open', '-u', 'test@financialforce.com'] },
				expectedOutput = {};

			shell.executeCommand.resolves({});

			// When
			const output = await sfdx.openOrg(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand);

		});

	});

	describe('readSfdxYaml', () => {

		it('should create the default yaml file if it is not found', async () => {

			// Given
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

			fs.readFile.rejects();
			fs.outputFile.resolves();

			// When
			const output = await sfdx.readSfdxYaml({});

			// Then
			expect(output).to.eql(expectedOutput);

		});

		it('should execute the correct commands', async () => {

			// Given
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

			fs.readFile.resolves('scratch-org-def: src/apex/config/project-scratch-def.json\nassign-permset: true\npermset-name: OrizuruAdmin\nrun-apex-tests: true\ndelete-scratch-org: false\nshow-scratch-org-url: true\n');

			// When
			const output = await sfdx.readSfdxYaml({});

			// Then
			expect(output).to.eql(expectedOutput);

		});

	});

	describe('select', () => {

		it('should prompt the user to select the SFDX scratch org application without a new app option', async () => {

			// Given
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
					message: 'Select SFDX Scratch Org',
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

			inquirer.prompt.resolves(expectedAnswer);
			config.writeSetting.resolves(expectedOutput);

			// When
			const output = await sfdx.select(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(inquirer.prompt).to.have.been.calledWith(expectedChoices);

		});

		it('should prompt the user to select the SFDX scratch org application with a new app option', async () => {

			// Given
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
					message: 'Select SFDX Scratch Org',
					name: 'sfdx.org',
					type: 'list',
					['default']: 0,
					validate: undefined
				}],
				expectedAnswer = {
					sfdx: {
						org: {
							username: expectedScratchOrgUsername
						}
					}
				},
				expectedOutput = expectedInput;

			config.writeSetting.resolves(expectedOutput);
			inquirer.prompt.resolves(expectedAnswer);

			// When
			const output = await sfdx.select(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(inquirer.prompt).to.have.been.calledWith(expectedChoices);
			expect(config.writeSetting).to.have.been.calledWith(expectedOutput, 'sfdx.org.username', expectedScratchOrgUsername);

		});

		it('should prompt the user to select the SFDX scratch org with a new app option and create a new app if that option is chosen', async () => {

			// Given
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
					message: 'Select SFDX Scratch Org',
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

			inquirer.prompt.resolves(expectedAnswer);
			shell.executeCommand.resolves({ stdout: '{"result": {"username": "test" }}' });
			config.writeSetting.resolves(expectedOutput);

			// When
			const output = await sfdx.select(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(inquirer.prompt).to.have.been.calledWith(expectedChoices);
			expect(shell.executeCommand).to.have.been.calledOnce;

		});

		it('should default to the SFDX org provided in the Orizuru config', async () => {

			// Given
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
					message: 'Select SFDX Scratch Org',
					name: 'sfdx.org',
					type: 'list',
					['default']: 1,
					validate: undefined
				}],
				expectedAnswer = {
					sfdx: {
						org: expectedScratchOrgUsername
					}
				},
				expectedOutput = expectedInput;

			inquirer.prompt.resolves(expectedAnswer);
			config.writeSetting.resolves(expectedOutput);

			// When
			const output = await sfdx.select(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(inquirer.prompt).to.have.been.calledWith(expectedChoices);

		});

	});

});
