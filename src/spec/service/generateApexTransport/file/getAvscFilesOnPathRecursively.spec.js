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
	chai = require('chai'),
	chaiAsPromised = require('chai-as-promised'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire'),

	expect = chai.expect,

	{ calledOnce, calledTwice, calledWith } = sinon.assert,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);

describe('service/generateApexTransport/file/getAvscFilesOnPathRecursively.js', () => {

	let startPath, mocks, getAvscFilesOnPathRecursively;

	beforeEach(() => {
		startPath = 'startPath/';
		mocks = {
			klawSync: sandbox.stub().returns([{
				path: startPath + 'a/b/c.avsc'
			}, {
				path: startPath + 'd/e/f.avsc'
			}]),
			readFileSync: sandbox.stub().returns(new Buffer('potato'))
		};
		getAvscFilesOnPathRecursively = proxyquire(root + '/src/lib/service/generateApexTransport/file/getAvscFilesOnPathRecursively', {
			'klaw-sync': mocks.klawSync,
			fs: {
				readFileSync: mocks.readFileSync
			}
		});
	});

	afterEach(() => sandbox.restore());

	describe('getAvscFilesOnPathRecursively', () => {

		it('should call klawSync and process results', () => {

			// given
			const
				expected = [{
					file: 'potato',
					fileName: 'c',
					path: 'startPath/a/b/c.avsc',
					sharedPath: 'a/b'
				}, {
					file: 'potato',
					fileName: 'f',
					path: 'startPath/d/e/f.avsc',
					sharedPath: 'd/e'
				}];

			// when - then
			expect(getAvscFilesOnPathRecursively(startPath)).to.eql(expected);

			calledOnce(mocks.klawSync);
			calledWith(mocks.klawSync, startPath, {
				nodir: true,
				filter: sinon.match.func
			});

			expect(mocks.klawSync.args[0][1].filter({ path: 'a.avsc' })).to.eql(true);
			expect(mocks.klawSync.args[0][1].filter({ path: 'a.js' })).to.eql(false);

			calledTwice(mocks.readFileSync);
			calledWith(mocks.readFileSync, startPath + 'a/b/c.avsc');
			calledWith(mocks.readFileSync, startPath + 'd/e/f.avsc');

		});

	});

});
