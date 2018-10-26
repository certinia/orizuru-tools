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
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	fs = require('fs-extra'),
	inquirer = require('inquirer'),

	logger = require('../../../lib/util/logger'),

	packageJson = require('../../../lib/service/init/packageJson'),

	expect = chai.expect;

chai.use(sinonChai);

describe('service/init/packageJson.js', () => {

	beforeEach(() => {

		sinon.stub(process, 'cwd').returns('currentWorkingDirectory');

		sinon.stub(fs, 'readJson');
		sinon.stub(fs, 'writeJson');

		sinon.stub(inquirer, 'prompt');

		sinon.stub(logger, 'logEvent');
		sinon.stub(logger, 'logFinish');
		sinon.stub(logger, 'logLn');

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('askQuestions', () => {

		it('should use the default package.json if the command line arguments useDefaults option is set', () => {

			// Given
			const
				argv = {
					useDefaults: true
				},
				expectedInput = {
					argv
				},
				expectedPackageJson = {
					name: 'orizuru',
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

			// When
			expect(packageJson.askQuestions(expectedInput)).to.eql(expectedOutput);

			// Then
			expect(inquirer.prompt).to.not.have.been.called;

		});

		it('should prompt the user if the command line arguments useDefaults option is not set', async () => {

			// Given
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

			inquirer.prompt.resolves(expectedOutput);

			// When
			const output = await packageJson.askQuestions(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(inquirer.prompt).to.have.been.calledOnce;

		});

	});

	describe('build', () => {

		it('should build the package.json from the config', () => {

			// Given
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

			// When
			const output = packageJson.build(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);

		});

	});

	describe('create', () => {

		it('should create the package.json file', async () => {

			// Given
			const
				argv = {
					useDefaults: true
				},
				expectedInput = {
					argv
				},
				expectedPackageJson = {
					name: 'orizuru',
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
						'package': 'currentWorkingDirectory/currentWorkingDirectory/package.json'
					}
				};

			fs.readJson.resolves({});
			fs.writeJson.resolves(expectedPackageJson);

			// When
			const output = await packageJson.create(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(inquirer.prompt).to.not.have.been.called;

		});

	});

	describe('read', () => {

		it('should read the package.json file and add the contents to the config', async () => {

			// Given
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
						'package': 'currentWorkingDirectory/currentWorkingDirectory/package.json'
					}
				};

			fs.readJson.resolves(expectedPackageJson);

			// When
			const output = await packageJson.read(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(logger.logLn).to.not.have.been.called;
			expect(fs.readJson).to.have.been.calledOnce;
			expect(fs.readJson).to.have.been.calledWith('currentWorkingDirectory/currentWorkingDirectory/package.json');

		});

	});

	describe('write', () => {

		it('should write the config.package property to the package.json file', async () => {

			// Given
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
						'package': 'package.json'
					}
				},
				expectedOutput = expectedInput;

			fs.writeJson.resolves(expectedPackageJson);

			// When
			const output = await packageJson.write(expectedInput);

			// Then
			expect(output).to.eql(expectedOutput);
			expect(logger.logLn).to.not.have.been.called;
			expect(fs.writeJson).to.have.been.calledOnce;
			expect(fs.writeJson).to.have.been.calledWith('package.json', expectedPackageJson, { spaces: '\t' });

		});

	});

});
