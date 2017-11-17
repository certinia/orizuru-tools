/*
 * Copyright (c) 2017 FinancialForce.com, inc.  All rights reserved.
 *
 * This is a proof of concept.
 * It forms the basis of recommendations for architecture, patterns, dependencies, and has
 * some of the characteristics which will eventually be present in FF hybrid apps.
 *
 * However, it lacks important functionality and checks.
 * It does not conform to SOC1 or any other auditable process.
 *
 * We do not endorse any attempt to use this codebase as the blueprint for production code.
 */
'use strict';

const
	chai = require('chai'),
	root = require('app-root-path'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create();

chai.use(sinonChai);

describe('util/debug.js', () => {

	beforeEach(() => {
		delete require.cache[root + '/src/lib/util/debug.js'];
	});

	afterEach(() => sandbox.restore());

	describe('addBufferFormatter', () => {

		beforeEach(() => {
			sandbox.stub(process.stderr, 'write');
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should log each line individually', () => {

			// given
			const
				input = 'test\nlogging\nthese\nnew\nlines\n',
				debug = require(root + '/src/lib/util/debug.js');

			var debugInstance;

			debug.create.enable('instance');

			debugInstance = debug.create('instance');
			debug.addBufferFormatter(debugInstance);

			// when
			debugInstance('%b', input);

			// then
			expect(process.stderr.write).to.have.callCount(5);
			expect(process.stderr.write.args[0][0]).to.contain('test');
			expect(process.stderr.write.args[1][0]).to.contain('logging');
			expect(process.stderr.write.args[2][0]).to.contain('these');
			expect(process.stderr.write.args[3][0]).to.contain('new');
			expect(process.stderr.write.args[4][0]).to.contain('lines');

		});

		it('should replace undefined with a blank string ', () => {

			// given
			const
				input = undefined,
				debug = require(root + '/src/lib/util/debug.js');

			var debugInstance;

			debug.create.enable('instance');

			debugInstance = debug.create('instance');
			debug.addBufferFormatter(debugInstance);

			// when
			debugInstance('%b', input);

			// then
			expect(process.stderr.write).to.have.callCount(1);
			expect(process.stderr.write.args[0][0]).to.contain('');

		});

	});

});
