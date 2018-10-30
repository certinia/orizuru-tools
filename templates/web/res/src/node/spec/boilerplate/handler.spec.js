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
	proxyquire = require('proxyquire'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create(),
	restore = sandbox.restore.bind(sandbox);

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('boilerplate/handler.js', () => {

	let handlers, mocks;

	beforeEach(() => {

		mocks = {};
		mocks.walk = sandbox.stub();
		mocks.walk.walk = sandbox.stub().returns([]);

		handlers = proxyquire('../../lib/boilerplate/handler', {
			'./walk': mocks.walk
		});

	});

	afterEach(() => {
		restore();
	});

	describe('get', () => {

		it('should return all handlers in the handler folder', () => {

			// when - then
			expect(handlers.get()).to.eql([]);

		});

	});

	describe('publishHandler', () => {

		it('should return a function', () => {

			// given 
			const
				schemasAndHandler = sandbox.stub(),
				publisherInstance = sandbox.stub();

			// when - then
			expect(handlers.publishHandler({
				schemasAndHandler,
				publisherInstance
			})).to.be.a('function');

		});

		it('should publish an ongoing message', () => {

			// given 
			const
				expectedEvent = {
					context: sandbox.stub()
				},
				expectedResult = sandbox.stub(),
				schemasAndHandler = {
					handler: sandbox.stub().resolves(expectedResult),
					schema: {
						outgoing: sandbox.stub()
					}
				},
				publisherInstance = {
					publish: sandbox.stub()
				},
				config = {
					schemasAndHandler,
					publisherInstance
				};

			// when - then
			return expect(handlers.publishHandler(config)(expectedEvent))
				.to.eventually.fulfilled
				.then(() => {
					expect(schemasAndHandler.handler).to.have.been.calledOnce;
					expect(publisherInstance.publish).to.have.been.calledOnce;
					expect(schemasAndHandler.handler).to.have.been.calledWith(expectedEvent);
					expect(publisherInstance.publish).to.have.been.calledWith({ context: expectedEvent.context, message: expectedResult, schema: schemasAndHandler.schema.outgoing });
				});

		});

	});

});
