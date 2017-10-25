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
	avroTypes = require('./avro'),
	apexTypes = require('./apex'),

	DELIMITER = '.',
	UNDERSCORE = '_';

function apexFriendlyFullyQualifiedName(qualifiedName) {
	const
		splits = qualifiedName.split(DELIMITER),
		strippedSplits = _.map(splits, split => {
			return _.trimEnd(_.trimStart(split, UNDERSCORE), UNDERSCORE);
		});
	return strippedSplits.join(UNDERSCORE);
}

function getFullyQualifiedName(object) {
	if (_.isString(object.name) && !_.isEmpty(object.name)) {
		if (_.isString(object.namespace) && !_.isEmpty(object.namespace)) {
			return object.namespace + DELIMITER + object.name;
		} else {
			return object.name;
		}
	}
	throw new Error('\'record\' and \'enum\' type objects must have a name.');
}

function mapSimpleType(object) {
	if (object === avroTypes.SIMPLE.BOOLEAN || object.type === avroTypes.SIMPLE.BOOLEAN) {
		return {
			type: avroTypes.SIMPLE.BOOLEAN,
			apexType: apexTypes.BOOLEAN,
			foundSubSchema: false
		};
	}
	if (object === avroTypes.SIMPLE.INTEGER || object.type === avroTypes.SIMPLE.INTEGER) {
		return {
			type: avroTypes.SIMPLE.INTEGER,
			apexType: apexTypes.INTEGER,
			foundSubSchema: false
		};
	}
	if (object === avroTypes.SIMPLE.LONG || object.type === avroTypes.SIMPLE.LONG) {
		return {
			type: avroTypes.SIMPLE.LONG,
			apexType: apexTypes.LONG,
			foundSubSchema: false
		};
	}
	if (object === avroTypes.SIMPLE.FLOAT || object.type === avroTypes.SIMPLE.FLOAT) {
		return {
			type: avroTypes.SIMPLE.FLOAT,
			apexType: apexTypes.DOUBLE,
			foundSubSchema: false
		};
	}
	if (object === avroTypes.SIMPLE.DOUBLE || object.type === avroTypes.SIMPLE.DOUBLE) {
		return {
			type: avroTypes.SIMPLE.DOUBLE,
			apexType: apexTypes.DOUBLE,
			foundSubSchema: false
		};
	}
	if (object === avroTypes.SIMPLE.STRING || object.type === avroTypes.SIMPLE.STRING) {
		return {
			type: avroTypes.SIMPLE.STRING,
			apexType: apexTypes.STRING,
			foundSubSchema: false
		};
	}
	return null;
}

function mapComplexType(object, existingSchemas) {
	let existing = false;
	_.each(existingSchemas, existingSchema => {
		if (object === existingSchema || object.type === existingSchema) {
			existing = {
				type: avroTypes.COMPLEX.RECORD,
				apexType: existingSchema,
				foundSubSchema: false
			};
		}
	});
	if (existing) {
		return existing;
	}
	if (object.type === avroTypes.COMPLEX.RECORD) {
		return {
			type: avroTypes.COMPLEX.RECORD,
			apexType: apexFriendlyFullyQualifiedName(getFullyQualifiedName(object)),
			foundSubSchema: object
		};
	}
	if (object.type === avroTypes.COMPLEX.ENUM) {
		return {
			type: avroTypes.COMPLEX.ENUM,
			apexType: apexFriendlyFullyQualifiedName(getFullyQualifiedName(object)),
			foundSubSchema: object
		};
	}
	if (object.type === avroTypes.COMPLEX.ARRAY) {
		// eslint-disable-next-line no-use-before-define
		const innerResult = map(object.items);
		return {
			type: avroTypes.COMPLEX.ARRAY,
			apexType: apexTypes.array(innerResult.apexType),
			foundSubSchema: innerResult.foundSubSchema
		};
	}
	if (object.type === avroTypes.COMPLEX.MAP) {
		// eslint-disable-next-line no-use-before-define
		const innerResult = map(object.values);
		return {
			type: avroTypes.COMPLEX.MAP,
			apexType: apexTypes.map(innerResult.apexType),
			foundSubSchema: innerResult.foundSubSchema
		};
	}
	return null;
}

function map(object, existingSchemas) {
	let result = null;
	result = mapSimpleType(object);
	if (result) {
		return result;
	}
	result = mapComplexType(object, existingSchemas);
	if (result) {
		return result;
	}
	throw new Error('Could not map type. We do not support "union", "bytes" or "fixed" types.');
}

module.exports = {
	map
};
