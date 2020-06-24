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
  const manifestPath = './manifest/css-images.json';

  function resolver(url, prev, done) {
    const filePath = path.join(path.dirname(prev), url);
    const content = fs.readFileSync(filePath).toString();
    // находим   и заменяем url
    const regexp = /(?<=url\(['"]).+?(?=['"])/g;
    //fonts
    if(path.basename(url) === 'fonts.scss') {
      const result = content.replace(regexp, function(fontUrl) {
        return path.posix.join('fonts/', path.basename(fontUrl))
      })
      done({ contents: result })
      return
    }
    //images
    const result = content.replace(regexp, function (imgUrl) {
      let fileName = path.basename(imgUrl);

      if(!isDevelopment) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath));
        fileName = manifest[fileName];
      }

      return path.posix.join('./img/styles', fileName);
    })
  
    done({ contents: result })
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
    gulp.dest('public'),
    $.if(!isDevelopment, combine(
      $.rev.manifest('styles.json'),
      gulp.dest('manifest')
    ))
  ).on('error', $.notify.onError({ title: 'styles' }))
});

gulp.task('styles:images', function() {
  return combine(
    gulp.src('src/styles/img/**/*.{png,jpg,jpeg,svg}', {since: gulp.lastRun('styles:images')}),
    $.newer('public/img/styles'),
    $.if(!isDevelopment, $.rev()),
    gulp.dest('public/img/styles'),
    $.if(!isDevelopment, combine(
      $.rev.manifest('css-images.json'),
      gulp.dest('./manifest')
    ))
  ).on('error', $.notify.onError({ title: 'styles:images' }))
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
              babelrc: true
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
      return file.basename === 'webpack.json' ? 'manifest' : 'public/'
    })
    ).on('data', function() {
      if(firstBuildReady)
        callback()    // просигнализировать завершение компиляции, async-done  внутри gulp игнорирует повторные вызовы callback
    }).on('error', $.notify.onError({ title: 'webpack' }))
});

gulp.task('images:opt', function() {
  return combine(
    gulp.src(['src/styles/img/**/*.{png,svg,jpg,jpeg}', 'src/assets/img/**/*.{png,svg,jpg,jpeg}']),
    imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.mozjpeg({quality: 95, progressive: true}),
      imagemin.svgo({
        plugins: [
          {cleanupIDs: false}
        ]
      })
    ]),
    $.rename(function(path) {
      path.basename += "-opt";
    }),
    gulp.dest(function(file) {
      return file.base === path.resolve('src/styles/img') ? 'src/styles/img' : 'src/assets/img'
    })
  )
});

gulp.task('images:clean:opt', function() {
  return del(['src/styles/img/**/*-opt.{png,svg,jpg,jpeg}', 'src/assets/img/**/*-opt.{png,svg,jpg,jpeg}'])
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
    .pipe($.webp({quality: 95}))
    .pipe(gulp.dest('src/assets/img'))
});

gulp.task('sprite', function() {
  return gulp.src("tmp/sprite-icons/*.svg")
  .pipe($.svgstore({
    inlineSvg: true
  }))
  .pipe($.rename("sprite.svg"))
  .pipe(gulp.dest("src/assets/img"));
});

gulp.task('copy:fonts', function() {
  return gulp.src('src/styles/fonts/**/*.{woff,woff2}', {base: 'src/styles'})
    .pipe(gulp.dest('public'))
});

gulp.task('pixel-glass', function() {
  return gulp.src(['node_modules/pixel-glass/**/*.{js,css}', 'tmp/preview/**/*.*'])
    .pipe(gulp.dest('public/pixel-glass'))
});

gulp.task('build', gulp.series(
  gulp.parallel(gulp.series('styles:images', 'styles'), 'webpack', 'assets:images', 'copy:fonts'),
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