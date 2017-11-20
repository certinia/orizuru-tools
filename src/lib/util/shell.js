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

/**
 * Utility module to handle executing shell commands.
 * @module util/shell
 * @see module:util/shell
 */

'use strict';

const
	_ = require('lodash'),
	debug = require('./debug'),
	logger = require('./logger'),

	childProcess = require('child_process'),
	spawn = childProcess.spawn,

	Promise = require('bluebird'),

	EVENT_CLOSE = 'close',
	EVENT_DATA = 'data',

	shellDebug = (cmd, args) => {
		const formattedCommand = cmd + (args ? ' ' + args.join(' ') : '');
		debug.create('Executing: ' + formattedCommand);
		return formattedCommand;
	};

/**
 * Executes a single shell command.
 * @param {Command} command - The command to execute.
 */
function executeInternal({ cmd, args, opts }) {

	return new Promise((resolve, reject) => {

		const
			debugMode = _.get(opts, 'debug', false),
			silent = _.get(opts, 'silent', false),
			namespace = _.get(opts, 'namespace', 'shell'),
			namespaceOutput = namespace + ':output',
			verbose = _.get(opts, 'verbose', false),
			exitOnError = _.get(opts, 'exitOnError', true),
			startLogging = _.get(opts, 'logging.start'),
			finishLogging = _.get(opts, 'logging.finish'),
			shouldDebug = _.get(opts, 'namespace'),

			log = debug.create(namespace),
			logOutput = debug.create(namespaceOutput),

			formattedCommand = shellDebug(cmd, args),
			child = spawn(cmd, args);

		let stdout = '',
			stderr = '';

		var stdoutStream,
			stderrStream;

		logger.logEvent(startLogging)(opts);

		if (verbose === true) {
			debug.create.enable(namespace + ',' + namespaceOutput);
		} else if (!silent && debugMode && shouldDebug) {
			debug.create.enable(namespace);
		}

		stdoutStream = debug.debugStream(log)('%b');
		stderrStream = debug.debugStream(log)('%b');

		debug.addBufferFormatter(log);

		child.stdout.pipe(stdoutStream).resume();
		child.stderr.pipe(stderrStream).resume();

		child.stdout.on(EVENT_DATA, (data) => {
			stdout += data;
		});

		child.stderr.on(EVENT_DATA, (data) => {
			stderr += data;
		});

		child.on(EVENT_CLOSE, (exitCode) => {

			if (exitCode !== 0 && exitOnError) {
				return reject(new Error(`Command failed: ${formattedCommand}\n${stderr}`));
			}

			const retval = { formattedCommand, exitCode, stdout: _.trim(stdout), stderr: _.trim(stderr) };
			logOutput(retval);
			logger.logEvent(finishLogging)(opts);
			return resolve(retval);

		});

	});

}

/**
 * Executes a single shell command.
 * 
 * Optionally, merge in the CLI command line arguments from a configuration object.
 * @instance
 * @param {Command} command - The command to execute.
 * @param {string} command.cmd - The process to execute; the executable.
 * @param {string[]} command.args - The arguments to pass to the executable.
 * @param {object} [command.opts] - Options.
 * @param {boolean} [command.opts.exitOnError=true] - If true, the process exits if the command fails.<br/>Note that for the command to fail the process must return a non-zero exit code.
 * @param {string} [command.opts.logging.start] - If set, logs the given string before the command executes.
 * @param {string} [command.opts.logging.finish] - If set, logs the given string after the command executes.
 * @param {string} [command.opts.namepace] - If set, any logging to stdout or stderr is printed with the given namespace.
 * @param {boolean} [command.opts.silent=false] - If true, no logging is produced.
 * @param {boolean} [command.opts.verbose=false] - If true, all logging is produced.
 * @param {Object} [config] - The configuration object passed through the process.
 */
function executeCommand(command, config) {

	if (config) {
		return Promise.resolve(_.merge(command, { opts: config.argv }))
			.then(executeInternal)
			.then(() => config);
	}

	return executeInternal(command);

}

/**
 * Executes a list of shell commands serially.
 * @instance
 * @param {Command[]} commands - An array of commands to execute.
 * @param opts - Options.
 * @param {boolean} [opts.exitOnError] - If true, the process exits if the command fails.<br/>Note that for the command to fail the process must return a non-zero exit code.
 * @param {string} [opts.namepace] - If set, any logging to stdout or stderr is printed with the given namespace.
 */
function executeCommands(commands, opts) {

	return Promise.reduce(commands, (results, command) => {

		command.opts = command.opts || opts;

		return executeCommand(command)
			.then((result) => {
				results[result.formattedCommand] = result;
				return results;
			});

	}, {});

}

module.exports = {
	executeCommand,
	executeCommands
};
