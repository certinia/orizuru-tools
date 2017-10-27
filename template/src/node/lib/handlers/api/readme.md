# Add Handlers here

Files are .js modules. Relative paths and names should match the schema file except
.avsc will be replaced with .js.

Exports a single handler function.

## Example

*fullname.js*

````javascript

'use strict';

const
	debug = require('debug-plus')('fullname-handler');

module.exports = ({ message, context }) => {
	debug.log('Handled event for schema \'api/fullname\'...');
	debug.log('Context:');
	debug.log(JSON.stringify(context));
	debug.log('Message:');
	debug.log(JSON.stringify(message));
};

````

