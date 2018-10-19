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
	proxyquire = require('proxyquire'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	yargs = require('yargs'),

	expect = chai.expect;

chai.use(sinonChai);

describe('bin/cli.js', () => {

	afterEach(() => {
		sinon.restore();
	});

	it('should create the base cli', () => {

		// given
		const
			terminalWidth = 200,
			mockConstants = { VERSION: '1.0.0', COPYRIGHT_NOTICE: '(c) test' },
			mockYargs = yargs('my-command');

		sinon.stub(mockYargs, 'alias').returnsThis();
		sinon.stub(mockYargs, 'command').returnsThis();
		sinon.stub(mockYargs, 'demandCommand').returnsThis();
		sinon.stub(mockYargs, 'epilogue').returnsThis();
		sinon.stub(mockYargs, 'help').returnsThis();
		sinon.stub(mockYargs, 'showHelpOnFail').returnsThis();
		sinon.stub(mockYargs, 'strict').returnsThis();
		sinon.stub(mockYargs, 'terminalWidth').returns(terminalWidth);
		sinon.stub(mockYargs, 'usage').returnsThis();
		sinon.stub(mockYargs, 'version').returnsThis();
		sinon.stub(mockYargs, 'wrap').returnsThis();

		// when
		proxyquire('../../lib/bin/cli', {
			'./constants/constants': mockConstants,
			yargs: mockYargs
		});

		// then
		expect(mockYargs.alias).to.have.been.calledTwice;
		expect(mockYargs.command).to.have.callCount(4);
		expect(mockYargs.demandCommand).to.have.been.calledOnce;
		expect(mockYargs.epilogue).to.have.been.calledOnce;
		expect(mockYargs.help).to.have.been.calledOnce;
		expect(mockYargs.showHelpOnFail).to.have.been.calledOnce;
		expect(mockYargs.strict).to.have.been.calledOnce;
		expect(mockYargs.usage).to.have.been.calledOnce;
		expect(mockYargs.version).to.have.been.calledOnce;
		expect(mockYargs.wrap).to.have.been.calledOnce;

		expect(mockYargs.usage).to.have.been.calledWith('\nUsage: orizuru COMMAND');
		expect(mockYargs.demandCommand).to.have.been.calledWith(2, 'Run \'orizuru --help\' for more information on a command.\n');
		expect(mockYargs.showHelpOnFail).to.have.been.calledWith(true);
		expect(mockYargs.help).to.have.been.calledWith('h');
		expect(mockYargs.alias).to.have.been.calledWith('h', 'help');
		expect(mockYargs.alias).to.have.been.calledWith('v', 'version');
		expect(mockYargs.strict).to.have.been.calledWith(true);
		expect(mockYargs.version).to.have.been.calledWith('1.0.0');
		expect(mockYargs.epilogue).to.have.been.calledWith('(c) test');
		expect(mockYargs.wrap).to.have.been.calledWith(terminalWidth);

	});

	it('should show the help if a command is not found', () => {

		// given
		const
			mockPublish = {
				command: 'my-command'
			},
			mockYargs = yargs('my-not-command --my-arg=my-value');

		sinon.stub(mockYargs, 'exit').returns(mockYargs);
		sinon.stub(mockYargs, 'showHelp');

		// stub the internal _getLoggerInstance method so that no logging is output
		sinon.stub(mockYargs, '_getLoggerInstance').returns({ error: sinon.stub() });

		// when
		proxyquire('../../lib/bin/cli', {
			'./commands/publish': mockPublish,
			yargs: mockYargs
		});

		// the
		expect(mockYargs.showHelp).to.have.been.calledOnce;
		expect(mockYargs.exit).to.have.been.called;

	});

});
