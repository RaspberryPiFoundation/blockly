/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A 'predeploy' script for Blockly extension packages.
 * This script:
 *   - Uses webpack to build the test directory in development mode in
 *     preparation for deployment.
 * @author samelh@google.com (Sam El-Husseini)
 */

import {readFileSync, realpathSync} from 'fs';
import {resolve} from 'path';

import chalk from 'chalk';
import webpack from 'webpack';
import webpackConfig from '../config/webpack.config.js';

const appDirectory = realpathSync(process.cwd());
const resolveApp = (relativePath) => resolve(appDirectory, relativePath);

const packageJson = JSON.parse(
  readFileSync(resolveApp('package.json'), 'utf8'),
);
console.log(`Running predeploy for ${packageJson.name}`);

// Create the webpack configuration for based on the build environment.
const config = webpackConfig({
  mode: 'development',
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
    return;
  }
  console.log(
    stats.toString({
      chunks: false, // Makes the build much quieter
      colors: true, // Shows colors in the console
    }),
  );
});
