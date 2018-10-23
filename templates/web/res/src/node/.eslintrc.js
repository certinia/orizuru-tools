'use strict';

module.exports = {
	'extends': '@financialforcedev',
	'parserOptions': {
		"ecmaVersion": 8
	},
	'rules': {
		camelcase: 0
	},
	overrides: [{
		files: ['*.spec.js'],
		rules: {
			'one-var': 'off'
		}
	}]
};
