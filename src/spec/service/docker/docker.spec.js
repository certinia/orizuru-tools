/*
 * Copyright (c) 2017 FinancialForce.com, inc.  All rights reserved.
 *
 * This is a proof of concept.
 * It forms the basis of recommendations for architecture, patterns, dependencies, and has
 * some of the characteristics which will eventually be present in FF hybrid apps.
 *
 * However, it lacks important functionality and checks.
 * It does not conform to SOC1 or any other auditable process.
 *
 * We do not endorse any attempt to use this codebase as the blueprint for production code.
 */
'use strict';

const
	chai = require('chai'),
	chaiAsPromised = require('chai-as-promised'),
	proxyquire = require('proxyquire'),
	root = require('app-root-path'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/docker/docker', () => {

	let docker, mocks;

	beforeEach(() => {

		mocks = {};
		mocks.shell = sandbox.stub();
		mocks.shell.executeCommand = sandbox.stub();

		docker = proxyquire(root + '/src/lib/service/docker/docker', {
			'../../util/shell': mocks.shell
		});

	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('displayLogs', () => {

		it('should handle no containers', () => {

			// given
			const expectedInput = {
				docker: {
					containers: []
				}
			};

			// when/then
			return expect(docker.displayLogs(expectedInput))
				.to.eventually.eql(expectedInput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.not.have.been.called;
				});

		});

		it('should handle one containers', () => {

			// given
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
				};

			mocks.shell.executeCommand.resolves(expectedContainerId);

			// when/then
			return expect(docker.displayLogs(expectedInput))
				.to.eventually.eql(expectedInput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

		it('should handle multiple containers', () => {

			// given
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
				}];

			mocks.shell.executeCommand
				.onFirstCall().resolves(expectedContainerId1)
				.onSecondCall().resolves(expectedContainerId2);

			// when/then
			return expect(docker.displayLogs(expectedInput))
				.to.eventually.eql(expectedInput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledTwice;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommands[0], expectedInput);
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommands[1], expectedInput);
				});

		});

	});

	describe('findContainersForImage', () => {

		it('should handle no containers for an image', () => {

			// given
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

			mocks.shell.executeCommand.resolves(expectedCommandOutput);

			// when/then
			return expect(docker.findContainersForImage(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

		it('should handle containers for an image', () => {

			// given
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

			mocks.shell.executeCommand.resolves(expectedCommandOutput);

			// when/then
			return expect(docker.findContainersForImage(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

	});

	describe('findDanglingImages', () => {

		it('should handle no dangling images', () => {

			// given
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

			mocks.shell.executeCommand.resolves(expectedCommandOutput);

			// when/then
			return expect(docker.findDanglingImages(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

		it('should handle dangling images', () => {

			// given
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

			mocks.shell.executeCommand.resolves(expectedCommandOutput);

			// when/then
			return expect(docker.findDanglingImages(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

	});

	describe('listContainers', () => {

		it('should handle no containers', () => {

			// given
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

			mocks.shell.executeCommand.resolves(expectedCommandOutput);

			// when/then
			return expect(docker.listContainers(true)(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

		it('should return only the running containers if the only running option is set', () => {

			// given
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

			mocks.shell.executeCommand.resolves(expectedCommandOutput);

			// when/then
			return expect(docker.listContainers(true)(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

		it('should return all containers if the only running option is not set', () => {

			// given
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

			mocks.shell.executeCommand.resolves(expectedCommandOutput);

			// when/then
			return expect(docker.listContainers(false)(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

	});

	describe('listImages', () => {

		it('should handle no images', () => {

			// given
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

			mocks.shell.executeCommand.resolves(expectedCommandOutput);

			// when/then
			return expect(docker.listImages(true)(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

		it('should return only the orizuru images with the only ffdc images option', () => {

			// given
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

			mocks.shell.executeCommand.resolves(expectedCommandOutput);

			// when/then
			return expect(docker.listImages(true)(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

		it('should return all images without the only ffdc Images option', () => {

			// given
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

			mocks.shell.executeCommand.resolves(expectedCommandOutput);

			// when/then
			return expect(docker.listImages(false)(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

	});

	describe('removeContainers', () => {

		it('should handle no containers', () => {

			// given
			const expectedInput = {
				docker: {
					containers: []
				}
			};

			// when/then
			return expect(docker.removeContainers(expectedInput))
				.to.eventually.deep.equal(expectedInput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.not.have.been.called;
				});

		});

		it('should handle one container', () => {

			// given
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

			mocks.shell.executeCommand.resolves(expectedCommandOutput);

			// when/then
			return expect(docker.removeContainers(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

		it('should handle multiple containers', () => {

			// given
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

			mocks.shell.executeCommand
				.onFirstCall().resolves(expectedCommandOutput[0])
				.onSecondCall().resolves(expectedCommandOutput[1]);

			// when/then
			return expect(docker.removeContainers(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledTwice;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommands[0], expectedInput);
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommands[1], expectedInput);
				});

		});

	});

	describe('removeImages', () => {

		it('should handle no images', () => {

			// given
			const expectedInput = {
				docker: {
					images: []
				}
			};

			// when/then
			return expect(docker.removeImages(expectedInput))
				.to.eventually.deep.equal(expectedInput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.not.have.been.called;
				});

		});

		it('should handle one image', () => {

			// given
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

			mocks.shell.executeCommand.resolves(expectedCommandOutput);

			// when/then
			return expect(docker.removeImages(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

		it('should handle multiple images', () => {

			// given
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

			mocks.shell.executeCommand
				.onFirstCall().resolves(expectedCommandOutput[0])
				.onSecondCall().resolves(expectedCommandOutput[1]);

			// when/then
			return expect(docker.removeImages(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledTwice;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommands[0], expectedInput);
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommands[1], expectedInput);
				});

		});

	});

	describe('removeDanglingImages', () => {

		it('should handle no dangling images', () => {

			// given
			const
				expectedInput = {},
				expectedCommandOutput = {
					lastcommand: {
						result: {
							stdout: ''
						}
					}
				};

			mocks.shell.executeCommand.resolves(expectedCommandOutput);

			// when/then
			return expect(docker.removeDanglingImages(expectedInput))
				.to.eventually.be.fulfilled
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
				});

		});

		it('should remove a single dangling image', () => {

			// given
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

			mocks.shell.executeCommand
				.onCall(0).resolves(expectedCommandOutput[0])
				.onCall(1).resolves(expectedCommandOutput[1])
				.onCall(2).resolves(expectedCommandOutput[1])
				.onCall(3).resolves(expectedCommandOutput[1])
				.onCall(4).resolves(expectedCommandOutput[0]);

			// when/then
			return expect(docker.removeDanglingImages(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.callCount(5);
				});

		});

	});

	describe('stopContainers', () => {

		it('should handle no containers', () => {

			// given
			const expectedInput = {
				docker: {
					containers: []
				}
			};

			// when/then
			return expect(docker.stopContainers(expectedInput))
				.to.eventually.deep.equal(expectedInput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.not.have.been.called;
				});

		});

		it('should handle one containers', () => {

			// given
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
				};

			mocks.shell.executeCommand.resolves(expectedContainerId);

			// when/then
			return expect(docker.stopContainers(expectedInput))
				.to.eventually.eql(expectedInput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

		it('should handle multiple containers', () => {

			// given
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
				}];

			mocks.shell.executeCommand
				.onFirstCall().resolves(expectedContainerId1)
				.onSecondCall().resolves(expectedContainerId2);

			// when/then
			return expect(docker.stopContainers(expectedInput))
				.to.eventually.eql(expectedInput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledTwice;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommands[0], expectedInput);
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommands[1], expectedInput);
				});

		});

	});

});
