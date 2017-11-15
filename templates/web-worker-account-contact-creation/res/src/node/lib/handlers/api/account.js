'use strict';

const
	_ = require('lodash'),
	debug = require('debug-plus')('account-handler'),
	grant = require('../../boilerplate/shared/auth').grant,
	jsforce = require('jsforce'),

	CONTACT_SOBJECT_NAME = 'Contact',

	newJsforceConnection = credentials => new jsforce.Connection(credentials),
	getJsforceConnection = user => grant(user).then(newJsforceConnection);

module.exports = ({ message, context }) => {
	debug.log('Handled event for schema \'api/account\'...');
	debug.log('Context:');
	debug.log(JSON.stringify(context));
	debug.log('Message:');
	debug.log(JSON.stringify(message));

	return getJsforceConnection(context.user).then(conn => {

		const contacts = [];
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

		return promise.then(() => debug.log('success!')).catch(debug.error);

	});
};
