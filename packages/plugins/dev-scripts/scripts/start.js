/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A 'start' script for Blockly extension packages.
 * This script:
 *   Builds the src and test directories in development mode.
 *   Starts the webpack dev server which watches changes to these directories.
 *   Opens the test page `0.0.0.0:3000/test`.
 *   Hot reloads the page if any changes are made to the source files.
 * @author samelh@google.com (Sam El-Husseini)
 */

'use strict';

const path = require('node:path');
const fs = require('node:fs');

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackConfig = require('../config/webpack.config');
const webpackDevServerConfig = require('../config/webpackDevServer.config');

const {styleText} = require('node:util');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const packageJson = require(resolveApp('package.json'));
const options = process.argv.slice(2);

console.log(`Running start for ${packageJson.name}`);

// Create the webpack configuration for the development environment.
// Build the test directory.
const config = webpackConfig({
  mode: 'development',
});
if (!config.entry) {
  console.log(`${styleText('red', `Configuration error.`)}
Make sure a ${styleText('red', 'test/index.(js|ts)')} file is included in your package.
`);
  process.exit(1);
}

let compiler;
try {
  compiler = webpack(config);
} catch (err) {
  console.log(
    `${styleText('red', 'Failed to compile.')}\n${err.message || err}\n`,
  );
  process.exit(1);
}

compiler.hooks.invalid.tap('invalid', () => {
  console.log('Compiling...');
});

// Register webpack compiler hooks.
compiler.hooks.done.tap('done', (stats) => {
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

  // Emit compile output.
  if (!messages.errors.length && !messages.warnings.length) {
    console.log(styleText('green', 'Compiled successfully!'));
  }
  if (messages.errors.length) {
    console.log(styleText('red', 'Failed to compile.\n'));
    console.log(messages.errors.join('\n\n'));
    return;
  }
  if (messages.warnings.length) {
    console.log(styleText('yellow', 'Compiled with warnings.\n'));
    console.log(messages.warnings.join('\n\n'));
  }
});

// Read the webpack devServer configuration.
const serverConfig = webpackDevServerConfig();

// If the --no-open option was passed in, respect it.
if (options.includes('--no-open')) {
  serverConfig.open = false;
}

// Start the dev server.
const devServer = new WebpackDevServer(serverConfig, compiler);
devServer.startCallback((err) => {
  if (err) {
    return console.log(err);
  }
  console.log('Starting the development server...\n');
});
