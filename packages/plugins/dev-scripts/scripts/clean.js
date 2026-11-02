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

import {readFileSync, realpathSync} from 'fs';
import {resolve} from 'path';
import {rimraf} from 'rimraf';

const appDirectory = realpathSync(process.cwd());
const resolveApp = (relativePath) => resolve(appDirectory, relativePath);

const packageJson = JSON.parse(
  readFileSync(resolveApp('package.json'), 'utf8'),
);
console.log(`Running clean for ${packageJson.name}`);

// Delete both the dist and build directories if they exist.
const dirs = ['dist', 'build'];
dirs.forEach((dir) => {
  rimraf.sync(resolveApp(dir));
});
