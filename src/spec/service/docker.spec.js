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

	dockerService = require('../../lib/service/docker/docker'),
	composeService = require('../../lib/service/docker/compose'),
	promptService = require('../../lib/service/docker/prompt'),

	logger = require('../../lib/util/logger'),

	docker = require('../../lib/service/docker'),

	expect = chai.expect;

chai.use(sinonChai);

describe('service/docker', () => {

	let listContainersStub;

	beforeEach(() => {

		sinon.stub(logger, 'logStart');
		sinon.stub(logger, 'logFinish');
		sinon.stub(logger, 'logError');

		listContainersStub = sinon.stub();

		sinon.stub(composeService, 'getAllServices');
		sinon.stub(composeService, 'buildImages');
		sinon.stub(composeService, 'up');

		sinon.stub(promptService, 'getServicesForProcess');

		sinon.stub(dockerService, 'displayLogs');
		sinon.stub(dockerService, 'listContainers').returns(listContainersStub);
		sinon.stub(dockerService, 'removeDanglingImages');
		sinon.stub(dockerService, 'stopContainers');

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('buildImage', () => {

		it('should catch errors', async () => {

			// Given
			const
				expectedServiceName = 'testService',
				expectedOptions = { _: ['d', 'bi', expectedServiceName] },
				expectedError = new Error('test');

			dockerService.removeDanglingImages.rejects(expectedError);

			// When
			await docker.buildImage(expectedOptions);

			// Then
			expect(dockerService.removeDanglingImages).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledOnce;
			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logError).to.have.been.calledOnce;
			expect(composeService.getAllServices).to.not.have.been.called;
			expect(composeService.buildImages).to.not.have.been.called;
			expect(logger.logStart).to.have.been.calledWith('Building images');
			expect(logger.logError).to.have.been.calledWith(expectedError);

		});

		it('should log build images failures', async () => {

			// Given
			const
				expectedServiceName = 'testService',
				expectedOptions = { _: ['d', 'bi', expectedServiceName] },
				expectedError = new Error('test'),
				services = {
					[expectedServiceName]: 'test1.yml'
				};

			composeService.buildImages.rejects(expectedError);
			composeService.getAllServices.resolves(services);
			promptService.getServicesForProcess.resolves(services);
			dockerService.removeDanglingImages.resolves();

			// When
			await docker.buildImage(expectedOptions);

			// Then
			expect(composeService.getAllServices).to.have.been.calledOnce;
			expect(dockerService.removeDanglingImages).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledOnce;
			expect(composeService.buildImages).to.have.been.calledOnce;
			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logFinish).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledWith('Select services to build');
			expect(composeService.buildImages).to.have.been.calledWith(services);
			expect(logger.logStart).to.have.been.calledWith('Building images');
			expect(logger.logError).to.have.been.calledWith(expectedError);

		});

		it('should build the image for the given service', async () => {

			// Given
			const
				expectedServiceName = 'testService',
				expectedOptions = { _: ['d', 'bi', expectedServiceName] },
				services = {
					[expectedServiceName]: 'test1.yml'
				};

			composeService.getAllServices.resolves(services);
			composeService.buildImages.resolves();
			promptService.getServicesForProcess.resolves(services);
			dockerService.removeDanglingImages.resolves();

			// When/then
			await docker.buildImage(expectedOptions);

			// Then
			expect(composeService.getAllServices).to.have.been.calledOnce;
			expect(dockerService.removeDanglingImages).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledOnce;
			expect(composeService.buildImages).to.have.been.calledOnce;
			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logFinish).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledWith('Select services to build');
			expect(composeService.buildImages).to.have.been.calledWith(services);
			expect(logger.logStart).to.have.been.calledWith('Building images');
			expect(logger.logFinish).to.have.been.calledWith('Built images');

		});

	});

	describe('displayLogs', () => {

		it('should catch errors', async () => {

			// Given
			const
				expectedOptions = { _: ['d', 'logs'] },
				expectedError = new Error('test'),
				services = { testService: 'test1.yml' };

			promptService.getServicesForProcess.resolves(services);
			dockerService.listContainers.rejects(expectedError);

			// When
			await docker.displayLogs(expectedOptions);

			// Then
			expect(dockerService.listContainers).to.have.been.calledOnce;
			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logFinish).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledOnce;
			expect(dockerService.displayLogs).to.not.have.been.called;
			expect(promptService.getServicesForProcess).to.have.been.calledWith('Select services for which to display logs');
			expect(logger.logStart).to.have.been.calledWith('Displaying logs');
			expect(logger.logError).to.have.been.calledWith(expectedError);

		});

		it('should display logs for the given service', async () => {

			// Given
			const
				expectedServiceName = 'testService',
				expectedOptions = { _: ['d', 'bi', expectedServiceName] },
				services = {
					[expectedServiceName]: 'test1.yml'
				};

			dockerService.listContainers.resolves([expectedServiceName]);
			dockerService.displayLogs.resolves();
			promptService.getServicesForProcess.resolves(services);

			// When
			await docker.displayLogs(expectedOptions);

			// Then
			expect(dockerService.listContainers).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledOnce;
			expect(dockerService.displayLogs).to.have.been.calledOnce;
			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logFinish).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledWith('Select services for which to display logs');
			expect(logger.logStart).to.have.been.calledWith('Displaying logs');
			expect(logger.logFinish).to.have.been.calledWith('Displayed logs');

		});

	});

	describe('listServices', () => {

		it('should list the services found in the Docker Compose files', async () => {

			// Given
			const expectedServices = {
				docker: {
					services: {
						image: 'file'
					}
				}
			};

			logger.logStart.returns(sinon.stub());
			logger.logFinish.returns(sinon.stub());

			composeService.getAllServices.resolves(expectedServices);

			// When
			await docker.listServices({});

			// Then
			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logFinish).to.have.been.calledOnce;
			expect(logger.logStart).to.have.been.calledWith('List services:');
			expect(logger.logFinish).to.have.been.calledWith('  image                                           file');

		});

	});

	describe('reset', () => {

		it('should handle errors', async () => {

			// Given
			const expectedError = new Error('test');

			listContainersStub.rejects(expectedError);

			// When/then
			await docker.reset({});

			// Then
			expect(dockerService.listContainers).to.have.been.calledTwice;
			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logFinish).to.have.been.calledOnce;
			expect(logger.logStart).to.have.been.calledWith('Removing all containers and images');
			expect(logger.logError).to.have.been.calledWith(expectedError);

		});

	});

	describe('startServices', () => {

		it('should catch errors', async () => {

			// Given
			const
				expectedServiceName = 'testService',
				expectedOptions = { _: ['d', 's', expectedServiceName] },
				expectedError = new Error('test');

			dockerService.removeDanglingImages.rejects(expectedError);

			// When
			await docker.startServices(expectedOptions);

			// Then
			expect(dockerService.removeDanglingImages).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledOnce;
			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logFinish).to.have.been.calledOnce;
			expect(composeService.up).to.not.have.been.called;
			expect(composeService.getAllServices).to.not.have.been.called;
			expect(logger.logStart).to.have.been.calledWith('Start services');
			expect(logger.logError).to.have.been.calledWith(expectedError);

		});

		it('should log Docker compose up failures', async () => {

			// Given
			const
				expectedServiceName = 'testService',
				expectedOptions = { _: ['d', 's', expectedServiceName] },
				expectedError = new Error('test'),
				services = {
					[expectedServiceName]: 'test1.yml'
				};

			composeService.getAllServices.resolves(services);
			composeService.up.rejects(expectedError);
			promptService.getServicesForProcess.resolves(services);
			dockerService.removeDanglingImages.resolves();

			// When
			await docker.startServices(expectedOptions);

			// Then
			expect(composeService.getAllServices).to.have.been.calledOnce;
			expect(dockerService.removeDanglingImages).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledOnce;
			expect(composeService.up).to.have.been.calledOnce;
			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logFinish).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledWith('Select services to start');
			expect(composeService.up).to.have.been.calledWith(services);
			expect(logger.logStart).to.have.been.calledWith('Start services');
			expect(logger.logError).to.have.been.calledWith(expectedError);

		});

		it('should start the given service', async () => {

			// Given
			const
				expectedServiceName = 'testService',
				expectedOptions = { _: ['d', 's', expectedServiceName] },
				services = {
					[expectedServiceName]: 'test1.yml'
				};

			composeService.getAllServices.resolves(services);
			composeService.up.resolves();
			promptService.getServicesForProcess.resolves(services);
			dockerService.removeDanglingImages.resolves();

			// When
			await docker.startServices(expectedOptions);

			// Then
			expect(composeService.getAllServices).to.have.been.calledOnce;
			expect(dockerService.removeDanglingImages).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledOnce;
			expect(composeService.up).to.have.been.calledOnce;
			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logFinish).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledWith('Select services to start');
			expect(composeService.up).to.have.been.calledWith(services);
			expect(logger.logStart).to.have.been.calledWith('Start services');
			expect(logger.logFinish).to.have.been.calledWith('Started services');

		});

	});

	describe('stopServices', () => {

		it('should catch errors', async () => {

			// Given
			const
				expectedService = 'ffdc -container',
				expectedOptions = { _: ['d', 'st', expectedService] },
				expectedError = new Error('test');

			dockerService.listContainers.returns(expectedService);
			dockerService.removeDanglingImages.rejects(expectedError);

			// When
			await docker.stopServices(expectedOptions);

			// Then
			expect(dockerService.removeDanglingImages).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledOnce;
			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logFinish).to.have.been.calledOnce;
			expect(dockerService.listContainers).to.not.have.been.called;
			expect(dockerService.stopContainers).to.not.have.been.called;
			expect(logger.logStart).to.have.been.calledWith('Stop services');
			expect(logger.logError).to.have.been.calledWith(expectedError);

		});

		it('should log Docker stopContainers failures', async () => {

			// Given
			const
				expectedService = 'ffdc -container',
				expectedOptions = { _: ['d', 'st', expectedService] },
				expectedError = new Error('test'),
				services = {
					[expectedService]: expectedService
				};

			promptService.getServicesForProcess.resolves(services);
			dockerService.removeDanglingImages.resolves();
			dockerService.stopContainers.rejects(expectedError);

			// When
			await docker.stopServices(expectedOptions);

			// Then
			expect(dockerService.removeDanglingImages).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledOnce;
			expect(dockerService.stopContainers).to.have.been.calledOnce;
			expect(logger.logStart).to.have.been.calledOnce;
			expect(logger.logFinish).to.have.been.calledOnce;
			expect(promptService.getServicesForProcess).to.have.been.calledWith('Select services to stop');
			expect(logger.logStart).to.have.been.calledWith('Stop services');
			expect(logger.logError).to.have.been.calledWith(expectedError);

		});

	});

});
