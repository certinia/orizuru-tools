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
	chaiAsPromised = require('chai-as-promised'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	inquirer = require('inquirer'),
	questions = require(root + '/src/lib/util/questions'),
	validators = require(root + '/src/lib/util/validators'),

	askQuestions = require(root + '/src/lib/service/init/askQuestions'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('service/init/askQuestions.js', () => {

	beforeEach(() => {

		sandbox.stub(inquirer, 'prompt').resolves({
			folder: 'test'
		});
		sandbox.stub(questions, 'listField').returns('test');

	});

	afterEach(() => sandbox.restore());

	describe('askQuestions', () => {

		it('should call inquirer prompt with correct questions', () => {

			// given - when - then
			return expect(askQuestions.askQuestions({
				appFolders: [
					'af1',
					'af2'
				]
			})).to.eventually.eql({
				appFolders: [
					'af1',
					'af2'
				],
				folder: 'test'
			}).then(() => {
				expect(inquirer.prompt).to.have.been.calledOnce;
				expect(questions.listField).to.have.been.calledOnce;
				expect(inquirer.prompt).to.have.been.calledWith(['test']);
				expect(questions.listField).to.have.been.calledWith('Select app to create:', 'folder', validators.valid, [
					'af1',
					'af2'
				]);
			});

		});

	});

});
