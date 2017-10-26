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

describe('service/generateApexTransport/generate.js', () => {

	describe('generate', () => {

		it('should generate types for a simple schema', () => {

			// given
			const input = [
					schemaToJson(inputPath('simple.avsctest'))
				],
				outputCls = read(outputPath('Simple.cls')),
				outputXml = read(outputPath('Default.cls-meta.xml'));

			// when - then
			expect(generate(input)).to.eql({
				cls: outputCls,
				xml: outputXml
			});

		});

		it('should generate types for a schema with a child record', () => {

			// given
			const input = [
					schemaToJson(inputPath('childRecord.avsctest'))
				],
				outputCls = read(outputPath('ChildRecord.cls')),
				outputXml = read(outputPath('Default.cls-meta.xml'));

			// when - then
			expect(generate(input)).to.eql({
				cls: outputCls,
				xml: outputXml
			});

		});

		it('should generate types for a recursive schema', () => {

			// given
			const input = [
					schemaToJson(inputPath('recursive.avsctest'))
				],
				outputCls = read(outputPath('Recursive.cls')),
				outputXml = read(outputPath('Default.cls-meta.xml'));

			// when - then
			expect(generate(input)).to.eql({
				cls: outputCls,
				xml: outputXml
			});

		});

		it('should generate types for a schema with enums', () => {

			// given
			const input = [
					schemaToJson(inputPath('enum.avsctest'))
				],
				outputCls = read(outputPath('Enum.cls')),
				outputXml = read(outputPath('Default.cls-meta.xml'));

			// when - then
			expect(generate(input)).to.eql({
				cls: outputCls,
				xml: outputXml
			});

		});

		it('should generate types for a schema with all types', () => {

			// given
			const input = [
					schemaToJson(inputPath('encompassingTypes.avsctest'))
				],
				outputCls = read(outputPath('EncompassingTypes.cls')),
				outputXml = read(outputPath('Default.cls-meta.xml'));

			// when - then
			expect(generate(input)).to.eql({
				cls: outputCls,
				xml: outputXml
			});

		});

		it('should generate types for a schema with nested union sub schemas', () => {

			// given
			const input = [
					schemaToJson(inputPath('nestedUnionSubSchema.avsctest'))
				],
				outputCls = read(outputPath('NestedUnionSubSchema.cls')),
				outputXml = read(outputPath('Default.cls-meta.xml'));

			// when - then
			expect(generate(input)).to.eql({
				cls: outputCls,
				xml: outputXml
			});

		});

	});

});
