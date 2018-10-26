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
	fs = require('fs'),
	path = require('path');

function readDirectory(dir, opts, fileList) {

	const
		results = fileList,
		filePaths = fs.readdirSync(dir);

	filePaths.map((filePath) => {

		const
			fp = dir + path.sep + filePath,
			stat = fs.lstatSync(fp),

			isFile = stat.isFile(),
			isDirectory = stat.isDirectory(),

			addToList = !isDirectory && (isFile && filePath.endsWith(opts.extension));

		if (isDirectory) {
			readDirectory(fp, opts, results);
		}

		if (addToList) {
			if (opts.readFile) {
				results[fp] = fs.readFileSync(fp).toString();
			} else {
				results.push(fp);
			}
		}

	});

	return results;

}

function findFilesWithExtension(directory, extension) {
	return readDirectory(directory, { extension }, []);
}

function readFilesWithExtension(directory, extension) {
	return readDirectory(directory, { extension, readFile: true }, {});
}

module.exports = {
	findFilesWithExtension,
	readFilesWithExtension
};
