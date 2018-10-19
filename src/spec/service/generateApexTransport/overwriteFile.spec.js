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
	root = require('app-root-path'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/generateApexTransport/overwriteFile.js', () => {

	let mocks, overwriteFile;

	beforeEach(() => {

		mocks = {};
		mocks.fs = {};
		mocks.fs.writeFile = sinon.stub();

		overwriteFile = proxyquire(root + '/src/lib/service/generateApexTransport/overwriteFile', {
			'fs-extra': mocks.fs
		});

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('overwriteFile', () => {

		it('should call fs.writeFile with the correct params', () => {

			// given
			const
				path = 'a',
				file = 'b',
				content = 'c',
				expected = 'd';

			mocks.fs.writeFile.resolves(expected);

			// when - then
			return expect(overwriteFile(path, file, content))
				.to.eventually.eql(expected)
				.then(() => {
					expect(mocks.fs.writeFile).to.have.been.calledOnce;
					expect(mocks.fs.writeFile).to.have.been.calledWith(process.cwd() + '/' + path + '/' + file, content, { flag: 'w' });
				});

		});

	});

});
