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
	root = require('app-root-path'),
	chai = require('chai'),
	proxyquire = require('proxyquire'),
	sinon = require('sinon'),

	expect = chai.expect,

	COPYRIGHT_NOTICE = require(root + '/src/lib/bin/constants/constants').COPYRIGHT_NOTICE,

	GenerateApexTransportService = require(root + '/src/lib/service/generateApexTransport'),
	generateApexTransportCommandPath = root + '/src/lib/bin/commands/setup/generateApexTransport',
	generateApexTransportCommand = require(generateApexTransportCommandPath),

	calledOnce = sinon.assert.calledOnce,
	calledWith = sinon.assert.calledWith,

	sandbox = sinon.sandbox.create();

describe('bin/commands/setup/generateApexTransport.js', () => {

	let mocks;

	beforeEach(() => {
		mocks = {};
		mocks.generateApexTransport = sandbox.stub(GenerateApexTransportService, 'generateApexTransport');
	});

	afterEach(() => sandbox.restore());

	it('should create the cli', () => {

		// given
		mocks.yargs = {};
		mocks.yargs.epilogue = sandbox.stub().returns(mocks.yargs);
		mocks.yargs.usage = sandbox.stub().returns(mocks.yargs);

		const cli = proxyquire(generateApexTransportCommandPath, {
			yargs: mocks.yargs
		});

		// when
		cli.builder(mocks.yargs);

		//then
		calledOnce(mocks.yargs.epilogue);

		calledWith(mocks.yargs.epilogue, COPYRIGHT_NOTICE);
		calledWith(mocks.yargs.usage, '\nUsage: orizuru setup generateapextransport [.avsc folder path] [apex class output path]');

	});

	it('should return the correct config', () => {

		// given/when/then
		expect(generateApexTransportCommand).to.deep.contain({
			command: ['generateapextransport [inputUrl] [outputUrl]', 'gat [inputUrl] [outputUrl]'],
			description: 'Generates apex transport classes for .avsc files in a folder'
		});

	});

	it('should have a handler that calls the generateApexTransport service', () => {

		// given
		const { handler } = generateApexTransportCommand;

		// when
		handler('test');

		// then
		calledOnce(mocks.generateApexTransport);
		calledWith(mocks.generateApexTransport, 'test');

	});

});
