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
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	inquirer = require('inquirer'),

	configFile = require('../../lib/service/deploy/shared/config'),
	connection = require('../../lib/service/deploy/shared/connection'),
	certificate = require('../../lib/service/deploy/certificate'),
	connectedApp = require('../../lib/service/deploy/connectedApp'),
	heroku = require('../../lib/service/deploy/heroku'),
	sfdx = require('../../lib/service/deploy/sfdx'),
	logger = require('../../lib/util/logger'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/connectedApp.js', () => {

	let mocks;

	beforeEach(() => {

		mocks = {};
		mocks.shell = sandbox.stub();
		mocks.shell.executeCommand = sandbox.stub();

		sandbox.stub(configFile, 'createFile');
		sandbox.stub(configFile, 'readSettings');
		sandbox.stub(configFile, 'writeSetting');

		sandbox.stub(certificate, 'getOrCreate');

		sandbox.stub(connection, 'create');

		sandbox.stub(connectedApp, 'askQuestions');
		sandbox.stub(connectedApp, 'create');
		sandbox.stub(connectedApp, 'generateInstallUrl');
		sandbox.stub(connectedApp, 'list');
		sandbox.stub(connectedApp, 'select');
		sandbox.stub(connectedApp, 'updateHerokuConfigVariables');

		sandbox.stub(heroku, 'getAllApps');
		sandbox.stub(heroku, 'select');

		sandbox.stub(inquirer, 'prompt');

		sandbox.stub(logger, 'logEvent');
		sandbox.stub(logger, 'logError');

		sandbox.stub(sfdx, 'checkSfdxInstalled');
		sandbox.stub(sfdx, 'checkSfdxProjectFileExists');
		sandbox.stub(sfdx, 'checkSfdxFolderExists');
		sandbox.stub(sfdx, 'display');
		sandbox.stub(sfdx, 'getAllScratchOrgs');
		sandbox.stub(sfdx, 'login').resolves({});
		sandbox.stub(sfdx, 'select');

	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('create', () => {

		it('should throw an error if the type is not found', () => {

			// given
			const service = proxyquire('../../lib/service/connectedApp.js', {
				'../../util/shell': mocks.shell
			});

			inquirer.prompt.resolves({
				type: 'New Connected App 2'
			});

			// when - then
			return expect(service.create({}))
				.to.eventually.be.fulfilled
				.then(() => {
					expect(logger.logError).to.have.been.calledOnce;
				});

		});

		it('should call the correct functions when creating a new connected app', () => {

			// given
			const service = proxyquire('../../lib/service/connectedApp.js', {
				'../../util/shell': mocks.shell
			});

			inquirer.prompt.resolves({
				type: 'New Connected App'
			});

			// when - then
			return expect(service.create({}))
				.to.eventually.be.fulfilled
				.then(() => {

					expect(sfdx.checkSfdxInstalled).to.have.been.calledOnce;

					expect(sfdx.checkSfdxProjectFileExists).to.have.been.calledAfter(sfdx.checkSfdxInstalled);
					expect(sfdx.checkSfdxFolderExists).to.have.been.calledAfter(sfdx.checkSfdxProjectFileExists);
					expect(configFile.readSettings).to.have.been.calledAfter(sfdx.checkSfdxFolderExists);
					expect(sfdx.login).to.have.been.calledAfter(configFile.readSettings);
					expect(heroku.getAllApps).to.have.been.calledAfter(sfdx.login);
					expect(sfdx.getAllScratchOrgs).to.have.been.calledAfter(heroku.getAllApps);
					expect(sfdx.select).to.have.been.have.been.calledOnce.and.calledAfter(sfdx.getAllScratchOrgs);

					expect(certificate.getOrCreate).to.have.been.calledOnce;

					expect(connection.create).to.have.been.calledOnce;

					expect(connectedApp.askQuestions).to.have.been.calledOnce;
					expect(connectedApp.create).to.have.been.calledOnce;
					expect(connectedApp.generateInstallUrl).to.have.been.calledOnce;
					expect(connectedApp.list).to.have.been.calledOnce;
					expect(connectedApp.select).to.have.been.calledOnce;
					expect(connectedApp.updateHerokuConfigVariables).to.have.been.calledOnce;

					expect(heroku.getAllApps).to.have.been.calledOnce;
					expect(heroku.select).to.have.been.calledOnce;

					expect(sfdx.display).to.have.been.calledOnce;
					expect(sfdx.getAllScratchOrgs).to.have.been.calledOnce;
					expect(sfdx.login).to.have.been.calledOnce;
					expect(sfdx.select).to.have.been.calledOnce;

				});

		});

		it('should call the correct functions when creating a new connected app', () => {

			// given
			const service = proxyquire('../../lib/service/connectedApp.js', {
				'../../util/shell': mocks.shell
			});

			inquirer.prompt.resolves({
				type: 'Existing Connected App In Scratch Org'
			});

			// when - then
			return expect(service.create({}))
				.to.eventually.be.fulfilled
				.then(() => {

					expect(sfdx.checkSfdxInstalled).to.have.been.calledOnce;

					expect(sfdx.checkSfdxProjectFileExists).to.have.been.calledAfter(sfdx.checkSfdxInstalled);
					expect(sfdx.checkSfdxFolderExists).to.have.been.calledAfter(sfdx.checkSfdxProjectFileExists);
					expect(configFile.readSettings).to.have.been.calledAfter(sfdx.checkSfdxFolderExists);
					expect(sfdx.login).to.have.been.calledAfter(configFile.readSettings);
					expect(sfdx.select).to.have.been.have.been.calledTwice.and.calledAfter(sfdx.getAllScratchOrgs);

					expect(connection.create).to.have.been.calledOnce;

					expect(connectedApp.generateInstallUrl).to.have.been.calledOnce;
					expect(connectedApp.list).to.have.been.calledOnce;
					expect(connectedApp.select).to.have.been.calledOnce;

					expect(sfdx.display).to.have.been.calledTwice;
					expect(sfdx.getAllScratchOrgs).to.have.been.calledOnce;
					expect(sfdx.login).to.have.been.calledOnce;
					expect(sfdx.select).to.have.been.calledTwice;

					expect(connectedApp.askQuestions).to.not.have.been.called;
					expect(connectedApp.create).to.not.have.been.called;
					expect(connectedApp.updateHerokuConfigVariables).to.not.have.been.called;
					expect(heroku.getAllApps).to.not.have.been.called;
					expect(heroku.select).to.not.have.been.called;

				});

		});

	});

});
