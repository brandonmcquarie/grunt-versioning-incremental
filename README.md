# grunt-versioning-incremental

> Versioning Static Files Incrementally with Grunt

> I will be creating an example Node Project using this, after some more testing
> This module will take a file named example.extension and turn it into example._version_.extension
> If example._5_.extension exists, and the example.extension file is modified, example._5_.extension will be removed and example._6_.extension will be created.
> I have a helper function in my Node templates that does the following

> Warning! If you change the options.pattern this module WILL delete versioned files that no longer match the new pattern. If you want to change your pattenr, I recommend passing `logging` as `[2]` and `testing` as `true` so you can see what files will be deleted before you build!

```js
    setVersioning(fs.readFileSync('.cache/versioning.json', { encoding: 'utf8' }));
    
    setVersioning: function(file) {
		this.versionRoutes = JSON.parse(file);
	}

	getVersionFile: function(path) {
        if (globalVars.production) {
			return this.versionRoutes[path] || path;
		}

		return path;
	}
```
> Those functions are placed into a global Functions file, and then in your template (Depending on what templating language you use, I use underscore tempaltes on the Server, you can do something as followed

```html
<link href="<%=getVersionFile('/css/apps/sitewidget.css')%>" rel="stylesheet">
```

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-versioning-incrementally --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-versioning-incremental');
```

## The "versioningIncremental" task

### Overview
In your project's Gruntfile, add a section named `versioningIncremental` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
    versioningIncremental: {
        options: {
            // Task-specific options go here.
        },
        files: [
            {
                expand: true,
                cwd: 'public/css/',
                src: '**/*.*',
                dest: 'public/css/',
            }
        ]
    },
})
```

### Options

#### options.cacheFile
Type: `String`
Default value: `.cache/versioning.json`

Where do you want to save the output file so you can translate the unversioned URL to the versioned URL

#### options.encoding
Type: `String`
Possible Values `utf8`, `ascii`, `base64`
Default value: `utf8`

How do you want to encode the output files that are versioned

#### options.versionAllFiles
Type: `Boolean`
Possible Values `true`, `false`
Default value: `false`

Force every file to be reversioned when set to true

#### options.outputKey(key)
Type: `Function`
Argument `key`: `Relative path to unversioned file`

Function that passes the relative path to the unversioned file, and allows you to do any directory replacing or renaming before the cache file saves. As an example, my public/css/bootstrap.css file gets passed in and I do a replace on `public/css/` to `assets/` so when I include the file in the assets directory, the cache file has a mapping of that file to the built version

#### options.outputValue(value)
Type: `Function`
Argument `value`: `Relative path to versioned file`

Same type of thing as the `outputKey(key)` function above, allows you to rename any part of the relative path to the built file. I rename `public/css/` in my CSS files to `assets/`

#### options.pattern
Type: `String`
Requirements: `name` `version` `ext`
Default value: `name._version_.ext`

Create the structure that you want your versioned files to have. `name._version_.ext` will turn testFile.css into `testFile._1_.css`

#### options.findRegex
Type: `RegExp`
Default value: Auto generated baesed off of options.pattern

Create the Regular Expression that will determine if a file in a given directory is a versioned file or not. Recommend leaving this parameter alone unless you have very strict RegEx requirements. The `options.pattern` should handle most cases.

#### options.versionRegex
Type: `RegExp`
Default value: Auto generated baesed off of options.pattern

Create the Regular Expression that will grab the version number out of the versioned file path. Recommend leaving this parameter alone unless you have very strict RegEx requirements. The `options.pattern` should handle most cases.

#### options.replaceRegex
Type: `RegExp`
Default value: Auto generated baesed off of options.pattern

Create the Regular Expression that will grab the entire version number and any additional characters. For the example `name._version_.ext`, it will grab the `._version.`. Recommend leaving this parameter alone unless you have very strict RegEx requirements. The `options.pattern` should handle most cases.

#### options.startingVersion
Type: `Integer`
Default value: 0

Starting version number for your unversioned files. If your file is already versioned, it will stil only increment by one. If your file has not been versioned yet, it will start off at `options.startinVersion + 1`, so a value of 200 will start your versioning at 201.

#### options.logging
Type: `Array` of `Integer`
Default value: [ 1, 2 ]

Modify this to get more granular logs during the build process.
1. Creating new version file
2. Deleting old version file
3. Process flow `Useful for debugging`
4. File already versioned

#### options.testing
Type: `Boolean`
Default value: false

Having a value of `true` will cause the build process to generate console messages, depending on your `options.logging` array, but will not delete, create, or modify any files. Your Cache File will remain untouched as well. Useful for when you are testing new settings, especially when changing your `options.pattern` to ensure no extra files get deleted.

### Usage Examples

#### Versioning your CSS directory, saving the versioned files into the same directory
In this example, all of your CSS files inside your CSS directory will be versioned into their same directory

```js
grunt.initConfig({
    versioningIncremental: {
        staticFiles: {
            options: {
                outputKey: function(key) {
                    key = key.replace('public/static-built/', '/assets/');
                    console.log(key);
                    return key;
                },
                outputValue: function(value) {
                    value = value.replace('public/static-built/', '/assets/');
                    return value;
                },
                startingVersion: 200
                pattern: 'version.name.ext'
            },
            files: [
                {
                    expand: true,
                    cwd: 'public/static-built/',
                    src: '**/*.*',
                    dest: 'public/static-built/',
                }
            ]
        },
        cssFiles: {
            options: {
                outputKey: function(key) {
                    key = key.replace('public/css/', '/css/');
                    console.log(key);
                    return key;
                },
                outputValue: function(value) {
                    value = value.replace('public/css/', '/css/');
                    return value;
                },
                testing: true,
                logging: [1, 2, 3, 4],
                versionAllFiles: true
            },
            files: [
                {
                    expand: true,
                    cwd: 'public/css/',
                    src: '**/*.*',
                    dest: 'public/css/',
                }
            ]
        }
    },
});
```

## Release History

* Fixed issue with versioning files when the versioned file has been manually deleted
* Fixed issue with versioning files with new RegEx

* Added additional config options
    * options.logging
    * options.pattern
    * options.findRegex
    * options.replaceRegex
    * options.versionRegex
    * options.testing
    * options.startingVersion
    * options.versionAllFiles
* Added automatic generation of Regex based on your options.pattern
* Updated process flow to try and account for more Grunt Configurations
