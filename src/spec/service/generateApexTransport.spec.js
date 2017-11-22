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

	{ resolve } = require('path'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/generateApexTransport.js', () => {

	let mocks, service;

	beforeEach(() => {

		mocks = {};

		mocks.logger = sandbox.stub();
		mocks.logger.log = sandbox.stub();
		mocks.logger.logError = sandbox.stub();
		mocks.logger.logFinish = sandbox.stub();
		mocks.logger.logStart = sandbox.stub();

		mocks.generate = sandbox.stub();
		mocks.generate.generate = sandbox.stub();

		mocks.getAvscFilesOnPathRecursively = sandbox.stub();
		mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively = sandbox.stub();

		mocks.overwriteFile = sandbox.stub();

		service = proxyquire(root + '/src/lib/service/generateApexTransport', {
			'./generateApexTransport/getAvscFilesOnPathRecursively': mocks.getAvscFilesOnPathRecursively,
			'./generateApexTransport/generate': mocks.generate,
			'./generateApexTransport/overwriteFile': mocks.overwriteFile,
			'../util/logger': mocks.logger
		});

	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('generateApexTransport', () => {

		it('should log error if input url not supplied', () => {

			// given
			const input = {};

			//when - then
			return expect(service.generateApexTransport(input)).to.be.fulfilled
				.then(() => {
					expect(mocks.logger.logError).to.have.been.calledOnce;
					expect(mocks.logger.logError).to.have.been.calledWith(sinon.match.instanceOf(Error));
				});

		});

		it('should log error if output url not supplied', () => {

			// given
			const input = {
				inputUrl: 'test'
			};

			// when - then
			return expect(service.generateApexTransport(input)).to.be.fulfilled
				.then(() => {
					expect(mocks.logger.logError).to.have.been.calledOnce;
					expect(mocks.logger.logError).to.have.been.calledWith(sinon.match.instanceOf(Error));
				});

		});

		it('should search for .avsc files in input path and log error if search throws', () => {

			// given
			const input = {
					inputUrl: 'inputTest',
					outputUrl: 'outputTest'
				},
				expectedError = new Error('test');

			mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively.throws(expectedError);

			// when - then
			return expect(service.generateApexTransport(input)).to.be.fulfilled
				.then(() => {
					expect(mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively).to.have.been.calledOnce;
					expect(mocks.logger.logError).to.have.been.calledOnce;
					expect(mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively).to.have.been.calledWith(resolve(process.cwd(), input.inputUrl));
					expect(mocks.logger.logError).to.have.been.calledWith(expectedError);
				});

		});

		it('should deserialize schemas and log if deserialize fails', () => {

			// given
			const input = {
				inputUrl: 'inputTest',
				outputUrl: 'outputTest'
			};

			mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively.returns([{
				file: 'a'
			}]);

			// when - then
			return expect(service.generateApexTransport(input)).to.be.fulfilled
				.then(() => {
					expect(mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively).to.have.been.calledOnce;
					expect(mocks.logger.logError).to.have.been.calledOnce;
					expect(mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively).to.have.been.calledWith(resolve(process.cwd(), input.inputUrl));
					expect(mocks.logger.logError).to.have.been.calledWith(sinon.match.instanceOf(Error));
				});

		});

		it('should generate apex transport and log if generate fails', () => {

			// given
			const input = {
					inputUrl: 'inputTest',
					outputUrl: 'outputTest'
				},
				expectedError = new Error('test');

			mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively.returns([{
				file: '{ "test": "test" }'
			}]);
			mocks.generate.generate.throws(expectedError);

			// when - then
			return expect(service.generateApexTransport(input)).to.be.fulfilled
				.then(() => {
					expect(mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively).to.have.been.calledOnce;
					expect(mocks.generate.generate).to.have.been.calledOnce;
					expect(mocks.logger.logError).to.have.been.calledOnce;
					expect(mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively).to.have.been.calledWith(resolve(process.cwd(), input.inputUrl));
					expect(mocks.generate.generate).to.have.been.calledWith([{ test: 'test' }]);
					expect(mocks.logger.logError).to.have.been.calledWith(expectedError);
				});

		});

		it('should save generated apex transport and log if save fails', () => {

			// given
			const input = {
					inputUrl: 'inputTest',
					outputUrl: 'outputTest'
				},
				expectedError = new Error('test');

			mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively.returns([{
				file: '{ "test": "test" }'
			}]);
			mocks.generate.generate.returns({
				cls: 'testCls',
				xml: 'testXml'
			});
			mocks.overwriteFile.throws(expectedError);

			// when - then
			return expect(service.generateApexTransport(input)).to.be.fulfilled
				.then(() => {
					expect(mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively).to.have.been.calledOnce;
					expect(mocks.generate.generate).to.have.been.calledOnce;
					expect(mocks.overwriteFile).to.have.been.calledOnce;
					expect(mocks.logger.logError).to.have.been.calledOnce;
					expect(mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively).to.have.been.calledWith(resolve(process.cwd(), input.inputUrl));
					expect(mocks.generate.generate).to.have.been.calledWith([{ test: 'test' }]);
					expect(mocks.overwriteFile).to.have.been.calledWith(resolve(process.cwd(), input.outputUrl), 'OrizuruTransport.cls', 'testCls');
					expect(mocks.logger.logError).to.have.been.calledWith(expectedError);
				});

		});

		it('should save generated apex transport and log complete if save succeeds', () => {

			// given
			const input = {
				inputUrl: 'inputTest',
				outputUrl: 'outputTest'
			};

			mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively.returns([{
				file: '{ "test": "test" }'
			}]);
			mocks.generate.generate.returns({
				cls: 'testCls',
				xml: 'testXml'
			});
			mocks.overwriteFile.resolves(true);

			// when - then
			return expect(service.generateApexTransport(input)).to.be.fulfilled
				.then(() => {
					expect(mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively).to.have.been.calledOnce;
					expect(mocks.generate.generate).to.have.been.calledOnce;
					expect(mocks.overwriteFile).to.have.been.calledTwice;
					expect(mocks.logger.log).to.have.been.calledOnce;
					expect(mocks.getAvscFilesOnPathRecursively.getAvscFilesOnPathRecursively).to.have.been.calledWith(resolve(process.cwd(), input.inputUrl));
					expect(mocks.generate.generate).to.have.been.calledWith([{ test: 'test' }]);
					expect(mocks.overwriteFile).to.have.been.calledWith(resolve(process.cwd(), input.outputUrl), 'OrizuruTransport.cls', 'testCls');
					expect(mocks.overwriteFile).to.have.been.calledWith(resolve(process.cwd(), input.outputUrl), 'OrizuruTransport.cls-meta.xml', 'testXml');
					expect(mocks.logger.log).to.have.been.calledWith('\nGenerated apex transport classes (OrizuruTransport.cls) in: ' + resolve(process.cwd(), input.outputUrl));
				});

		});

	});

});
