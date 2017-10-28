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

	types = require('./types'),

	CLASSIFICATIONS = [
		'simple',
		'complex',
		'ref',
		'nested',
		'union'
	];

CLASSIFICATIONS.SIMPLE = CLASSIFICATIONS[0];
CLASSIFICATIONS.COMPLEX = CLASSIFICATIONS[1];
CLASSIFICATIONS.REF = CLASSIFICATIONS[2];
CLASSIFICATIONS.NESTED = CLASSIFICATIONS[3];
CLASSIFICATIONS.UNION = CLASSIFICATIONS[4];

CLASSIFICATIONS.classify = schema => {
	let type;
	if (_.isObject(schema)) {
		type = schema.type;
	} else if (_.isString(schema)) {
		type = schema;
	} else {
		throw new Error('Could not classify null schema');
	}

	if (_.isString(type) && !_.isEmpty(type)) {
		const
			simpleType = types.SIMPLE.is(type),
			complexType = types.COMPLEX.is(type);

		if (simpleType) {
			return {
				classification: CLASSIFICATIONS.SIMPLE,
				type
			};
		}
		if (complexType) {
			return {
				classification: CLASSIFICATIONS.COMPLEX,
				type: schema
			};
		}
		return {
			classification: CLASSIFICATIONS.REF,
			type
		};
	}
	if (_.isPlainObject(type)) {
		return {
			classification: CLASSIFICATIONS.NESTED,
			type
		};
	}
	if (_.isArray(type)) {
		return {
			classification: CLASSIFICATIONS.UNION,
			type
		};
	}
	throw new Error('Could not classify type for schema: ' + JSON.stringify(schema));
};

module.exports = Object.freeze(CLASSIFICATIONS);
