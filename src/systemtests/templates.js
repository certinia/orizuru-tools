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
	fs = require('fs-extra'),
	path = require('path'),

	shell = require('../lib/util/shell');

function isDirectory(source) {
	return fs.lstatSync(source).isDirectory();
}

function getTemplates(source) {
	return fs.readdir(source)
		.then(files => _.filter(files, file => isDirectory(path.resolve(source, file))));
}

function runTests() {

	const source = path.resolve(__dirname, '..', '..', 'templates');
	return shell.executeCommand({ cmd: 'npm', args: ['link'] })
		.then(() => getTemplates(source))
		.then(templates => {

			const commands = _.map(templates, (template, index) => {
				return ({ cmd: '/bin/bash', args: ['-c', 'mkdir test' + (index + 1) + ' && cd test' + (index + 1) + ' && orizuru setup init -t ' + template + ' -y && cd .. && rm -r test' + (index + 1)] });
			});

			return shell.executeCommands(commands, { namespace: 'system~tests', debug: true });

		})
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

runTests();
