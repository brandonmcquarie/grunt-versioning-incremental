/*
* Copyright (c) 2014 Brandon McQuarie
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
                    return path.dirname(destPath) + path.sep + path.basename(destPath, path.extname(destPath)) + '._' + rev + '_' + path.extname(destPath);
                },
                versionAllFiles: false
            }),
            findRegex = new RegExp(process.env.versioningFind || /\w+\.\_\w\_+\.\w+/),
            replaceRegex = new RegExp(process.env.versioningReplace || /\.\_\w\_+\./),
            files = {},
            unversionedHash = '',
            versionedHash = '',
            tempFile,
            version,
            rev,
            tempFileName;

        _.each(this.files, function(file) {
            tempFileName = path.basename(file.dest).split('.');

            if (!findRegex.test(path.basename(file.dest))) {
                files[file.dest] = _.extend({
                    version: 0,
                    versioned: { src: [] }
                }, files[file.dest], {
                    unversioned: file
                });
            } else {
                version = parseInt(file.dest.match(replaceRegex, '.')[0].split('_')[1]);
                files[file.dest.replace(replaceRegex, '.')] = _.extend({}, files[file.dest.replace(replaceRegex, '.')], {
                    versioned: file,
                    version: version
                });
            }
        });

        _.each(files, function(file) {
            rev = false;
            unversionedHash = '';
            versionedHash = '';

            if (file.unversioned.src.length === 0) {
                grunt.log.warn('SRC is an empty array');
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
                    files[options.outputKey(f)] = options.outputValue(newFilePath);
                    console.log('✔ Creating version file: ' + f + ' to ' + newFilePath);
                    grunt.file.copy(f, newFilePath);
                });

                file.versioned.src.forEach(function(f) {
                    console.log('✔ Deleting version file: ' + f);
                    grunt.file.delete(f);
                });
            } else {
                file.unversioned.src.forEach(function(f) {
                    files[options.outputKey(f)] = options.outputValue(file.versioned.src[0]);
                });
            }

        });
        
        if (fs.existsSync(options.cacheFile)) {
            grunt.file.delete(options.cacheFile);
        }
        grunt.file.write(options.cacheFile, JSON.stringify(files));

        done();
    });
};