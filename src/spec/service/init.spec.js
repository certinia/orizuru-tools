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

	service = require('../../lib/service/init'),

	npm = require('../../lib/service/init/npm'),
	packageJson = require('../../lib/service/init/packageJson'),
	resource = require('../../lib/service/init/resource'),
	template = require('../../lib/service/init/template'),
	logger = require('../../lib/util/logger'),

	expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/init.js', () => {

	beforeEach(() => {

		sinon.stub(logger, 'logStart');
		sinon.stub(logger, 'logFinish');
		sinon.stub(logger, 'logError');
		sinon.stub(npm, 'init');
		sinon.stub(npm, 'install');
		sinon.stub(npm, 'generateApexTransport');
		sinon.stub(npm, 'generateDocumentation');
		sinon.stub(npm, 'test');
		sinon.stub(npm, 'orizuruPostInit');
		sinon.stub(packageJson, 'create');
		sinon.stub(resource, 'copy');
		sinon.stub(resource, 'renameGitIgnore');
		sinon.stub(template, 'select');
		sinon.stub(process, 'exit');

	});

	afterEach(() => sinon.restore());

	describe('init', () => {

		it('should call init functions in order', () => {

			// when/then
			return expect(service.init({}))
				.to.eventually.be.fulfilled
				.then(() => {

					expect(logger.logStart).to.have.been.calledOnce;
					expect(npm.init).to.have.been.calledOnce;
					expect(npm.install).to.have.been.calledOnce;
					expect(npm.generateApexTransport).to.have.been.calledOnce;
					expect(npm.test).to.have.been.calledOnce;
					expect(npm.orizuruPostInit).to.have.been.calledOnce;
					expect(packageJson.create).to.have.been.calledOnce;
					expect(resource.copy).to.have.been.calledOnce;
					expect(resource.renameGitIgnore).to.have.been.calledOnce;
					expect(template.select).to.have.been.calledOnce;

					expect(logger.logStart).to.have.been.calledWith('Building new project');
					expect(logger.logFinish).to.have.been.calledWith('Built project');

					expect(template.select).to.have.been.calledAfter(logger.logStart);
					expect(npm.init).to.have.been.calledAfter(template.select);
					expect(packageJson.create).to.have.been.calledAfter(npm.init);
					expect(resource.copy).to.have.been.calledAfter(packageJson.create);
					expect(resource.renameGitIgnore).to.have.been.calledAfter(resource.copy);
					expect(npm.install).to.have.been.calledAfter(resource.renameGitIgnore);
					expect(npm.generateApexTransport).to.have.been.calledAfter(npm.install);
					expect(npm.test).to.have.been.calledAfter(npm.generateApexTransport);
					expect(npm.generateDocumentation).to.have.been.calledAfter(npm.test);
					expect(npm.orizuruPostInit).to.have.been.calledAfter(npm.generateDocumentation);

				});

		});

		it('should call logError function if there is an error and exit thr process', () => {

			// given
			const expectedError = new Error('errorTest');

			template.select.rejects(expectedError);

			// when/then
			return expect(service.init({}))
				.to.eventually.be.fulfilled
				.then(() => {
					expect(logger.logStart).to.have.been.calledOnce;
					expect(logger.logError).to.have.been.calledOnce;
					expect(process.exit).to.have.been.calledOnce;
					expect(logger.logStart, 'Building new project');
					expect(logger.logError, expectedError);
					expect(process.exit).to.have.been.calledWith(1);
				});

		});

	});

});
