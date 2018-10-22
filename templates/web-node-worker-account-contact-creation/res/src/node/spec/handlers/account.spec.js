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

	jsforce = require('jsforce'),

	connection = require('../../lib/service/salesforce/connection'),
	writer = require('../../lib/service/salesforce/writer'),

	handler = require('../../lib/handler/account'),

	expect = chai.expect;

chai.use(sinonChai);

describe('handler/account.js', () => {

	let connectionStub, contactCreateStub;

	beforeEach(() => {

		contactCreateStub = sinon.stub();

		connectionStub = sinon.createStubInstance(jsforce.Connection);
		connectionStub.sobject.withArgs('Contact').returns({
			create: contactCreateStub
		});
		sinon.stub(connection, 'fromContext').returns(connectionStub);

		sinon.stub(writer, 'createObject');

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('handler', () => {

		it('should create a single contact', async () => {

			// Given
			const event = {
				context: {
					user: 'test@test.com'
				},
				message: {
					ids: ['testId']
				}
			};

			// When
			await handler(event);

			// Then
			expect(connection.fromContext).to.have.been.calledOnce;

			expect(writer.createObject).to.have.been.calledOnce;
			expect(writer.createObject).to.have.been.calledWithExactly(connectionStub, 'Contact', {
				accountId: 'testId',
				firstName: 'Default contact',
				lastName: 'testId'
			});

		});

		it('should create a batch of 10 contacts', async () => {

			// Given
			const event = {
				context: {
					user: 'test@test.com'
				},
				message: {
					ids: ['testId1', 'testId2', 'testId3', 'testId4', 'testId5', 'testId6', 'testId7', 'testId8', 'testId9', 'testId10']
				}
			};

			// When
			await handler(event);

			// Then
			expect(connection.fromContext).to.have.been.calledOnce;

			expect(writer.createObject).to.have.callCount(10);

			event.message.ids.forEach((id) => {
				expect(writer.createObject).to.have.been.calledWithExactly(connectionStub, 'Contact', {
					accountId: id,
					firstName: 'Default contact',
					lastName: id
				});
			});

		});

		it('should create a 11 contacts', async () => {

			// Given
			const event = {
				context: {
					user: 'test@test.com'
				},
				message: {
					ids: ['testId1', 'testId2', 'testId3', 'testId4', 'testId5', 'testId6', 'testId7', 'testId8', 'testId9', 'testId10', 'testId11']
				}
			};

			// When
			await handler(event);

			// Then
			expect(connection.fromContext).to.have.been.calledOnce;

			expect(writer.createObject).to.have.callCount(11);

			event.message.ids.forEach((id) => {
				expect(writer.createObject).to.have.been.calledWithExactly(connectionStub, 'Contact', {
					accountId: id,
					firstName: 'Default contact',
					lastName: id
				});
			});

		});

	});

});
