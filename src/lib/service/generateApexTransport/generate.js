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

	{ classesForSchema } = require('./generate/classesForSchema'),

	CLASS_MERGE_DELIMITER = '\n';

function generate(jsonAvroSchemas) {
	const
		finalResult = [],
		mergedClassIdentifiers = {};

	_.each(jsonAvroSchemas, jsonAvroSchema => {
		const classes = {};

		classesForSchema(classes, jsonAvroSchema);

		_.each(classes, (classString, classIdentifer) => {
			if (_.hasIn(mergedClassIdentifiers, classIdentifer)) {
				if (mergedClassIdentifiers[classIdentifer] !== classString) {
					throw new Error('Records and enums with the same \'name\' / \'namespace\' cannot be used across schemas unless they are identical. Identifier: \'' + classIdentifer + '\'.');
				}
			}
			finalResult.push(classString);
			mergedClassIdentifiers[classIdentifer] = classString;
		});

	});

	return finalResult.join(CLASS_MERGE_DELIMITER);

}

module.exports = {
	generate
};
