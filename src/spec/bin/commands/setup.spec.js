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
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	yargs = require('yargs'),

	COPYRIGHT_NOTICE = require('../../../lib/bin/constants/constants').COPYRIGHT_NOTICE,

	cli = require('../../../lib/bin/commands/setup'),

	expect = chai.expect;

chai.use(sinonChai);

describe('bin/commands/setup.js', () => {

	beforeEach(() => {
		sinon.stub(yargs, 'command').returnsThis();
		sinon.stub(yargs, 'demandCommand').returnsThis();
		sinon.stub(yargs, 'epilogue').returnsThis();
		sinon.stub(yargs, 'updateStrings').returnsThis();
		sinon.stub(yargs, 'usage').returnsThis();
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should create the cli', () => {

		// when
		cli.builder(yargs);

		// then
		expect(yargs.command).to.have.been.calledTwice;
		expect(yargs.demandCommand).to.have.been.calledOnce;
		expect(yargs.epilogue).to.have.been.calledOnce;
		expect(yargs.updateStrings).to.have.been.calledOnce;
		expect(yargs.usage).to.have.been.calledOnce;

		expect(yargs.demandCommand).to.have.been.calledWith(3, 'Run \'orizuru setup --help\' for more information on a command.\n');
		expect(yargs.epilogue).to.have.been.calledWith(COPYRIGHT_NOTICE);
		expect(yargs.updateStrings).to.have.been.calledWith({ 'Commands:': 'Setup:' });
		expect(yargs.usage).to.have.been.calledWith('\nUsage: orizuru setup COMMAND');

	});

	it('should have the correct command, description and alias', () => {

		// then
		expect(cli.command).to.eql('setup');
		expect(cli.aliases).to.eql(['s']);
		expect(cli.desc).to.eql('Executes Setup commands');

	});

});
