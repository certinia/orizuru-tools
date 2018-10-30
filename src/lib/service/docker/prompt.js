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
