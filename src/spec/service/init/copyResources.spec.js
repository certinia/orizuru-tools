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

describe('service/init/copyResources.js', () => {

	let copyResources, mocks;

	beforeEach(() => {

		mocks = {};
		mocks.fs = sandbox.stub();
		mocks.fs.copy = sandbox.stub();

		mocks.logger = sandbox.stub();
		mocks.logger.logLn = sandbox.stub();

		copyResources = proxyquire(root + '/src/lib/service/init/copyResources', {
			'fs-extra': mocks.fs,
			'../../util/logger': mocks.logger
		});

	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('copyResources', () => {

		it('should copy a template that does not extend other templates', () => {

			// given
			const
				templatesFolder = root + '/templates',
				folder = 'simple-example',
				expectedInput = {
					template: {
						selected: {
							fullPath: templatesFolder + '/' + folder
						}
					}
				},
				expectedOutput = expectedInput;

			mocks.fs.copy.resolves();

			// when - then
			return expect(copyResources(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.logger.logLn).to.have.been.calledTwice;
					expect(mocks.fs.copy).to.have.been.calledOnce;
					expect(mocks.logger.logLn).to.have.been.calledWith('Copying resources to ' + process.cwd());
					expect(mocks.logger.logLn).to.have.been.calledWith('Copying ' + templatesFolder + '/' + folder + '/res');
					expect(mocks.fs.copy).to.have.been.calledWith(root + '/templates/simple-example/res', process.cwd());
				});

		});

		it('should copy a template that extends another template', () => {

			// given
			const
				templatesFolder = root + '/templates',
				mainTemplate = 'main-template',
				extendedTemplate = 'other-template',
				expectedInput = {
					template: {
						folder: templatesFolder,
						selected: {
							configuration: {
								current: {
									'extends': [extendedTemplate]
								}
							},
							fullPath: templatesFolder + '/' + mainTemplate
						}
					}
				},
				expectedOutput = expectedInput;

			mocks.fs.copy.resolves();

			// when - then
			return expect(copyResources(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.logger.logLn).to.have.been.calledThrice;
					expect(mocks.fs.copy).to.have.been.calledTwice;
					expect(mocks.logger.logLn).to.have.been.calledWith('Copying resources to ' + process.cwd());
					expect(mocks.logger.logLn).to.have.been.calledWith('Copying ' + templatesFolder + '/' + extendedTemplate + '/res');
					expect(mocks.logger.logLn).to.have.been.calledWith('Copying ' + templatesFolder + '/' + mainTemplate + '/res');
					expect(mocks.logger.logLn).to.have.been.calledWith('Copying resources to ' + process.cwd());
					expect(mocks.fs.copy).to.have.been.calledWith(templatesFolder + '/' + extendedTemplate + '/res', process.cwd());
					expect(mocks.fs.copy).to.have.been.calledWith(templatesFolder + '/' + mainTemplate + '/res', process.cwd());
				});

		});

	});

});
