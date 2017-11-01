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
	proxyquire = require('proxyquire').noCallThru(),
	root = require('app-root-path'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	expect = chai.expect,

	schemas = require(root + '/src/node/lib/boilerplate/shared/schemas'),
	handlers = require(root + '/src/node/lib/boilerplate/shared/handlers'),
	read = require(root + '/src/node/lib/boilerplate/shared/read'),
	defaultTransport = require(root + '/src/node/lib/boilerplate/shared/transport'),
	orizuru = require('@financialforcedev/orizuru'),

	sandbox = sinon.sandbox.create(),
	restore = sandbox.restore.bind(sandbox);

chai.use(sinonChai);

describe('boilerplate/worker.js', () => {

	let handleSpy, throngStub;

	beforeEach(() => {
		handleSpy = sandbox.spy();
		throngStub = sandbox.stub();
		sandbox.stub(orizuru, 'Handler').callsFake(function () {
			this.handle = handleSpy;
		});
		sandbox.stub(read, 'readSchema').returns({ mock: true });
		sandbox.stub(read, 'readHandler').returns({ mockHandler: true });
		sandbox.stub(schemas, 'get');
		sandbox.stub(handlers, 'get');
		orizuru.Handler.emitter = {
			on: sandbox.stub()
		};
	});

	afterEach(() => {
		delete require.cache[require.resolve(root + '/src/node/lib/boilerplate/worker')];
		delete process.env.WEB_CONCURRENCY;

		restore();
	});

	it('should create an orizuru handler', () => {

		// given
		schemas.get.returns([{
			path: 'api/test1.avsc',
			sharedPath: '/api',
			fileName: 'test1'
		}, {
			path: 'api/test2.avsc',
			sharedPath: '/api',
			fileName: 'test2'
		}]);
		handlers.get.returns([{
			path: 'api/test1.js',
			sharedPath: '/api',
			fileName: 'test1'
		}, {
			path: 'api/test2.js',
			sharedPath: '/api',
			fileName: 'test2'
		}]);

		// when
		require(root + '/src/node/lib/boilerplate/worker');

		// then
		expect(orizuru.Handler).to.have.been.calledOnce;
		expect(orizuru.Handler).to.have.been.calledWithNew;
		expect(orizuru.Handler).to.have.been.calledWith(defaultTransport);

		expect(handleSpy).to.have.been.calledTwice;
		expect(handleSpy).to.have.been.calledWith({
			schema: { mock: true },
			callback: { mockHandler: true }
		});
		expect(handleSpy).to.have.been.calledWith({
			schema: { mock: true },
			callback: { mockHandler: true }
		});

	});

	it('should create an orizuru handler cluster', () => {

		// given

		throngStub = sandbox.stub();
		throngStub.yields();
		process.env.WEB_CONCURRENCY = 2;

		schemas.get.returns([{
			path: 'api/test1.avsc',
			sharedPath: '/api',
			fileName: 'test1'
		}, {
			path: 'api/test2.avsc',
			sharedPath: '/api',
			fileName: 'test2'
		}]);
		handlers.get.returns([{
			path: 'api/test1.js',
			sharedPath: '/api',
			fileName: 'test1'
		}, {
			path: 'api/test2.js',
			sharedPath: '/api',
			fileName: 'test2'
		}]);

		// when
		proxyquire(root + '/src/node/lib/boilerplate/worker', {
			throng: throngStub
		});

		// then
		expect(orizuru.Handler).to.have.been.calledOnce;
		expect(orizuru.Handler).to.have.been.calledWithNew;
		expect(orizuru.Handler).to.have.been.calledWith(defaultTransport);

		expect(handleSpy).to.have.been.calledTwice;
		expect(handleSpy).to.have.been.calledWith({
			schema: { mock: true },
			callback: { mockHandler: true }
		});
		expect(handleSpy).to.have.been.calledWith({
			schema: { mock: true },
			callback: { mockHandler: true }
		});

		expect(throngStub).to.have.been.calledOnce;
		expect(throngStub).to.have.been.calledWith('2', sinon.match.any);

	});

	it('should not register a handler if no handler for a schema exists', () => {

		// given
		schemas.get.returns([{
			path: 'api/test1.avsc',
			sharedPath: '/api',
			fileName: 'test1'
		}]);
		handlers.get.returns([{
			path: 'api/test1.js',
			sharedPath: '/api',
			fileName: 'test1'
		}, {
			path: 'api/test2.js',
			sharedPath: '/api',
			fileName: 'test2'
		}]);

		// when
		require(root + '/src/node/lib/boilerplate/worker');

		// then
		expect(orizuru.Handler).to.have.been.calledOnce;
		expect(orizuru.Handler).to.have.been.calledWithNew;
		expect(orizuru.Handler).to.have.been.calledWith(defaultTransport);

		expect(handleSpy).to.have.been.calledOnce;
		expect(handleSpy).to.have.been.calledWith({
			schema: { mock: true },
			callback: { mockHandler: true }
		});

	});

	it('should not register a handler if schema for a handler exists', () => {

		// given
		schemas.get.returns([{
			path: 'api/test1.avsc',
			sharedPath: '/api',
			fileName: 'test1'
		}, {
			path: 'api/test2.avsc',
			sharedPath: '/api',
			fileName: 'test2'
		}]);
		handlers.get.returns([{
			path: 'api/test1.js',
			sharedPath: '/api',
			fileName: 'test1'
		}]);

		// when
		require(root + '/src/node/lib/boilerplate/worker');

		// then
		expect(orizuru.Handler).to.have.been.calledOnce;
		expect(orizuru.Handler).to.have.been.calledWithNew;
		expect(orizuru.Handler).to.have.been.calledWith(defaultTransport);

		expect(handleSpy).to.have.been.calledOnce;
		expect(handleSpy).to.have.been.calledWith({
			schema: { mock: true },
			callback: { mockHandler: true }
		});

	});

});
