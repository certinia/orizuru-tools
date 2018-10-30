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

	sandbox = sinon.sandbox.create(),
	restore = sandbox.restore.bind(sandbox);

chai.use(sinonChai);

describe('boilerplate/auth.js', () => {

	let
		auth, tokenValidatorStub, grantCheckerStub,
		tokenValidatorResult, grantCheckerResult, getTokenStub;

	beforeEach(() => {

		tokenValidatorStub = sandbox.stub();
		tokenValidatorResult = sandbox.stub();

		grantCheckerStub = sandbox.stub();
		grantCheckerResult = sandbox.stub();
		getTokenStub = sandbox.stub();

		tokenValidatorStub.returns(tokenValidatorResult);
		grantCheckerStub.returns(grantCheckerResult);

		process.env.JWT_SIGNING_KEY = '123';
		process.env.OPENID_CLIENT_ID = '456';
		process.env.OPENID_HTTP_TIMEOUT = '5333';
		process.env.OPENID_ISSUER_URI = 'http://test';

		auth = proxyquire('../../lib/boilerplate/auth', {
			['@financialforcedev/orizuru-auth']: {
				middleware: {
					tokenValidator: tokenValidatorStub,
					grantChecker: grantCheckerStub
				},
				grant: {
					getToken: getTokenStub
				}
			}
		});

	});

	afterEach(() => {
		delete process.env.JWT_SIGNING_KEY;
		delete process.env.OPENID_CLIENT_ID;
		delete process.env.OPENID_HTTP_TIMEOUT;
		delete process.env.OPENID_ISSUER_URI;
		restore();
	});

	describe('middleware', () => {

		it('should return middleware and grant', () => {

			// given - when
			const middleware = auth.middleware;

			// then
			expect(middleware.length).to.eql(2);
			expect(middleware[0]).to.eql(tokenValidatorResult);
			expect(middleware[1]).to.eql(grantCheckerResult);

			expect(getTokenStub).to.have.been.calledOnce;
			expect(tokenValidatorStub).to.have.been.calledOnce;
			expect(tokenValidatorStub).to.have.been.calledWith({
				jwtSigningKey: '123',
				openidClientId: '456',
				openidHTTPTimeout: 5333,
				openidIssuerURI: 'http://test'
			});

		});

	});

});
