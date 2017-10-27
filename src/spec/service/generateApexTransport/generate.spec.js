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

	expect = chai.expect,

	generateInputResPath = root + '/src/res/spec/generate/input/',
	generateOutputResPath = root + '/src/res/spec/generate/output/',

	{ readFileSync } = require('fs'),

	{ generate } = require(root + '/src/lib/service/generateApexTransport/generate');

function inputPath(filename) {
	return generateInputResPath + filename;
}

function outputPath(filename) {
	return generateOutputResPath + filename;
}

function read(path) {
	return readFileSync(path).toString('utf8');
}

function schemaToJson(path) {
	return JSON.parse(read(path));
}

function testError(inputFile, errorMsg) {

	// given
	const input = [
		schemaToJson(inputPath(inputFile))
	];

	// when - then
	expect(() => generate(input)).to.throw(errorMsg);

}

function testSuccess(inputFile, outputFile) {

	// given
	const input = [
			schemaToJson(inputPath(inputFile))
		],
		outputCls = read(outputPath(outputFile)),
		outputXml = read(outputPath('Default.cls-meta.xml'));

	// when - then
	expect(generate(input)).to.eql({
		cls: outputCls,
		xml: outputXml
	});

}

describe('service/generateApexTransport/generate.js', () => {

	describe('generate', () => {

		describe('should throw', () => {

			it('for unknown types', () => testError('unknownType.avsc', 'Could not map type for: "unknown". We do not support "bytes" or "fixed" types.'));

			it('for unnamed records', () => testError('unnamedRecord.avsc', '\'record\' and \'enum\' type objects must have a name.'));

			it('if enum has no symbols', () => testError('noEnumSymbols.avsc', 'TestEnum must contain \'symbols.\''));

			it('if enum is already defined', () => testError('duplicateEnum.avsc', 'Enum: TestEnum already defined in schema.'));

			it('if the root isn\'t a record', () => testError('nonRecordRoot.avsc', 'The root of the schema must be of type \'record\': {"namespace":"com.financialforce","name":"Test","type":"enum","symbols":["A","B","C"]}'));

			it('if record has no fields', () => testError('noRecordFields.avsc', 'Record: com_financialforce_Test must contain \'fields.\''));

			it('if record is already defined', () => testError('duplicateRecord.avsc', 'Record: com_financialforce_Test already defined in schema.'));

		});

		describe('should generate types for', () => {

			it('a simple schema', () => testSuccess('simple.avsc', 'Simple.cls'));

			it('a schema with a child record', () => testSuccess('childRecord.avsc', 'ChildRecord.cls'));

			it('a recursive schema', () => testSuccess('recursive.avsc', 'Recursive.cls'));

			it('a schema with enums', () => testSuccess('enum.avsc', 'Enum.cls'));

			it('a schema with all types', () => testSuccess('encompassingTypes.avsc', 'EncompassingTypes.cls'));

			it('a schema with nested union sub schemas', () => testSuccess('nestedUnionSubSchema.avsc', 'NestedUnionSubSchema.cls'));

		});

	});

});
