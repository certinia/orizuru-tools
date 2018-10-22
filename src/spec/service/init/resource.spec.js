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

	path = require('path'),

	shell = require('../../../lib/util/shell'),

	resource = require('../../../lib/service/init/resource'),

	expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/init/resource.js', () => {

	beforeEach(() => {
		sinon.stub(process, 'cwd').returns('currentWorkingDirectory');
		sinon.stub(shell, 'executeCommand');
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('resources', () => {

		it('should copy a template that does not extend other templates', () => {

			// Given
			const
				templateFolder = 'templates',
				folder = 'simple-example',
				expectedCommand = {
					args: ['-r', `currentWorkingDirectory/${templateFolder}/${folder}/res/.`, 'currentWorkingDirectory'],
					cmd: 'cp',
					opts: {
						logging: {
							finish: `Copied currentWorkingDirectory/${templateFolder}/${folder}/res/. to currentWorkingDirectory`
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

			shell.executeCommand.resolves();

			// When - Then
			return expect(resource.copy(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(shell.executeCommand).to.have.been.calledTwice;
					expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

		it('should copy a template that extends another template', () => {

			// Given
			const
				templateFolder = 'templates',
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
					args: ['-r', `currentWorkingDirectory/${templateFolder}/${extendedTemplate}/res/.`, 'currentWorkingDirectory'],
					cmd: 'cp',
					opts: {
						logging: {
							finish: `Copied currentWorkingDirectory/${templateFolder}/${extendedTemplate}/res/. to currentWorkingDirectory`
						}
					}
				},
				expectedCommandMainTemplate = {
					args: ['-r', `currentWorkingDirectory/${templateFolder}/${mainTemplate}/res/.`, 'currentWorkingDirectory'],
					cmd: 'cp',
					opts: {
						logging: {
							finish: `Copied currentWorkingDirectory/${templateFolder}/${mainTemplate}/res/. to currentWorkingDirectory`
						}
					}
				},
				expectedOutput = expectedInput;

			shell.executeCommand.resolves();

			// When - Then
			return expect(resource.copy(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(shell.executeCommand).to.have.been.calledThrice;
					expect(shell.executeCommand).to.have.been.calledWith(expectedCommandExtendedTemplate, expectedInput);
					expect(shell.executeCommand).to.have.been.calledWith(expectedCommandMainTemplate, expectedInput);
				});

		});

	});

	describe('deployGitIgnore', () => {

		it('should rename the gitignore file to .gitignore', () => {

			// Given
			sinon.stub(path, 'resolve')
				.withArgs('currentWorkingDirectory', 'gitignore').returns('gitignore')
				.withArgs('currentWorkingDirectory', '.gitignore').returns('.gitignore');

			const
				templateFolder = './templates',
				folder = 'simple-example',
				expectedInput = {
					selectedTemplate: {
						fullPath: templateFolder + '/' + folder
					},
					templateFolder
				},
				expectedCommand = {
					args: ['gitignore', '.gitignore'],
					cmd: 'mv',
					opts: {
						logging: {
							finish: 'Renamed gitignore to .gitignore'
						}
					}
				},
				expectedOutput = expectedInput;

			shell.executeCommand.resolves(expectedInput);

			// When - Then
			return expect(resource.renameGitIgnore(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(shell.executeCommand).to.have.been.calledOnce;
					expect(shell.executeCommand).to.have.been.calledWith(expectedCommand, expectedInput);
				});

		});

	});

});
