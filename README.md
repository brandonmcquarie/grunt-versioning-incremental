# grunt-versioning-incremental

> Versioning Static Files Incrementally with Grunt

> I will be creating an example Node Project using this, after some more testing
> This module will take a file named example.extension and turn it into example._version_.extension
> If example._5_.extension exists, and the example.extension file is modified, example._5_.extension will be removed and example._6_.extension will be created.
> I have a helper function in my Node templates that does the following

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

### Usage Examples

#### Versioning your CSS directory, saving the versioned files into the same directory
In this example, all of your CSS files inside your CSS directory will be versioned into their same directory

```js
grunt.initConfig({
    versioningIncremental: {
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

## Release History
_(Nothing yet)_
