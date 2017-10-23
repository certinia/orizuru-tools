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

	sinon = require('sinon'),
	{ calledOnce, calledWith, calledWithNew } = sinon.assert,

	sandbox = sinon.sandbox.create(),
	restore = sandbox.restore.bind(sandbox),

	schemas = require(root + '/src/lib/boilerplate/shared/schemas'),
	read = require(root + '/src/lib/boilerplate/shared/read'),
	defaultTransport = require(root + '/src/lib/boilerplate/shared/transport'),
	orizuru = require('@financialforcedev/orizuru');

describe('boilerplate/web.js', () => {

	let addRouteSpy, getServerStub, serverListenSpy;

	beforeEach(() => {
		serverListenSpy = sandbox.spy();
		getServerStub = sandbox.stub().returns({
			listen: serverListenSpy
		});
		addRouteSpy = sandbox.spy();
		sandbox.stub(orizuru, 'Server').callsFake(function () {
			this.addRoute = addRouteSpy;
			this.getServer = getServerStub;
		});
		sandbox.stub(read, 'readSchema').returns({ mock: true });
		sandbox.stub(schemas, 'get').returns([{
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

	afterEach(restore);

	it('should create an orizuru server', () => {

		// given
		require(root + '/src/lib/boilerplate/web');

		// when - then
		calledOnce(orizuru.Server);
		calledWithNew(orizuru.Server);
		calledWith(orizuru.Server, defaultTransport);

		calledOnce(addRouteSpy);
		calledWith(addRouteSpy, {
			schemaNameToDefinition: {
				test1: { mock: true },
				test2: { mock: true }
			},
			apiEndpoint: '/api',
			middlewares: []
		});

		calledOnce(getServerStub);
		calledWith(getServerStub);

		calledOnce(serverListenSpy);
		calledWith(serverListenSpy, 8080);

	});

});
