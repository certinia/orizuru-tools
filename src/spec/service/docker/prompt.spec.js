/*
 * Copyright (c) 2017 FinancialForce.com, inc.  All rights reserved.
 *
 * This is a proof of concept.
 * It forms the basis of recommendations for architecture, patterns, dependencies, and has
 * some of the characteristics which will eventually be present in FF hybrid apps.
 *
 * However, it lacks important functionality and checks.
 * It does not conform to SOC1 or any other auditable process.
 *
 * We do not endorse any attempt to use this codebase as the blueprint for production code.
 */

'use strict';

const
	chai = require('chai'),
	chaiAsPromised = require('chai-as-promised'),
	proxyquire = require('proxyquire'),
	root = require('app-root-path'),
	sinon = require('sinon'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);

function createMocks() {
	return {
		inquirer: {
			prompt: sandbox.stub()
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
		sandbox.restore();
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
