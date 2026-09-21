/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Tests the Blockly generators inside a browser and reports the
 * results.
 */

import {spawnSync} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {rimraf} from 'rimraf';

const OUTPUT_DIR = 'build/generators';
const GOLDEN_DIR = 'tests/generators/golden';
const BOLD_GREEN = '\x1b[1;32m';
const BOLD_RED = '\x1b[1;31m';
const ANSI_RESET = '\x1b[0m';

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
        console.log(
          `${SUCCESS_PREFIX} ${suffix}: ` +
            `${resultFileName} matches ${goldenFileName}`,
        );
        return 0;
      } else {
        console.log(
          `${FAILURE_PREFIX} ${suffix}: ` +
            `${resultFileName} does not match ${goldenFileName}`,
        );
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
 * Run generator tests inside a browser and check the results.
 * @return {Promise} Asynchronous result.
 */
async function generators() {
    // Clean up.
    rimraf.sync(OUTPUT_DIR);
    fs.mkdirSync(OUTPUT_DIR);

    const result = spawnSync(
      'node',
      ['tests/generators/webdriver.js', OUTPUT_DIR],
      {
        stdio: 'inherit',
        env: process.env,
      },
    );
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error('Generator browser tests failed.');
    }

    const generatorSuffixes = ['js', 'py', 'dart', 'lua', 'php'];
    let failed = 0;
    generatorSuffixes.forEach((suffix) => {
      failed += checkResult(suffix);
    });

    if (failed === 0) {
      console.log(`${BOLD_GREEN}All generator tests passed.${ANSI_RESET}`);
    } else {
      console.log(
        `${BOLD_RED}Failures in ${failed} generator tests.${ANSI_RESET}`,
      );
      throw new Error('Generator tests failed.');
    }
}

await generators();
