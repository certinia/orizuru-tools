'use strict';

const
	_ = require('lodash'),
	debug = require('debug-plus')('account-handler'),
	grant = require('../boilerplate/auth').grant,
	jsforce = require('jsforce'),
	Hunter = require('hunterio'),
	{ parse } = require('tldjs'),

	HUNTER_KEY = process.env.HUNTER_KEY,
	CONFIDENCE = process.env.CONFIDENCE || 80,

	CONTACT_SOBJECT_NAME = 'Contact',
	ACCOUNT_SOBJECT_NAME = 'Account',

	newJsforceConnection = credentials => new jsforce.Connection(credentials),
	getJsforceConnection = user => grant(user).then(newJsforceConnection),

	getAccountDomain = (conn, id) => () => {
		return conn.sobject(ACCOUNT_SOBJECT_NAME).retrieve(id)
			.then(account => parse(account.Website).domain)
			.catch(error => null);
	},

	getEmails = domain => {
		if (!domain) {
			return [];
		}
		return new Promise((resolve, reject) => {
			var hunter = new Hunter(HUNTER_KEY);

			hunter.domainSearch({
				domain
			}, (err, body) => {
				if (err) {
					reject(err);
				} else {
					resolve(body.data.emails);
				}
			});
		});
	},

	getContactsFromEmails = id => emails => {
		return emails
			.filter(email => {
				return email.type === 'personal' &&
					email.confidence > CONFIDENCE &&
					email.last_name &&
					email.first_name;
			})
			.map(email => {
				return {
					firstName: email.first_name,
					lastName: email.last_name,
					accountId: id,
					email: email.value,
					title: email.position
				};
			});
	},

	createContacts = conn => contacts => {

		const
			processChunck = (chain, tenContacts) => {
				return chain
					.then(() =>
						Promise.all(
							_.map(tenContacts, contact => conn.sobject(CONTACT_SOBJECT_NAME).create(contact))
						)
					);
			};

		return (_.reduce(_.chunk(contacts, 10), processChunck, Promise.resolve()))
			.then(() => debug.log('success!')).catch(debug.error);
	};

module.exports = ({ message, context }) => {
	debug.log('Handled event for schema \'api/account\'...');
	debug.log('Context:');
	debug.log(JSON.stringify(context));
	debug.log('Message:');
	debug.log(JSON.stringify(message));
	debug.log(`Confidence Threshold: ${CONFIDENCE}`);

	return getJsforceConnection(context.user)
		.then(conn => {
			return _.reduce(message.ids, (chain, id) => {
				return chain
					.then(getAccountDomain(conn, id))
					.then(getEmails)
					.then(getContactsFromEmails(id))
					.then(createContacts(conn));
			}, Promise.resolve());
		});
};
