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
	_ = require('lodash'),
	chai = require('chai'),
	root = require('app-root-path'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	expect = chai.expect;

chai.use(sinonChai);

describe('util/logger.js', () => {

	let logger;

	beforeEach(() => {
		delete require.cache[root + '/src/lib/util/logger.js'];
		logger = require(root + '/src/lib/util/logger.js');
		sinon.stub(process.stdout, 'write');
	});

	afterEach(() => {
		const data = _.last(process.stdout.write.args);
		sinon.restore();
		process.stdout.write(data[0]);
	});

	describe('log', () => {

		it('should log out the message provided', () => {

			// given
			const
				message = 'test',
				expectedMessage = message + '\n';

			// when
			logger.log(message);

			// then
			expect(process.stdout.write).to.have.been.calledOnce;
			expect(process.stdout.write).to.have.been.calledWith(expectedMessage);

		});

		it('should not log out the message if silent mode is enabled', () => {

			// given
			const message = 'test';

			// when
			logger.log(message, { silent: true });

			// then
			expect(process.stdout.write).to.not.have.been.called;

		});

		it('should log out each line of a messsage array', () => {

			// given
			const
				line1 = 'test',
				line2 = 'test2',
				message = ['test', 'test2'],
				expectedMessage = line1 + '\n' + line2 + '\n';

			// when
			logger.log(message);

			// then
			expect(process.stdout.write).to.have.been.calledOnce;
			expect(process.stdout.write).to.have.been.calledWith(expectedMessage);

		});

	});

	describe('logError', () => {

		it('should log out the error message', () => {

			// given
			const
				expectedError = 'error',
				expectedMessage = expectedError + '\n\n',
				error = new Error(expectedError);

			// when
			logger.logError(error);

			// then
			expect(process.stdout.write).to.have.been.calledOnce;
			expect(process.stdout.write).to.have.been.calledWith(expectedMessage);

		});

	});

	describe('logEvent', () => {

		it('should log out the message provided', () => {

			// given
			const
				message = 'test',
				expectedMessage = message + '\n';

			// when
			logger.logEvent(message)();

			// then
			expect(process.stdout.write).to.have.been.calledOnce;
			expect(process.stdout.write).to.have.been.calledWith(expectedMessage);

		});

	});

	describe('logFinish', () => {

		it('should not log out undefined', () => {

			// given
			const message = undefined;

			// when
			logger.logFinish(message)();

			// then
			expect(process.stdout.write).to.not.have.been.called;

		});

		it('should log out the message provided', () => {

			// given
			const
				message = 'test',
				expectedMessage = message + '\n\n';

			// when
			logger.logFinish(message)();

			// then
			expect(process.stdout.write).to.have.been.calledOnce;
			expect(process.stdout.write).to.have.been.calledWith(expectedMessage);

		});

	});

	describe('logLn', () => {

		it('should log out the message provided with a new line at the end', () => {

			// given
			const
				message = 'test',
				expectedMessage = message + '\n\n';

			// when
			logger.logLn(message);

			// then
			expect(process.stdout.write).to.have.been.calledOnce;
			expect(process.stdout.write).to.have.been.calledWith(expectedMessage);

		});

	});

	describe('logLns', () => {

		it('should log out the message provided with a new line at the start and end', () => {

			// given
			const
				message = 'test',
				expectedMessage = '\n' + message + '\n';

			// when
			logger.logLns(message);

			// then
			expect(process.stdout.write).to.have.been.calledOnce;
			expect(process.stdout.write).to.have.been.calledWith(expectedMessage);

		});

	});

	describe('logStart', () => {

		it('should not log out undefined', () => {

			// given
			const message = undefined;

			// when
			logger.logStart(message)();

			// then
			expect(process.stdout.write).to.not.have.been.called;

		});

		it('should log out the message provided', () => {

			// given
			const
				message = 'test',
				expectedMessage = '\n' + message + '\n';

			// when
			logger.logStart(message)();

			// then
			expect(process.stdout.write).to.have.been.calledOnce;
			expect(process.stdout.write).to.have.been.calledWith(expectedMessage);

		});

	});

});
