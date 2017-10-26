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
	avroTypes = require('./types/avro'),
	mapper = require('./types/mapper'),

	{ transportClass, innerClass, innerEnum } = require('./template');

function enumForSchema(classes, subSchema) {
	const
		result = mapper.map(subSchema),
		recordName = result.apexType,
		symbols = subSchema.symbols;
	if (!_.isArray(symbols)) {
		throw new Error('Enum: ' + recordName + ' must contain \'symbols.\'');
	}
	if (classes[recordName]) {
		throw new Error('Enum: ' + recordName + ' already defined in schema.');
	} else {
		classes[recordName] = innerEnum(symbols, recordName);
	}
}

function classesForSchema(classes, subSchema, root = true) {
	const
		result = mapper.map(subSchema, Object.keys(classes)),
		recordName = result.apexType,
		fields = subSchema.fields,
		fieldNameToTypeMap = {};

	classes[recordName] = null;

	if (result.type !== avroTypes.COMPLEX.RECORD) {
		throw new Error('The root of the schema must be of type \'record\': ' + JSON.stringify(subSchema) + '.');
	}

	if (!_.isArray(fields)) {
		throw new Error('Record: ' + recordName + ' must contain \'fields.\'');
	}

	_.each(fields, field => {
		const result = mapper.map(field.type, Object.keys(classes));
		fieldNameToTypeMap[field.name] = result.apexType;
		if (_.size(result.foundSubSchemas)) {
			_.each(result.foundSubSchemas, innerSubSchema => {
				if (innerSubSchema.type === avroTypes.COMPLEX.RECORD) {
					classesForSchema(classes, innerSubSchema, false);
				}
				if (innerSubSchema.type === avroTypes.COMPLEX.ENUM) {
					enumForSchema(classes, innerSubSchema);
				}
			});
		}
	});

	if (classes[recordName]) {
		throw new Error('Record: ' + recordName + ' already defined in schema.');
	} else {
		if (root) {
			classes[recordName] = transportClass(fieldNameToTypeMap, recordName);
		} else {
			classes[recordName] = innerClass(fieldNameToTypeMap, recordName);
		}
	}

}

module.exports = {
	classesForSchema
};
