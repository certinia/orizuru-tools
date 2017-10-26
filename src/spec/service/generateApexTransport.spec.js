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

	getAvscFilesOnPathRecursively = require(root + '/src/lib/service/generateApexTransport/getAvscFilesOnPathRecursively'),
	generate = require(root + '/src/lib/service/generateApexTransport/generate'),
	overwriteFile = require(root + '/src/lib/service/generateApexTransport/overwriteFile'),

	{ resolve } = require('path'),

	expect = chai.expect,

	{ calledOnce, calledTwice, calledWith } = sinon.assert,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);

describe('service/generateApexTransport.js', () => {

	let mocks, GenerateApexTransportService;

	beforeEach(() => {
		mocks = {
			logger: sandbox.stub(),
			getAvscFilesOnPathRecursively: sandbox.stub(getAvscFilesOnPathRecursively, 'getAvscFilesOnPathRecursively'),
			generate: sandbox.stub(generate, 'generate'),
			overwriteFile: sandbox.stub(overwriteFile, 'overwriteFile')
		};

		mocks.logger.logStart = sandbox.stub().callsFake(() => config => config);
		mocks.logger.logFinish = sandbox.stub().callsFake(() => config => config);
		mocks.logger.logError = sandbox.stub();
		mocks.logger.log = sandbox.stub();

		GenerateApexTransportService = proxyquire(root + '/src/lib/service/generateApexTransport', {
			'../util/logger': mocks.logger
		});

	});

	afterEach(() => sandbox.restore());

	describe('generateApexTransport', () => {

		it('should log error if input url not supplied', () => {

			// given
			const input = {};

			//when - then
			return expect(GenerateApexTransportService.generateApexTransport(input)).to.be.fulfilled
				.then(() => {
					calledOnce(mocks.logger.logError);
					calledWith(mocks.logger.logError, sinon.match.instanceOf(Error));
				});

		});

		it('should log error if output url not supplied', () => {

			// given
			const input = {
				inputUrl: 'test'
			};

			// when - then
			return expect(GenerateApexTransportService.generateApexTransport(input)).to.be.fulfilled
				.then(() => {
					calledOnce(mocks.logger.logError);
					calledWith(mocks.logger.logError, sinon.match.instanceOf(Error));
				});

		});

		it('should search for .avsc files in input path and log error if search throws', () => {

			// given
			const input = {
					inputUrl: 'inputTest',
					outputUrl: 'outputTest'
				},
				expectedError = new Error('test');

			mocks.getAvscFilesOnPathRecursively.throws(expectedError);

			// when - then
			return expect(GenerateApexTransportService.generateApexTransport(input)).to.be.fulfilled
				.then(() => {
					calledOnce(mocks.getAvscFilesOnPathRecursively);
					calledWith(mocks.getAvscFilesOnPathRecursively, resolve(process.cwd(), input.inputUrl));
					calledOnce(mocks.logger.logError);
					calledWith(mocks.logger.logError, expectedError);
				});

		});

		it('should deserialize schemas and log if deserialize fails', () => {

			// given
			const input = {
				inputUrl: 'inputTest',
				outputUrl: 'outputTest'
			};

			mocks.getAvscFilesOnPathRecursively.returns([{
				file: 'a'
			}]);

			// when - then
			return expect(GenerateApexTransportService.generateApexTransport(input)).to.be.fulfilled
				.then(() => {
					calledOnce(mocks.getAvscFilesOnPathRecursively);
					calledWith(mocks.getAvscFilesOnPathRecursively, resolve(process.cwd(), input.inputUrl));
					calledOnce(mocks.logger.logError);
					calledWith(mocks.logger.logError, sinon.match.instanceOf(Error));
				});

		});

		it('should generate apex transport and log if generate fails', () => {

			// given
			const input = {
					inputUrl: 'inputTest',
					outputUrl: 'outputTest'
				},
				expectedError = new Error('test');

			mocks.getAvscFilesOnPathRecursively.returns([{
				file: '{ "test": "test" }'
			}]);
			mocks.generate.throws(expectedError);

			// when - then
			return expect(GenerateApexTransportService.generateApexTransport(input)).to.be.fulfilled
				.then(() => {
					calledOnce(mocks.getAvscFilesOnPathRecursively);
					calledWith(mocks.getAvscFilesOnPathRecursively, resolve(process.cwd(), input.inputUrl));
					calledOnce(mocks.generate);
					calledWith(mocks.generate, [{ test: 'test' }]);
					calledOnce(mocks.logger.logError);
					calledWith(mocks.logger.logError, expectedError);
				});

		});

		it('should save generated apex transport and log if save fails', () => {

			// given
			const input = {
					inputUrl: 'inputTest',
					outputUrl: 'outputTest'
				},
				expectedError = new Error('test');

			mocks.getAvscFilesOnPathRecursively.returns([{
				file: '{ "test": "test" }'
			}]);
			mocks.generate.returns({
				cls: 'testCls',
				xml: 'testXml'
			});
			mocks.overwriteFile.throws(expectedError);

			// when - then
			return expect(GenerateApexTransportService.generateApexTransport(input)).to.be.fulfilled
				.then(() => {
					calledOnce(mocks.getAvscFilesOnPathRecursively);
					calledWith(mocks.getAvscFilesOnPathRecursively, resolve(process.cwd(), input.inputUrl));
					calledOnce(mocks.generate);
					calledWith(mocks.generate, [{ test: 'test' }]);
					calledOnce(mocks.overwriteFile);
					calledWith(mocks.overwriteFile, resolve(process.cwd(), input.outputUrl, 'OrizuruTransport.cls'), 'testCls');
					calledOnce(mocks.logger.logError);
					calledWith(mocks.logger.logError, expectedError);
				});

		});

		it('should save generated apex transport and log complete if save succeeds', () => {

			// given
			const input = {
				inputUrl: 'inputTest',
				outputUrl: 'outputTest'
			};

			mocks.getAvscFilesOnPathRecursively.returns([{
				file: '{ "test": "test" }'
			}]);
			mocks.generate.returns({
				cls: 'testCls',
				xml: 'testXml'
			});
			mocks.overwriteFile.returns(true);

			// when - then
			return expect(GenerateApexTransportService.generateApexTransport(input)).to.be.fulfilled
				.then(() => {
					calledOnce(mocks.getAvscFilesOnPathRecursively);
					calledWith(mocks.getAvscFilesOnPathRecursively, resolve(process.cwd(), input.inputUrl));
					calledOnce(mocks.generate);
					calledWith(mocks.generate, [{ test: 'test' }]);
					calledTwice(mocks.overwriteFile);
					calledWith(mocks.overwriteFile, resolve(process.cwd(), input.outputUrl, 'OrizuruTransport.cls'), 'testCls');
					calledWith(mocks.overwriteFile, resolve(process.cwd(), input.outputUrl, 'OrizuruTransport.cls-meta.xml'), 'testXml');
					calledTwice(mocks.logger.log); // called once earlier and we didn't bother asserting
					calledWith(mocks.logger.log, '\nGenerated apex transport classes (OrizuruTransport.cls) in: ' + resolve(process.cwd(), input.outputUrl));
				});

		});

	});

});
