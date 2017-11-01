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

	proxyquire = require('proxyquire').noCallThru(),

	sinon = require('sinon'),
	{ calledOnce, calledWith } = sinon.assert,

	sandbox = sinon.sandbox.create(),
	restore = sandbox.restore.bind(sandbox),

	{ expect } = require('chai');

describe('boilerplate/shared/id.js', () => {

	let id, uuidStub;

	beforeEach(() => {
		uuidStub = sandbox.stub();
		uuidStub.returns('aaa123');
		id = proxyquire(root + '/src/node/lib/boilerplate/shared/id', {
			uuid: uuidStub
		});
	});

	afterEach(() => {
		restore();
	});

	describe('middleware', () => {

		it('should return single function that sets id on the orizuru object', () => {

			// given - when - then
			const
				middleware = id.middleware;

			expect(middleware.length).to.eql(1);
		});

		it('function should set orizuru object and set id on it', () => {

			// given - when - then
			const
				middleware = id.middleware,
				next = sandbox.stub(),
				req = {},
				res = {};

			middleware[0](req, res, next);

			expect(req.orizuru.id).to.eql('aaa123');
			calledOnce(uuidStub);
		});

		it('function should set id on it', () => {

			// given - when - then
			const
				middleware = id.middleware,
				next = sandbox.stub(),
				req = { orizuru: {} },
				res = {};

			middleware[0](req, res, next);

			expect(req.orizuru.id).to.eql('aaa123');
			calledOnce(uuidStub);
		});

	});

	describe('responseWriter', () => {

		it('should write a happy result to the response', () => {

			// given - when - then

			const
				jsonStub = sandbox.stub(),
				responseWriter = id.responseWriter,
				res = {
					json: jsonStub
				},
				orizuru = { id: '123' };

			responseWriter(null, res, orizuru);

			calledOnce(jsonStub);
			calledWith(jsonStub, {
				id: '123'
			});
		});

		it('should write an error result to the response', () => {

			// given - when - then

			const
				statusStub = sandbox.stub(),
				sendStub = sandbox.stub(),
				responseWriter = id.responseWriter,
				res = {
					status: statusStub,
					send: sendStub
				},
				orizuru = { id: '123' };

			statusStub.returns(res);
			responseWriter(new Error('Test error.'), res, orizuru);

			calledOnce(statusStub);
			calledWith(statusStub, 400);
			calledOnce(sendStub);
			calledWith(sendStub, 'Test error.');
		});

	});

});
