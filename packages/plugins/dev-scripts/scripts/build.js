/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A 'build' script for Blockly extension packages.
 * This script:
 *   - Uses webpack to build the src directory in development mode if no
 *   additional arguments are passed.
 *   - Uses webpack to build the src directory in production mode if
 *   ``blockly-scripts build prod`` is called.
 * @author samelh@google.com (Sam El-Husseini)
 */

'use strict';

const path = require('path');
const fs = require('fs');

const chalk = require('chalk');
const webpack = require('webpack');
const webpackConfig = require('../config/webpack.config');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const packageJson = require(resolveApp('package.json'));
console.log(`Running production build for ${packageJson.name}`);

// Create the webpack configuration for based on the build environment.
const config = webpackConfig({
  mode: 'production',
});
if (!config.entry) {
  console.log(`${chalk.red(`Configuration error.`)}
Make sure a ${chalk.red('src/index.(js|ts)')} file is included in your package.
`);
  process.exit(1);
}

// Create and run the webpack compiler.
webpack(config, (err, stats) => {
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    process.exit(1);
  }
  const statsData = stats.toJson({
    all: false,
    warnings: true,
    errors: true,
  });

  const formatWebpackMessage = (obj) => {
    return obj.message.trim();
  };

  const messages = {
    errors: statsData.errors.map(formatWebpackMessage),
    warnings: statsData.warnings.map(formatWebpackMessage),
  };

  if (!messages.errors.length && !messages.warnings.length) {
    console.log(chalk.green('Compiled successfully!'));
  }
  if (messages.errors.length) {
    console.log(chalk.red('Failed to compile.\n'));
    console.log(messages.errors.join('\n\n'));
    process.exit(1);
  }
  if (messages.warnings.length) {
    console.log(chalk.yellow('Compiled with warnings.\n'));
    console.log(messages.warnings.join('\n\n'));
  }
});
