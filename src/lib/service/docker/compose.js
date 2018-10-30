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
	fs = require('fs'),
	klaw = require('klaw'),
	path = require('path'),
	yaml = require('js-yaml'),

	shell = require('../../util/shell'),

	DOCKER = 'docker',
	DOCKER_COMPOSE = 'docker-compose',

	EXTENSION_YAML = 'yaml';

function findComposeFiles(config) {

	return new Promise(resolve => {
		const composeFiles = [];
		klaw(process.cwd())
			.on('data', item => {
				if (item.path.indexOf(DOCKER) > -1) {
					if (_.tail(item.path.split('.'))[0] === EXTENSION_YAML) {
						composeFiles.push(item.path);
					}
				}
			})
			.on('end', () => {
				resolve(_.set(config, 'docker.compose.files', composeFiles));
			});
	}).then(() => config);

}

function readComposeFile(composeFile) {
	const composeFileContents = fs.readFileSync(composeFile);
	return yaml.load(composeFileContents);
}

function noSelectedServicesCheck(config) {
	if (_.isEmpty(_.get(config, 'docker.selected.services'))) {
		throw new Error('No services selected');
	}
}

function getServices(composeFile) {
	const composeFileContents = readComposeFile(composeFile);
	return _.keys(composeFileContents.services);
}

function getServicesFromComposeFile(config) {

	const composeFiles = _.get(config, 'docker.compose.files');
	return _.reduce(composeFiles, (config, composeFile) => {
		composeFile = path.resolve(process.cwd(), composeFile);
		_.each(getServices(composeFile), (image) => {
			_.set(config, `docker.services.${image}`, composeFile);
		});
		return config;
	}, config);

}

function getAllServices(config) {
	return findComposeFiles(config)
		.then(getServicesFromComposeFile);
}

function buildImages(config) {

	noSelectedServicesCheck(config);

	const
		services = _.get(config, 'docker.selected.services'),
		commands = _.map(services, (composeFile, service) => {
			return {
				cmd: DOCKER_COMPOSE,
				args: ['-f', composeFile, 'build', service],
				opts: {
					logging: {
						start: `Build image: ${service}`,
						finish: `Built image: ${service}`
					},
					namespace: 'docker'
				}
			};
		});

	return shell.executeCommands(commands, {}, config);

}

function up(config) {

	noSelectedServicesCheck(config);

	const
		services = _.get(config, 'docker.selected.services'),
		commands = _.map(services, (composeFile, service) => {
			return {
				cmd: DOCKER_COMPOSE,
				args: ['-f', composeFile, 'up', '-d', service],
				opts: {
					logging: {
						start: `Start service: ${service}`,
						finish: `Started service: ${service}`
					},
					namespace: 'docker'
				}
			};
		});

	return shell.executeCommands(commands, {}, config);

}

module.exports = {
	buildImages,
	getAllServices,
	getServices,
	up
};
