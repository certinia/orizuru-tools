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

	{ generateTransportExtension, generateInnerClass } = require('./generateClass'),

	PRIMITIVE_TYPE_MAP = {
		'null': {
			type: 'Object',
			complex: false
		},
		'boolean': {
			type: 'Boolean',
			complex: false
		},
		'int': {
			type: 'Integer',
			complex: false
		},
		'long': {
			type: 'Long',
			complex: false
		},
		'float': {
			type: 'Double',
			complex: false
		},
		'double': {
			type: 'Double',
			complex: false
		},
		string: {
			type: 'String',
			complex: false
		}
	},

	getFullyQualifiedName = object => {
		if (_.isString(object.name) && !_.isEmpty(object.name)) {
			if (_.isString(object.namespace) && !_.isEmpty(object.namespace)) {
				return object.namespace + '.' + object.name;
			} else {
				return object.name;
			}
		}
		throw new Error('\'record\' and \'enum\' type objects must have a name.');
	},

	COMPLEX_TYPE_MAP = {
		record: object => ({
			type: 'record',
			complex: true,
			fullyQualifiedName: getFullyQualifiedName(object),
			subtree: object
		}),
		'enum': object => ({
			type: 'enum',
			complex: true,
			fullyQualifiedName: getFullyQualifiedName(object),
			subtree: object
		}),
		array: object => ({
			type: 'array',
			complex: true,
			items: object.items
		}),
		map: object => ({
			type: 'map',
			complex: true,
			values: object.values
		})
	};

function mapType(object) {

	let type = null;

	// if union
	if (_.isArray(object.type)) {
		type = {
			type: 'Object',
			complex: false
		};
	}
	// if primitive
	if (_.isString(object.type)) {
		type = PRIMITIVE_TYPE_MAP[object.type];
		if (type == null) {
			type = COMPLEX_TYPE_MAP[object.type];
			if (_.isFunction(type)) {
				type = type(object);
			}
		}
	}

	if (type == null) {
		throw new Error('Unable to determine type for: \n' + JSON.stringify(object) + '\n, we do not allow usage of the \'fixed\' or \'bytes\' types.');
	}

	return type;
}

module.exports = {
	mapType
};
