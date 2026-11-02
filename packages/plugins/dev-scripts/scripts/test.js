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

import {
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'fs';
import {join, resolve} from 'path';
import {pathToFileURL} from 'url';

import chalk from 'chalk';
import Mocha from 'mocha';
import webpack from 'webpack';
import webpackConfig from '../config/webpack.config.js';

const appDirectory = realpathSync(process.cwd());
const resolveApp = (relativePath) => resolve(appDirectory, relativePath);

const packageJson = JSON.parse(
  readFileSync(resolveApp('package.json'), 'utf8'),
);
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
if (existsSync(join(testDir, '.mocharc.js'))) {
  // The default export covers both ESM (export default) and CommonJS
  // (module.exports) config files.
  mochaConfig = (await import(pathToFileURL(join(testDir, '.mocharc.js')).href))
    .default;
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
  // Webpack emits CommonJS for these bundles, so tell Node not to treat them
  // as ES modules even though the package is "type": "module".
  writeFileSync(
    join(testOutputDir, 'package.json'),
    JSON.stringify({type: 'commonjs'}) + '\n',
  );
  readdirSync(testOutputDir)
    .filter((file) => {
      // Only keep the .mocha.js files
      return file.substr(-9) === '.mocha.js';
    })
    .forEach((file) => {
      mocha.addFile(join(testOutputDir, file));
    });

  // Run the tests.
  mocha.run((failures) => {
    // exit with non-zero status if there were failures.
    process.exitCode = failures ? 1 : 0;
  });
});
