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

describe('service/init/readAppTemplates.js', () => {

	let mocks, readAppTemplates;

	beforeEach(() => {

		const lstatResultMock = {
			isDirectory: sandbox.stub()
		};

		mocks = {
			fs: {
				lstatSync: sandbox.stub().returns(lstatResultMock),
				readdirSync: sandbox.stub().returns([
					'a',
					'b.js'
				])
			}
		};

		lstatResultMock.isDirectory.onFirstCall().returns(true);
		lstatResultMock.isDirectory.onSecondCall().returns(false);

		readAppTemplates = proxyquire(root + '/src/lib/service/init/readAppTemplates', {
			fs: mocks.fs
		});

	});

	afterEach(() => sandbox.restore());

	describe('readAppTemplates', () => {

		it('should read folder for names, stripping out files', () => {

			// given
			const
				templatesFolder = root + '/templates',
				folder = 'simple-example';

			// when - then
			expect(readAppTemplates.readAppTemplates({ templatesFolder, folder })).to.eql({
				templatesFolder,
				folder,
				appFolders: [templatesFolder + '/a']
			});

			expect(mocks.fs.readdirSync).to.have.been.calledOnce;
			expect(mocks.fs.lstatSync).to.have.been.calledTwice;
			expect(mocks.fs.readdirSync).to.have.been.calledWith(templatesFolder);
			expect(mocks.fs.lstatSync).to.have.been.calledWith(templatesFolder + '/a');
			expect(mocks.fs.lstatSync).to.have.been.calledWith(templatesFolder + '/b.js');

		});

	});

});
