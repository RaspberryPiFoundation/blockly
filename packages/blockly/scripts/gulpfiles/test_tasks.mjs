/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Gulp tasks to test.
 */
/* eslint-env node */

import asyncDone from 'async-done';
import * as gulp from 'gulp';
import gzip from 'gulp-gzip';
import * as fs from 'fs';
import * as path from 'path';
import {execSync} from 'child_process';
import {rimraf} from 'rimraf';

import {RELEASE_DIR, TEST_TSC_OUTPUT_DIR} from './config.mjs';

import {runMochaTestsInBrowser} from '../../tests/mocha/webdriver.js';
import {runGeneratorsInBrowser} from '../../tests/generators/webdriver.js';
import {runCompileCheckInBrowser} from '../../tests/compile/webdriver.js';

const OUTPUT_DIR = 'build/generators';
const GOLDEN_DIR = 'tests/generators/golden';

const BOLD_GREEN = '\x1b[1;32m';
const BOLD_RED = '\x1b[1;31m';
const ANSI_RESET = '\x1b[0m';

let successCount = 0;
let failCount = 0;
let firstErr;
const results = {};

/**
 * Run an arbitrary Gulp task as a test.
 * @param {function} task Any Gulp task.
 * @return {Promise} Asynchronous result.
 */
function runTestTask(id, task) {
  return new Promise((resolve) => {
    console.log('=======================================');
    console.log(`== ${id}`);

    // Turn any task into a Promise!
    const asyncTask = new Promise((resolve, reject) => {
      asyncDone(task, (error, result) => {
        if (error) reject(error);
        resolve(result);
      });
    });

    if (process.env.CI) console.log('::group::');
    asyncTask
      .then((result) => {
        successCount++;
        if (process.env.CI) console.log('::endgroup::');
        console.log(`${BOLD_GREEN}SUCCESS:${ANSI_RESET} ${id}`);
        results[id] = {success: true};
        resolve(result);
      })
      .catch((err) => {
        failCount++;
        if (!firstErr) {
          // Save the first error so we can use it in the stack trace later.
          firstErr = err;
        }
        console.error(err.message);
        if (process.env.CI) console.log('::endgroup::');
        console.log(`${BOLD_RED}FAILED:${ANSI_RESET} ${id}`);
        results[id] = {success: false, message: err.message};
        // Always continue.
        resolve(err);
      });
  });
}

function createSummary() {
  let summary = '# Test Summary\n\n';
  summary += '|Test Name|Passed?|Error message|\n';
  summary += '|---------|-------|-------------|\n';
  for (const test in results) {
    summary += `|${test}|${results[test].success
      ? ':white_check_mark:' : ':x:'}|${results[test].message ?? ''}|\n`;
  }
  summary += `\n\n## Total: ${successCount} passed. ${failCount} failed.`;
  return summary;
}

/**
 * Print test results and fail the task if needed.
 */
function reportTestResult() {
  console.log('=======================================');
  if (process.env.CI && process.env.GITHUB_STEP_SUMMARY) {
    try {
      fs.writeFileSync(process.env.GITHUB_STEP_SUMMARY, createSummary());
    } catch(e) {
      // Don't fail CI just because we couldn't write the summary.
      console.log('Failed to write job summary', e);
    }
  }
  // Check result.
  if (failCount === 0) {
    console.log(
        `${BOLD_GREEN}All ${successCount} tests passed.${ANSI_RESET}`);
    return Promise.resolve();
  }
  console.log(
      `${BOLD_RED}Failures in ${failCount} test groups.${ANSI_RESET}`);
  return Promise.reject(firstErr ||
      'Unspecified test failures, see above. The following stack trace is unlikely to be useful.');
}

/**
 * Helper method for running test command.
 * @param {string} command Command line to run.
 * @return {Promise} Asynchronous result.
 */
async function runTestCommand(id, command) {
  return runTestTask(id, async() => {
    return execSync(command, {stdio: 'inherit'});
  });
}

/**
 * Lint the codebase.
 * Skip for CI environments, because linting is run separately.
 * @return {Promise} Asynchronous result.
 */
function eslint() {
  if (process.env.CI) {
    console.log('Skip linting.');
    return Promise.resolve();
  }
  return runTestCommand('eslint', 'eslint .');
}

