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
