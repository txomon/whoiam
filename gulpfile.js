var gulp = require("gulp");
var exec = require('child_process').exec;
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");

gulp.task("ts-compile", function () {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("dist"));
});


gulp.task("default", ['ts-compile'], function (cb) {
    return exec(`node dist/index.js`, function (err, stdout, stderr) {
        if (stdout != null) {
            console.log(stdout)
        }
        if (stderr != null) {
            console.log(stderr)
        }
        cb(err)
    });
});