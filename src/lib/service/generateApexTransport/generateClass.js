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
	fs = require('fs'),
	path = require('path'),

	TEMPLATE_PATH = path.resolve(__dirname, '../../../res/template'),

	TOKEN_START = '{{',
	TOKEN_END = '}}',

	REGEX_GLOBAL = 'g',

	CONSTRUCTOR_PARAM_DELIMITER = ', ',

	ENCODING = 'utf8',

	TEMPLATES = {
		GET_SET_PARAM: fs.readFileSync(path.resolve(TEMPLATE_PATH, 'getSetParam.cls')).toString(ENCODING),
		GET_SET_PARAM_ASSIGNMENT: fs.readFileSync(path.resolve(TEMPLATE_PATH, 'getSetParamAssignment.cls')).toString(ENCODING),
		INNER_CLASS: fs.readFileSync(path.resolve(TEMPLATE_PATH, 'innerClass.cls')).toString(ENCODING),
		CONSTRUCTOR_PARAM: fs.readFileSync(path.resolve(TEMPLATE_PATH, 'constructorParam.cls')).toString(ENCODING),
		TRANSPORT_EXTENSION: fs.readFileSync(path.resolve(TEMPLATE_PATH, 'transportExtension.cls')).toString(ENCODING)
	};

function replaceAll(str, token, value) {
	return str.replace(new RegExp(token, REGEX_GLOBAL), value);
}

function findAndReplace(tokenNamesToValuesMap, template) {
	let templateResult = template;
	_.each(tokenNamesToValuesMap, (value, tokenName) => {
		templateResult = replaceAll(templateResult, TOKEN_START + tokenName + TOKEN_END, value);
	});
	return templateResult;
}

function generateGetSetParams(namesToTypesMap) {
	let result = '';
	_.each(namesToTypesMap, (type, name) => {
		result += findAndReplace({ type, name }, TEMPLATES.GET_SET_PARAM + '\n');
	});
	return _.trimStart(result);
}

function generateConstructorParams(namesToTypesMap) {
	const result = [];
	_.each(namesToTypesMap, (type, name) => {
		result.push(findAndReplace({ type, name }, TEMPLATES.CONSTRUCTOR_PARAM));
	});
	return result.join(CONSTRUCTOR_PARAM_DELIMITER);
}

function generateGetSetParamAssignments(names) {
	let result = '';
	_.each(names, name => {
		result += findAndReplace({ name }, TEMPLATES.GET_SET_PARAM_ASSIGNMENT + '\n');
	});
	return _.trimStart(result);
}

function generateClass(fieldNamesToFieldTypesMap, qualifiedName, template) {
	const
		getSetParams = generateGetSetParams(fieldNamesToFieldTypesMap),
		constructorParams = generateConstructorParams(fieldNamesToFieldTypesMap),
		getSetParamAssignments = generateGetSetParamAssignments(Object.keys(fieldNamesToFieldTypesMap));

	return _.trimStart(findAndReplace({ getSetParams, constructorParams, getSetParamAssignments, qualifiedName }, template));
}

function generateTransportExtension(fieldNamesToFieldTypesMap, qualifiedName) {
	return generateClass(fieldNamesToFieldTypesMap, qualifiedName, TEMPLATES.TRANSPORT_EXTENSION);
}

function generateInnerClass(fieldNamesToFieldTypesMap, qualifiedName) {
	return generateClass(fieldNamesToFieldTypesMap, qualifiedName, TEMPLATES.INNER_CLASS);
}

module.exports = {
	generateTransportExtension,
	generateInnerClass
};
