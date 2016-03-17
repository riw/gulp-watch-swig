'use strict';

var PLUGIN_NAME = 'gulp-watch-swig';

var gulp = require('gulp'),
	gutil = require('gulp-util'),
	watch = require('gulp-watch'),
	through = require('through2'),
	path = require('path'),
  fs = require('fs');

// Generates list of include/extends paths for a given Vinyl file
function getSwigFileImports(file, cb) {
	var
		filePath = file.path,
		base,
		contents,
		regexp = /{%\s*(?:extends|include)\s*(?:"(.+)"|'(.+)').*%}/g,
		match,
		imports = [],
		i = 0;
	do {
		base = path.dirname(filePath);
		contents = fs.readFileSync(filePath, 'utf-8');
		do {
			match = regexp.exec(contents);
			if(match) {
				filePath = path.join(base, match[2]);
				if(imports.indexOf(filePath) < 0) {
					imports.push(filePath);
				}
			}
		} while(match);
		i++;
	} while(i <= imports.length);
	cb(imports.sort());
}

// Tracks watch streams e.g. `{filepath}: stream`
var _streams = Object.create(null);

// Name of the event fired when include/extends cause file to change
// (Overwrites the current file.event set by gulp-watch/gaze)
var changeEvent = 'changed:by:import';

// Import generator
function watchSwigImports(file, options, cb, done) {
	var filePath = file.path,
		watchStream = _streams[filePath];

	// Generate an include/extends list
	getSwigFileImports(file, function(imports) {
		var oldImports;

		// If a previous watch stream is active...
		if(watchStream) {
			oldImports = watchStream._imports;

			// Check to ensure the include/extends arrays are identical.
			if(oldImports.length && oldImports.join() === imports.join()) {
				done(); return; // Don't do anything further!
			}

			// Clean up previous watch stream
			watchStream.end();
			watchStream.unpipe();
			watchStream.close();
			delete _streams[filePath];
		}

		// If we found some imports...
		if(imports.length) {
			// Generate new watch stream
			watchStream = _streams[filePath] = watch(imports, options, cb);

			// Expose include/extends list on the stream
			watchStream._imports = imports;
		}

		done();
	});
}

module.exports = function (glob, options, callback) {
	// No-op callback if not given
	if(!options) { options = {}; }
	if(!callback) { callback = function() {}; }

	// Generate a basic `gulp-watch` stream
	var watchStream = watch(glob, options, callback)

	function watchImportStream(file, enc, cb) {
		var filePath = file.path;

		// Passthrough the file
		this.push(file);

		// Make sure we only execute the logic on external events
		// and not when our own internal changeEvent triggers it
		if(file.event !== changeEvent) {
			watchSwigImports(file, options, function(importFile) {
					watchStream._gaze.emit('all', changeEvent, filePath);
				},
				cb);
		}

		// Otherwise execute the callback logic immediately
		else { cb(); }

	}

	// Close all import watch streams when the watchStream ends
	watchStream.on('end', function() { Object.keys(_streams).forEach(closeStream); });

	// Immediately apply the globs and watch all imports, since otherwise we'd
	// have to edit the files once before any include/extends watching would activate
	gulp.src(glob).pipe(through.obj(watchImportStream));

	// Pipe the watch stream into the imports watcher so whenever any of the
	// files change, we re-generate our include/extends watcher so removals/additions
	// are detected
	return watchStream.pipe(through.obj(watchImportStream));
};
