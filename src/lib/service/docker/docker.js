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

	Promise = require('bluebird'),

	shell = require('../../util/shell'),

	NEW_LINE = '\n';

function removeContainer(config) {

	const
		container = _.get(config, 'docker.container'),
		command = {
			cmd: 'docker',
			args: ['rm', container],
			opts: {
				logging: {
					start: `Removing container: ${container}`,
					finish: `Removed container: ${container}`
				},
				namespace: 'docker'
			}
		};

	return shell.executeCommand(command, config);

}

function removeContainers(config) {

	const containers = _.get(config, 'docker.containers');
	return Promise.all(_.map(_.compact(_.concat(containers)), (containerName) => {
		_.set(config, 'docker.container', containerName);
		return removeContainer(config);
	})).then(() => config);

}

function displayLog(config) {

	const
		container = _.get(config, 'docker.container'),
		command = {
			cmd: 'docker',
			args: ['logs', container],
			opts: {
				logging: {
					start: `Displaying logs for container: ${container}`,
					finish: `Displayed logs for container: ${container}`
				},
				namespace: 'docker'
			}
		};

	return shell.executeCommand(command, config);
}

function displayLogs(config) {

	let containers = _.get(config, 'docker.containers');
	if (_.isString(containers)) {
		containers = [containers];
	}

	return Promise.each(containers, (containerName) => {
		_.set(config, 'docker.container', containerName);
		return displayLog(config);
	}).then(() => config);

}

function findContainersForImage(config) {

	const
		image = _.get(config, 'docker.image'),
		command = {
			cmd: 'docker',
			args: ['ps', '-aq', '--filter', 'ancestor=' + image],
			opts: {
				logging: {
					start: `Finding containers for image: ${image}`,
					finish: `Found containers for image: ${image}`
				},
				namespace: 'docker'
			}
		};

	return shell.executeCommand(command, config)
		.then(config => {
			const result = _.get(config, 'lastcommand.result.stdout');
			if (_.size(result) === 0) {
				return config;
			}
			return _.set(config, 'docker.containers', _.split(result, NEW_LINE));
		});

}

function findDanglingImages(config) {

	const command = {
		cmd: 'docker',
		args: ['images', '-f', 'dangling=true', '-q'],
		opts: {
			logging: {
				start: 'Finding dangling images',
				finish: 'Found dangling images'
			},
			namespace: 'docker'
		}
	};

	return shell.executeCommand(command, config)
		.then(config => {
			const result = _.get(config, 'lastcommand.result.stdout');
			if (_.size(result) === 0) {
				return config;
			}
			return _.set(config, 'docker.dangling.images', _.split(result, NEW_LINE));
		});

}

function listImages(onlyFFDCImages) {

	return function (config) {

		const
			mainArgs = ['images'],
			formatArgs = ['--format', '{{.Repository}}'],
			args = onlyFFDCImages ? mainArgs.concat(['ffdc/*']).concat(formatArgs) : mainArgs.concat(formatArgs),

			command = {
				cmd: 'docker',
				args,
				opts: {
					logging: {
						start: 'Listing images',
						finish: 'Listed images'
					},
					namespace: 'docker'
				}
			};

		return shell.executeCommand(command, config)
			.then(config => {
				const result = _.get(config, 'lastcommand.result.stdout');
				if (_.size(result) === 0) {
					return config;
				}
				return _.set(config, 'docker.images', _.split(result, NEW_LINE));
			});

	};

}

function listContainers(onlyRunning) {

	return function (config) {

		const
			mainArgs = ['container', 'ls'],
			formatArgs = ['--format', '{{.Names}}'],
			args = onlyRunning ? mainArgs.concat(formatArgs) : mainArgs.concat(['-a']).concat(formatArgs),

			command = {
				cmd: 'docker',
				args,
				opts: {
					logging: {
						start: 'Listing containers',
						finish: 'Listed containers'
					},
					namespace: 'docker'
				}
			};

		return shell.executeCommand(command, config)
			.then(config => {
				const result = _.get(config, 'lastcommand.result.stdout');
				if (_.size(result) === 0) {
					return config;
				}
				return _.set(config, 'docker.containers', _.split(result, NEW_LINE));
			});

	};

}

function stopContainer(config) {

	const
		container = _.get(config, 'docker.container'),
		command = {
			cmd: 'docker',
			args: ['stop', container],
			opts: {
				logging: {
					start: `Stopping container: ${container}`,
					finish: `Stopped container: ${container}`
				},
				namespace: 'docker'
			}
		};

	return shell.executeCommand(command, config);

}

function stopContainers(config) {

	const containers = _.get(config, 'docker.containers');
	return Promise.all(_.map(_.compact(_.concat(containers)), (containerName) => {
		_.set(config, 'docker.container', containerName);
		return stopContainer(config);
	})).then(() => config);

}

function removeContainersForImage(config) {

	return Promise.resolve(config)
		.then(findContainersForImage)
		.then(stopContainers)
		.then(removeContainers);

}

function removeImage(config) {

	const
		image = _.get(config, 'docker.image'),
		command = {
			cmd: 'docker',
			args: ['rmi', image],
			opts: {
				logging: {
					start: `Removing image: ${image}`,
					finish: `Removed image: ${image}`
				},
				namespace: 'docker'
			}
		};

	return shell.executeCommand(command, config);

}

function removeImages(config) {

	const images = _.get(config, 'docker.images');
	return Promise.all(_.map(_.compact(_.concat(images)), (image) => {
		_.set(config, 'docker.image', image);
		return removeImage(config);
	})).then(() => config);

}

function removeAllDanglingContainers(config) {

	const danglingImages = _.get(config, 'docker.dangling.images');
	if (!danglingImages) {
		return Promise.resolve(config);
	}

	return Promise.all(_.compact(_.map(danglingImages, (image) => {
		_.set(config, 'docker.image', image);
		return Promise.resolve(config)
			.then(removeContainersForImage)
			.then(removeImage);
	}))).then(() => config);
}

function removeDanglingImages(config) {

	return Promise.resolve(config)
		.then(findDanglingImages)
		.then(removeAllDanglingContainers);

}

module.exports = {
	displayLogs,
	findContainersForImage,
	findDanglingImages,
	listContainers,
	listImages,
	removeContainers,
	removeContainersForImage,
	removeImages,
	removeDanglingImages,
	stopContainers
};
