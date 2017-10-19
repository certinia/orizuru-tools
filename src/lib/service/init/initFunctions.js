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
	Promise = require('bluebird'),
	path = require('path'),
	fs = require('fs-extra'),
	klaw = require('klaw'),
	inquirer = require('inquirer'),
	{ log } = require('../../util/logger'),
	validators = require('../../util/validators'),
	questions = require('../../util/questions'),

	RESOURCE_FOLDER = path.resolve(__dirname, '../../../../template'),
	CWD = process.cwd(),

	UTF8 = 'utf8',

	askQuestions = () => {
		return inquirer.prompt([
			questions.inputField('NPM Module Name:', '{{npm-module-name}}', validators.validateNotEmpty),
			questions.inputField('NPM Module Description:', '{{npm-module-description}}', validators.validateNotEmpty),
			questions.inputField('GIT Repository Name:', '{{git-repository-name}}', validators.validateNotEmpty),
			questions.inputField('GIT Repository URL:', '{{git-repository-url}}', validators.validateNotEmpty),
			questions.inputField('Sidebar Color:', '{{vscode-bar-color}}', validators.validateHexColor)
		]).then(answers => ({ answers }));
	},

	copyResources = ({ answers }) => {
		log('Copying resources to ' + CWD);
		return fs.copy(RESOURCE_FOLDER, CWD)
			.then(() => ({ answers }));
	},

	walkResources = ({ answers }) => {
		log('Enumerating resources');
		return new Promise(resolve => {
			const paths = [];
			klaw(CWD)
				.on('data', data => paths.push(data.path))
				.on('end', () => resolve({ answers, paths }));
		});
	},

	filterOutDirectories = ({ answers, paths }) => {
		return Promise.map(paths, path => {
			return fs.lstat(path)
				.then(stats => {
					return { isDir: stats.isDirectory(), path };
				});
		}).then(paths => ({
			answers,
			/* 
			 * The paths returned by the composite promise above are in the form { path, isDir }.
			 * So we need to filter these out if isDir, and then map them back from objects to path strings.
			 */
			paths: _(paths).filter(path => !path.isDir).map(path => path.path).value()
		}));
	},

	readFiles = ({ answers, paths }) => {
		log('Reading resources');
		return Promise.map(paths, path => fs.readFile(path, UTF8))
			.then(contents => {
				return _.map(contents, (content, index) => {
					const path = paths[index];
					return { path, content };
				});
			})
			.then(files => ({ answers, files }));
	},

	replaceTokensWithAnswers = ({ answers, files }) => {
		log('Running find and replace');
		_.each(answers, (replace, token) => {
			_.each(files, file => {
				file.content = file.content.replace(token, replace);
			});
		});
		return { files };
	},

	saveFiles = ({ files }) => {
		log('Finalizing');
		return Promise.map(files, file => fs.writeFile(file.path, file.content, UTF8))
			.then(_.noop);
	},

	test = () => {
		const
			ini = require('init-package-json'),
			pth = path.join(__dirname, '.init-package-json.config.js');
		console.log(pth);
		ini(CWD, pth, (err) => {
			console.log(err);
		});
	};

module.exports = {
	askQuestions: config => askQuestions(config),
	copyResources: config => copyResources(config),
	walkResources: config => walkResources(config),
	filterOutDirectories: config => filterOutDirectories(config),
	readFiles: config => readFiles(config),
	replaceTokensWithAnswers: config => replaceTokensWithAnswers(config),
	saveFiles: config => saveFiles(config),
	test: config => test(config)
};
