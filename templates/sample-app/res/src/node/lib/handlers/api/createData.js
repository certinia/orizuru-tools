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
	connection = require('../../service/salesforce/connection'),
	writer = require('../../service/salesforce/writer'),

	dataToCreate = {
		accounts: require('../../../res/dataCreator/Account.json').records,
		contacts: require('../../../res/dataCreator/Contact.json').records,
		orders: require('../../../res/dataCreator/Order.json').records,
		vehicles: require('../../../res/dataCreator/Vehicle__c.json').records,
		vehicleTypes: require('../../../res/dataCreator/VehicleType__c.json').records,
		warehouses: require('../../../res/dataCreator/Warehouse__c.json').records,
		warehouseContacts: require('../../../res/dataCreator/WarehouseContacts.json').records
	},

	CREATED_ACCOUNTS = { message: 'Created Accounts', status: 'CREATED_ACCOUNTS' },
	CREATED_CONTACTS = { message: 'Created Contacts', status: 'CREATED_CONTACTS' },
	CREATED_WAREHOUSE_CONTACTS = { message: 'Created Warehouse Contacts', status: 'CREATED_WAREHOUSE_CONTACTS' },
	CREATED_VEHICLE_TYPE = { message: 'Created Vehicle Types', status: 'CREATED_VEHICLE_TYPE' },
	CREATED_WAREHOUSES = { message: 'Created Warehouses', status: 'CREATED_WAREHOUSES' },
	CREATED_VEHICLES = { message: 'Created Vehicles', status: 'CREATED_VEHICLES' },
	CREATED_ORDERS = { message: 'Created Orders', status: 'CREATED_ORDERS' },

	getConnection = ({ context, incomingMessage }) => {
		return connection.fromContext(context)
			.then(conn => ({ incomingMessage, conn }));
	},

	createObjects = ({ conn, objName, data }) => {
		return writer.bulkCreateObject(conn, objName, data);
	},

	sendDataGeneratorStepEvent = ({ conn, status, incomingMessage }) => {
		return writer.sendPlatformEvent(conn, { eventType: 'DataGeneratorStep__e', message: status.message, status: status.status, id: incomingMessage.generateDataTaskId });
	},

	createAccounts = (result) => {

		const conn = result.conn;

		return createObjects({ conn, objName: 'Account', data: dataToCreate.accounts })
			.then(accounts => {
				return sendDataGeneratorStepEvent({ conn, status: CREATED_ACCOUNTS, incomingMessage: result.incomingMessage })
					.then(() => {
						result.Accounts = accounts;
						return result;
					});
			});

	},

	createContacts = (result) => {

		const
			conn = result.conn,

			contactsToCreate = _.map(dataToCreate.contacts, (record, count) => {
				record.AccountId = result.Accounts[count].id;
				return record;
			});

		return createObjects({ conn, objName: 'Contact', data: contactsToCreate })
			.then(contacts => {
				return sendDataGeneratorStepEvent({ conn, status: CREATED_CONTACTS, incomingMessage: result.incomingMessage })
					.then(() => {
						result.Contacts = contacts;
						return result;
					});
			});

	},

	createWarehouseContacts = (result) => {

		const
			conn = result.conn,

			contactsToCreate = _.map(dataToCreate.warehouseContacts, (record, count) => {
				record.AccountId = result.Accounts[count].id;
				return record;
			});

		return createObjects({ conn, objName: 'Contact', data: contactsToCreate })
			.then(contacts => {
				return sendDataGeneratorStepEvent({ conn, status: CREATED_WAREHOUSE_CONTACTS, incomingMessage: result.incomingMessage })
					.then(() => {
						result.WarehouseContacts = contacts;
						return result;
					});
			});

	},

	createVehicleTypes = (result) => {

		const conn = result.conn;

		return createObjects({ conn, objName: 'VehicleType__c', data: dataToCreate.vehicleTypes })
			.then(vehicleTypes => {
				return sendDataGeneratorStepEvent({ conn, status: CREATED_VEHICLE_TYPE, incomingMessage: result.incomingMessage })
					.then(() => {
						result.VehicleTypes = vehicleTypes;
						return result;
					});
			});

	},

	createWarehouses = (result) => {

		const
			conn = result.conn,
			WarehouseContacts = result.WarehouseContacts,

			warehousesToCreate = _.map(dataToCreate.warehouses, (record, count) => {
				record['Contact__c'] = WarehouseContacts[count].id;
				return record;
			});

		return createObjects({ conn, objName: 'Warehouse__c', data: warehousesToCreate })
			.then(warehouses => {
				return sendDataGeneratorStepEvent({ conn, status: CREATED_WAREHOUSES, incomingMessage: result.incomingMessage })
					.then(() => {
						result.Warehouses = warehouses;
						return result;
					});
			});

	},

	createVehicles = (result) => {

		const
			conn = result.conn,
			VehicleTypes = result.VehicleTypes,
			Warehouses = result.Warehouses,
			WarehouseContacts = result.WarehouseContacts,

			vehiclesToCreate = _.map(dataToCreate.vehicles, (record, count) => {
				record['VehicleType__c'] = VehicleTypes[0].id;
				record['Warehouse__c'] = Warehouses[count % _.size(WarehouseContacts)].id;
				return record;
			});

		return createObjects({ conn, objName: 'Vehicle__c', data: vehiclesToCreate })
			.then(vehicles => {
				return sendDataGeneratorStepEvent({ conn, status: CREATED_VEHICLES, incomingMessage: result.incomingMessage })
					.then(() => {
						result.Vehicles = vehicles;
						return result;
					});
			});

	},

	createOrders = (result) => {
		const
			conn = result.conn,
			Accounts = result.Accounts,
			Contacts = result.Contacts,

			vehiclesToCreate = _.map(dataToCreate.orders, (record, count) => {
				record.AccountId = Accounts[count].id;
				record.ShipToContactId = Contacts[count].id;
				return record;
			});

		return createObjects({ conn, objName: 'Order', data: vehiclesToCreate })
			.then(orders => {
				return sendDataGeneratorStepEvent({ conn: result.conn, status: CREATED_ORDERS, incomingMessage: result.incomingMessage })
					.then(() => {
						result.orders = orders;
						return result;
					});
			});
	};

module.exports = ({ message, context }) => {

	return getConnection({ context, incomingMessage: message })
		.then(createAccounts)
		.then(createContacts)
		.then(createWarehouseContacts)
		.then(createVehicleTypes)
		.then(createWarehouses)
		.then(createVehicles)
		.then(createOrders);

};