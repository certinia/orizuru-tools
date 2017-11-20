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
	proxyquire = require('proxyquire'),
	root = require('app-root-path'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/init/resource.js', () => {

	let resource, mocks;

	beforeEach(() => {

		mocks = {};
		mocks.shell = sandbox.stub();
		mocks.shell.executeCommand = sandbox.stub();

		resource = proxyquire(root + '/src/lib/service/init/resource', {
			'../../util/shell': mocks.shell
		});

	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('resources', () => {

		it('should copy a template that does not extend other templates', () => {

			// given
			const
				templateFolder = root + '/templates',
				folder = 'simple-example',
				expectedCommand = {
					args: ['-r', `${templateFolder}/${folder}/res/.`, `${root}`],
					cmd: 'cp',
					opts: {
						logging: {
							finish: `Copied ${templateFolder}/${folder}/res/. to ${root}`
						}
					}
				},
				expectedInput = {
					selectedTemplate: {
						fullPath: templateFolder + '/' + folder
					},
					templateFolder
				},
				expectedOutput = expectedInput;

			mocks.shell.executeCommand.resolves();

			// when - then
			return expect(resource.copy(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledTwice;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

		it('should copy a template that extends another template', () => {

			// given
			const
				templateFolder = root + '/templates',
				mainTemplate = 'main-template',
				extendedTemplate = 'other-template',
				expectedInput = {
					selectedTemplate: {
						configuration: {
							extensions: {
								[extendedTemplate]: {}
							}
						},
						fullPath: templateFolder + '/' + mainTemplate
					},
					templateFolder
				},
				expectedCommandExtendedTemplate = {
					args: ['-r', `${templateFolder}/${extendedTemplate}/res/.`, `${root}`],
					cmd: 'cp',
					opts: {
						logging: {
							finish: `Copied ${templateFolder}/${extendedTemplate}/res/. to ${root}`
						}
					}
				},
				expectedCommandMainTemplate = {
					args: ['-r', `${templateFolder}/${mainTemplate}/res/.`, `${root}`],
					cmd: 'cp',
					opts: {
						logging: {
							finish: `Copied ${templateFolder}/${mainTemplate}/res/. to ${root}`
						}
					}
				},
				expectedOutput = expectedInput;

			mocks.shell.executeCommand.resolves();

			// when - then
			return expect(resource.copy(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledThrice;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommandExtendedTemplate, expectedInput);
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommandMainTemplate, expectedInput);
				});

		});

	});

	describe('deployGitIgnore', () => {

		it('should rename the gitignore file to .gitignore', () => {

			// given
			const
				templateFolder = root + '/templates',
				folder = 'simple-example',
				expectedInput = {
					selectedTemplate: {
						fullPath: templateFolder + '/' + folder
					},
					templateFolder
				},
				expectedCommand = {
					args: [`${root}/gitignore`, `${root}/.gitignore`],
					cmd: 'mv',
					opts: {
						logging: {
							finish: `Renamed ${root}/gitignore to ${root}/.gitignore`
						}
					}
				},
				expectedOutput = expectedInput;

			mocks.shell.executeCommand.resolves(expectedInput);

			// when - then
			return expect(resource.renameGitIgnore(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

	});

});
