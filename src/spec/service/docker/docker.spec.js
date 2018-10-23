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

	docker = require('../../../lib/service/docker/docker'),

	expect = chai.expect;

chai.use(sinonChai);

describe('service/docker/docker', () => {

	beforeEach(() => {
		sinon.stub(shell, 'executeCommand');
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('displayLogs', () => {

		it('should handle no containers', async () => {

			// Given
			const
				expectedInput = {
					docker: {
						containers: []
					}
				},
				expectedOutput = {
					docker: {
						containers: []
					}
				};

			// When
			const output = await docker.displayLogs(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);

			expect(shell.executeCommand).to.not.have.been.called;

		});

		it('should handle one containers', async () => {

			// Given
			const
				expectedContainerId = '855da641126a',
				expectedInput = {
					docker: {
						containers: expectedContainerId
					}
				},
				expectedCommand = {
					args: ['logs', expectedContainerId],
					cmd: 'docker',
					opts: {
						logging: {
							finish: `Displayed logs for container: ${expectedContainerId}`,
							start: `Displaying logs for container: ${expectedContainerId}`
						},
						namespace: 'docker'
					}
				},
				expectedOutput = {
					docker: {
						container: expectedContainerId,
						containers: expectedContainerId
					}
				};

			shell.executeCommand.resolves(expectedContainerId);

			// When
			const output = await docker.displayLogs(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

		it('should handle multiple containers', async () => {

			// Given
			const
				expectedContainerId1 = '855da641126a',
				expectedContainerId2 = '6cd97630122b',
				expectedInput = {
					docker: {
						containers: [expectedContainerId1, expectedContainerId2]
					}
				},
				expectedCommands = [{
					args: ['logs', expectedContainerId1],
					cmd: 'docker',
					opts: {
						logging: {
							finish: `Displayed logs for container: ${expectedContainerId1}`,
							start: `Displaying logs for container: ${expectedContainerId1}`
						},
						namespace: 'docker'
					}
				}, {
					args: ['logs', expectedContainerId2],
					cmd: 'docker',
					opts: {
						logging: {
							finish: `Displayed logs for container: ${expectedContainerId2}`,
							start: `Displaying logs for container: ${expectedContainerId2}`
						},
						namespace: 'docker'
					}
				}],
				expectedOutput = {
					docker: {
						container: expectedContainerId2,
						containers: [expectedContainerId1, expectedContainerId2]
					}
				};

			shell.executeCommand
				.onFirstCall().resolves(expectedContainerId1)
				.onSecondCall().resolves(expectedContainerId2);

			// When
			const output = await docker.displayLogs(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledTwice;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommands[0], expectedInput);
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommands[1], expectedInput);

		});

	});

	describe('findContainersForImage', () => {

		it('should handle no containers for an image', async () => {

			// Given
			const
				expectedImageId = 'af9748170b0',
				expectedInput = {
					docker: {
						image: expectedImageId
					}
				},
				expectedCommand = {
					args: ['ps', '-aq', '--filter', `ancestor=${expectedImageId}`],
					cmd: 'docker',
					opts: {
						logging: {
							finish: `Found containers for image: ${expectedImageId}`,
							start: `Finding containers for image: ${expectedImageId}`
						},
						namespace: 'docker'
					}
				},
				expectedCommandOutput = {
					docker: {
						image: expectedImageId
					},
					lastcommand: {
						result: {
							stdout: ''
						}
					}
				},
				expectedOutput = {
					docker: {
						image: expectedImageId
					},
					lastcommand: {
						result: {
							stdout: ''
						}
					}
				};

			shell.executeCommand.resolves(expectedCommandOutput);

			// When
			const output = await docker.findContainersForImage(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

		it('should handle containers for an image', async () => {

			// Given
			const
				expectedImageId = 'af9748170b0',
				expectedInput = {
					docker: {
						image: expectedImageId
					}
				},
				expectedCommand = {
					args: ['ps', '-aq', '--filter', `ancestor=${expectedImageId}`],
					cmd: 'docker',
					opts: {
						logging: {
							finish: `Found containers for image: ${expectedImageId}`,
							start: `Finding containers for image: ${expectedImageId}`
						},
						namespace: 'docker'
					}
				},
				expectedCommandOutput = {
					docker: {
						image: expectedImageId
					},
					lastcommand: {
						result: {
							stdout: 'af9748170b7\n6cd97630122'
						}
					}
				},
				expectedOutput = {
					docker: {
						image: expectedImageId,
						containers: ['af9748170b7', '6cd97630122']
					},
					lastcommand: {
						result: {
							stdout: 'af9748170b7\n6cd97630122'
						}
					}
				};

			shell.executeCommand.resolves(expectedCommandOutput);

			// When
			const output = await docker.findContainersForImage(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

	});

	describe('findDanglingImages', () => {

		it('should handle no dangling images', async () => {

			// Given
			const
				expectedInput = {},
				expectedCommand = {
					args: ['images', '-f', 'dangling=true', '-q'],
					cmd: 'docker',
					opts: {
						logging: {
							finish: 'Found dangling images',
							start: 'Finding dangling images'
						},
						namespace: 'docker'
					}
				},
				expectedCommandOutput = {
					lastcommand: {
						result: {
							stdout: ''
						}
					}
				},
				expectedOutput = {
					lastcommand: {
						result: {
							stdout: ''
						}
					}
				};

			shell.executeCommand.resolves(expectedCommandOutput);

			// When
			const output = await docker.findDanglingImages(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

		it('should handle dangling images', async () => {

			// Given
			const
				expectedInput = {},
				expectedCommand = {
					args: ['images', '-f', 'dangling=true', '-q'],
					cmd: 'docker',
					opts: {
						logging: {
							finish: 'Found dangling images',
							start: 'Finding dangling images'
						},
						namespace: 'docker'
					}
				},
				expectedCommandOutput = {
					lastcommand: {
						result: {
							stdout: 'af9748170b7\n6cd97630122'
						}
					}
				},
				expectedOutput = {
					docker: {
						dangling: {
							images: ['af9748170b7', '6cd97630122']
						}
					},
					lastcommand: {
						result: {
							stdout: 'af9748170b7\n6cd97630122'
						}
					}
				};

			shell.executeCommand.resolves(expectedCommandOutput);

			// When
			const output = await docker.findDanglingImages(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

	});

	describe('listContainers', () => {

		it('should handle no containers', async () => {

			// Given
			const
				expectedInput = {},
				expectedCommand = {
					args: ['container', 'ls', '--format', '{{.Names}}'],
					cmd: 'docker',
					opts: {
						logging: {
							finish: 'Listed containers',
							start: 'Listing containers'
						},
						namespace: 'docker'
					}
				},
				expectedCommandOutput = {
					lastcommand: {
						result: {
							stdout: ''
						}
					}
				},
				expectedOutput = {
					lastcommand: {
						result: {
							stdout: ''
						}
					}
				};

			shell.executeCommand.resolves(expectedCommandOutput);

			// When
			const output = await docker.listContainers(true)(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

		it('should return only the running containers if the only running option is set', async () => {

			// Given
			const
				expectedInput = {},
				expectedCommand = {
					args: ['container', 'ls', '--format', '{{.Names}}'],
					cmd: 'docker',
					opts: {
						logging: {
							finish: 'Listed containers',
							start: 'Listing containers'
						},
						namespace: 'docker'
					}
				},
				expectedCommandOutput = {
					lastcommand: {
						result: {
							stdout: 'ffdc/test'
						}
					}
				},
				expectedOutput = {
					docker: {
						containers: ['ffdc/test']
					},
					lastcommand: {
						result: {
							stdout: 'ffdc/test'
						}
					}
				};

			shell.executeCommand.resolves(expectedCommandOutput);

			// When
			const output = await docker.listContainers(true)(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

		it('should return all containers if the only running option is not set', async () => {

			// Given
			const
				expectedInput = {},
				expectedCommand = {
					args: ['container', 'ls', '-a', '--format', '{{.Names}}'],
					cmd: 'docker',
					opts: {
						logging: {
							finish: 'Listed containers',
							start: 'Listing containers'
						},
						namespace: 'docker'
					}
				},
				expectedCommandOutput = {
					lastcommand: {
						result: {
							stdout: 'ffdc/test\nheroku'
						}
					}
				},
				expectedOutput = {
					docker: {
						containers: ['ffdc/test', 'heroku']
					},
					lastcommand: {
						result: {
							stdout: 'ffdc/test\nheroku'
						}
					}
				};

			shell.executeCommand.resolves(expectedCommandOutput);

			// When
			const output = await docker.listContainers(false)(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

	});

	describe('listImages', () => {

		it('should handle no images', async () => {

			// Given
			const
				expectedInput = {},
				expectedCommand = {
					args: ['images', 'ffdc/*', '--format', '{{.Repository}}'],
					cmd: 'docker',
					opts: {
						logging: {
							finish: 'Listed images',
							start: 'Listing images'
						},
						namespace: 'docker'
					}
				},
				expectedCommandOutput = {
					lastcommand: {
						result: {
							stdout: ''
						}
					}
				},
				expectedOutput = {
					lastcommand: {
						result: {
							stdout: ''
						}
					}
				};

			shell.executeCommand.resolves(expectedCommandOutput);

			// When
			const output = await docker.listImages(true)(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

		it('should return only the orizuru images with the only ffdc images option', async () => {

			// Given
			const
				expectedInput = {},
				expectedCommand = {
					args: ['images', 'ffdc/*', '--format', '{{.Repository}}'],
					cmd: 'docker',
					opts: {
						logging: {
							finish: 'Listed images',
							start: 'Listing images'
						},
						namespace: 'docker'
					}
				},
				expectedCommandOutput = {
					lastcommand: {
						result: {
							stdout: 'ffdc/test'
						}
					}
				},
				expectedOutput = {
					docker: {
						images: ['ffdc/test']
					},
					lastcommand: {
						result: {
							stdout: 'ffdc/test'
						}
					}
				};

			shell.executeCommand.resolves(expectedCommandOutput);

			// When
			const output = await docker.listImages(true)(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

		it('should return all images without the only ffdc Images option', async () => {

			// Given
			const
				expectedInput = {},
				expectedCommand = {
					args: ['images', '--format', '{{.Repository}}'],
					cmd: 'docker',
					opts: {
						logging: {
							finish: 'Listed images',
							start: 'Listing images'
						},
						namespace: 'docker'
					}
				},
				expectedCommandOutput = {
					lastcommand: {
						result: {
							stdout: 'ffdc/test\nheroku'
						}
					}
				},
				expectedOutput = {
					docker: {
						images: ['ffdc/test', 'heroku']
					},
					lastcommand: {
						result: {
							stdout: 'ffdc/test\nheroku'
						}
					}
				};

			shell.executeCommand.resolves(expectedCommandOutput);

			// When
			const output = await docker.listImages(false)(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

	});

	describe('removeContainers', () => {

		it('should handle no containers', async () => {

			// Given
			const
				expectedInput = {
					docker: {
						containers: []
					}
				},
				expectedOutput = {
					docker: {
						containers: []
					}
				};

			// When
			const output = await docker.removeContainers(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);

			expect(shell.executeCommand).to.not.have.been.called;

		});

		it('should handle one container', async () => {

			// Given
			const
				expectedContainerId = '855da641126a',
				expectedInput = {
					docker: {
						containers: [expectedContainerId]
					}
				},
				expectedCommand = {
					args: ['rm', expectedContainerId],
					cmd: 'docker',
					opts: {
						logging: {
							finish: `Removed container: ${expectedContainerId}`,
							start: `Removing container: ${expectedContainerId}`
						},
						namespace: 'docker'
					}
				},
				expectedCommandOutput = {
					lastcommand: {
						result: {
							stdout: expectedContainerId
						}
					}
				},
				expectedOutput = {
					docker: {
						container: expectedContainerId,
						containers: [expectedContainerId]
					}
				};

			shell.executeCommand.resolves(expectedCommandOutput);

			// When
			const output = await docker.removeContainers(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

		it('should handle multiple containers', async () => {

			// Given
			const
				expectedContainerId1 = '855da641126a',
				expectedContainerId2 = '6cd97630122b',
				expectedInput = {
					docker: {
						containers: [expectedContainerId1, expectedContainerId2]
					}
				},
				expectedCommands = [{
					args: ['rm', expectedContainerId1],
					cmd: 'docker',
					opts: {
						logging: {
							finish: `Removed container: ${expectedContainerId1}`,
							start: `Removing container: ${expectedContainerId1}`
						},
						namespace: 'docker'
					}
				}, {
					args: ['rm', expectedContainerId2],
					cmd: 'docker',
					opts: {
						logging: {
							finish: `Removed container: ${expectedContainerId2}`,
							start: `Removing container: ${expectedContainerId2}`
						},
						namespace: 'docker'
					}
				}],
				expectedCommandOutput = [{
					lastcommand: {
						result: {
							stdout: expectedContainerId1
						}
					}
				}, {
					lastcommand: {
						result: {
							stdout: expectedContainerId2
						}
					}
				}],
				expectedOutput = {
					docker: {
						container: expectedContainerId2,
						containers: [expectedContainerId1, expectedContainerId2]
					}
				};

			shell.executeCommand
				.onFirstCall().resolves(expectedCommandOutput[0])
				.onSecondCall().resolves(expectedCommandOutput[1]);

			// When
			const output = await docker.removeContainers(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledTwice;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommands[0], expectedInput);
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommands[1], expectedInput);

		});

	});

	describe('removeImages', () => {

		it('should handle no images', async () => {

			// Given
			const
				expectedInput = {
					docker: {
						images: []
					}
				},
				expectedOutput = {
					docker: {
						images: []
					}
				};

			// When
			const output = await docker.removeImages(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);

			expect(shell.executeCommand).to.not.have.been.called;

		});

		it('should handle one image', async () => {

			// Given
			const
				expectedImageId = '855da641126a',
				expectedInput = {
					docker: {
						images: [expectedImageId]
					}
				},
				expectedCommand = {
					args: ['rmi', expectedImageId],
					cmd: 'docker',
					opts: {
						logging: {
							finish: `Removed image: ${expectedImageId}`,
							start: `Removing image: ${expectedImageId}`
						},
						namespace: 'docker'
					}
				},
				expectedCommandOutput = {
					lastcommand: {
						result: {
							stdout: expectedImageId
						}
					}
				},
				expectedOutput = {
					docker: {
						image: expectedImageId,
						images: [expectedImageId]
					}
				};

			shell.executeCommand.resolves(expectedCommandOutput);

			// When
			const output = await docker.removeImages(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

		it('should handle multiple images', async () => {

			// Given
			const
				expectedImageId1 = '855da641126a',
				expectedImageId2 = '6cd97630122b',
				expectedInput = {
					docker: {
						images: [expectedImageId1, expectedImageId2]
					}
				},
				expectedCommands = [{
					args: ['rmi', expectedImageId1],
					cmd: 'docker',
					opts: {
						logging: {
							finish: `Removed image: ${expectedImageId1}`,
							start: `Removing image: ${expectedImageId1}`
						},
						namespace: 'docker'
					}
				}, {
					args: ['rmi', expectedImageId2],
					cmd: 'docker',
					opts: {
						logging: {
							finish: `Removed image: ${expectedImageId2}`,
							start: `Removing image: ${expectedImageId2}`
						},
						namespace: 'docker'
					}
				}],
				expectedCommandOutput = [{
					lastcommand: {
						result: {
							stdout: expectedImageId1
						}
					}
				}, {
					lastcommand: {
						result: {
							stdout: expectedImageId2
						}
					}
				}],
				expectedOutput = {
					docker: {
						image: expectedImageId2,
						images: [expectedImageId1, expectedImageId2]
					}
				};

			shell.executeCommand
				.onFirstCall().resolves(expectedCommandOutput[0])
				.onSecondCall().resolves(expectedCommandOutput[1]);

			// When
			const output = await docker.removeImages(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledTwice;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommands[0], expectedInput);
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommands[1], expectedInput);

		});

	});

	describe('removeDanglingImages', () => {

		it('should handle no dangling images', async () => {

			// Given
			const
				expectedInput = {},
				expectedCommandOutput = {
					lastcommand: {
						result: {
							stdout: ''
						}
					}
				},
				expectedOutput = expectedCommandOutput;

			shell.executeCommand.resolves(expectedCommandOutput);

			// When
			const output = await docker.removeDanglingImages(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);

			expect(shell.executeCommand).to.have.been.calledOnce;

		});

		it('should remove a single dangling image', async () => {

			// Given
			const
				expectedImageId = '855da6411260',
				expectedContainerId = 'b55da6411260',
				expectedInput = {},
				expectedCommandOutput = [{
					lastcommand: {
						result: {
							stdout: expectedImageId
						}
					}
				}, {
					lastcommand: {
						result: {
							stdout: expectedContainerId
						}
					}
				}],
				expectedOutput = {
					docker: {
						dangling: {
							images: [
								expectedImageId
							]
						},
						image: expectedImageId
					},
					lastcommand: {
						result: {
							stdout: expectedImageId
						}
					}
				};

			shell.executeCommand
				.onCall(0).resolves(expectedCommandOutput[0])
				.onCall(1).resolves(expectedCommandOutput[1])
				.onCall(2).resolves(expectedCommandOutput[1])
				.onCall(3).resolves(expectedCommandOutput[1])
				.onCall(4).resolves(expectedCommandOutput[0]);

			// When
			const output = await docker.removeDanglingImages(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.callCount(5);

		});

	});

	describe('stopContainers', () => {

		it('should handle no containers', async () => {

			// Given
			const
				expectedInput = {
					docker: {
						containers: []
					}
				},
				expectedOutput = {
					docker: {
						containers: []
					}
				};

			// When
			const output = await docker.stopContainers(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);

			expect(shell.executeCommand).to.not.have.been.called;

		});

		it('should handle one containers', async () => {

			// Given
			const
				expectedContainerId = '855da641126a',
				expectedInput = {
					docker: {
						containers: expectedContainerId
					}
				},
				expectedCommand = {
					args: ['stop', expectedContainerId],
					cmd: 'docker',
					opts: {
						logging: {
							finish: `Stopped container: ${expectedContainerId}`,
							start: `Stopping container: ${expectedContainerId}`
						},
						namespace: 'docker'
					}
				},
				expectedOutput = {
					docker: {
						container: expectedContainerId,
						containers: expectedContainerId
					}
				};

			shell.executeCommand.resolves(expectedContainerId);

			// When
			const output = await docker.stopContainers(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledOnce;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);

		});

		it('should handle multiple containers', async () => {

			// Given
			const
				expectedContainerId1 = '855da641126a',
				expectedContainerId2 = '6cd97630122b',
				expectedInput = {
					docker: {
						containers: [expectedContainerId1, expectedContainerId2]
					}
				},
				expectedCommands = [{
					args: ['stop', expectedContainerId1],
					cmd: 'docker',
					opts: {
						logging: {
							finish: `Stopped container: ${expectedContainerId1}`,
							start: `Stopping container: ${expectedContainerId1}`
						},
						namespace: 'docker'
					}
				}, {
					args: ['stop', expectedContainerId2],
					cmd: 'docker',
					opts: {
						logging: {
							finish: `Stopped container: ${expectedContainerId2}`,
							start: `Stopping container: ${expectedContainerId2}`
						},
						namespace: 'docker'
					}
				}],
				expectedOutput = {
					docker: {
						container: expectedContainerId2,
						containers: [expectedContainerId1, expectedContainerId2]
					}
				};

			shell.executeCommand
				.onFirstCall().resolves(expectedContainerId1)
				.onSecondCall().resolves(expectedContainerId2);

			// When
			const output = await docker.stopContainers(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(shell.executeCommand).to.have.been.calledTwice;
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommands[0], expectedInput);
			expect(shell.executeCommand).to.have.been.calledWith(expectedCommands[1], expectedInput);

		});

	});

});
