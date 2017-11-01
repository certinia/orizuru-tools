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
	proxyquire = require('proxyquire'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	askQuestions = require('../../lib/service/init/askQuestions'),
	readAppTemplates = require('../../lib/service/init/readAppTemplates'),
	createPackageJson = require('../../lib/service/init/createPackageJson'),
	copyResources = require('../../lib/service/init/copyResources'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/init.js', () => {

	let mocks, InitService;

	beforeEach(() => {
		mocks = {
			logger: sandbox.stub(),
			readAppTemplates: sandbox.stub(readAppTemplates, 'readAppTemplates').resolves('test1'),
			askQuestions: sandbox.stub(askQuestions, 'askQuestions').resolves('test2'),
			createPackageJson: sandbox.stub(createPackageJson, 'createPackageJson').resolves('test3'),
			copyResources: sandbox.stub(copyResources, 'copyResources').resolves('test4')
		};

		mocks.logger.logStart = sandbox.stub();
		mocks.logger.logFinish = sandbox.stub();
		mocks.logger.logError = sandbox.stub();

		InitService = proxyquire('../../lib/service/init', {
			'../util/logger': mocks.logger
		});

	});

	afterEach(() => sandbox.restore());

	describe('init', () => {

		it('should call init functions in order', () => {

			// when/then
			return expect(InitService.init())
				.to.eventually.be.fulfilled
				.then(() => {
					expect(mocks.logger.logStart).to.have.been.calledOnce;
					expect(mocks.readAppTemplates).to.have.been.calledOnce;
					expect(mocks.askQuestions).to.have.been.calledOnce;
					expect(mocks.createPackageJson).to.have.been.calledOnce;
					expect(mocks.copyResources).to.have.been.calledOnce;

					expect(mocks.logger.logStart).to.have.been.calledWith('Building new project');
					expect(mocks.readAppTemplates).to.have.been.calledWith({
						templatesFolder: root + '/templates'
					});
					expect(mocks.askQuestions).to.have.been.calledWith('test1');
					expect(mocks.createPackageJson).to.have.been.calledWith('test2');
					expect(mocks.copyResources).to.have.been.calledWith('test3');
				});

		});

		it('should call logError function if there is an error', () => {

			// given
			const
				expectedError = new Error('errorTest');

			mocks.readAppTemplates.rejects(expectedError);

			// when/then
			return expect(InitService.init())
				.to.eventually.be.fulfilled
				.then(() => {
					expect(mocks.logger.logStart).to.have.been.calledOnce;
					expect(mocks.logger.logError).to.have.been.calledOnce;
					expect(mocks.logger.logStart, 'Building new project');
					expect(mocks.logger.logError, expectedError);
				});

		});

	});

});
