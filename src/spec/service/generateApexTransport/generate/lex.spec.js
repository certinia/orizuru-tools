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

	testResPath = root + '/src/res/spec/generateApexTransport/generate/lex/',
	generateInputResPath = testResPath + 'input/',
	generateOutputResPath = testResPath + 'output/',

	{ validateAndLex } = require(root + '/src/lib/service/generateApexTransport/generate/lex');

function inputPath(filename) {
	return generateInputResPath + filename;
}

function outputPath(filename) {
	return generateOutputResPath + filename;
}

function read(path) {
	return require(path);
}

function testError(inputFile, errorMsg) {

	// given
	const
		input = read(inputPath(inputFile));

	// when - then
	expect(() => validateAndLex(input)).to.throw(errorMsg);

}

function testSuccess(inputAndOutputFileName) {

	// given
	const
		input = read(inputPath(inputAndOutputFileName + '.json')),
		output = read(outputPath(inputAndOutputFileName + '.json'));

	// when - then
	expect(validateAndLex(input)).to.eql(output);

}

describe('service/generateApexTransport/generate/lex.js', () => {

	describe('generate', () => {

		describe('should throw', () => {

			it('for unknown types', () => testError('unknownType', 'undefined type name: com.financialforce.unknown'));

			it('for bytes type', () => testError('bytesType', 'Could not classify type for schema: bytes. We do not support the fixed and bytes types.'));

			it('for unnamed records', () => testError('unnamedRecord', 'Records and Enums must have a name'));

			it('if enum has no symbols', () => testError('noEnumSymbols', 'invalid enum symbols: undefined'));

			it('if enum is already defined', () => testError('duplicateEnum', 'duplicate type name: com.financialforce.TestEnum'));

			it('if record has no fields', () => testError('noRecordFields', 'non-array record fields: undefined'));

			it('if record is already defined', () => testError('duplicateRecord', 'duplicate type name: com.financialforce.Test'));

		});

		describe('should generate types for', () => {

			it('a simple schema', () => testSuccess('simple'));

			it('a schema with a child record', () => testSuccess('childRecord'));

			it('if the root isn\'t a record', () => testSuccess('nonRecordRoot'));

			it('a recursive schema', () => testSuccess('recursive'));

			it('a schema with enums', () => testSuccess('enum'));

			it('a schema with all types', () => testSuccess('encompassingTypes'));

			it('a schema with nested union sub schemas', () => testSuccess('nestedUnionSubSchema'));

		});

	});

});
