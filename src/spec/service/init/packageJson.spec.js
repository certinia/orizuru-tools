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

describe('service/init/packageJson.js', () => {

	let packageJson, mocks;

	beforeEach(() => {

		mocks = {};

		mocks.debug = sandbox.stub();
		mocks.debug.log = sandbox.stub();
		mocks.debug.stringify = sandbox.stub();

		mocks.fs = sandbox.stub();
		mocks.fs.readJson = sandbox.stub();
		mocks.fs.writeJson = sandbox.stub();

		mocks.inquirer = sandbox.stub();
		mocks.inquirer.prompt = sandbox.stub();

		mocks.logger = sandbox.stub();
		mocks.logger.logEvent = sandbox.stub();
		mocks.logger.logFinish = sandbox.stub();
		mocks.logger.logLn = sandbox.stub();

		packageJson = proxyquire(root + '/src/lib/service/init/packageJson', {
			'fs-extra': mocks.fs,
			inquirer: mocks.inquirer,
			'../../util/debug': mocks.debug,
			'../../util/logger': mocks.logger
		});

	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('askQuestions', () => {

		it('should use the default package.json if the command line arguments useDefaults option is set', () => {

			// given
			const
				argv = {
					useDefaults: true
				},
				expectedInput = {
					argv
				},
				expectedPackageJson = {
					name: 'Orizuru',
					version: '1.0.0',
					description: '',
					main: 'src/node/lib/web.js',
					author: 'FinancialForce',
					license: 'BSD-3-Clause'
				},
				expectedOutput = {
					argv,
					'package': expectedPackageJson
				};

			// when
			expect(packageJson.askQuestions(expectedInput)).to.eql(expectedOutput);

			// then
			expect(mocks.inquirer.prompt).to.not.have.been.called;

		});

		it('should prompt the user if the command line arguments useDefaults option is not set', () => {

			// given
			const
				expectedInput = {},
				expectedPackageJson = {
					name: 'Orizuru',
					version: '1.0.0',
					description: '',
					main: 'src/node/lib/web.js',
					author: 'FinancialForce',
					license: 'BSD-3-Clause'
				},
				expectedOutput = {
					'package': expectedPackageJson
				};

			mocks.inquirer.prompt.resolves(expectedOutput);

			// when - then
			return expect(packageJson.askQuestions(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.inquirer.prompt).to.have.been.calledOnce;
				});

		});

	});

	describe('build', () => {

		it('should build the package.json from the config', () => {

			// given
			const
				expectedPackageJson = {
					name: '@financialforcedev/orizuru-tools',
					version: '1.0.0',
					description: 'Development tools for the Orizuru framework.'
				},
				selectedTemplate = {
					configuration: {
						extensions: {
							a: {
								'package': {
									name: '@financialforcedev/orizuru-tools',
									version: '1.0.0'
								}
							},
							b: {}
						},
						file: {
							'package': {
								description: 'Development tools for the Orizuru framework.'
							}
						}
					}
				},
				expectedInput = {
					'package': {},
					selectedTemplate
				},
				expectedOutput = {
					'package': expectedPackageJson,
					selectedTemplate
				};

			// when - then
			expect(packageJson.build(expectedInput)).to.eql(expectedOutput);

		});

	});

	describe('create', () => {

		it('should create the package.json file', () => {

			// given
			const
				argv = {
					useDefaults: true
				},
				expectedInput = {
					argv
				},
				expectedPackageJson = {
					name: 'Orizuru',
					version: '1.0.0',
					description: '',
					main: 'src/node/lib/web.js',
					author: 'FinancialForce',
					license: 'BSD-3-Clause'
				},
				expectedOutput = {
					argv,
					'package': expectedPackageJson,
					path: {
						'package': `${process.cwd()}/package.json`
					}
				};

			mocks.fs.readJson.resolves({});
			mocks.fs.writeJson.resolves(expectedPackageJson);

			// when - then
			return expect(packageJson.create(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.inquirer.prompt).to.not.have.been.called;
				});

		});

	});

	describe('read', () => {

		it('should read the package.json file and add the contents to the config', () => {

			// given
			const
				expectedPackageJson = {
					name: '@financialforcedev/orizuru-tools',
					version: '1.0.0',
					description: 'Development tools for the Orizuru framework.'
				},
				expectedInput = {},
				expectedOutput = {
					'package': expectedPackageJson,
					path: {
						'package': `${process.cwd()}/package.json`
					}
				};

			mocks.fs.readJson.resolves(expectedPackageJson);

			// when - then
			return expect(packageJson.read(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.logger.logLn).to.not.have.been.called;
					expect(mocks.fs.readJson).to.have.been.calledOnce;
					expect(mocks.fs.readJson).to.have.been.calledWith(root + '/package.json');
				});

		});

	});

	describe('write', () => {

		it('should write the config.package property to the package.json file', () => {

			// given
			const
				expectedPackageJson = {
					name: '@financialforcedev/orizuru-tools',
					version: '1.0.0',
					description: 'Development tools for the Orizuru framework.'
				},
				expectedInput = {
					argv: {
						useDefaults: true
					},
					'package': expectedPackageJson,
					path: {
						'package': `${process.cwd()}/package.json`
					}
				},
				expectedOutput = expectedInput;

			mocks.fs.writeJson.resolves(expectedPackageJson);

			// when - then
			return expect(packageJson.write(expectedInput))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.logger.logLn).to.not.have.been.called;
					expect(mocks.fs.writeJson).to.have.been.calledOnce;
					expect(mocks.fs.writeJson).to.have.been.calledWith(root + '/package.json', expectedPackageJson, { spaces: 2 });
				});

		});

	});

});
