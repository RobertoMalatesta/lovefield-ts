/**
 * Copyright 2016 The Lovefield Project Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const chalk = require('chalk');
const diff = require('diff');
const fs = require('fs-extra');
const glob = require('glob');
const gulp = require('gulp');
const debug = require('gulp-debug');
const guppy = require('git-guppy')(gulp);
const mocha = require('gulp-mocha');
const format = require('gulp-clang-format');
const sourcemaps = require('gulp-sourcemaps');
const tslint = require('gulp-tslint');
const tsc = require('gulp-typescript');
const yaml = require('js-yaml');
const karma = require('karma');
const nopt = require('nopt');
const path = require('path');
const thru = require('through2');
const Toposort = require('toposort-class');

const DIST_FILE = 'dist/lf.ts';
let tsProject;
let deps;

function getProject() {
  if (!tsProject) {
    tsProject = tsc.createProject('tsconfig.json');
  }
  return tsProject;
}

function prettyPrint(patch) {
  if (patch.hunks.length) {
    console.log(chalk.yellow('===== ' + patch.oldFileName));
    patch.hunks.forEach((hunk) => {
      let numberOld = hunk.oldStart;
      let numberNew = hunk.newStart;
      hunk.lines.forEach((line) => {
        if (line[0] == '-') {
          console.log(chalk.bgRed(numberOld + ' ' + line));
          numberOld++;
        } else if (line[0] == '+') {
          console.log(chalk.bgGreen(numberNew + ' ' + line));
          numberNew++;
        } else {
          console.log(numberOld + ' ' + line);
          numberOld++;
          numberNew++;
        }
      });
    });
    console.log();
  }
}

function checkFormat() {
  let stream = thru.obj(function(file, enc, done) {
    if (file.isBuffer()) {
      let original = fs.readFileSync(file.path, 'utf8');
      let formatted = file.contents.toString();
      let patch = diff.structuredPatch(file.path, null, original, formatted);
      prettyPrint(patch);
    } else {
      console.error('Not supported');
      process.exit(1);
    }

    // Make sure the file goes through the next gulp plugin.
    this.push(file);
    done();
  });
  return stream;
}

function isQuickMode() {
  let knownOpts = { 'quick': Boolean };
  let opts = nopt(knownOpts, null, process.argv, 2);
  return opts.quick || false;
}

function getGrepPattern() {
  let knownOpts = { 'grep': String };
  let opts = nopt(knownOpts, null, process.argv, 2);
  return opts.grep;
}

function genFlags() {
  let flags = yaml.safeLoad(fs.readFileSync('flags.yaml', 'utf8'));

  let knownOpts = { 'flag': Array };
  let opts = nopt(knownOpts, null, process.argv, 2);
  if (opts.flag) {
    opts.flag.forEach(line => {
      let index = line.indexOf(':');
      if (index != -1) {
        let key = line.substring(0, index);
        let value = line.substring(index + 1).trim();
        flags.Flags[key] = value;
      }
    });
  }

  let contents = 'export class Flags {\n';
  for (let key in flags.Flags) {
    let value = flags.Flags[key];
    let quote = '\'';
    if (typeof(value) == 'boolean') {
      quote = '';
    }
    // We do not use readonly so that tests can modify them, esp. DEBUG.
    contents += `  public static ${key} = ${quote}${value}${quote};\n`;
  }
  contents += '}  // class Flags\n';
  fs.ensureDirSync('lib/gen');
  fs.writeFileSync('lib/gen/flags.ts', contents, {encoding: 'utf-8'});
  gulp.src('lib/gen/flags.ts')
      .pipe(format.format())
      .pipe(gulp.dest('lib/gen'));
}

gulp.task('default', (cb) => {
  let log = console.log;
  log('gulp tasks:');
  log('  build: build all libraries and tests');
  log('  clean: remove all intermediate files');
  log('  test: run mocha tests (quick mode only)');
  log('  format: format files using clang-format');
  log('  check: lint and format check files');
  log('options:');
  log('  --quick, -q: Quick test only');
  log('  --grep, -g: Mocha grep pattern');
  log('  --flag <KEY:VALUE>: Override flags');
  cb();
});

gulp.task('clean', (cb) => {
  fs.removeSync(getProject().options.outDir);
  fs.removeSync('coverage');
  fs.removeSync('lib/gen');
  cb();
});

gulp.task('build', gulp.series('clean', function actualBuild() {
  genFlags();
  return getProject()
      .src()
      .pipe(sourcemaps.init())
      .pipe(tsProject())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(tsProject.options.outDir));
}));

gulp.task('lint', () => {
  return getProject()
      .src()
      .pipe(tslint({formatter: 'stylish'}))
      .pipe(tslint.report({
        summarizeFailureOutput: true
      }));
});

function quickTest() {
  let mochaOptions = {
    reporter: getGrepPattern() ? 'spec' : 'dot',
    require: ['source-map-support/register'],
    grep: getGrepPattern()
  };

  return gulp
      .src(['out/tests/**/*.js', '!out/tests/**/*_spec.js'], {read: false})
      .pipe(mocha(mochaOptions));
}

gulp.task('test', gulp.series('build', function actualTest(cb) {
  if (!fs.existsSync(getProject().options.outDir)) {
    cb('Compile Error!');
    return;
  }

  if (isQuickMode()) {
    return quickTest();
  } else {
    let server = new karma.Server({
      configFile: path.join(__dirname, 'karma_config.js'),
      singleRun: true,
      client: { mocha: { grep: getGrepPattern() } }
    });

    server.on('run_complete', () => {
      karma.stopper.stop();
    });
    server.start();
  }
}));

