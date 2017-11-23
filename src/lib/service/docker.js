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
	_ = require('lodash'),
	ui = require('cliui'),
	{ logStart, logFinish, logError } = require('../util/logger'),

	docker = require('./docker/docker'),
	compose = require('./docker/compose'),
	prompts = require('./docker/prompt');

function buildImage(config) {

	return Promise.resolve(config)
		.then(logStart('Building images'))
		.then(docker.removeDanglingImages)
		.then(compose.getAllServices)
		.then(prompts.getServicesForProcess('Select services to build'))
		.then(compose.buildImages)
		.then(logFinish('Built images'))
		.catch(logError);

}

function displayLogs(config) {

	return Promise.resolve(config)
		.then(logStart('Displaying logs'))
		.then(docker.listContainers)
		.then(prompts.getServicesForProcess('Select services for which to display logs'))
		.then(selectedServices => _.keys(selectedServices))
		.then(selectedServiceNames => docker.displayLogs(selectedServiceNames))
		.then(logFinish('Displayed logs'))
		.catch(logError);

}

function listServices(config) {

	return Promise.resolve(config)
		.then(compose.getAllServices)
		.then(config => {

			const
				output = ui({ width: 200 }),
				services = _.get(config, 'docker.services');

			logStart('List services:')(config);

			_.each(services, (value, key) => {
				output.div({ width: 50, padding: [0, 0, 0, 2], text: key }, value);
			});

			logFinish(output.toString())(config);

			return config;

		});

}

function reset(config) {

	return Promise.resolve(config)
		.then(logStart('Removing all containers and images'))
		.then(docker.listContainers(true))
		.then(docker.stopContainers)
		.then(docker.listContainers(false))
		.then(docker.removeContainers)
		.then(docker.listImages(true))
		.then(docker.removeImages)
		.then(logFinish('Removed all containers and images'))
		.catch(logError);

}

function startServices(config) {

	return Promise.resolve(config)
		.then(logStart('Start services'))
		.then(docker.removeDanglingImages)
		.then(compose.getAllServices)
		.then(prompts.getServicesForProcess('Select services to start'))
		.then(compose.up)
		.then(logFinish('Started services'))
		.catch(logError);

}

function stopServices(config) {

	return Promise.resolve(config)
		.then(logStart('Stop services'))
		.then(docker.removeDanglingImages)
		.then(compose.getAllServices)
		.then(prompts.getServicesForProcess('Select services to stop'))
		.then(docker.stopContainers)
		.then(logFinish('Stopped services'))
		.catch(logError);

}

module.exports = {
	buildImage,
	displayLogs,
	listServices,
	reset,
	startServices,
	stopServices
};
