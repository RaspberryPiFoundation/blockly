/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview An audit and fix script for Blockly extension packages.
 * This script:
 *   - Runs `npm install` to get a clean (not locally linked) installation.
 *   - Runs `npm audit fix` to do the fixes.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const packageJson = require(resolveApp('package.json'));

console.log(`Running npm audit fix steps for ${packageJson.name}`);

// Run npm install.
execSync(`npm install`, {stdio: [0, 1, 2]});

// Audit fix.
execSync(`npm audit fix`, {stdio: [0, 1, 2]});
