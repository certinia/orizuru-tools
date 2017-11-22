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
	service = require('../../../service/docker'),

	COPYRIGHT_NOTICE = require('../../constants/constants').COPYRIGHT_NOTICE;

module.exports = {
	command: 'build-image',
	aliases: ['build', 'b', 'bi'],
	desc: 'Builds the selected Docker images',
	builder: (yargs) => yargs
		.usage('\nUsage: orizuru docker build-image [SERVICE] [OPTIONS]')
		.option('a', {
			alias: 'all',
			describe: 'Build all images',
			demandOption: false,
			type: 'boolean'
		})
		.option('d', {
			alias: 'debug',
			describe: 'Turn on debug logging',
			demandOption: false,
			type: 'boolean'
		})
		.option('verbose', {
			describe: 'Turn on all logging',
			demandOption: false,
			type: 'boolean'
		})
		.epilogue(COPYRIGHT_NOTICE)
		.argv,
	handler: (argv) => service.buildImage({ argv })
};