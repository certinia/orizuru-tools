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

	validators = require('../../lib/util/validators'),

	expect = chai.expect;

describe('util/validators.js', () => {

	describe('valid', () => {

		it('should return true', () => {

			// given - when - then
			expect(validators.valid()).to.eql(true);

		});

	});

	describe('validateNotEmpty', () => {

		it('should return an error if the result is empty', () => {

			// given
			const result = undefined;

			// when/then
			expect(validators.validateNotEmpty(result)).to.eql('You must provide a value.');

		});

		it('should return true if the result is not empty', () => {

			// given
			const result = 'test';

			// when/then
			expect(validators.validateNotEmpty(result)).to.eql(true);

		});

	});

	describe('validateHexColor', () => {

		it('should return an error if the result is empty', () => {

			// given
			const result = undefined;

			// when/then
			expect(validators.validateHexColor(result)).to.eql('You must provide a valid HEX color, e.g. FF0000.');

		});

		describe('should return an error if the result is not a 6 digit hex string', () => {

			it('Test 1', () => {

				// given/when/then
				expect(validators.validateHexColor('AAA00G')).to.eql('You must provide a valid HEX color, e.g. FF0000.');

			});

			it('Test 2', () => {

				// given/when/then
				expect(validators.validateHexColor('AAA00')).to.eql('You must provide a valid HEX color, e.g. FF0000.');

			});

			it('Test 3', () => {

				// given/when/then
				expect(validators.validateHexColor('12345X')).to.eql('You must provide a valid HEX color, e.g. FF0000.');

			});

		});

		it('should return true if the result is a hex color', () => {

			// given
			const result = 'FF0000';

			// when/then
			expect(validators.validateHexColor(result)).to.eql(true);

		});

	});

});
