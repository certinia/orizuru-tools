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
	chai = require('chai'),
	root = require('app-root-path'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	expect = chai.expect;

chai.use(sinonChai);

describe('util/debug.js', () => {

	beforeEach(() => {
		delete require.cache[root + '/src/lib/util/debug.js'];

		sinon.stub(process.stderr, 'write');
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('addBufferFormatter', () => {

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

		it('should replace undefined with a blank string', () => {

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
			expect(process.stderr.write).to.have.been.calledOnce;
			expect(process.stderr.write.args[0][0]).to.contain('');

		});

	});

	describe('log', () => {

		it('should log a message if debug is true', () => {

			// given
			const
				input = 'test',
				debug = require(root + '/src/lib/util/debug.js');

			// when
			debug.log({ debug: true }, 'test', input);

			// then
			expect(process.stderr.write).to.have.been.calledOnce;
			expect(process.stderr.write.args[0][0]).to.contain(input);

		});

		it('should not log a message in silent mode', () => {

			// given
			const
				input = 'test',
				debug = require(root + '/src/lib/util/debug.js');

			// when
			debug.log({ silent: true, debug: false }, 'test', input);

			// then
			expect(process.stderr.write).to.not.have.been.calledWith(input);

		});

	});

	describe('stringify', () => {

		it('should log a message', () => {

			// given
			const
				input = { test: 'test' },
				debug = require(root + '/src/lib/util/debug.js');

			// when
			debug.stringify({ debug: true }, 'test', input);

			// then
			expect(process.stderr.write).to.have.been.calledOnce;

		});

	});

});
