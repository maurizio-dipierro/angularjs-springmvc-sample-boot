const gulp = require('gulp');
const url = require('url');
const proxy = require('proxy-middleware');
const templateCache = require('gulp-angular-templatecache');
const browserSync = require("browser-sync").create();
const del = require('del');
const terser = require('gulp-terser');
const cleanCSS = require('gulp-clean-css');
const $ = require('gulp-load-plugins')();

//
// CLEAN
//
function clean() {
  return del(['dist/', '.tmp/']);
}

//
// TEMPLATES
//
function templates() {
  return gulp.src('app/views/**/*.html')
    .pipe(templateCache({ module: 'exampleApp.templates', standalone: true }))
    .pipe($.wrap('(function () {<%=contents%>}());'))
    .pipe(gulp.dest('.tmp/scripts/'));
}

//
// SERVE
//
function serve() {
  const proxyOptions = url.parse('http://localhost:9000/api');
  proxyOptions.route = '/api';

  browserSync.init({
    notify: false,
    logPrefix: 'WSK',
    server: {
      baseDir: ['.tmp', 'app'],
      middleware: [proxy(proxyOptions)]
    },
    port: 3000
  });

  gulp.watch(
    ['app/**/*.html', 'app/styles/**/*.{scss,css}', 'app/scripts/**/*.js', 'app/images/**/*'],
    gulp.series(templates, (done) => { browserSync.reload(); done(); })
  );
}

//
// COPY TASKS
//
function copyFonts() {
  return gulp.src(
    [
      'bower_components/font-awesome/fonts/*.*',
      'bower_components/bootstrap-material-design/fonts/*.*',
      'bower_components/bootstrap/fonts/*.*'
    ],
    { cwd: 'app/' }
  ).pipe(gulp.dest('dist/fonts/'));
}

function copyImages() {
  return gulp.src(['images/**'], { cwd: 'app/' })
    .pipe($.cache(
      $.imagemin({
        optimizationLevel: 5,
        progressive: true,
        interlaced: true
      })
    ))
    .pipe(gulp.dest('dist/images/'));
}

function copyI18n() {
  return gulp.src(['i18n/**'], { cwd: 'app/' })
    .pipe(gulp.dest('dist/i18n/'));
}

const copy = gulp.parallel(copyFonts, copyImages, copyI18n);

//
// USEMIN
//
function usemin() {
  return gulp.src('app/index.html')
    .pipe($.usemin({
      css: [
        cleanCSS(),
        'concat',
        $.rev()
      ],
      appcss: [
        cleanCSS(),
        $.rev()
      ],
      js: [
        terser(),
        $.rev()
      ],
      ngjs: [
        $.stripDebug(),
        $.ngAnnotate(),
        terser(),
        $.rev()
      ],
      tpljs: [
        $.ngAnnotate(),
        terser(),
        $.rev()
      ]
    }))
    .pipe(gulp.dest('dist/'));
}

//
// TASK REGISTRATION
//
exports.clean = clean;
exports.templates = templates;
exports.serve = gulp.series(templates, serve);
exports.copy = copy;
exports.usemin = gulp.series(copy, usemin);
exports.default = gulp.series(clean, templates, exports.usemin);
