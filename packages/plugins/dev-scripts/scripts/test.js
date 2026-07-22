/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A 'test' script for Blockly extension packages.
 * This script:
 *   Runs mocha tests on all *.mocha.js tests in the test directory.
 * @author samelh@google.com (Sam El-Husseini)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const Mocha = require('mocha');
const webpack = require('webpack');
const webpackConfig = require('../config/webpack.config');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const packageJson = require(resolveApp('package.json'));
console.log(`Building tests for ${packageJson.name}`);

const config = webpackConfig({
  mode: 'test',
});
if (!config.entry) {
  console.log(
    chalk.yellow(`Warning: No tests found`) +
      '\n' +
      'There were no ' +
      chalk.yellow('test/*.mocha.js') +
      ' files found ' +
      'in your package.\n',
  );
  process.exit(0);
}

let mochaConfig = {
  ui: 'tdd',
};
// If custom configuration exists, use that instead.
const testDir = resolveApp('test');
if (fs.existsSync(path.join(testDir, '.mocharc.js'))) {
  mochaConfig = require(path.join(testDir, '.mocharc.js'));
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

  // Run mocha.
  console.log(`Running tests for ${packageJson.name}`);

  // Instantiate a Mocha instance.
  const mocha = new Mocha(mochaConfig);

  // Run mocha for each built mocha .js file.
  const testOutputDir = 'build';
  fs.readdirSync(testOutputDir)
    .filter((file) => {
      // Only keep the .mocha.js files
      return file.substr(-9) === '.mocha.js';
    })
    .forEach((file) => {
      mocha.addFile(path.join(testOutputDir, file));
    });

  // Run the tests.
  mocha.run((failures) => {
    // exit with non-zero status if there were failures.
    process.exitCode = failures ? 1 : 0;
  });
});
