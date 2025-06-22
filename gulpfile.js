const gulp = require("gulp");
//const cssnano = require("gulp-cssnano");
//const eslint = require("gulp-eslint");
const concat = require("gulp-concat");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");

const babelify = require("babelify");
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const deleteFile = require('gulp-delete-file');

/*
gulp.task("css", function(){
  return gulp.src("src/style.css")
    .pipe(cssnano())
    .pipe(gulp.dest("dist/css"));
});
*/

gulp.task("frontend", function(){
  return browserify(["src/public/vendor/api.js", "src/public/index.js"])
    .transform(babelify)
    .bundle()
    .pipe(source("___bundle.js"))
    .pipe(buffer())
    //all other plugins should be here
    .pipe(uglify())
    //////
    .pipe(gulp.dest("dist/public"))
    .pipe(deleteFile({
      reg: "___bundle.js",
      deleteMatch: true
    }))
});
/*
gulp.task("backend", function(){
  return gulp.src(["src/data/*.js", "src/getIp.js", "src/recaptcha.js", "src/rs_api.js", "src/index.js"])
	  .pipe(concat("index.js"))
    .pipe(babel({presets: [["@babel/preset-env"]] }))
	  .pipe(uglify())
	  .pipe(gulp.dest("dist"));
});
*/
gulp.task("backend", function(){
  return browserify(["src/data/StreamReader.js", "src/data/StreamWriter.js", "src/data/RoomData.js", "src/data/TokenData.js", "src/getIp.js", "src/recaptcha.js", "src/rs_api.js", "src/index.js"])
    .transform(babelify)
    .bundle()
    .pipe(source("___bundle.js"))
    .pipe(buffer())
    //all other plugins should be here
    .pipe(uglify())
    //////
    .pipe(gulp.dest("dist"))
    .pipe(deleteFile({
      reg: "___bundle.js",
      deleteMatch: true
    }))
});

gulp.task("watch", function(){
  gulp.watch("src/js/** /*.js", ["frontend"]);
});

/*
gulp.task("frontend", function(){
  return gulp.src(["src/public/vendor/api.js", "src/public/index.js"])
	  .pipe(concat("index.js"))
    .pipe(babel({presets: [["@babel/preset-env"]] }))
	  .pipe(uglify())
	  .pipe(gulp.dest("dist/public"));
});

gulp.task("backend", function(){
  return gulp.src(["src/data/*.js", "src/getIp.js", "src/recaptcha.js", "src/rs_api.js", "src/index.js"])
	  .pipe(concat("index.js"))
    .pipe(babel({presets: [["@babel/preset-env"]] }))
	  .pipe(uglify())
	  .pipe(gulp.dest("dist"));
});

gulp.task("watch", function(){
  gulp.watch("src/js/** /*.js", ["frontend"]);
});
*/

/*
gulp.task("lint", function(cb){
  return src(["*.js", "!node_modules/**"])
    .pipe(eslint())
    .pipe(eslint.format()) 
    .pipe(eslint.failAfterError())
    .on("end", function() {
      cb();
    });  
});
*/

gulp.task("default", gulp.series("frontend", "backend", "watch"));