function errorInSauceBrowserResults(ret) {
  let result = false;
  ret.browsers.forEach(browser => {
    let res = browser.lastResult;
    console.log(`${browser.name}: ${res.total} [${res.success}/${res.failed}]`);
    result = (res.failed > 0) ? true : result;
  });
  return result;
}

gulp.task('ci', gulp.series('build', function actualCI(cb) {
  if (!fs.existsSync(getProject().options.outDir)) {
    cb('Compile Error!');
    return;
  }

  quickTest();
  const server = new karma.Server({
    configFile: path.join(__dirname, 'karma_config_ci.js')
  });
  server.on('run_complete', (ret) => {
    karma.stopper.stop();
    if (errorInSauceBrowserResults(ret)) {
      console.log('===== TEST FAILED =====');
      process.exit(1);
    }
    cb();
  });
  server.start();
}));

gulp.task('debug', gulp.series('build', function actualDebug(cb) {
  if (!fs.existsSync(getProject().options.outDir)) {
    cb('Compile Error!');
    return;
  }

  new karma.Server({
      configFile: path.join(__dirname, 'karma_config.js'),
      singleRun: false,
      client: { mocha: { grep: getGrepPattern() } }
  }).start();
}));

gulp.task('fastcheck', () => {
  return getProject()
      .src()
      .pipe(format.checkFormat('file'))
      .on('warning', e => {
        debug(e.message);
        process.exit(1);
      });
});

gulp.task(
    'pre-commit',
    gulp.parallel(['build', 'lint', 'fastcheck'],
    function preCommitCheck(cb) {
      cb();
    }));

gulp.task('format', () => {
  return getProject()
      .src()
      .pipe(format.format('file'))
      .pipe(gulp.dest('.'));
});

gulp.task('check', gulp.series('lint', function actualCheck() {
  return getProject()
      .src()
      .pipe(format.format('file'))
      .pipe(checkFormat());
}));

gulp.task('deps', (cb) => {
  glob('lib/**/*.ts', (err, matches) => {
    let files = ['lib/gen/flags.ts'].concat(matches);
    let fileSet = new Set(files);
    const relativePath = (p) => {
      return path.relative(__dirname, p).replace(/\\/g, '/');
    };

    let topoGraph = [];
    fileSet.forEach(f => {
      const absDir = path.dirname(path.resolve(f));
      const imports = fs.readFileSync(f, 'utf-8').split('\n')
          .filter(l => l.startsWith('import '))
          .map(l => {
            const tokens = l.split(' ');
            let child = tokens[tokens.length - 1].substring(1);
            child = child.substring(0, child.length - 2) + '.ts';
            child = relativePath(path.resolve(absDir, child));
            topoGraph.push([f, child]);
         });
    });

    let resolved = false;
    while (!resolved) {
      try {
        const t = new Toposort();
        topoGraph.forEach(pair => {
          t.add(pair[0], pair[1]);
        });
        const res = t.sort();
        resolved = true;
        deps = res.reverse();
      } catch(e) {
        const chain = e.message.split('\n')[1];
        // For debug use to check circular dependency.
        // console.log(chain);
        const tokens = chain.split(' ');
        const key = tokens[tokens.length - 3];
        const value = tokens[tokens.length - 1];
        let index = -1;
        topoGraph.forEach((pair, i) => {
          if (pair[0] == key && pair[1] == value) {
            index = i;
          }
        });
        topoGraph.splice(index, 1);
      }
    }

    cb();
  });
});

gulp.task('dist', gulp.series('build', 'deps', function actualDist(cb) {
  let copyRight = false;  // only need to include copy right header once.
  // Erase file first.
  fs.ensureDirSync('dist');
  let finalResult = [];
  deps.forEach(file => {
    console.log(`processing ${file}`);
    contents = fs.readFileSync(file, 'utf-8').split('\n');
    if (!copyRight) {
      copyRight = true;
    } else if (file != 'lib/gen/flags.ts') {
      contents.splice(0, 15);
    }

    let exp = false;
    contents.forEach(line => {
      if (line.startsWith('import ') || line.startsWith('// tslint:')) {
        // no-op
      } else if (line == '// @export') {
        exp = true;
      } else if (line.startsWith('export ')) {
        if (exp) {
          exp = false;
          finalResult.push(line);
        } else {
          finalResult.push(line.substring(7));
        }
      } else {
        finalResult.push(line);
      }
    });
  });
  fs.writeFileSync(DIST_FILE, [
    '// tslint:disable:class-name',
    '// tslint:disable:max-classes-per-file',
    '// tslint:disable:no-consecutive-blank-lines',
    '// tslint:disable:no-shadowed-variable',
    '',
  ].join('\n'), 'utf-8');
  fs.appendFileSync(DIST_FILE, finalResult.join('\n'), 'utf-8');
  fs.appendFileSync(DIST_FILE, [
    '',
    '// tslint:enable:class-name',
    '// tslint:enable:max-classes-per-file',
    '// tslint:enable:no-consecutive-blank-lines',
    '// tslint:enable:no-shadowed-variable',
    '',
  ].join('\n'), 'utf-8');
  cb();
}));
