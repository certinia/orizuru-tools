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
	root = require('app-root-path'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),
	proxyquire = require('proxyquire'),

	expect = chai.expect,

	logger = require(root + '/src/lib/util/logger'),

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/deploy/certificate.js', () => {

	let mocks, certificate;

	beforeEach(() => {

		mocks = {};
		mocks.shell = {};
		mocks.inquirer = sandbox.stub();
		mocks.inquirer.prompt = sandbox.stub();

		sandbox.stub(logger, 'logStart');
		sandbox.stub(logger, 'logEvent');
		sandbox.stub(logger, 'logLn');
		sandbox.stub(logger, 'logFinish');

		certificate = proxyquire(root + '/src/lib/service/deploy/certificate.js', {
			inquirer: mocks.inquirer,
			'../../util/shell': mocks.shell
		});

	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('checkOpenSSLInstalled', () => {

		it('should check that the OpenSSL is installed', () => {

			// given
			const expectedCommand = { cmd: 'openssl', args: ['version'] };

			mocks.shell.executeCommand = sandbox.stub().resolves('OpenSSL 0.9.8zh 14 Jan 2016');

			// when - then
			return expect(certificate.checkOpenSSLInstalled({}))
				.to.eventually.eql({})
				.then(() => {
					expect(mocks.shell.executeCommand).to.have.been.calledOnce;
					expect(mocks.shell.executeCommand).to.have.been.calledWith(expectedCommand);
				});

		});

	});

	describe('generate', () => {

		it('should execute the correct commands', () => {

			// given
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

			mocks.inquirer.prompt.resolves(expectedCertificateDetails);

			mocks.shell.executeCommands = sandbox.stub().resolves({
				command0: { stdout: 'publicKey' },
				command1: { stdout: 'privateKey' }
			});

			// when - then
			return expect(certificate.generate({}))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommands).to.have.been.calledTwice;
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedSslCommands);
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedReadCommands);
				});

		});

	});

	describe('getOrCreate', () => {

		it('should generate certificate', () => {

			// given
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

			mocks.inquirer.prompt.resolves(expectedCertificateDetails);

			mocks.shell.executeCommands = sandbox.stub().resolves();
			mocks.shell.executeCommands.onCall(0).rejects();

			mocks.shell.executeCommands.onCall(2).resolves({
				command0: { stdout: 'publicKey' },
				command1: { stdout: 'privateKey' }
			});

			// when - then
			return expect(certificate.getOrCreate({}))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommands).to.have.been.calledThrice;
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedReadCommands);
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedSslCommands);
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedReadCommands);
				});

		});

		it('should not generate certificate when it already exists', () => {

			// given
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

			mocks.shell.executeCommands = sandbox.stub().resolves({
				command0: { stdout: 'publicKey' },
				command1: { stdout: 'privateKey' }
			});

			// when - then
			return expect(certificate.getOrCreate({}))
				.to.eventually.eql(expectedOutput)
				.then(() => {
					expect(mocks.shell.executeCommands).to.have.been.calledOnce;
					expect(mocks.shell.executeCommands).to.have.been.calledWith(expectedReadCommands);
				});

		});

	});

});
