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
