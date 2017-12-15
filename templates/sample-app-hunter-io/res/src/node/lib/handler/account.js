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

	hunter = new Hunter(HUNTER_KEY),

	hunterDomainSearchAsync = domain => {
		// promisify hunter.domainSearch...
		// we cannot just use util.promisify because hunterio builds the function
		// dynamically, without named parameters
		return new Promise((resolve, reject) => {
			hunter.domainSearch({
				domain
			}, (err, body) => {
				if (err) {
					reject(err);
				} else {
					resolve(body);
				}
			});
		});
	};

async function handle({ message, context }) {
	debug.log('Handled event for schema \'api/account\'...');
	debug.log('Context:');
	debug.log(JSON.stringify(context));
	debug.log('Message:');
	debug.log(JSON.stringify(message));
	debug.log(`Confidence Threshold: ${CONFIDENCE}`);

	try {
		const
			// get credentials for the SF org which sent the request
			credentials = await grant(context.user),
			// establish the connection
			connection = new jsforce.Connection(credentials),
			// read accounts for the supplied Ids
			accounts = await connection.sobject(ACCOUNT_SOBJECT_NAME).retrieve(message.ids),
			// build Promises that will return the contacts for each Account
			createContactPromises = _.map(accounts, async account => {
				// parse out the domain of the website
				const domain = parse(account.Website).domain;
				if (domain) {
					debug.log('Searching for emails from %s', domain);
					// query hunter.io for emails for the domain
					const body = await hunterDomainSearchAsync(domain);

					return body.data.emails
						// reject emails without first and last name, or below our confidence threshold
						.filter(x => x.confidence > CONFIDENCE && x.first_name && x.last_name)
						// create a JSON object representing the Contact SObject record
						.map(x => ({
							firstName: x.first_name,
							lastName: x.last_name,
							accountId: account.Id,
							email: x.value,
							title: x.position
						}));
				}

				// return an empty array if the website was missing, or gave an invalid domain.
				return [];
			}),
			// wait for the Contacts to be created, resulting in an array where each element
			// is an Array of Contacts related to a single Account
			contactArrays = await Promise.all(createContactPromises),
			// flatten the array of arrays into a single array
			contacts = _.flatMap(contactArrays);

		if (contacts.length) {
			// insert the new Contacts
			await connection.sobject(CONTACT_SOBJECT_NAME).create(contacts);
			//log the result
			debug.log('Successfully inserted %s contacts', contacts.length);
		}
	} catch (error) {
		debug.error(error);
	}
}

module.exports = handle;
