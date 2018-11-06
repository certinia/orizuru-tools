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
	debug = require('debug')('account-handler'),
	connection = require('../service/salesforce/connection'),
	writer = require('../service/salesforce/writer'),

	CONTACT_SOBJECT_NAME = 'Contact';

/*
 * Logs information from the event
 */
function logEvent(event) {

	debug('Handled event for schema \'api/account\'...');
	debug('Context:');
	debug(JSON.stringify(event.context));
	debug('Message:');
	debug(JSON.stringify(event.message));

}

/*
 * Creates a contact for each of the account IDs found in the event
 */
async function createContacts(conn, event) {

	const
		message = event.message,

		contacts = message.ids.map((id) => {
			return {
				firstName: 'Default contact',
				lastName: id,
				accountId: id
			};
		}),

		contactChunks = contacts.reduce((results, contact) => {
			let contactChunk = results.pop();
			if (contactChunk.length === 10) {
				results.push(contactChunk);
				contactChunk = [];
			}
			contactChunk.push(contact);
			results.push(contactChunk);
			return results;
		}, [[]]);

	let promise = Promise.resolve();

	contactChunks.forEach((tenContacts) => {
		promise = promise.then(() =>
			Promise.all(tenContacts.map((contact) => writer.createObject(conn, CONTACT_SOBJECT_NAME, contact)))
		);
	});

	await promise;

}

module.exports = async (event) => {

	logEvent(event);

	const conn = await connection.fromContext(event.context);
	await createContacts(conn, event);
	debug('Success!');

};
