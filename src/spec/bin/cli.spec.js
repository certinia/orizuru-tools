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

	constants = require('../../lib/bin/constants/constants'),

	yargs = require('yargs'),

	expect = chai.expect;

chai.use(sinonChai);

describe('bin/cli.js', () => {

	beforeEach(() => {

		sinon.stub(constants, 'getCopyrightNotice').returns('(c)');
		sinon.stub(constants, 'getVersion').returns('1.0.0');

		sinon.stub(yargs, 'alias').returnsThis();
		sinon.stub(yargs, 'command').returnsThis();
		sinon.stub(yargs, 'demandCommand').returnsThis();
		sinon.stub(yargs, 'epilogue').returnsThis();
		sinon.stub(yargs, 'help').returnsThis();
		sinon.stub(yargs, 'showHelpOnFail').returnsThis();
		sinon.stub(yargs, 'strict').returnsThis();
		sinon.stub(yargs, 'terminalWidth').returns(200);
		sinon.stub(yargs, 'usage').returnsThis();
		sinon.stub(yargs, 'version').returnsThis();
		sinon.stub(yargs, 'wrap').returnsThis();
		sinon.stub(yargs, 'exitProcess').returnsThis();

	});

	afterEach(() => {
		sinon.restore();
	});

	it('should create the base cli', () => {

		// Given
		// When
		require('../../lib/bin/cli');

		// Then
		expect(yargs.alias).to.have.been.calledTwice;
		expect(yargs.command).to.have.callCount(4);
		expect(yargs.demandCommand).to.have.been.calledOnce;
		expect(yargs.epilogue).to.have.been.calledOnce;
		expect(yargs.help).to.have.been.calledOnce;
		expect(yargs.showHelpOnFail).to.have.been.calledOnce;
		expect(yargs.strict).to.have.been.calledOnce;
		expect(yargs.usage).to.have.been.calledOnce;
		expect(yargs.version).to.have.been.calledOnce;
		expect(yargs.wrap).to.have.been.calledOnce;

		expect(yargs.usage).to.have.been.calledWith('\nUsage: orizuru COMMAND');
		expect(yargs.demandCommand).to.have.been.calledWith(2, 'Run \'orizuru --help\' for more information on a command.\n');
		expect(yargs.showHelpOnFail).to.have.been.calledWith(true);
		expect(yargs.help).to.have.been.calledWith('h');
		expect(yargs.alias).to.have.been.calledWith('h', 'help');
		expect(yargs.alias).to.have.been.calledWith('v', 'version');
		expect(yargs.strict).to.have.been.calledWith(true);
		expect(yargs.version).to.have.been.calledWith('1.0.0');
		expect(yargs.epilogue).to.have.been.calledWith('(c)');
		expect(yargs.wrap).to.have.been.calledWith(200);

	});

});
