/*
* Copyright (c) 2014 Brandon McQuarie

* Logging
  1. Creating new version file
  2. Deleting old version file
  3. Process flow
  4. File already versioned
*/

'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var _ = require('underscore');

module.exports = function(grunt) {

    grunt.registerMultiTask('versioningIncremental', 'Static Versioning Files', function() {
        var done = this.async(),
            options = this.options({
                cacheFile: '.cache/versioning.json',
                deletedFile: '.cache/versioningOld.json',
                encoding: 'utf8',
                outputKey: function(key) { return key; },
                outputValue: function(value) { return value; },
                versionFile: function(destPath, rev) {
                    var fileName = options.pattern.replace('name', path.basename(destPath, path.extname(destPath))).replace('version', rev).replace('.ext', path.extname(destPath));
                    return path.dirname(destPath) + path.sep + fileName;
                },
                versionAllFiles: false,
                pattern: 'name._version_.ext',
                findRegex: undefined,
                replaceRegex: undefined,
                versionRegex: undefined,
                deleteOld: true,
                startingVersion: 0,
                logging: [1, 2],
                testing: false
            }),
            files = {},
            cacheJSON = {
                modified: {},
                original: {}
            },
            localParams = {},
            cacheOld = [];

        options.logging = _.isArray(options.logging) ? options.logging : [options.logging];

        output('Reading Cache File', 3, options);
        if (fs.existsSync(options.cacheFile)) {
            try {
                cacheJSON = JSON.parse(grunt.file.read(options.cacheFile));

                if (!_.isObject(cacheJSON)) {
                    cacheJSON = {
                        modified: {},
                        original: {}
                    };
                }
            } catch(e) {}
        }

        if (fs.existsSync(options.deletedFile)) {
            try {
                cacheOld = JSON.parse(grunt.file.read(options.deletedFile));

                if (!_.isObject(cacheJSON)) {
                    cacheOld = [];
                }
            } catch(e) {}
        }

        output('Cache File Read: ' + _.keys(cacheJSON.original).length + ' found cached files', 3, options);
        output('Old Cache File Read: ' + cacheOld.length + ' found cached files', 3, options);

        options.findRegex = options.findRegex || new RegExp(options.pattern.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&").replace(/(name|version|ext)/g, '.+'));
        options.versionRegex = options.versionRegex || new RegExp('(?!=' + options.pattern.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&").replace(/(name|ext)/g, '').replace('version', ')[0-9]+(?=').replace('\\.\\.', '\\..+\\.') + ')')
        options.replaceRegex = options.replaceRegex || new RegExp(options.pattern.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&").replace(/(name|ext)/g, '').replace('version', '[0-9]').replace('\\.\\.', '\\.'))
        output('Created Find, Replace and Version Regex for: ' + options.pattern, 3, options);

        output('Creating versioning object based on found files.', 3, options);
        _.each(this.files, function(file) {
            if (!options.findRegex.test(path.basename(file.dest))) {
                cacheJSON.original[file.dest] = cacheJSON.original[file.dest] || '';

                localParams.versionedFile = {
                    version: options.startingVersion,
                    src: cacheJSON.original[file.dest] || ''
                }

                if (cacheJSON.original[file.dest].length && !cacheJSON.original[file.dest].match(options.versionRegex, '.')) {
                    if (!options.force && !grunt.option( 'force' )) {
                        grunt.fail.warn('Regex may have changed, unable to find version number. Stopping execution, versioned files will be deleted! Pass option "force = true" to ignore this warning!');
                    }

                    files[cacheJSON.original[file.dest]] = _.extend({}, files[cacheJSON.original[file.dest]], {
                        versioned: { src: [cacheJSON.original[file.dest]], dest: cacheJSON.original[file.dest] },
                        version: 0,
                        remove: true
                    });

                    localParams.versionedFile = {
                        version: 0,
                        src: []
                    }
                } else if (localParams.versionedFile.src.length) {
                    localParams.versionedFile.version = parseInt(cacheJSON.original[file.dest].match(options.versionRegex, '.')[0]);
                    if (grunt.file.exists(cacheJSON.original[file.dest])) {
                        localParams.versionedFile.src = [cacheJSON.original[file.dest]];
                    } else {
                        output('✔ Old version file not found: ' + cacheJSON.original[file.dest], 2, options);
                        localParams.versionedFile.src = [];
                    }
                } else {
                    localParams.versionedFile.version = 0;
                    localParams.versionedFile.src = [];
                }

                files[file.dest] = _.extend({
                    version: localParams.versionedFile.version,
                    versioned: { src: localParams.versionedFile.src }
                }, files[file.dest], {
                    unversioned: file
                });
            } else if (file.dest.match(options.versionRegex, '.')) {
                localParams.version = parseInt(file.dest.match(options.versionRegex, '.')[0]);
                files[file.dest.replace(options.replaceRegex, '.')] = _.extend({}, files[file.dest.replace(options.replaceRegex, '.')], {
                    versioned: file,
                    version: version
                });
            } else {
                files[file.dest] = _.extend({}, files[file.dest], {
                    versioned: file,
                    version: 0
                });
            }
        });

        output('Processed all SRC files', 3, options);
        options.versionAllFiles && output('Forcing reversioning of all files', 3, options) || output('Starting versioning', 3, options);

        _.each(files, function(file) {
            localParams.unversionedHash = '';
            localParams.versionedHash = '';

            if (!file.unversioned || file.remove) {
                output('Deleting versioned file as unversioned is gone: ' + file.versioned.dest, 2, options);
                !options.testing && grunt.file.delete(file.versioned.dest);
                return true;
            }

            if (file.unversioned.src.length === 0) {
                grunt.log.warn('SRC is an Empty Array');
                return false;
            }

            if (!options.versionAllFiles) {
                file.unversioned.src.forEach(function(f){
                    localParams.unversionedHash += crypto.createHash('md5').update(grunt.file.read(f, options.encoding)).digest('hex');
                });
                if (file.unversioned.src.length > 1){
                    localParams.unversionedHash = crypto.createHash('md5').update(localParams.unversionedHash).digest('hex');
                }

                file.versioned.src.forEach(function(f){
                    localParams.versionedHash += crypto.createHash('md5').update(grunt.file.read(f, options.encoding)).digest('hex');
                });
                if (file.versioned.src.length > 1){
                    localParams.versionedHash = crypto.createHash('md5').update(localParams.versionedHash).digest('hex');
                }
            }

            if (localParams.versionedHash !== localParams.unversionedHash || options.versionAllFiles) {
                localParams.newFilePath = options.versionFile.call(this, file.unversioned.dest, file.version + 1);

                file.unversioned.src.forEach(function(f) {
                    cacheJSON.modified[options.outputKey(f)] = options.outputValue(localParams.newFilePath);
                    cacheJSON.original[file.unversioned.dest] = localParams.newFilePath;
                    output('✔ Creating version file: ' + f + ' to ' + localParams.newFilePath, 1, options);
                    !options.testing && grunt.file.copy(f, localParams.newFilePath);
                });

                file.versioned.src.forEach(function(f) {
                    if (options.deleteOld) {
                        output('✔ Deleting version file: ' + f, 2, options);
                        !options.testing && grunt.file.delete(f);
                    }

                    cacheOld.push({
                        src: options.outputValue(f)
                    });
                });
            } else {
                file.unversioned.src.forEach(function(f) {
                    output('File already versioned: ' + f, 4, options);
                    cacheJSON.modified[options.outputKey(f)] = options.outputValue(file.versioned.src[0]);
                    cacheJSON.original[file.unversioned.dest] = file.versioned.src[0];
                });
            }

        });

        output('Writing out Cache File to: ' + options.cacheFile, 3, options);
        !options.testing && grunt.file.write(options.deletedFile, JSON.stringify(cacheOld));
        !options.testing && grunt.file.write(options.cacheFile, JSON.stringify(cacheJSON));

        done();
    });
};

function output(text, level, options) {
    if (_.contains(options.logging, level)) {
        console.log(text);
    }
}