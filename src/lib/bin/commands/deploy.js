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
	certificate = require('./deploy/certificate'),
	connectedApp = require('./deploy/connectedApp'),

	service = require('../../service/deploy'),

	COPYRIGHT_NOTICE = require('../constants/constants').COPYRIGHT_NOTICE;

module.exports = {
	command: 'deploy',
	aliases: ['d'],
	desc: 'Executes Deployment commands',
	builder: (yargs) => {
		return yargs
			.usage('\nUsage: orizuru deploy COMMAND')
			.command(certificate)
			.command(connectedApp)
			.options('apex', {
				alias: 'a',
				describe: 'Apex deploy',
				demandOption: false,
				type: 'boolean'
			})
			.options('debug', {
				alias: 'd',
				describe: 'Turn on debug logging',
				demandOption: false,
				type: 'boolean'
			})
			.options('full', {
				alias: 'f',
				describe: 'Full deploy',
				demandOption: false,
				type: 'boolean'
			})
			.options('heroku', {
				alias: 'h',
				describe: 'Heroku deploy',
				demandOption: false,
				type: 'boolean'
			})
			.options('silent', {
				alias: 's',
				describe: 'Turn off all logging',
				demandOption: false,
				type: 'boolean'
			})
			.options('verbose', {
				describe: 'Turn on all logging',
				demandOption: false,
				type: 'boolean'
			})
			.updateStrings({
				'Commands:': 'Deployment:'
			})
			.help('help')
			.epilogue(COPYRIGHT_NOTICE);
	},
	handler: (argv) => service.run({ argv })
};
