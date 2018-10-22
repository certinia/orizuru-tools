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
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	inquirer = require('inquirer'),

	logger = require('../../../lib/util/logger'),
	shell = require('../../../lib/util/shell'),

	certificate = require('../../../lib/service/deploy/certificate'),

	expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/deploy/certificate.js', () => {

	beforeEach(() => {

		sinon.stub(shell, 'executeCommand');
		sinon.stub(shell, 'executeCommands');

		sinon.stub(inquirer, 'prompt');

		sinon.stub(logger, 'logStart');
		sinon.stub(logger, 'logEvent');
		sinon.stub(logger, 'logLn');
		sinon.stub(logger, 'logFinish');

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('checkOpenSSLInstalled', () => {

		it('should check that the OpenSSL is installed', () => {

			// Given
			const expectedCommand = { cmd: 'openssl', args: ['version'] };

			shell.executeCommand = sinon.stub().resolves('OpenSSL 0.9.8zh 14 Jan 2016');

			// When - Then
			return expect(certificate.checkOpenSSLInstalled({}))
				.to.eventually.eql({})
				.then(() => {
					expect(shell.executeCommand).to.have.been.calledOnce;
					expect(shell.executeCommand).to.have.been.calledWith(expectedCommand);
				});

		});

	});

	describe('generate', () => {

		it('should execute the correct commands', () => {

			// Given
			const
				expectedSslCommands = [{
					cmd: 'openssl',
					args: ['req', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'key.pem', '-x509', '-days', '365', '-out', 'certificate.pem', '-subj', '/C=GB/ST=North Yorkshire/L=Harrogate/O=FinancialForce/OU=Research Team/CN=test@test.com']
				}],
				expectedCertificateDetails = {
					country: 'GB',
					state: 'North Yorkshire',
					locality: 'Harrogate',
					organization: 'FinancialForce',
					organizationUnitName: 'Research Team',
					commonName: 'test@test.com'
				},
				expectedReadCommands = [
					{ cmd: 'cat', args: ['certificate.pem'] },
					{ cmd: 'cat', args: ['key.pem'] }
				],
				expectedOutput = {
					certificate: {
						privateKey: 'privateKey',
						publicKey: 'publicKey'
					},
					parameters: {
						certificate: expectedCertificateDetails
					}
				};

			inquirer.prompt.resolves(expectedCertificateDetails);

			shell.executeCommands = sinon.stub().resolves({
				command0: { stdout: 'publicKey' },
				command1: { stdout: 'privateKey' }
			});

			// When - Then
			return expect(certificate.generate({}))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(shell.executeCommands).to.have.been.calledTwice;
					expect(shell.executeCommands).to.have.been.calledWith(expectedSslCommands);
					expect(shell.executeCommands).to.have.been.calledWith(expectedReadCommands);
				});

		});

	});

	describe('getOrCreate', () => {

		it('should generate certificate', () => {

			// Given
			const
				expectedSslCommands = [{
					cmd: 'openssl',
					args: ['req', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'key.pem', '-x509', '-days', '365', '-out', 'certificate.pem', '-subj', '/C=GB/ST=North Yorkshire/L=Harrogate/O=FinancialForce/OU=Research Team/CN=test@test.com']
				}],
				expectedCertificateDetails = {
					country: 'GB',
					state: 'North Yorkshire',
					locality: 'Harrogate',
					organization: 'FinancialForce',
					organizationUnitName: 'Research Team',
					commonName: 'test@test.com'
				},
				expectedReadCommands = [
					{ cmd: 'cat', args: ['certificate.pem'] },
					{ cmd: 'cat', args: ['key.pem'] }
				],
				expectedOutput = {
					certificate: {
						privateKey: 'privateKey',
						publicKey: 'publicKey'
					},
					parameters: {
						certificate: expectedCertificateDetails
					}
				};

			inquirer.prompt.resolves(expectedCertificateDetails);

			shell.executeCommands = sinon.stub().resolves();
			shell.executeCommands.onCall(0).rejects();

			shell.executeCommands.onCall(2).resolves({
				command0: { stdout: 'publicKey' },
				command1: { stdout: 'privateKey' }
			});

			// When - Then
			return expect(certificate.getOrCreate({}))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(shell.executeCommands).to.have.been.calledThrice;
					expect(shell.executeCommands).to.have.been.calledWith(expectedReadCommands);
					expect(shell.executeCommands).to.have.been.calledWith(expectedSslCommands);
					expect(shell.executeCommands).to.have.been.calledWith(expectedReadCommands);
				});

		});

		it('should not generate certificate when it already exists', () => {

			// Given
			const

				expectedReadCommands = [
					{ cmd: 'cat', args: ['certificate.pem'] },
					{ cmd: 'cat', args: ['key.pem'] }
				],
				expectedOutput = {
					certificate: {
						privateKey: 'privateKey',
						publicKey: 'publicKey'
					}
				};

			shell.executeCommands = sinon.stub().resolves({
				command0: { stdout: 'publicKey' },
				command1: { stdout: 'privateKey' }
			});

			// When - Then
			return expect(certificate.getOrCreate({}))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(shell.executeCommands).to.have.been.calledOnce;
					expect(shell.executeCommands).to.have.been.calledWith(expectedReadCommands);
				});

		});

	});

});
