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

const path = require('path');
const fs = require('fs');
const os = require('os');

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackConfig = require('../config/webpack.config');
const webpackDevServerConfig = require('../config/webpackDevServer.config');

const chalk = require('chalk');
const codeFrame = require('@babel/code-frame').codeFrameColumns;
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const packageJson = require(resolveApp('package.json'));
const isTypescript = fs.existsSync(resolveApp('tsconfig.json'));

console.log(`Running start for ${packageJson.name}`);

// Create the webpack configuration for the development environment.
// Build the test directory.
const config = webpackConfig({
  mode: 'development',
});
if (!config.entry) {
  console.log(`${chalk.red(`Configuration error.`)}
Make sure a ${chalk.red('test/index.(js|ts)')} file is included in your package.
`);
  process.exit(1);
}

let compiler;
try {
  compiler = webpack(config);
} catch (err) {
  console.log(`${chalk.red('Failed to compile.')}\n${err.message || err}\n`);
  process.exit(1);
}

const devSocket = {
  warnings: (warnings) =>
    devServer.sockWrite(devServer.sockets, 'warnings', warnings),
  errors: (errors) => devServer.sockWrite(devServer.sockets, 'errors', errors),
};

compiler.hooks.invalid.tap('invalid', () => {
  console.log('Compiling...');
});

let tsMessagesPromise;
let tsMessagesResolver;

if (isTypescript) {
  compiler.hooks.beforeCompile.tap('beforeCompile', () => {
    tsMessagesPromise = new Promise((resolve) => {
      tsMessagesResolver = (msgs) => resolve(msgs);
    });
  });

  // Register TypeScript type checker hooks.
  const tsCheckerHooks = ForkTsCheckerWebpackPlugin.getCompilerHooks(compiler);
  tsCheckerHooks.issues.tap('done', (issues) => {
    const formatTypecheckerMessage = (message) => {
      const {severity, file, line, character} = message;

      const messageColor = severity == 'warning' ? chalk.yellow : chalk.red;

      const source =
        file && fs.existsSync(file) && fs.readFileSync(file, 'utf-8');
      const frame = source
        ? codeFrame(
            source,
            {start: {line: line, column: character}},
            {highlightCode: true, linesAbove: 2, linesBelow: 2},
          )
            .split('\n')
            .map((str) => '  ' + str)
            .join(os.EOL)
        : '';

      return [
        os.EOL,
        messageColor.bold(`${severity.toLowerCase()} in `) +
          chalk.cyan.bold(`${file}(${line},${character})`) +
          messageColor(':'),
        '',
        frame,
      ].join(os.EOL);
    };

    tsMessagesResolver({
      errors: issues
        .filter((msg) => msg.severity === 'error')
        .map(formatTypecheckerMessage),
      warnings: issues
        .filter((msg) => msg.severity === 'warning')
        .map(formatTypecheckerMessage),
    });

    return issues;
  });
}

// Register webpack compiler hooks.
compiler.hooks.done.tap('done', async (stats) => {
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

  if (isTypescript && statsData.errors.length === 0) {
    const delayedMsg = setTimeout(() => {
      console.log(
        chalk.yellow(
          'Files successfully emitted, waiting for typecheck results...',
        ),
      );
    }, 100);

    const tsMessages = await tsMessagesPromise;
    clearTimeout(delayedMsg);

    messages.warnings.push(...tsMessages.errors);
    messages.warnings.push(...tsMessages.warnings);

    if (tsMessages.errors.length > 0) {
      devSocket.warnings(tsMessages.errors);
    } else if (tsMessages.warnings.length > 0) {
      devSocket.warnings(tsMessages.warnings);
    }
  }

  // Emit compile output.
  if (!messages.errors.length && !messages.warnings.length) {
    console.log(chalk.green('Compiled successfully!'));
  }
  if (messages.errors.length) {
    console.log(chalk.red('Failed to compile.\n'));
    console.log(messages.errors.join('\n\n'));
    return;
  }
  if (messages.warnings.length) {
    console.log(chalk.yellow('Compiled with warnings.\n'));
    console.log(messages.warnings.join('\n\n'));
  }
});

// Read the webpack devServer configuration.
const serverConfig = webpackDevServerConfig();

// Start the dev server.
const devServer = new WebpackDevServer(serverConfig, compiler);
devServer.startCallback((err) => {
  if (err) {
    return console.log(err);
  }
  console.log('Starting the development server...\n');
});
