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
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	{ resolve } = require('path'),

	generate = require('../../lib/service/generateApexTransport/generate'),
	overwriteFile = require('../../lib/service/generateApexTransport/overwriteFile'),

	logger = require('../../lib/util/logger'),
	read = require('../../lib/util/read'),

	service = require('../../lib/service/generateApexTransport'),

	expect = chai.expect;

chai.use(sinonChai);

describe('service/generateApexTransport.js', () => {

	beforeEach(() => {

		sinon.stub(logger, 'log');
		sinon.stub(logger, 'logError');
		sinon.stub(logger, 'logFinish');
		sinon.stub(logger, 'logEvent');

		sinon.stub(generate, 'generate');
		sinon.stub(read, 'readFilesWithExtension');

		sinon.stub(overwriteFile, 'overwriteFile');

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('generateApexTransport', () => {

		it('should log error if input url not supplied', async () => {

			// Given
			const input = {};

			// When
			await service.generateApexTransport(input);

			// Then
			expect(logger.logError).to.have.been.calledOnce;
			expect(logger.logError).to.have.been.calledWith(sinon.match.instanceOf(Error));

		});

		it('should log error if output url not supplied', async () => {

			// Given
			const input = {
				argv: {
					inputUrl: 'test'
				}
			};

			// When
			await service.generateApexTransport(input);

			// Then
			expect(logger.logError).to.have.been.calledOnce;
			expect(logger.logError).to.have.been.calledWith(sinon.match.instanceOf(Error));

		});

		it('should search for .avsc files in input path and log error if search throws', async () => {

			// Given
			const
				input = {
					argv: {
						inputUrl: 'inputTest',
						outputUrl: 'outputTest'
					}
				},
				expectedError = new Error('test');

			read.readFilesWithExtension.throws(expectedError);

			// When
			await service.generateApexTransport(input);

			// Then
			expect(read.readFilesWithExtension).to.have.been.calledOnce;
			expect(logger.logError).to.have.been.calledOnce;
			expect(read.readFilesWithExtension).to.have.been.calledWith(resolve(process.cwd(), input.argv.inputUrl));
			expect(logger.logError).to.have.been.calledWith(expectedError);

		});

		it('should deserialize schemas and log if deserialize fails', async () => {

			// Given
			const input = {
				argv: {
					inputUrl: 'inputTest',
					outputUrl: 'outputTest'
				}
			};

			read.readFilesWithExtension.returns({
				file: 'a'
			});

			// When
			await service.generateApexTransport(input);

			// Then
			expect(read.readFilesWithExtension).to.have.been.calledOnce;
			expect(logger.logError).to.have.been.calledOnce;
			expect(read.readFilesWithExtension).to.have.been.calledWith(resolve(process.cwd(), input.argv.inputUrl));
			expect(logger.logError).to.have.been.calledWith(sinon.match.instanceOf(Error));

		});

		it('should generate apex transport and log if generate fails', async () => {

			// Given
			const
				input = {
					argv: {
						inputUrl: 'inputTest',
						outputUrl: 'outputTest'
					}
				},
				expectedError = new Error('test');

			read.readFilesWithExtension.returns({
				file: '{ "test": "test" }'
			});
			generate.generate.throws(expectedError);

			// When
			await service.generateApexTransport(input);

			// Then
			expect(read.readFilesWithExtension).to.have.been.calledOnce;
			expect(generate.generate).to.have.been.calledOnce;
			expect(logger.logError).to.have.been.calledOnce;
			expect(read.readFilesWithExtension).to.have.been.calledWith(resolve(process.cwd(), input.argv.inputUrl));
			expect(generate.generate).to.have.been.calledWith([{ test: 'test' }]);
			expect(logger.logError).to.have.been.calledWith(expectedError);

		});

		it('should save generated apex transport and log if save fails', async () => {

			// Given
			const
				input = {
					argv: {
						inputUrl: 'inputTest',
						outputUrl: 'outputTest'
					}
				},
				expectedError = new Error('test');

			read.readFilesWithExtension.returns({
				file: '{ "test": "test" }'
			});
			generate.generate.returns({
				cls: 'testCls',
				xml: 'testXml'
			});
			overwriteFile.overwriteFile.throws(expectedError);

			// When
			await service.generateApexTransport(input);

			// Then
			expect(read.readFilesWithExtension).to.have.been.calledOnce;
			expect(generate.generate).to.have.been.calledOnce;
			expect(overwriteFile.overwriteFile).to.have.been.calledOnce;
			expect(logger.logError).to.have.been.calledOnce;
			expect(read.readFilesWithExtension).to.have.been.calledWith(resolve(process.cwd(), input.argv.inputUrl));
			expect(generate.generate).to.have.been.calledWith([{ test: 'test' }]);
			expect(overwriteFile.overwriteFile).to.have.been.calledWith(resolve(process.cwd(), input.argv.outputUrl), 'OrizuruTransport.cls', 'testCls');
			expect(logger.logError).to.have.been.calledWith(expectedError);

		});

		it('should save generated apex transport and log complete if save succeeds', async () => {

			// Given
			const input = {
				argv: {
					inputUrl: 'inputTest',
					outputUrl: 'outputTest'
				}
			};

			read.readFilesWithExtension.returns({
				file: '{ "test": "test" }'
			});
			generate.generate.returns({
				cls: 'testCls',
				xml: 'testXml'
			});
			overwriteFile.overwriteFile.resolves(true);

			// When
			await service.generateApexTransport(input);

			// Then
			expect(read.readFilesWithExtension).to.have.been.calledOnce;
			expect(generate.generate).to.have.been.calledOnce;
			expect(overwriteFile.overwriteFile).to.have.been.calledTwice;
			expect(logger.log).to.have.been.calledOnce;
			expect(read.readFilesWithExtension).to.have.been.calledWith(resolve(process.cwd(), input.argv.inputUrl));
			expect(generate.generate).to.have.been.calledWith([{ test: 'test' }]);
			expect(overwriteFile.overwriteFile).to.have.been.calledWith(resolve(process.cwd(), input.argv.outputUrl), 'OrizuruTransport.cls', 'testCls');
			expect(overwriteFile.overwriteFile).to.have.been.calledWith(resolve(process.cwd(), input.argv.outputUrl), 'OrizuruTransport.cls-meta.xml', 'testXml');
			expect(logger.log).to.have.been.calledWith('\nGenerated apex transport classes (OrizuruTransport.cls) in: ' + resolve(process.cwd(), input.argv.outputUrl));

		});

	});

});
