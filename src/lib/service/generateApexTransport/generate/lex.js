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

	avro = require('avsc'),

	types = require('./lex/types'),
	classifications = require('./lex/classifications'),

	tokens = require('./shared/tokens');

function validate(schema) {
	avro.Type.forSchema(schema); // throws for invalid schemas
}

function lex(schema) {

	function lexRecord(schema) {
		const fields = [];
		_.each(schema.fields, field => {
			fields.push(new tokens.Field(field.name, lex(field)));
		});
		return new tokens.Record(schema.name, schema.namespace, fields);
	}

	function lexEnum(schema) {
		const symbols = [];
		_.each(schema.symbols, symbol => {
			symbols.push(new tokens.Symbol(symbol));
		});
		return new tokens.Enum(schema.name, schema.namespace, symbols);
	}

	function lexArray(schema) {
		return new tokens.Array(lex(schema.items));
	}

	function lexMap(schema) {
		return new tokens.Map(lex(schema.values));
	}

	function lexUnion(schema) {
		const types = [];
		_.each(schema, item => {
			types.push(lex(item));
		});
		return new tokens.Union(types);
	}

	const { classification, type } = classifications.classify(schema);
	let result = null;

	if (classification === classifications.SIMPLE ||
		classification === classifications.REF) {
		result = type;
	}

	if (classification === classifications.NESTED) {
		result = lex(type);
	}

	if (classification === classifications.COMPLEX) {

		if (type.type === types.COMPLEX.RECORD) {
			result = lexRecord(type, lex);
		}

		if (type.type === types.COMPLEX.ENUM) {
			result = lexEnum(type, lex);
		}

		if (type.type === types.COMPLEX.ARRAY) {
			result = lexArray(type, lex);
		}

		if (type.type === types.COMPLEX.MAP) {
			result = lexMap(type, lex);
		}

	}

	if (classification === classifications.UNION) {
		result = lexUnion(type, lex);
	}

	return result;

}

function validateAndLex(schema) {
	validate(schema);
	return lex(schema);
}

module.exports = { validateAndLex };