/**
 * Run the full usual build and package process, checking to ensure
 * there are no Closure Compiler warnings / errors.
 * @return {Promise} Asynchronous result.
 */
function build() {
  return runTestCommand('build', 'npm run package -- --verbose --debug');
}

/**
 * Run renaming validation test.
 * @return {Promise} Asynchronous result.
 */
function renamings() {
  return runTestCommand('renamings', 'tests/migration/validate-renamings.mjs');
}

/**
 * Helper method for gzipping file.
 * @param {string} file Target file.
 * @return {Promise} Asynchronous result.
 */
function gzipFile(file) {
  return new Promise((resolve) => {
    const name = path.posix.join(RELEASE_DIR, file);

    const stream = gulp.src(name)
        .pipe(gzip())
        .pipe(gulp.dest(RELEASE_DIR));

    stream.on('end', () => {
      resolve();
    });
  });
}

/**
 * Helper method for comparing file size.
 * @param {string} file Target file.
 * @param {number} expected Expected size.
 * @return {number} 0: success / 1: failed.
 */
function compareSize(file, expected) {
  const name = path.posix.join(RELEASE_DIR, file);
  const compare = Math.floor(expected * 1.1);
  const stat = fs.statSync(name);
  const size = stat.size;

  if (!compare) {
    const message = `Failed: Previous size of ${name} is undefined.`;
    console.log(`${BOLD_RED}${message}${ANSI_RESET}`);
    return 1;
  }

  if (size > compare) {
    const message = `Failed: ` +
        `Size of ${name} has grown more than 10%. ${size} vs ${expected}`;
    console.log(`${BOLD_RED}${message}${ANSI_RESET}`);
    return 1;
  }

  const message =
      `Size of ${name} at ${size} compared to previous ${expected}`;
  console.log(`${BOLD_GREEN}${message}${ANSI_RESET}`);
  return 0;
}

/**
 * Helper method for zipping the compressed files.
 * @return {Promise} Asynchronous result.
 */
function zippingFiles() {
  // GZip them for additional size comparisons (keep originals, force
  // overwite previously-gzipped copies).
  console.log('Zipping the compressed files');
  const gzip1 = gzipFile('blockly_compressed.js');
  const gzip2 = gzipFile('blocks_compressed.js');
  return Promise.all([gzip1, gzip2]);
}

/**
 * Check the sizes of built files for unexpected growth.
 * @return {Promise} Asynchronous result.
 */
async function metadata() {
  return runTestTask('metadata', async () => {
    // Zipping the compressed files.
    await zippingFiles();
    // Read expected size from script.
    const contents = fs.readFileSync('tests/scripts/check_metadata.sh')
        .toString();
    const pattern = /^readonly (?<key>[A-Z_]+)=(?<value>\d+)$/gm;
    const matches = contents.matchAll(pattern);
    const expected = {};
    for (const match of matches) {
      expected[match.groups.key] = match.groups.value;
    }

    // Check the sizes of the files.
    let failed = 0;
    failed += compareSize('blockly_compressed.js',
                          expected.BLOCKLY_SIZE_EXPECTED);
    failed += compareSize('blocks_compressed.js',
                          expected.BLOCKS_SIZE_EXPECTED);
    failed += compareSize('blockly_compressed.js.gz',
                          expected.BLOCKLY_GZ_SIZE_EXPECTED);
    failed += compareSize('blocks_compressed.js.gz',
                          expected.BLOCKS_GZ_SIZE_EXPECTED);
    if (failed > 0) {
      throw new Error('Unexpected growth was detected.');
    }
  });
}

/**
 * Run Mocha tests inside a browser.
 * @return {Promise} Asynchronous result.
 */
async function mocha(exitOnCompletion = true) {
  return runTestTask('mocha', async () => {
    const result = await runMochaTestsInBrowser(exitOnCompletion).catch(e => {
      throw e;
    });
    if (result) {
      throw new Error('Mocha tests failed');
    }
    console.log('Mocha tests passed');
  });
}

/**
 * Run Mocha tests inside a browser and keep the browser open upon completion.
 * @return {Promise} Asynchronous result.
 */
