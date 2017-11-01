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
	fs = require('fs-extra'),
	path = require('path'),
	logger = require('../../util/logger'),

	readProperties = (config) => {
		return fs.readFile(config.properties.filepath).then(content => {
			config.properties.content = content.toString().split('\n');
			return config;
		}).catch(err => {
			config.properties.content = [];
			logger.logEvent('local.run.properties does not exist');
			return config;
		});
	},

	filterProperties = (config) => {
		const
			privateKey = config.certificate.privateKey.replace(/\n/g, ''),
			newprops = [
				`JWT_SIGNING_KEY="${privateKey}"`,
				`OPENID_CLIENT_ID=${config.connectedApp.oauthConfig.consumerKey}`,
				'OPENID_ISSUER_URI=https://test.salesforce.com/',
				'OPENID_HTTP_TIMEOUT=4000'
			],

			uniqueContent = _.difference(config.properties.content, newprops),

			filteredContent = _.map(uniqueContent, prop => {
				const key = prop.split('=')[0];
				if (key.startsWith('JWT') || key.startsWith('OPENID')) {
					prop = '#' + prop;
				}
				return prop;
			});

		config.properties.content = filteredContent.concat(newprops);

		return config;
	},

	writeProperties = (config) => {
		return fs.writeFile(config.properties.filepath, config.properties.content.join('\n')).then(() => {
			return config;
		});
	},

	updateProperties = (config) => {
		config.properties = {};
		config.properties.filepath = path.resolve(process.cwd(), 'local.run.properties');

		return Promise.resolve(config)
			.then(readProperties)
			.then(filterProperties)
			.then(writeProperties);
	};

module.exports = {
	updateProperties
};
