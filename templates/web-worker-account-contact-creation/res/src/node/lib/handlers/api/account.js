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
	debug = require('debug-plus')('account-handler'),
	jsforce = require('jsforce'),

	grant = require('../../boilerplate/auth').grant,

	Connection = jsforce.Connection,

	CONTACT_SOBJECT_NAME = 'Contact';

/**
 * Logs information from the event
 */
function logEvent(event) {

	debug.log('Handled event for schema \'api/account\'...');
	debug.log('Context:');
	debug.log(JSON.stringify(event.context));
	debug.log('Message:');
	debug.log(JSON.stringify(event.message));

	return event;

}

/**
 * Creates a new connection for the given credentials
 */
function newConnection(credentials) {
	return new Connection(credentials);
}

/**
 * Get an authenticated connection using the credentials from the event
 */
function getConnection(event) {
	return grant(event.context.user)
		.then(newConnection)
		.then(conn => ({ conn, event }));
}

/**
 * Creates a contact for each of the account IDs found in the event
 */
function createContacts(config) {

	const
		conn = config.conn,
		event = config.event,
		message = event.message,
		contacts = [];

	let promise = Promise.resolve();

	_.each(message.ids, id => {
		contacts.push({
			firstName: 'Default contact',
			lastName: id,
			accountId: id
		});
	});

	_.each(_.chunk(contacts, 10), tenContacts => {
		promise = promise.then(() =>
			Promise.all(
				_.map(tenContacts, contact => conn.sobject(CONTACT_SOBJECT_NAME).create(contact))
			)
		);
	});

	return promise;

}

module.exports = (event) => {

	return Promise.resolve(event)
		.then(logEvent)
		.then(getConnection)
		.then(createContacts)
		.then(() => debug.log('Success!'))
		.catch(debug.error);

};
