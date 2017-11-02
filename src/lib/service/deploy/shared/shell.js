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
	debug = require('../../../util/debug'),

	childProcess = require('child_process'),
	spawn = childProcess.spawn,

	Promise = require('bluebird'),

	EVENT_CLOSE = 'close',
	EVENT_DATA = 'data',

	shellDebug = (cmd, args) => {
		const formattedCommand = cmd + (args ? ' ' + args.join(' ') : '');
		debug.create('Executing: ' + formattedCommand);
		return formattedCommand;
	},

	executeCommand = ({ cmd, args, opts }) => {

		return new Promise((resolve, reject) => {

			const
				namespace = opts && opts.namespace || 'shell',
				namespaceOutput = namespace + ':output',
				formattedCommand = shellDebug(cmd, args),
				log = debug.create(namespace),
				logOutput = debug.create(namespaceOutput),
				child = spawn(cmd, args);

			let stdout = '',
				stderr = '';

			var stdoutStream,
				stderrStream;

			if (opts && opts.namespace) {
				debug.create.enable(opts.namespace);
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
				if (exitCode !== 0 && opts && opts.exitOnError) {
					return reject(new Error(`Command failed: ${formattedCommand}\n${stderr}`));
				}
				const retval = { formattedCommand, exitCode, stdout: _.trim(stdout), stderr: _.trim(stderr) };
				logOutput(retval);
				return resolve(retval);
			});

		});

	},

	executeCommands = (commands, opts) => {

		return Promise.reduce(commands, (results, command) => {

			command.opts = command.opts || opts;

			return executeCommand(command)
				.then((result) => {
					results[result.formattedCommand] = result;
					return results;
				});

		}, {});

	};

module.exports = {
	executeCommand,
	executeCommands
};
