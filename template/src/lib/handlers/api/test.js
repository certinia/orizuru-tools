'use strict';

const debug = require('debug-plus')('financialforcedev:orizuru~tools:example:handlers:api:test');

module.exports = ({ message, context }) => {
	debug.log('Handled event for schema \'api/test\'...');
	debug.log('Context:');
	debug.log(JSON.stringify(context));
	debug.log('Message:');
	debug.log(JSON.stringify(message));
};
