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
	proxyquire = require('proxyquire'),
	sinon = require('sinon'),

	expect = chai.expect,

	testSchemas = [{
		path: '/Users/Guest/GIT/test/src/node/lib/schema/api/calculateRoutesForPlan.avsc',
		sharedPath: '/api',
		fileName: 'calculateRoutesForPlan'
	}, {
		path: '/Users/Guest/GIT/test/src/node/lib/schema/api/createData.avsc',
		sharedPath: '/api',
		fileName: 'createData'
	}, {
		path: '/Users/Guest/GIT/test/src/node/lib/schema/createData_incoming.avsc',
		sharedPath: '',
		fileName: 'createData_incoming'
	}, {
		path: '/Users/Guest/GIT/test/src/node/lib/schema/questionBuilder_incoming.avsc',
		sharedPath: '',
		fileName: 'questionBuilder_incoming'
	}, {
		path: '/Users/Guest/GIT/test/src/node/lib/schema/questionBuilder_outgoing.avsc',
		sharedPath: '',
		fileName: 'questionBuilder_outgoing'
	}, {
		path: '/Users/Guest/GIT/test/src/node/lib/schema/resultWriter_incoming.avsc',
		sharedPath: '',
		fileName: 'resultWriter_incoming'
	}],

	sandbox = sinon.sandbox.create(),
	restore = sandbox.restore.bind(sandbox);

describe('boilerplate/schema.js', () => {

	let mocks, schemas;

	beforeEach(() => {

		mocks = {};
		mocks.walk = sandbox.stub();
		mocks.walk.walk = sandbox.stub().returns(testSchemas);

		schemas = proxyquire('../../lib/boilerplate/schema', {
			'./walk': mocks.walk
		});

	});

	afterEach(() => {
		restore();
	});

	describe('getWebSchemas', () => {

		it('should return all the web schemas', () => {

			// Given
			const expectedOutput = {
				calculateRoutesForPlan: {
					fileName: 'calculateRoutesForPlan',
					path: '/Users/Guest/GIT/test/src/node/lib/schema/api/calculateRoutesForPlan.avsc',
					sharedPath: '/api'
				},
				createData: {
					fileName: 'createData',
					path: '/Users/Guest/GIT/test/src/node/lib/schema/api/createData.avsc',
					sharedPath: '/api'
				}
			};

			// When - then
			expect(schemas.getWebSchemas()).to.eql(expectedOutput);

		});

	});

	describe('getWorkerSchemas', () => {

		it('should return all the worker schemas', () => {

			// Given
			const expectedOutput = {
				createData: {
					incoming: {
						fileName: 'createData_incoming',
						path: '/Users/Guest/GIT/test/src/node/lib/schema/createData_incoming.avsc',
						sharedPath: ''
					}
				},
				questionBuilder: {
					incoming: {
						fileName: 'questionBuilder_incoming',
						path: '/Users/Guest/GIT/test/src/node/lib/schema/questionBuilder_incoming.avsc',
						sharedPath: ''
					},
					outgoing: {
						fileName: 'questionBuilder_outgoing',
						path: '/Users/Guest/GIT/test/src/node/lib/schema/questionBuilder_outgoing.avsc',
						sharedPath: ''
					}
				},
				resultWriter: {
					incoming: {
						fileName: 'resultWriter_incoming',
						path: '/Users/Guest/GIT/test/src/node/lib/schema/resultWriter_incoming.avsc',
						sharedPath: ''
					}
				}
			};

			// When - then
			expect(schemas.getWorkerSchemas()).to.eql(expectedOutput);

		});

	});

});