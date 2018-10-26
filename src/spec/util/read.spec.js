/**
 * Copyright (c) 2017-2018, FinancialForce.com, inc
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
 */

'use strict';

const
	chai = require('chai'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),

	fs = require('fs'),
	path = require('path'),

	read = require('../../lib/util/read'),

	expect = chai.expect;

chai.use(sinonChai);

describe('lib/util/read', () => {

	beforeEach(() => {

		sinon.stub(fs, 'readdirSync')
			.withArgs('src/index/client/shared').returns([
				'.DS_Store',
				'read.js',
				'walk.js'
			])
			.withArgs('src/index/client/validator').returns([])
			.withArgs('src/index/client').returns([
				'.DS_Store',
				'handler.js',
				'schema.js',
				'shared',
				'validator'
			]);

		sinon.stub(fs, 'lstatSync')
			.withArgs('src/index/client/shared/.DS_Store').returns({
				isDirectory: () => false,
				isFile: () => true
			})
			.withArgs('src/index/client/shared/read.js').returns({
				isDirectory: () => false,
				isFile: () => true
			})
			.withArgs('src/index/client/shared/walk.js').returns({
				isDirectory: () => false,
				isFile: () => true
			})
			.withArgs('src/index/client/.DS_Store').returns({
				isDirectory: () => false,
				isFile: () => true
			})
			.withArgs('src/index/client/handler.js').returns({
				isDirectory: () => false,
				isFile: () => true
			})
			.withArgs('src/index/client/schema.js').returns({
				isDirectory: () => false,
				isFile: () => true
			})
			.withArgs('src/index/client/shared').returns({
				isDirectory: () => true,
				isFile: () => false
			})
			.withArgs('src/index/client/validator').returns({
				isDirectory: () => true,
				isFile: () => false
			});

	});

	afterEach(() => {
		sinon.restore();
	});

	describe('findFilesWithExtension', () => {

		it('should return an empty object is no files of the given type are found', () => {

			// Given
			sinon.stub(path, 'resolve')
				.withArgs(sinon.match.string, 'src/index/client/shared').returns('src/index/client/shared')
				.withArgs(sinon.match.string).returns('');

			// When
			const results = read.findFilesWithExtension('src/index/client/shared', '.avsc');

			// Then
			expect(results).to.eql([]);

		});

		it('should return only files of the given type', () => {

			// Given
			sinon.stub(path, 'resolve')
				.withArgs(sinon.match.string, 'src/index/client/shared').returns('src/index/client/shared')
				.withArgs(sinon.match.string).returns('');

			// When
			const results = read.findFilesWithExtension('src/index/client/shared', '.js');

			// Then
			expect(results).to.eql([
				'src/index/client/shared/read.js',
				'src/index/client/shared/walk.js'
			]);

		});

		it('should return only files of the given type and recurse', () => {

			// Given
			sinon.stub(path, 'resolve')
				.withArgs(sinon.match.string, 'src/index/client').returns('src/index/client')
				.withArgs(sinon.match.string).returns('');

			// When
			const results = read.findFilesWithExtension('src/index/client', '.js');

			// Then
			expect(results).to.eql([
				'src/index/client/handler.js',
				'src/index/client/schema.js',
				'src/index/client/shared/read.js',
				'src/index/client/shared/walk.js'
			]);

		});

	});

	describe('readFilesWithExtension', () => {

		it('should return the file', () => {

			// Given
			sinon.stub(path, 'resolve')
				.withArgs(sinon.match.string, 'src/index/client').returns('src/index/client')
				.withArgs(sinon.match.string).returns('');

			sinon.stub(fs, 'readFileSync').returns('fileContents');

			// When
			const results = read.readFilesWithExtension('src/index/client', '.js');

			// Then
			expect(results).to.eql({
				'src/index/client/handler.js': 'fileContents',
				'src/index/client/schema.js': 'fileContents',
				'src/index/client/shared/read.js': 'fileContents',
				'src/index/client/shared/walk.js': 'fileContents'
			});

		});

	});

});
