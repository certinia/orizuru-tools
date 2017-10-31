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
	debug = require('debug-plus')('financialforcedev:orizuru~tools:deploy:certificate'),
	{ logStart, logFinish, logError } = require('../../util/logger'),

	_ = require('lodash'),
	inquirer = require('inquirer'),
	questions = require('../../util/questions'),
	validators = require('../../util/validators'),
	shell = require('./shared/shell'),

	opensslCommands = (config) => [{
		cmd: 'openssl',
		args: [
			'req', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'key.pem', '-x509', '-days', '365', '-out', 'certificate.pem',
			'-subj', `/C=${config.parameters.certificate.country}/ST=${config.parameters.certificate.state}/L=${config.parameters.certificate.locality}/O=${config.parameters.certificate.organization}/OU=${config.parameters.certificate.organizationUnitName}/CN=${config.parameters.certificate.commonName}`
		]
	}],

	readCertificateCommands = [
		{ cmd: 'cat', args: ['certificate.pem'] },
		{ cmd: 'cat', args: ['key.pem'] }
	],

	askQuestions = (config) => {
		return inquirer.prompt([
			questions.inputField('Country Name (2 letter code)', 'country', validators.validateNotEmpty, 'GB'),
			questions.inputField('State or Province Name (full name)', 'state', validators.validateNotEmpty, 'Some-State'),
			questions.inputField('Locality Name (eg, city)', 'locality'),
			questions.inputField('Organization Name (eg, company)', 'organization', validators.validateNotEmpty, 'FinancialForce'),
			questions.inputField('Organizational Unit Name (eg, section)', 'organizationUnitName'),
			questions.inputField('Common Name (e.g. server FQDN or YOUR name)', 'commonName', validators.validateNotEmpty, 'test@test.com')
		]).then(answers => {
			config.parameters = config.parameters || {};
			config.parameters.certificate = answers;
			return config;
		});
	},

	create = (config) => {
		return shell.executeCommands(opensslCommands(config), { exitOnError: true })
			.then(() => config);
	},

	read = (config) => {

		debug.log('Read certificates');

		return shell.executeCommands(readCertificateCommands, { exitOnError: true })
			.then(openSslResults => {

				const certificate = _.map(_.values(openSslResults), value => value.stdout);

				config.certificate = {};
				config.certificate.publicKey = certificate[0];
				config.certificate.privateKey = certificate[1];

				return config;

			});

	},

	generate = (config) => {

		return Promise.resolve(config)
			.then(logStart('Generating certificates\nYou are about to be asked to enter information that will be incorporated into your certificate.'))
			.then(askQuestions)
			.then(create)
			.then(read)
			.then(logFinish('Generated certificates'))
			.catch(logError);

	};

module.exports = {
	generate,
	askQuestions,
	create,
	read
};