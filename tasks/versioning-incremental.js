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
                startingVersion: 0,
                logging: [1, 2],
                testing: false
            }),
            files = {},
            cacheJSON = {
                modified: {},
                original: {}
            },
            position = 0,
            unversionedHash = '',
            versionedHash = '',
            versionedFile,
            tempFile,
            version,
            sameDir,
            rev,
            tempFileName,
            consoleNum = 2;

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

        output('Cache File Read: ' + _.keys(cacheJSON.original).length + ' found cached files', 3, options);

        _.each(options.pattern.split('.'), function(item, pos) {
            if (item.indexOf('version') >= 0) {
                position = pos;
            }
        });

        options.findRegex = options.findRegex || new RegExp(options.pattern.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&").replace(/(name|version|ext)/g, '.+'));
        options.versionRegex = options.versionRegex || new RegExp('(?!=' + options.pattern.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&").replace(/(name|ext)/g, '').replace('version', ')[0-9]+(?=').replace('\\.\\.', '\\..+\\.') + ')')
        options.replaceRegex = options.replaceRegex || new RegExp(options.pattern.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&").replace(/(name|ext)/g, '').replace('version', '[0-9]').replace('\\.\\.', '\\.'))
        output('Created Find, Replace and Version Regex for: ' + options.pattern, 3, options);

        _.each(this.files, function(file) {
            tempFileName = path.basename(file.dest).split('.');
            
            if (!options.findRegex.test(path.basename(file.dest))) {
                versionedFile = {
                    version: options.startingVersion,
                    src: cacheJSON.original[file.dest] || ''
                }

                if (!versionedFile.src.match(options.versionRegex, '.')) {
                    if (!options.force && !grunt.option( 'force' )) {
                        grunt.fail.warn('Regex may have changed, unable to find version number. Stopping execution, versioned files will be deleted! Pass option "force = true" to ignore this warning!');
                    }

                    files[versionedFile.src] = _.extend({}, files[versionedFile.src], {
                        versioned: { src: [versionedFile.src], dest: versionedFile.src },
                        version: 0,
                        remove: true
                    });

                    versionedFile = {
                        version: 0,
                        src: []
                    }
                }

                if (versionedFile.src.length) {
                    versionedFile.version = parseInt(versionedFile.src.match(options.versionRegex, '.')[0]);
                    versionedFile.src = [versionedFile.src];
                } else {
                    versionedFile.src = [];
                }

                files[file.dest] = _.extend({
                    version: 0,
                    versioned: { src: versionedFile.src }
                }, files[file.dest], {
                    unversioned: file
                });
            } else if (file.dest.match(options.versionRegex, '.')) {
                version = parseInt(file.dest.match(options.versionRegex, '.')[0]);
                files[file.dest.replace(options.replaceRegex, '.')] = _.extend({}, files[file.dest.replace(options.replaceRegex, '.')], {
                    versioned: file,
                    version: version
                });
            } else {
                files[file.dest] = _.extend({}, files[file.dest], {
                    versioned: file,
                    version: version
                });
            }
        });

        output('Processed all SRC files', 3, options);
        options.versionAllFiles && output('Forcing reversioning of all files', 3, options) || output('Starting versioning', 3, options);

        _.each(files, function(file) {
            rev = false;
            unversionedHash = '';
            versionedHash = '';

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
                    unversionedHash += crypto.createHash('md5').update(grunt.file.read(f, options.encoding)).digest('hex');
                });
                if (file.unversioned.src.length > 1){
                    unversionedHash = crypto.createHash('md5').update(unversionedHash).digest('hex');
                }

                file.versioned.src.forEach(function(f){
                    versionedHash += crypto.createHash('md5').update(grunt.file.read(f, options.encoding)).digest('hex');
                });
                if (file.versioned.src.length > 1){
                    versionedHash = crypto.createHash('md5').update(versionedHash).digest('hex');
                }

                rev = versionedHash !== unversionedHash;
            }

            if (rev || options.versionAllFiles) {
                var newFilePath = options.versionFile.call(this, file.unversioned.dest, file.version + 1),
                    removeFilePath = file.versioned ? file.versioned.src : [];

                file.unversioned.src.forEach(function(f) {
                    cacheJSON.modified[options.outputKey(f)] = options.outputValue(newFilePath);
                    cacheJSON.original[file.unversioned.dest] = newFilePath;
                    output('✔ Creating version file: ' + f + ' to ' + newFilePath, 1, options);
                    !options.testing && grunt.file.copy(f, newFilePath);
                });

                file.versioned.src.forEach(function(f) {
                    output('✔ Deleting version file: ' + f, 2, options);
                    !options.testing && grunt.file.delete(f);
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
        !options.testing && grunt.file.write(options.cacheFile, JSON.stringify(cacheJSON));

        done();
    });
};

function output(text, level, options) {
    if (_.contains(options.logging, level)) {
        console.log(text);
    }
}