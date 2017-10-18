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
	proxyquire = require('proxyquire'),

	fs = require('fs-extra'),
	inquirer = require('inquirer'),
	validators = require(root + '/src/lib/util/validators'),
	questions = require(root + '/src/lib/util/questions'),

	expect = chai.expect,

	calledOnce = sinon.assert.calledOnce,
	calledTwice = sinon.assert.calledTwice,
	calledThrice = sinon.assert.calledThrice,
	calledWith = sinon.assert.calledWith,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);

describe('service/init/initFunctions.js', () => {

	let mocks, initFunctions;

	beforeEach(() => {

		mocks = {
			logger: sandbox.stub(),
			inquirerPrompt: sandbox.stub(inquirer, 'prompt').resolves({ key: 'value' }),
			fsCopy: sandbox.stub(fs, 'copy').resolves(),
			fsLstat: sandbox.stub(fs, 'lstat'),
			fsReadfile: sandbox.stub(fs, 'readFile'),
			fsWriteFile: sandbox.stub(fs, 'writeFile')
		};

		mocks.logger.log = sandbox.stub();

		initFunctions = proxyquire(root + '/src/lib/service/init/initFunctions', {
			'../../util/logger': mocks.logger
		});

	});

	afterEach(() => sandbox.restore());

	describe('askQuestions', () => {

		it('should call inquirer prompt with the correct arguments', () => {

			return expect(initFunctions.askQuestions()).to.eventually.eql({
				answers: {
					key: 'value'
				}
			}).then(() => {
				calledOnce(mocks.inquirerPrompt);
				calledWith(mocks.inquirerPrompt, [
					questions.inputField('NPM Module Name:', '{{npm-module-name}}', validators.validateNotEmpty),
					questions.inputField('NPM Module Description:', '{{npm-module-description}}', validators.validateNotEmpty),
					questions.inputField('GIT Repository Name:', '{{git-repository-name}}', validators.validateNotEmpty),
					questions.inputField('GIT Repository URL:', '{{git-repository-url}}', validators.validateNotEmpty),
					questions.inputField('Sidebar Color:', '{{vscode-bar-color}}', validators.validateHexColor)
				]);
			});
		});

	});

	describe('copyResources', () => {

		it('should call fs-extra copy with the correct arguments, and return input', () => {

			return expect(initFunctions.copyResources({ answers: 'test' })).to.eventually.eql({
				answers: 'test'
			}).then(() => {
				calledOnce(mocks.logger.log);
				calledWith(mocks.logger.log, 'Copying resources to ' + process.cwd());
				calledOnce(mocks.fsCopy);
				calledWith(mocks.fsCopy, root + '/template', process.cwd());
			});

		});

	});

	describe('walkResources', () => {

		it('should klaw with the correct arguments, and return input plus paths', () => {

			const
				expectedResult = ['path1'],
				walker = {
					on: function (type, fn) {
						if (type === 'data') {
							fn({ path: 'path1' });
						}
						if (type === 'end') {
							fn();
						}
						return this;
					}
				},
				klawMock = sandbox.stub().returns(walker),
				initFunctionsMockedKlaw = proxyquire(root + '/src/lib/service/init/initFunctions', {
					'../../util/logger': mocks.logger,
					klaw: klawMock
				});

			return expect(initFunctionsMockedKlaw.walkResources({ answers: 'test' })).to.eventually.eql({
				answers: 'test',
				paths: expectedResult
			}).then(() => {
				calledOnce(mocks.logger.log);
				calledWith(mocks.logger.log, 'Enumerating resources');
				calledOnce(klawMock);
				calledWith(klawMock, process.cwd());
			});

		});

	});

	describe('filterOutDirectories', () => {

		it('should call lstat on paths, and filter out any directories', () => {

			const
				input = {
					answers: 'answersTest',
					paths: [
						'a.txt',
						'b.txt',
						'c'
					]
				};

			mocks.fsLstat.onCall(0).resolves({ isDirectory: () => false });
			mocks.fsLstat.onCall(1).resolves({ isDirectory: () => false });
			mocks.fsLstat.onCall(2).resolves({ isDirectory: () => true });

			return expect(initFunctions.filterOutDirectories(input)).to.eventually.eql({
				answers: 'answersTest',
				paths: [
					'a.txt',
					'b.txt'
				]
			}).then(() => {
				calledThrice(mocks.fsLstat);
				calledWith(mocks.fsLstat, 'a.txt');
				calledWith(mocks.fsLstat, 'b.txt');
				calledWith(mocks.fsLstat, 'c');
			});

		});

	});

	describe('readFiles', () => {

		it('should read the content of the specified file paths', () => {

			const
				input = {
					answers: 'answersTest',
					paths: [
						'a.txt',
						'b.txt'
					]
				};

			mocks.fsReadfile.onCall(0).resolves('some content for a.txt');
			mocks.fsReadfile.onCall(1).resolves('some content for b.txt');

			return expect(initFunctions.readFiles(input)).to.eventually.eql({
				answers: 'answersTest',
				files: [{
					path: 'a.txt',
					content: 'some content for a.txt'
				}, {
					path: 'b.txt',
					content: 'some content for b.txt'
				}]
			}).then(() => {
				calledOnce(mocks.logger.log);
				calledWith(mocks.logger.log, 'Reading resources');
				calledTwice(mocks.fsReadfile);
				calledWith(mocks.fsReadfile, 'a.txt');
				calledWith(mocks.fsReadfile, 'b.txt');
			});
		});

	});

	describe('replaceTokensWithAnswers', () => {

		it('should replace tokens in the file contents based on answers', () => {

			const
				input = {
					answers: {
						content: 'replaced content'
					},
					files: [{
						path: 'a.txt',
						content: 'some content for a.txt'
					}, {
						path: 'b.txt',
						content: 'some content for b.txt'
					}]
				};

			expect(initFunctions.replaceTokensWithAnswers(input)).to.eql({
				files: [{
					path: 'a.txt',
					content: 'some replaced content for a.txt'
				}, {
					path: 'b.txt',
					content: 'some replaced content for b.txt'
				}]
			});

			calledOnce(mocks.logger.log);
			calledWith(mocks.logger.log, 'Running find and replace');

		});

	});

	describe('saveFiles', () => {

		it('should save the files passed in', () => {

			const
				input = {
					files: [{
						path: 'a.txt',
						content: 'some replaced content for a.txt'
					}, {
						path: 'b.txt',
						content: 'some replaced content for b.txt'
					}]
				};

			mocks.fsWriteFile.onCall(0).resolves();
			mocks.fsWriteFile.onCall(1).resolves();

			return expect(initFunctions.saveFiles(input))
				.to.eventually.eql(undefined)
				.then(() => {
					calledOnce(mocks.logger.log);
					calledWith(mocks.logger.log, 'Finalizing');
					calledTwice(mocks.fsWriteFile);
					calledWith(mocks.fsWriteFile, input.files[0].path, input.files[0].content, 'utf8');
					calledWith(mocks.fsWriteFile, input.files[1].path, input.files[1].content, 'utf8');
				});
		});

	});

});
