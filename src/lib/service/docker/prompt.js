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
	inquirer = require('inquirer'),
	questions = require('../../util/questions'),
	{ validateNotEmpty } = require('../../util/validators'),

	ERROR_NO_SERVICES_FOUND = 'No services found',
	ERROR_SERVICES_NOT_FOUND = 'Service not found: ';

function getServicesForProcess(message) {

	return function (config) {

		let services = _.get(config, 'docker.services');
		if (_.isEmpty(services)) {
			throw new Error(ERROR_NO_SERVICES_FOUND);
		}

		// If we have an array of services then convert to an object
		if (_.isArray(services)) {
			services = _.reduce(services, (results, service) => {
				results[service] = service;
				return results;
			}, {});
		}

		const
			all = _.get(config, 'argv.a'),
			serviceName = config.argv._[2],
			choices = _.map(services, (value, key) => {
				return { name: key };
			});

		if (all) {
			return _.set(config, 'docker.selected.services', services);
		}

		if (serviceName && !services[serviceName]) {
			throw new Error(ERROR_SERVICES_NOT_FOUND + serviceName);
		}

		if (serviceName) {
			const service = _.pick(services, serviceName);
			return _.set(config, 'docker.selected.services', service);
		}

		return inquirer.prompt([questions.checkboxField(message, 'services', validateNotEmpty, choices)])
			.then(answers => _.pick(services, answers.services))
			.then(services => _.set(config, 'docker.selected.services', services));

	};

}

module.exports = {
	getServicesForProcess
};
