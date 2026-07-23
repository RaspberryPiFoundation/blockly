/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A 'clean' script for Blockly extension packages.
 * This script:
 *   Deletes the dist and build directories if they exist.
 * @author samelh@google.com (Sam El-Husseini)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const packageJson = require(resolveApp('package.json'));
console.log(`Running clean for ${packageJson.name}`);

// Delete both the dist and build directories if they exist.
const dirs = ['dist', 'build'];
dirs.forEach((dir) => {
  rimraf.sync(resolveApp(dir));
});
