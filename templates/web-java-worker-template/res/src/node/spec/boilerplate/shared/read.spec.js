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

	sandbox = sinon.sandbox.create(),
	restore = sandbox.restore.bind(sandbox),

	{ expect } = require('chai');

describe('boilerplate/shared/read.js', () => {

	let read, readFileSyncStub, dummy;

	beforeEach(() => {
		dummy = {};
		readFileSyncStub = sandbox.stub();
		read = proxyquire(root + '/src/node/lib/boilerplate/shared/read', {
			fs: {
				readFileSync: readFileSyncStub
			},
			dummy: dummy
		});
	});

	afterEach(() => {
		restore();
	});

	describe('readSchema', () => {

		it('should read a schema file to json', () => {

			// given - when - then

			readFileSyncStub.returns(Buffer.from('{"a": "b"}'));

			expect(read.readSchema('blah')).to.eql({
				a: 'b'
			});

		});

	});

	describe('readHandler', () => {

		it('should read a handler file', () => {

			// given - when - then

			readFileSyncStub.returns(Buffer.from('{"a": "b"}'));

			expect(read.readHandler('dummy')).to.eql(dummy);

		});

	});

});