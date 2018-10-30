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
	proxyquire = require('proxyquire').noCallThru(),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	expect = chai.expect,

	schemas = require('../lib/boilerplate/schema'),
	read = require('../lib/boilerplate/read'),
	defaultTransport = require('../lib/boilerplate/transport'),
	orizuru = require('@financialforcedev/orizuru'),

	sandbox = sinon.sandbox.create(),
	restore = sandbox.restore.bind(sandbox);

chai.use(sinonChai);

describe('web.js', () => {

	let
		addGetSpy, addRouteSpy, getServerStub, serverListenSpy,
		authMiddleware, idMiddleware, middleware,
		responseWriterStub, throngStub;

	beforeEach(() => {
		responseWriterStub = sandbox.stub();
		authMiddleware = [];
		middleware = authMiddleware.concat(idMiddleware);
		serverListenSpy = sandbox.spy();
		getServerStub = sandbox.stub().returns({
			listen: serverListenSpy
		});
		addRouteSpy = sandbox.spy();
		addGetSpy = sandbox.spy();
		sandbox.stub(orizuru, 'Server').callsFake(function () {
			this.addGet = addGetSpy;
			this.addRoute = addRouteSpy;
			this.getServer = getServerStub;
		});
		sandbox.stub(read, 'readSchema').returns({ mock: true });
		sandbox.stub(schemas, 'getWebSchemas').returns([{
			path: 'api/test1.avsc',
			sharedPath: '/api',
			fileName: 'test1'
		}, {
			path: 'api/test2.avsc',
			sharedPath: '/api',
			fileName: 'test2'
		}]);
		orizuru.Server.emitter = {
			on: sandbox.stub()
		};
	});

	afterEach(() => {
		restore();
		delete process.env.WEB_CONCURRENCY;
	});

	it('should create an orizuru server', () => {

		// given
		proxyquire('../lib/web', {
			['./boilerplate/auth']: {
				middleware: authMiddleware
			},
			['./boilerplate/id']: {
				middleware: idMiddleware,
				responseWriter: responseWriterStub
			}
		});

		// when - then
		expect(orizuru.Server).to.have.been.calledOnce;
		expect(orizuru.Server).to.have.been.calledWithNew;
		expect(orizuru.Server, defaultTransport);

		expect(addRouteSpy).to.have.been.calledOnce;
		expect(addRouteSpy).to.have.calledWith({
			schemaNameToDefinition: {
				test1: { mock: true },
				test2: { mock: true }
			},
			apiEndpoint: '/api',
			middlewares: middleware,
			responseWriter: responseWriterStub
		});

		expect(getServerStub).to.have.been.calledOnce;

		expect(serverListenSpy).to.have.been.calledOnce;
		expect(serverListenSpy).to.have.been.calledWith(8080);

	});

	it('should create an orizuru server cluster', () => {

		// given
		throngStub = sandbox.stub();
		throngStub.yields();
		process.env.WEB_CONCURRENCY = 2;

		proxyquire('../lib/web', {
			['./boilerplate/auth']: {
				middleware: authMiddleware
			},
			['./boilerplate/id']: {
				middleware: idMiddleware,
				responseWriter: responseWriterStub
			},
			throng: throngStub
		});

		// when - then
		expect(orizuru.Server).to.have.been.calledOnce;
		expect(orizuru.Server).to.have.been.calledWith(defaultTransport);

		expect(addRouteSpy).to.have.been.calledOnce;
		expect(addRouteSpy).to.have.been.calledWith({
			schemaNameToDefinition: {
				test1: { mock: true },
				test2: { mock: true }
			},
			apiEndpoint: '/api',
			middlewares: middleware,
			responseWriter: responseWriterStub
		});

		expect(getServerStub).to.have.been.calledOnce;

		expect(serverListenSpy).to.have.been.calledOnce;
		expect(serverListenSpy).to.have.been.calledWith(8080);

		expect(throngStub).to.have.been.calledOnce;
		expect(throngStub).to.have.been.calledWith('2', sinon.match.any);

	});

});
