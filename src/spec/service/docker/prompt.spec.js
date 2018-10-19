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

	expect = chai.expect;

chai.use(chaiAsPromised);

function createMocks() {
	return {
		inquirer: {
			prompt: sinon.stub()
		}
	};
}

describe('service/docker/prompt.js', () => {

	let mocks, prompt;

	beforeEach(() => {

		mocks = createMocks();

		prompt = proxyquire(root + '/src/lib/service/docker/prompt', {
			inquirer: mocks.inquirer
		});

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('getServicesForProcess', () => {

		it('should throw an error for no services', () => {

			// given
			const
				expectedMessage = 'testMessage',
				expectedInput = {};

			// when/then
			expect(() => prompt.getServicesForProcess(expectedMessage)(expectedInput))
				.to.throw('No services found');

		});

		it('should convert a services array to an object', () => {

			// given
			const
				expectedMessage = 'testMessage',
				expectedServiceName = 'testService',
				expectedInput = {
					argv: { _: ['d', 'bi', expectedServiceName] },
					docker: {
						services: [expectedServiceName]
					}
				},
				expectedOutput = {
					argv: { _: ['d', 'bi', expectedServiceName] },
					docker: {
						selected: {
							services: {
								[expectedServiceName]: expectedServiceName
							}
						},
						services: [expectedServiceName]
					}
				};

			// when/then
			expect(prompt.getServicesForProcess(expectedMessage)(expectedInput)).to.eql(expectedOutput);

		});

		it('should create the inquirer prompts for the given services', () => {

			// given
			const
				expectedMessage = 'testMessage',
				expectedServiceName = 'testService',
				expectedInput = {
					argv: { _: ['d', 'bi'] },
					docker: {
						services: [expectedServiceName]
					}
				},
				expectedAnswer = {
					services: [expectedServiceName]
				},
				expectedChoices = [{
					name: expectedServiceName
				}],
				expectedOutput = {
					argv: { _: ['d', 'bi'] },
					docker: {
						selected: {
							services: {
								[expectedServiceName]: expectedServiceName
							}
						},
						services: [expectedServiceName]
					}
				};

			mocks.inquirer.prompt.resolves(expectedAnswer);

			// when/then
			return expect(prompt.getServicesForProcess(expectedMessage)(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.inquirer.prompt.args[0][0][0].choices).to.eql(expectedChoices);
				});

		});

		it('should handle the all option', () => {

			// given
			const
				expectedMessage = 'testMessage',
				expectedServiceName = 'testService',
				expectedServices = {
					[expectedServiceName]: 'test1.yml',
					rejectedServiceName: 'test2.yml'
				},
				expectedInput = {
					argv: { _: ['d', 'bi'], a: true },
					docker: {
						services: expectedServices
					}
				},
				expectedOutput = {
					argv: { _: ['d', 'bi'], a: true },
					docker: {
						selected: {
							services: expectedServices
						},
						services: expectedServices
					}
				},

				// when
				services = prompt.getServicesForProcess(expectedMessage)(expectedInput);

			// then
			expect(services).to.eql(expectedOutput);

		});

		it('should throw an error if no service is found', () => {

			// given
			const
				expectedMessage = 'testMessage',
				expectedServiceName = 'testService',
				expectedInput = {
					argv: { _: ['d', 'bi', expectedServiceName] },
					docker: {
						services: ['otherService']
					}
				};

			// when/then
			expect(() => prompt.getServicesForProcess(expectedMessage)(expectedInput))
				.to.throw('Service not found: ' + expectedServiceName);

		});

	});

});
