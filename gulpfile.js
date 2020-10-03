const browserSync = require('browser-sync').create();
const gulp = require('gulp');
const flowRemoveTypes = require('gulp-flow-remove-types');
var rename = require('gulp-rename');

function reload(file) {
    const dist = file.replace("base", "dist");
    gulp.src(file)
        .pipe(flowRemoveTypes({pretty: true}))
        .pipe(rename(dist))
        .pipe(gulp.dest("."))
        .pipe(browserSync.stream());
}

exports.default = function() {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
    gulp.src("base/**")
        .pipe(flowRemoveTypes({pretty: true}))
        .pipe(gulp.dest("dist"));
    gulp.watch("base/**").on('change', reload);
    gulp.watch("assets/**").on('change', reload);
};

