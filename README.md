# [gulp](http://gulpjs.com)-watch-swig
> Watch swig files and their includes/extends using the [gulp-watch][watch-url] endless stream task

## Install

```sh
$ npm install --save-dev gulp-watch-swig
```


## Usage

```js
var gulp = require('gulp');
var watchSwig = require('gulp-watch-swig');
var swig = require('gulp-swig');

gulp.task('default', function () {
	return gulp.src('templates/file.html')
		.pipe(watchLess('templates/file.html'))
		.pipe(swig())
		.pipe(gulp.dest('dist'));
});
```

> __Protip:__ until gulpjs 4.0 is released, you can use [gulp-plumber][plumber-url] to prevent stops on errors.


## API

### GulpWatchSwig(glob, [options, callback])

Creates watcher that will spy on files that were matched by glob which can be a [`node-glob`][glob-url] string or array of strings.

**This will also watch all traced `include` and `extends` dependencies of the matched files, and re-emit a change event when any of them change**.
In this case, the `file.event` will be equal to `changed:by:import` for easy distinction.

Returns pass-through stream, that will emit vinyl files (with additional `event` property) that corresponds to event on file-system.

#### Callback `function(events, done)`

See documentation on [gulp-watch][watch-url] task

#### options

See documentation on [gulp-watch][watch-url] task

## License

MIT