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

describe('handler/account.js', () => {

	let handler, mocks;

	beforeEach(() => {

		process.env.JWT_SIGNING_KEY = '123';
		process.env.OPENID_CLIENT_ID = '456';
		process.env.OPENID_HTTP_TIMEOUT = '5333';
		process.env.OPENID_ISSUER_URI = 'http://test';

		class Connection {}

		mocks = {};

		mocks.auth = sandbox.stub();
		mocks.auth.grant = sandbox.stub();

		mocks.jsforce = sandbox.stub();
		mocks.jsforce.Connection = Connection;

		mocks.sobject = sandbox.stub();
		mocks.sobject.create = sandbox.stub();

		mocks.jsforce.Connection.prototype.sobject = sandbox.stub().returns(mocks.sobject);

		handler = proxyquire('../../lib/handler/account', {
			jsforce: mocks.jsforce,
			'../boilerplate/auth': mocks.auth
		});

	});

	afterEach(() => {

		delete process.env.JWT_SIGNING_KEY;
		delete process.env.OPENID_CLIENT_ID;
		delete process.env.OPENID_HTTP_TIMEOUT;
		delete process.env.OPENID_ISSUER_URI;

		restore();

	});

	describe('handler', () => {

		it('handler', () => {

			// given
			const event = {
				context: {
					user: 'test@test.com'
				},
				message: {
					ids: ['test id']
				}
			};

			mocks.auth.grant.resolves();

			// when - then
			return expect(handler(event))
				.to.eventually.be.fulfilled;

		});

	});

});
