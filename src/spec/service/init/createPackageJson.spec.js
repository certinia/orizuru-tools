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
	chaiAsPromised = require('chai-as-promised'),
	proxyquire = require('proxyquire'),
	root = require('app-root-path'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/init/createPackageJson.js', () => {

	let mocks, createPackageJson;

	beforeEach(() => {

		mocks = {
			initPackageJson: sandbox.stub()
		};

		createPackageJson = proxyquire(root + '/src/lib/service/init/createPackageJson', {
			'init-package-json': mocks.initPackageJson
		});

	});

	afterEach(() => sandbox.restore());

	describe('createPackageJson', () => {

		it('should call initPackageJson and resolve with input if initPackageJson callback has no error', () => {

			// given
			const
				templatesFolder = root + '/templates',
				folder = 'simple-example';

			mocks.initPackageJson.callsArgWith(2, null);

			// when - then
			return expect(createPackageJson.createPackageJson({ templatesFolder, folder })).to.eventually.eql({ templatesFolder, folder })
				.then(() => {
					expect(mocks.initPackageJson).to.have.been.calledOnce;
					expect(mocks.initPackageJson).to.have.been.calledWith(process.cwd(), root + '/templates/simple-example/.config.js', sinon.match.func);
				});

		});

		it('should call initPackageJson and reject with error if initPackageJson callback has an error', () => {

			// given
			const
				templatesFolder = root + '/templates',
				folder = 'simple-example';

			mocks.initPackageJson.callsArgWith(2, new Error('err'));

			// when - then
			return expect(createPackageJson.createPackageJson({ templatesFolder, folder })).to.eventually.be.rejectedWith('err')
				.then(() => {
					expect(mocks.initPackageJson).to.have.been.calledOnce;
					expect(mocks.initPackageJson).to.have.been.calledWith(process.cwd(), root + '/templates/simple-example/.config.js', sinon.match.func);
				});

		});

	});

});
