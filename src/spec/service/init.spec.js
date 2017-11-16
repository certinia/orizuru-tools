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
	root = require('app-root-path'),
	chai = require('chai'),
	chaiAsPromised = require('chai-as-promised'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	service = require('../../lib/service/init'),

	askQuestions = require('../../lib/service/init/askQuestions'),
	readAppTemplates = require('../../lib/service/init/readAppTemplates'),
	createPackageJson = require('../../lib/service/init/createPackageJson'),
	copyResources = require('../../lib/service/init/copyResources'),
	deployGitIgnore = require('../../lib/service/init/deployGitIgnore'),
	npm = require('../../lib/service/init/npm'),
	logger = require('../../lib/util/logger'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/init.js', () => {

	beforeEach(() => {

		sandbox.stub(askQuestions, 'askQuestions').resolves('test2');
		sandbox.stub(createPackageJson, 'createPackageJson').resolves('test3');
		sandbox.stub(copyResources, 'copyResources').resolves('test4');
		sandbox.stub(deployGitIgnore, 'deployGitIgnore').resolves('test5');
		sandbox.stub(logger, 'logStart');
		sandbox.stub(logger, 'logFinish');
		sandbox.stub(logger, 'logError');
		sandbox.stub(npm, 'install').resolves('test6');
		sandbox.stub(npm, 'generateApexTransport').resolves('test7');
		sandbox.stub(npm, 'test').resolves('test8');
		sandbox.stub(npm, 'orizuruPostInit').resolves('test9');
		sandbox.stub(readAppTemplates, 'readAppTemplates').resolves('test1');

	});

	afterEach(() => sandbox.restore());

	describe('init', () => {

		it('should call init functions in order', () => {

			// when/then
			return expect(service.init())
				.to.eventually.be.fulfilled
				.then(() => {

					expect(logger.logStart).to.have.been.calledOnce;
					expect(readAppTemplates.readAppTemplates).to.have.been.calledOnce;
					expect(askQuestions.askQuestions).to.have.been.calledOnce;
					expect(createPackageJson.createPackageJson).to.have.been.calledOnce;
					expect(copyResources.copyResources).to.have.been.calledOnce;
					expect(npm.install).to.have.been.calledOnce;
					expect(npm.generateApexTransport).to.have.been.calledOnce;
					expect(npm.test).to.have.been.calledOnce;
					expect(npm.orizuruPostInit).to.have.been.calledOnce;

					expect(logger.logStart).to.have.been.calledWith('Building new project');
					expect(readAppTemplates.readAppTemplates).to.have.been.calledWith({
						templatesFolder: root + '/templates'
					});
					expect(askQuestions.askQuestions).to.have.been.calledWith('test1');
					expect(createPackageJson.createPackageJson).to.have.been.calledWith('test2');
					expect(copyResources.copyResources).to.have.been.calledWith('test3');
					expect(deployGitIgnore.deployGitIgnore).to.have.been.calledWith('test4');
					expect(npm.install).to.have.been.calledWith('test5');
					expect(npm.generateApexTransport).to.have.been.calledWith('test6');
					expect(npm.test).to.have.been.calledWith('test7');
					expect(npm.orizuruPostInit).to.have.been.calledWith('test8');

				});

		});

		it('should call logError function if there is an error', () => {

			// given
			const
				expectedError = new Error('errorTest');

			readAppTemplates.readAppTemplates.rejects(expectedError);

			// when/then
			return expect(service.init())
				.to.eventually.be.fulfilled
				.then(() => {
					expect(logger.logStart).to.have.been.calledOnce;
					expect(logger.logError).to.have.been.calledOnce;
					expect(logger.logStart, 'Building new project');
					expect(logger.logError, expectedError);
				});

		});

	});

});
