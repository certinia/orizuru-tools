/**
 * Copyright (c) 2017, FinancialForce.com, inc
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
 **/

'use strict';

const
	_ = require('lodash'),
	proxyquire = require('proxyquire'),
	sinon = require('sinon'),
	yargs = require('yargs'),

	assert = sinon.assert,
	// Note: Intentionally using called, not calledOnce.
	// Yargs self-invokes certain functions.
	// e.g. 'usage' to provide default usage instructions
	called = assert.called,
	calledOnce = assert.calledOnce,
	calledWith = assert.calledWith,

	sandbox = sinon.sandbox.create();

describe('bin/cli.js', () => {

	afterEach(() => {
		sandbox.restore();
	});

	it('should create the base cli', () => {

		// given
		const
			terminalWidth = 200,
			mockConstants = { VERSION: '1.0.0', COPYRIGHT_NOTICE: '(c) test' },
			mockPublish = {
				command: 'my-command'
			},
			mockInit = {
				command: 'test-init',
				description: 'test desc',
				handler: _.noop
			},
			mockYargs = yargs('my-command');

		sandbox.stub(mockYargs, 'alias').returnsThis();
		sandbox.stub(mockYargs, 'command').returnsThis();
		sandbox.stub(mockYargs, 'demandCommand').returnsThis();
		sandbox.stub(mockYargs, 'epilogue').returnsThis();
		sandbox.stub(mockYargs, 'help').returnsThis();
		sandbox.stub(mockYargs, 'showHelpOnFail').returnsThis();
		sandbox.stub(mockYargs, 'strict').returnsThis();
		sandbox.stub(mockYargs, 'terminalWidth').returns(terminalWidth);
		sandbox.stub(mockYargs, 'usage').returnsThis();
		sandbox.stub(mockYargs, 'version').returnsThis();
		sandbox.stub(mockYargs, 'wrap').returnsThis();

		// when
		proxyquire('../../lib/bin/cli', {
			'./constants/constants': mockConstants,
			'./commands/publish': mockPublish,
			'./commands/init': mockInit,
			yargs: mockYargs
		});

		// then
		called(mockYargs.alias);
		called(mockYargs.command);
		called(mockYargs.demandCommand);
		called(mockYargs.epilogue);
		called(mockYargs.help);
		called(mockYargs.showHelpOnFail);
		called(mockYargs.strict);
		called(mockYargs.usage);
		called(mockYargs.version);
		called(mockYargs.wrap);

		calledWith(mockYargs.usage, '\nUsage: orizuru COMMAND');
		calledWith(mockYargs.demandCommand, 2, 'Run \'orizuru --help\' for more information on a command.\n');
		calledWith(mockYargs.showHelpOnFail, true);
		calledWith(mockYargs.help, 'h');
		calledWith(mockYargs.alias, 'h', 'help');
		calledWith(mockYargs.alias, 'v', 'version');
		calledWith(mockYargs.strict, true);
		calledWith(mockYargs.version, '1.0.0');
		calledWith(mockYargs.epilogue, '(c) test');
		calledWith(mockYargs.wrap, terminalWidth);

	});

	it('should show the help if a command is not found', () => {

		// given
		const
			mockPublish = {
				command: 'my-command'
			},
			mockYargs = yargs('my-not-command --my-arg=my-value');

		sandbox.stub(mockYargs, 'exit').returns(mockYargs);
		sandbox.stub(mockYargs, 'showHelp');

		// stub the internal _getLoggerInstance method so that no logging is output
		sandbox.stub(mockYargs, '_getLoggerInstance').returns({ error: sandbox.stub() });

		// when
		proxyquire('../../lib/bin/cli', {
			'./commands/publish': mockPublish,
			yargs: mockYargs
		});

		// the
		calledOnce(mockYargs.showHelp);
		called(mockYargs.exit);

	});

});
