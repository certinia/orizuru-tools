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

		it('should throw for unknown types', () => testError('unknownType.avsctest', 'Could not map type for: "unknown". We do not support "bytes" or "fixed" types.'));

		it('should throw for unnamed records', () => testError('unnamedRecord.avsctest', '\'record\' and \'enum\' type objects must have a name.'));

		it('should throw if enum has no symbols', () => testError('noEnumSymbols.avsctest', 'TestEnum must contain \'symbols.\''));

		it('should throw if enum is already defined', () => testError('duplicateEnum.avsctest', 'Enum: TestEnum already defined in schema.'));

		it('should generate types for a simple schema', () => testSuccess('simple.avsctest', 'Simple.cls'));

		it('should generate types for a schema with a child record', () => testSuccess('childRecord.avsctest', 'ChildRecord.cls'));

		it('should generate types for a recursive schema', () => testSuccess('recursive.avsctest', 'Recursive.cls'));

		it('should generate types for a schema with enums', () => testSuccess('enum.avsctest', 'Enum.cls'));

		it('should generate types for a schema with all types', () => testSuccess('encompassingTypes.avsctest', 'EncompassingTypes.cls'));

		it('should generate types for a schema with nested union sub schemas', () => testSuccess('nestedUnionSubSchema.avsctest', 'NestedUnionSubSchema.cls'));

	});

});
