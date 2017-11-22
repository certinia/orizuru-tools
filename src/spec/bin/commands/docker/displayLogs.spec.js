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
	chai = require('chai'),
	proxyquire = require('proxyquire'),
	root = require('app-root-path'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	expect = chai.expect,

	COPYRIGHT_NOTICE = require(root + '/src/lib/bin/constants/constants').COPYRIGHT_NOTICE,

	service = require(root + '/src/lib/service/docker'),

	sandbox = sinon.sandbox.create();

chai.use(sinonChai);

describe('bin/commands/docker/displayLogs.js', () => {

	let cli, mocks;

	beforeEach(() => {

		mocks = {};
		mocks.yargs = {};
		mocks.yargs.epilogue = sandbox.stub().returns(mocks.yargs);
		mocks.yargs.option = sandbox.stub().returns(mocks.yargs);
		mocks.yargs.usage = sandbox.stub().returns(mocks.yargs);

		cli = proxyquire(root + '/src/lib/bin/commands/docker/displayLogs', {
			yargs: mocks.yargs
		});

	});

	afterEach(() => {
		sandbox.restore();
	});

	it('should have the correct command, description and alias', () => {

		// then
		expect(cli.command).to.eql('display-logs');
		expect(cli.aliases).to.eql(['logs']);
		expect(cli.desc).to.eql('Display logs for the selected Docker containers');

	});

	it('should create the cli', () => {

		// when
		cli.builder(mocks.yargs);

		// then
		expect(mocks.yargs.epilogue).to.have.been.calledOnce;
		expect(mocks.yargs.option).to.have.been.calledThrice;
		expect(mocks.yargs.usage).to.have.been.calledOnce;

		expect(mocks.yargs.epilogue).to.have.been.calledWith(COPYRIGHT_NOTICE);
		expect(mocks.yargs.option).to.have.been.calledWith('a', sinon.match.object);
		expect(mocks.yargs.option).to.have.been.calledWith('d', sinon.match.object);
		expect(mocks.yargs.option).to.have.been.calledWith('verbose', sinon.match.object);
		expect(mocks.yargs.usage).to.have.been.calledWith('\nUsage: orizuru docker display-logs [SERVICE] [OPTIONS]');

	});

	it('should call the handler', () => {

		// given
		const
			expectedInput = { debug: true },
			expectedOutput = { argv: expectedInput };

		sandbox.stub(service, 'displayLogs');

		// when
		cli.handler(expectedInput);

		// then
		expect(service.displayLogs).to.have.been.calledOnce;
		expect(service.displayLogs).to.have.been.calledWith(expectedOutput);

	});

});
