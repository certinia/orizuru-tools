'use strict';

const
	klawSync = require('klaw-sync'),
	{ dirname, basename, resolve } = require('path');

// get all files in our 'schemas' directory
module.exports = {
	walk: (folder, ext) => {
		const
			DIR = resolve(__dirname, '..', '..', folder),
			FILTER = ({ path }) => path.endsWith(ext);

		return klawSync(DIR, { nodir: true, filter: FILTER }).map(value => {
			const { path } = value;
			return {
				path,
				sharedPath: dirname(path).substring(DIR.length),
				filename: basename(path, ext)
			};
		});
	}
};
