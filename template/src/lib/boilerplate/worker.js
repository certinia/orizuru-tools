'use strict';

const

	// get utils
	debug = require('debug-plus')('financialforcedev:orizuru~tools:example:boilerplate:worker'),
	fs = require('fs'),
	{ dirname, basename, resolve } = require('path'),
	klawSync = require('klaw-sync'),

	// define transport
	transport = require('./shared/transport'),

	// get handler
	{ Handler } = require('@financialforcedev/orizuru'),
	handlerInstance = new Handler(transport),

	// get all files in our 'schemas' and 'handlers' directories
	schemas = require('./shared/schemas'),
	handlers = require('./shared/handlers'),

	schemaAndHandlersFilePathUnion = {};