export async function interactiveMocha() {
  return mocha(false);
}

/**
 * Helper method for comparison file.
 * @param {string} file1 First target file.
 * @param {string} file2 Second target file.
 * @return {boolean} Comparison result (true: same / false: different).
 */
function compareFile(file1, file2) {
  const buf1 = fs.readFileSync(file1);
  const buf2 = fs.readFileSync(file2);
  // Normalize the line feed.
  const code1 = buf1.toString().replace(/(?:\r\n|\r|\n)/g, '\n');
  const code2 = buf2.toString().replace(/(?:\r\n|\r|\n)/g, '\n');
  return code1 === code2;
}

/**
 * Helper method for checking the result of generator.
 * @param {string} suffix Target suffix.
 * @return {number} Check result (0: success / 1: failed).
 */
function checkResult(suffix) {
  const fileName = `generated.${suffix}`;
  const resultFileName = path.posix.join(OUTPUT_DIR, fileName);

  const SUCCESS_PREFIX = `${BOLD_GREEN}SUCCESS:${ANSI_RESET}`;
  const FAILURE_PREFIX = `${BOLD_RED}FAILED:${ANSI_RESET}`;

  if (fs.existsSync(resultFileName)) {
    const goldenFileName = path.posix.join(GOLDEN_DIR, fileName);
    if (fs.existsSync(goldenFileName)) {
      if (compareFile(resultFileName, goldenFileName)) {
        console.log(`${SUCCESS_PREFIX} ${suffix}: ` +
            `${resultFileName} matches ${goldenFileName}`);
        return 0;
      } else {
        console.log(
            `${FAILURE_PREFIX} ${suffix}: ` +
            `${resultFileName} does not match ${goldenFileName}`);
      }
    } else {
      console.log(`File ${goldenFileName} not found!`);
    }
  } else {
    console.log(`File ${resultFileName} not found!`);
  }
  return 1;
}

/**
 * Run generator tests inside a browser and check the results.
 * @return {Promise} Asynchronous result.
 */
export async function generators() {
  return runTestTask('generators', async () => {
    // Clean up.
    rimraf.sync(OUTPUT_DIR);
    fs.mkdirSync(OUTPUT_DIR);

    await runGeneratorsInBrowser(OUTPUT_DIR);

    const generatorSuffixes = ['js', 'py', 'dart', 'lua', 'php'];
    let failed = 0;
    generatorSuffixes.forEach((suffix) => {
      failed += checkResult(suffix);
    });

    if (failed === 0) {
      console.log(`${BOLD_GREEN}All generator tests passed.${ANSI_RESET}`);
    } else {
      console.log(
          `${BOLD_RED}Failures in ${failed} generator tests.${ANSI_RESET}`);
      throw new Error('Generator tests failed.');
    }
  });
}

/**
 * Run Node tests.
 * @return {Promise} Asynchronous result.
 */
function node() {
  return runTestCommand('node', 'mocha tests/node --config tests/node/.mocharc.js');
}

/**
 * Attempt advanced compilation of a Blockly app.
 * @returns {Promise} Async result.
 */
function advancedCompile() {
  return runTestCommand('advanced_compile', 'npm run test:compile:advanced');
}

/**
 * Attempt advanced compilation of a Blockly app and make sure it runs in the browser.
 * Should be run after the `advancedCompile` test.
 * @return {Promise} Asynchronous result.
 */
function advancedCompileInBrowser() {
  return runTestTask('advanced_compile_in_browser', runCompileCheckInBrowser);
}

/**
 * Verify the built Blockly type definitions compile with the supported
 * TypeScript examples included in `./tests/typescript`.
 * @returns {Promise} Asynchronous result.
 */
function typeDefinitions() {
  return runTestCommand('type_definitions',
    `tsc -p ./tests/typescript/tsconfig.json -outDir ${TEST_TSC_OUTPUT_DIR}`);
}

// Run all tests in sequence.
const tasks = [
  eslint,
  // Build must run before the remaining tasks
  build,
  renamings,
  metadata,
  mocha,
  generators,
  node,
  typeDefinitions,
  // Make sure these two are in series with each other
  advancedCompile,
  advancedCompileInBrowser
];

export const test = gulp.series(...tasks, reportTestResult);


