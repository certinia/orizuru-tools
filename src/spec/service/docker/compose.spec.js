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

describe('service/docker/compose', () => {

	let compose, mocks;

	beforeEach(() => {

		mocks = {};
		mocks.fs = sinon.stub();
		mocks.fs.readFileSync = sinon.stub();

		mocks.klaw = sinon.stub();

		mocks.path = {};
		mocks.path.dirname = sinon.stub().returns('');
		mocks.path.resolve = sinon.stub();

		mocks.shell = sinon.stub();
		mocks.shell.executeCommands = sinon.stub();

		compose = proxyquire('../../../lib/service/docker/compose', {
			klaw: mocks.klaw,
			'../../util/shell': mocks.shell,
			path: mocks.path,
			fs: mocks.fs
		});

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('getServices', () => {

		it('should read the services from a given yaml file', () => {

			// given
			const
				expectedImageName = 'image',
				expectedYaml = 'version: \'3\'\nservices:\n  image:\n    testing';

			var services;

			mocks.fs.readFileSync.returns(expectedYaml);

			// when
			services = compose.getServices(expectedImageName);

			// then
			expect(mocks.fs.readFileSync).to.have.been.calledOnce;
			expect(services).to.eql([expectedImageName]);

		});

	});

	describe('getAllServices', () => {

		it('should ignore non-yaml files', () => {

			// given
			const
				expectedFile = 'docker.txt',
				expectedInput = {},
				expectedOutput = {
					docker: {
						compose: {
							files: []
						}
					}
				};

			mocks.klaw.returns({
				on: function (type, fn) {
					switch (type) {
						case 'data':
							fn({ path: expectedFile });
							break;
						case 'end':
							fn();
					}
					return this;
				}
			});

			// when/then
			return expect(compose.getAllServices(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.fs.readFileSync).to.not.have.been.called;
				});

		});

		it('should ignore files that don\'t contain docker', () => {

			// given
			const
				expectedFile = 'test.txt',
				expectedInput = {},
				expectedOutput = {
					docker: {
						compose: {
							files: []
						}
					}
				};

			mocks.klaw.returns({
				on: function (type, fn) {
					switch (type) {
						case 'data':
							fn({ path: expectedFile });
							break;
						case 'end':
							fn();
					}
					return this;
				}
			});

			// when/then
			return expect(compose.getAllServices(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.fs.readFileSync).to.not.have.been.called;
				});

		});

		it('should read the services from a given yaml files', () => {

			// given
			const
				expectedDockerComposeFile = 'docker.yaml',
				expectedYaml = 'version: \'3\'\nservices:\n  image:\n    testing',
				expectedInput = {},
				expectedOutput = {
					docker: {
						compose: {
							files: [expectedDockerComposeFile]
						},
						services: {
							image: expectedDockerComposeFile
						}
					}
				};

			mocks.klaw.returns({
				on: function (type, fn) {
					switch (type) {
						case 'data':
							fn({ path: expectedDockerComposeFile });
							break;
						case 'end':
							fn();
					}
					return this;
				}
			});
			mocks.fs.readFileSync.withArgs(expectedDockerComposeFile).returns(expectedYaml);
			mocks.path.resolve.returns(expectedDockerComposeFile);

			// when/then
			return expect(compose.getAllServices(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.fs.readFileSync).to.have.been.calledOnce;
					expect(mocks.fs.readFileSync).to.have.been.calledWith(expectedDockerComposeFile);
				});

		});

	});

	describe('buildImages', () => {

		it('should handle no selected services', () => {

			// when/then
			expect(() => {
				compose.buildImages([]);
			}).to.throw('No services selected');

		});

		it('should call shell executeCommands', () => {

			// given
			const
				expectedCommands = [{
					args: ['-f', 'test1.yml', 'build', 'image1'],
					cmd: 'docker-compose',
					opts: {
						logging: {
							start: 'Build image: image1',
							finish: 'Built image: image1'
						},
						namespace: 'docker'
					}
				}, {
					args: ['-f', 'test2.yml', 'build', 'image2'],
					cmd: 'docker-compose',
					opts: {
						logging: {
							start: 'Build image: image2',
							finish: 'Built image: image2'
						},
						namespace: 'docker'
					}
				}],
				expectedServices = { image1: 'test1.yml', image2: 'test2.yml' },
				expectedInput = {
					docker: {
						selected: {
							services: expectedServices
						}
					}
				};

			mocks.shell.executeCommands.resolves();

			// when/then
			return expect(compose.buildImages(expectedInput))
				.to.eventually.be.fulfilled
				.then(() => {
					expect(mocks.shell.executeCommands).to.have.been.calledOnce;
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedCommands, {}, expectedInput);
				});

		});

	});

	describe('up', () => {

		it('should handle no selected services', () => {

			// when/then
			expect(() => {
				compose.up({});
			}).to.throw('No services selected');

		});

		it('should call shell executeCommands', () => {

			// given
			const
				expectedCommands = [{
					args: ['-f', 'test1.yml', 'up', '-d', 'image1'],
					cmd: 'docker-compose',
					opts: {
						logging: {
							start: 'Start service: image1',
							finish: 'Started service: image1'
						},
						namespace: 'docker'
					}
				}, {
					args: ['-f', 'test2.yml', 'up', '-d', 'image2'],
					cmd: 'docker-compose',
					opts: {
						logging: {
							start: 'Start service: image2',
							finish: 'Started service: image2'
						},
						namespace: 'docker'
					}
				}],
				expectedServices = { image1: 'test1.yml', image2: 'test2.yml' },
				expectedInput = {
					docker: {
						selected: {
							services: expectedServices
						}
					}
				};

			mocks.shell.executeCommands.resolves();

			// when/then
			return expect(compose.up(expectedInput))
				.to.eventually.be.fulfilled
				.then(() => {
					expect(mocks.shell.executeCommands).to.have.been.calledOnce;
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedCommands, {}, expectedInput);
				});

		});

	});

});
