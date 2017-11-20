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
	chaiAsPromised = require('chai-as-promised'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),
	proxyquire = require('proxyquire'),

	expect = chai.expect,

	sandbox = sinon.sandbox.create(),

	connection = require('../../lib/service/salesforce/connection'),
	writer = require('../../lib/service/salesforce/writer');

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('dataCreator/service.js', () => {
	let mocks, fakeReturnedSobjects, service;

	afterEach(() => {
		sandbox.restore();
	});

	describe('createData', () => {
		beforeEach(() => {
			mocks = {};
			mocks.conn = sandbox.stub();
			mocks.mockId = 'testId';
			fakeReturnedSobjects = [sandbox.stub()];
			fakeReturnedSobjects[0].id = mocks.mockId;

			sandbox.stub(connection, 'fromContext').resolves(mocks.conn);
			sandbox.stub(writer, 'bulkCreateObject').resolves(fakeReturnedSobjects);
			sandbox.stub(writer, 'sendPlatformEvent').resolves();

			service = proxyquire('../../lib/handler/createData', {
				'./createData/sampleData/Account.json': {
					records: [{
						Name: 'Mission High School'
					}]
				},
				'./createData/sampleData/Contact.json': {
					records: [{
						FirstName: 'Mission High School',
						LastName: 'Mission High School',
						MailingLatitude: 37.76171660000001,
						MailingLongitude: -122.4273151,
						MailingCountry: 'USA'
					}]
				},
				'./createData/sampleData/Order.json': {
					records: [{
						Status: 'Draft',
						EffectiveDate: '2017-10-01'
					}]
				},
				'./createData/sampleData/Vehicle__c.json': {
					records: [{
						Name: 'Van 1'
					}]
				},
				'./createData/sampleData/VehicleType__c.json': {
					records: [{
						name: 'Mercedes-Benz 2018 Sprinter Cargo Van 3500 High Roof V6 170',
						['MaximumPayloadCapacity__c']: 10,
						['Fixed__c']: 0.0,
						['Distance__c']: 1.0,
						['Time__c']: 0.0
					}]
				},
				'./createData/sampleData/Warehouse__c.json': {
					records: [{
						Name: 'Port of San Francisco'
					}]
				},
				'./createData/sampleData/WarehouseContacts.json': {
					records: [{
						FirstName: 'Warehouse 1',
						LastName: 'Warehouse 1',
						MailingLatitude: 37.76171660000001,
						MailingLongitude: -122.4273151,
						MailingCountry: 'USA'
					}]
				}
			});
		});

		describe('resolve', () => {

			it('should insertData ', () => {

				// given
				const
					context = {},
					message = {
						generateDataTaskId: 'testId'
					};

				// when - then
				return expect(service({ context, message })).to.eventually.be.fulfilled
					.then(() => {
						expect(writer.bulkCreateObject).to.have.been.callCount(7);
						expect(writer.bulkCreateObject).to.have.been.calledWith(mocks.conn, 'Account', [{
							Name: 'Mission High School'
						}]);
						expect(writer.bulkCreateObject).to.have.been.calledWith(mocks.conn, 'Contact', [{
							FirstName: 'Mission High School',
							LastName: 'Mission High School',
							MailingLatitude: 37.76171660000001,
							MailingLongitude: -122.4273151,
							MailingCountry: 'USA',
							AccountId: mocks.mockId
						}]);
						expect(writer.bulkCreateObject).to.have.been.calledWith(mocks.conn, 'Contact', [{
							FirstName: 'Warehouse 1',
							LastName: 'Warehouse 1',
							MailingLatitude: 37.76171660000001,
							MailingLongitude: -122.4273151,
							MailingCountry: 'USA',
							AccountId: mocks.mockId
						}]);
						expect(writer.bulkCreateObject).to.have.been.calledWith(mocks.conn, 'VehicleType__c', [{
							name: 'Mercedes-Benz 2018 Sprinter Cargo Van 3500 High Roof V6 170',
							['MaximumPayloadCapacity__c']: 10,
							['Fixed__c']: 0.0,
							['Distance__c']: 1.0,
							['Time__c']: 0.0
						}]);
						expect(writer.bulkCreateObject).to.have.been.calledWith(mocks.conn, 'Warehouse__c', [{
							Name: 'Port of San Francisco',
							['Contact__c']: mocks.mockId
						}]);
						expect(writer.bulkCreateObject).to.have.been.calledWith(mocks.conn, 'Vehicle__c', [{
							Name: 'Van 1',
							['VehicleType__c']: mocks.mockId,
							['Warehouse__c']: mocks.mockId
						}]);
						expect(writer.bulkCreateObject).to.have.been.calledWith(mocks.conn, 'Order', [{
							AccountId: mocks.mockId,
							ShipToContactId: mocks.mockId,
							Status: 'Draft',
							EffectiveDate: '2017-10-01'
						}]);
						expect(writer.sendPlatformEvent).to.have.been.callCount(7);
						expect(writer.sendPlatformEvent).to.have.been.calledWith(mocks.conn, { eventType: 'DataGeneratorStep__e', message: 'Created Accounts', status: 'CREATED_ACCOUNTS', id: 'testId' });
						expect(writer.sendPlatformEvent).to.have.been.calledWith(mocks.conn, { eventType: 'DataGeneratorStep__e', message: 'Created Contacts', status: 'CREATED_CONTACTS', id: 'testId' });
						expect(writer.sendPlatformEvent).to.have.been.calledWith(mocks.conn, { eventType: 'DataGeneratorStep__e', message: 'Created Warehouse Contacts', status: 'CREATED_WAREHOUSE_CONTACTS', id: 'testId' });
						expect(writer.sendPlatformEvent).to.have.been.calledWith(mocks.conn, { eventType: 'DataGeneratorStep__e', message: 'Created Vehicle Types', status: 'CREATED_VEHICLE_TYPE', id: 'testId' });
						expect(writer.sendPlatformEvent).to.have.been.calledWith(mocks.conn, { eventType: 'DataGeneratorStep__e', message: 'Created Warehouses', status: 'CREATED_WAREHOUSES', id: 'testId' });
						expect(writer.sendPlatformEvent).to.have.been.calledWith(mocks.conn, { eventType: 'DataGeneratorStep__e', message: 'Created Vehicles', status: 'CREATED_VEHICLES', id: 'testId' });
						expect(writer.sendPlatformEvent).to.have.been.calledWith(mocks.conn, { eventType: 'DataGeneratorStep__e', message: 'Created Orders', status: 'CREATED_ORDERS', id: 'testId' });

					});

			});

		});

	});

});