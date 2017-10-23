'use strict';

const
	_ = require('lodash'),
	klawSync = require('klaw-sync'),
	{ dirname, basename, resolve } = require('path');

// get all files in the given folder with the given extension
module.exports = {
	walk: (folder, ext) => {
		const
			DIR = resolve(__dirname, '..', '..', folder),
			FILTER = ({ path }) => path.endsWith(ext);

		return _.map(klawSync(DIR, { nodir: true, filter: FILTER }), value => {
			const { path } = value;
			// add sharedPath and fileName to the result
			return {
				path,
				sharedPath: dirname(path).substring(DIR.length),
				fileName: basename(path, ext)
			};
		});
	}
};
