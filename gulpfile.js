'use strict'

const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const combine = require('stream-combiner2').obj;
const path = require('path');
const fs = require('fs');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const del = require('del');
const gulplog = require('gulplog');
const webpackStream = require('webpack-stream');
const ManifestPlugin = require('webpack-manifest-plugin');
const browserSync = require("browser-sync").create();
const imagemin = require('gulp-imagemin');

const isDevelopment = !process.env.NODE_ENV || !process.env.NODE_ENV === 'production';

gulp.task('styles', function() {
  const manifestPath = './manifest/assets-styles.json';

  function resolver(url, _, done) {
    const filePath = path.join(path.dirname(_), url);
    const content = fs.readFileSync(filePath).toString();
    // находим   и заменяем url изображения
    const regexp = /(?<=url\(['"]).+?(?=['"])/g;

    const result = content.replace(regexp, function (oldUrl) {
      const newUrl = path.posix.join(path.dirname(url), oldUrl);
  
      if (isDevelopment)
        return newUrl;
  
      const manifest = JSON.parse(fs.readFileSync(manifestPath));
  
      return manifest[newUrl];
    })
  
    done({
      contents: result
    })
  }

  return combine(
    gulp.src('src/styles/style.scss'),
    $.if(isDevelopment, $.sourcemaps.init()),
    $.sass({ importer: resolver }),
    $.if(isDevelopment, $.sourcemaps.write()),
    $.if(!isDevelopment, combine(
      $.postcss([autoprefixer(), cssnano()]),
      $.rev()
    )),
    gulp.dest('public/styles'),
    $.if(!isDevelopment, combine(
      $.rev.manifest('styles.json'),
      gulp.dest('manifest')
    ))
  ).on('error', $.notify.onError({ title: 'styles' }))
});

gulp.task('styles:assets', function() {
  return combine(
    gulp.src('src/styles/**/*.{png,jpg,jpeg,svg}', {since: gulp.lastRun('styles:assets')}),
    $.newer('public/styles'),
    $.if(!isDevelopment, $.rev()),
    gulp.dest('public/styles'),
    $.if(!isDevelopment, combine(
      $.rev.manifest('assets-styles.json'),
      gulp.dest('manifest')
    ))
  ).on('error', $.notify.onError({ title: 'styles:assets' }))
});

gulp.task('clean', function() {
  return del('public')
});

gulp.task('html', function() {
  return combine(
    gulp.src('src/assets/**/*.html', {since: gulp.lastRun('html')}),
    $.if(!isDevelopment, combine(
      $.revReplace({
        manifest: gulp.src('manifest/styles.json', { allowEmpty: true }) // gulp if в любом случае прочитает функцию, поэтому allowEmpty: true
      }),
      $.revReplace({
        manifest: gulp.src('manifest/webpack.json', {allowEmpty: true})
      }),
      $.revReplace({
        manifest: gulp.src('manifest/html-images.json', {allowEmpty: true})
      }),
      $.htmlmin({collapseWhitespace: true}),
    )),
    gulp.dest('public')
  ).on('error', $.notify.onError({ title: 'html' }))
});

gulp.task('webpack', function(callback) {
  let firstBuildReady = false;

  function done(err, stats) {
    firstBuildReady = true;

    if(err) return  //hard error, обрабатывается gulp
    
    gulplog[stats.hasErrors() ? 'error' : 'info'](stats.toString({ color: true}));  // логирование
  }

  const options = {
    mode: isDevelopment ? 'development' : 'production',
    watch: isDevelopment,
    devtool: isDevelopment ? 'eval' : false,
    output: {
      filename: isDevelopment ? '[name].js' : '[name]-[hash:10].js',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            }
          }
        }
      ]
    },
    plugins: []
  }

  if(!isDevelopment) {
    options.plugins.push(new ManifestPlugin({
      fileName: 'webpack.json',
    }))
  }

  return combine(
    gulp.src('src/js/main.js'),            // return можно убрать, так как мы вызываем callback.      
    webpackStream(options, null, done),    //  Однако может подвиснуть если первая сборка завершилась с ошибкой, так как не сработает on data
    gulp.dest(function(file) {
      return file.basename === 'webpack.json' ? './manifest' : 'public/js'
    })
    ).on('data', function() {
      if(firstBuildReady)
        callback()    // просигнализировать завершение компиляции, async-done  внутри gulp игнорирует повторные вызовы callback
    }).on('error', $.notify.onError({ title: 'webpack' }))
});

gulp.task('images:opt', function() {
  return combine(
    gulp.src(['src/styles/**/*.{png,svg,jpg,jpeg}', 'src/assets/img/**/*.{png,svg,jpg,jpeg}']),
    imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.mozjpeg({quality: 95, progressive: true}),
      imagemin.svgo()
    ]),
    $.rename(function(path) {
      path.basename += "-opt";
    }),
    gulp.dest(function(file) {
      return file.base === path.resolve('src/styles') ? 'src/styles' : 'src/assets/img'
    })
  )
});

gulp.task('images:clean:opt', function() {
  return del(['src/styles/**/*-opt.{png,svg,jpg,jpeg}', 'src/assets/img/**/*-opt.{png,svg,jpg,jpeg}'])
});

gulp.task('assets:images', function() {
  return combine(
    gulp.src('src/assets/img/**/*.{png,svg,jpg,jpeg,webp}', {since: gulp.lastRun('assets:images'), base: 'src/assets'}),
    $.newer('public'),
    $.if(!isDevelopment, $.rev()),
    gulp.dest('public'),
    $.if(!isDevelopment, combine(
      $.rev.manifest('html-images.json'),
      gulp.dest('manifest')
    )))
});

gulp.task('webp', function() {
  return gulp.src('src/assets/img/**/*.{png,jpg,jpeg}')
    .pipe($.webp({quality: 100}))
    .pipe(gulp.dest('src/assets/img'))
});

gulp.task('sprite', function() {
  return gulp.src("tmp/icons/*.svg")
  .pipe($.svgstore({
    inlineSvg: true
  }))
  .pipe($.rename("sprite.svg"))
  .pipe(gulp.dest("src/assets/img"));
});

gulp.task('copy:js', function() {
  return gulp.src(['src/js/**/*.js', '!src/js/main.js'])
    .pipe(gulp.dest('public/js'))
});

gulp.task('copy:fonts', function() {
  return gulp.src('src/styles/sass-common/**/*.{woff,woff2}')
    .pipe(gulp.dest('public/styles'))
});

gulp.task('pixel-glass', function() {
  return gulp.src('tmp/pixel-glass/**/*.*')
    .pipe(gulp.dest('public/pixel-glass'))
});

gulp.task('build', gulp.series(
  gulp.parallel(gulp.series('styles:assets', 'styles'), 'webpack', 'assets:images', 'copy:js', 'copy:fonts'),
  'html'
));

gulp.task('watch', function() {
  gulp.watch('src/assets/**/*.html', gulp.series('html'));
  gulp.watch('src/assets/img/**/*.{png,svg,jpeg,jpg,webp}', gulp.series('assets:images'));
  gulp.watch('src/styles/**/*.scss', gulp.series('styles'));
  gulp.watch('src/styles/**/*.{png,svg,jpeg,jpg}', gulp.series('styles:images'));
});

gulp.task('server', function() {
  browserSync.init({
    watch: true,
    server: './public'
  });
});

gulp.task('dev', gulp.series('build', 'pixel-glass', gulp.parallel('watch', 'server')));

gulp.task('prod', gulp.series('clean', 'build'));