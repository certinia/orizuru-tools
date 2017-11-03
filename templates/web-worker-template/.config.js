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

/*
 * Forked from https://github.com/npm/init-package-json/blob/master/default-input.js
 * 
 * We can't simply require this file from init-package-json, and override its exported members. 
 * It seems to reference vars that don't exist, leading me to believe that the code here is wrapped in something before it is ran.
 * 
 * Therefore, we have to copy the entire file over and override the bits we want to change.
 */

var fs = require('fs')
var glob = require('glob')
var path = require('path')
var validateLicense = require('validate-npm-package-license')
var validateName = require('validate-npm-package-name')
var npa = require('npm-package-arg')
var semver = require('semver')

// more popular packages should go here, maybe?
function isTestPkg(p) {
	return !!p.match(/^(expresso|mocha|tap|coffee-script|coco|streamline)$/)
}

function niceName(n) {
	return n.replace(/^node-|[.-]js$/g, '').toLowerCase()
}

function conf(name) {
	return config.get(name) || config.get(name.split('.').join('-'))
}

var name = package.name || basename
var spec = npa(name)
var scope = conf('scope')
if (scope) {
	if (scope.charAt(0) !== '@') scope = '@' + scope
	if (spec.scope) {
		name = scope + '/' + spec.name.split('/')[1]
	} else {
		name = scope + '/' + name
	}
}
exports.name = yes ? name : prompt('package name', niceName(name), function (data) {
	var its = validateName(data)
	if (its.validForNewPackages) return data
	var errors = (its.errors || []).concat(its.warnings || [])
	var er = new Error('Sorry, ' + errors.join(' and ') + '.')
	er.notValid = true
	return er
})

var version = package.version || conf('init.version') || '1.0.0'
exports.version = yes ?
	version :
	prompt('version', version, function (version) {
		if (semver.valid(version)) return version
		var er = new Error('Invalid version: "' + version + '"')
		er.notValid = true
		return er
	})

if (!package.description) {
	exports.description = yes ? '' : prompt('description')
}

if (!package.bin) {
	exports.bin = function (cb) {
		fs.readdir(path.resolve(dirname, 'bin'), function (er, d) {
			// no bins
			if (er) return cb()
			// just take the first js file we find there, or nada
			return cb(null, d.filter(function (f) {
				return f.match(/\.js$/)
			})[0])
		})
	}
}

exports.directories = function (cb) {
	fs.readdir(dirname, function (er, dirs) {
		if (er) return cb(er)
		var res = {}
		dirs.forEach(function (d) {
			switch (d) {
				case 'example':
				case 'examples':
					return res.example = d
				case 'test':
				case 'tests':
					return res.test = d
				case 'doc':
				case 'docs':
					return res.doc = d
				case 'man':
					return res.man = d
				case 'lib':
					return res.lib = d
			}
		})
		if (Object.keys(res).length === 0) res = undefined
		return cb(null, res)
	})
}

// overrode dependencies
exports.dependencies = {
	"@financialforcedev/orizuru": "^5.0.2",
	"@financialforcedev/orizuru-auth": "^3.0.3",
	"@financialforcedev/orizuru-transport-rabbitmq": "^3.0.3",
	"@financialforcedev/orizuru-openapi": "^2.0.1",
	"debug-plus": "1.2.2",
	"klaw-sync": "3.0.0",
	"pkginfo": "0.4.1",
	"throng": "4.0.0",
	"uuid": "3.1.0"
}

// overrode devDependencies
exports.devDependencies = {
	"@financialforcedev/eslint-config": "^3.0.0",
	"chai": "4.1.1",
	"lodash": "4.17.4",
	"mocha": "3.5.0",
	"nyc": "11.2.1",
	"proxyquire": "1.8.0",
	"sinon": "3.2.1",
	"sinon-chai": "2.14.0"
}

// overrode scripts
exports.scripts = {
	"lint-fix": "eslint src/node --fix",
	"pretest": "eslint src/node",
	"single-test": "nyc --all=false mocha",
	"test": "nyc mocha --recursive src/node/spec",
	"generate-apex-transport": "orizuru setup generateapextransport src/node/lib/schemas src/apex/app/main/default/classes"
}

// added nyc
exports.nyc = {
	"check-coverage": true,
	"per-file": true,
	"lines": 0,
	"statements": 0,
	"functions": 0,
	"branches": 0,
	"include": [
		"src"
	],
	"reporter": [
		"lcov",
		"html",
		"text",
		"text-summary"
	],
	"cache": true,
	"all": true
}

// added engine
exports.engines = {
	"node": "6.11.2"
}

if (!package.repository) {
	exports.repository = function (cb) {
		fs.readFile('.git/config', 'utf8', function (er, gconf) {
			if (er || !gconf) {
				return cb(null, yes ? '' : prompt('git repository'))
			}
			gconf = gconf.split(/\r?\n/)
			var i = gconf.indexOf('[remote "origin"]')
			if (i !== -1) {
				var u = gconf[i + 1]
				if (!u.match(/^\s*url =/)) u = gconf[i + 2]
				if (!u.match(/^\s*url =/)) u = null
				else u = u.replace(/^\s*url = /, '')
			}
			if (u && u.match(/^git@github.com:/))
				u = u.replace(/^git@github.com:/, 'https://github.com/')

			return cb(null, yes ? u : prompt('git repository', u))
		})
	}
}

if (!package.keywords) {
	exports.keywords = yes ? '' : prompt('keywords', function (s) {
		if (!s) return undefined
		if (Array.isArray(s)) s = s.join(' ')
		if (typeof s !== 'string') return s
		return s.split(/[\s,]+/)
	})
}

if (!package.author) {
	var a = conf('init.author.name')
	exports.author = a ? {
		"name": a,
		"email": conf('init.author.email'),
		"url": conf('init.author.url')
	} : yes ? '' : prompt('author')
}

var license = package.license || conf('init.license') || 'ISC'
exports.license = yes ? license : prompt('license', license, function (data) {
	var its = validateLicense(data)
	if (its.validForNewPackages) return data
	var errors = (its.errors || []).concat(its.warnings || [])
	var er = new Error('Sorry, ' + errors.join(' and ') + '.')
	er.notValid = true
	return er
})
