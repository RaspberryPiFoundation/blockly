/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Webpack configuration file.
 * @author samelh@google.com (Sam El-Husseini)
 */

import fs from 'fs';
import {createRequire} from 'module';
import path from 'path';
import {fileURLToPath} from 'url';
import webpack from 'webpack';

const cjsRequire = createRequire(import.meta.url);

/**
 * Resolves a package to a file path, starting from this file's location. Tries
 * ESM resolution first, then falls back to CJS.
 * @param {string} name The name of the package to resolve.
 * @returns {string} The absolute path of the package's entry point.
 */
function resolvePackage(name) {
  try {
    return fileURLToPath(import.meta.resolve(name));
  } catch {
    return cjsRequire.resolve(name);
  }
}

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);
const exists = (relativePath) => fs.existsSync(resolveApp(relativePath));

const packageJson = JSON.parse(
  fs.readFileSync(resolveApp('package.json'), 'utf8'),
);

export default (env) => {
  const mode = env.mode;
  const isDevelopment = mode === 'development';
  const isTest = mode === 'test';
  const isTypescript = exists('tsconfig.json');

  let entry;
  let outputFile;
  let target = 'web';
  const plugins = [
    // Use DefinePlugin (https://webpack.js.org/plugins/define-plugin/)
    // to pass the name of the package being built to the dev-tools
    // playground (via plugins/dev-tools/src/playground/id.js).  The
    // "process.env."  prefix is arbitrary: the stringified value
    // gets substituted directly into the source code of that file
    // at build time.
    new webpack.DefinePlugin({
      'process.env.PACKAGE_NAME': JSON.stringify(packageJson.name),
    }),
  ];

  if (isDevelopment) {
    // Development.
    if (exists('./test/index.js')) entry = './test/index.js';
    if (exists('./test/index.ts')) entry = './test/index.ts';
    outputFile = 'test_bundle.js';
  } else if (isTest) {
    // Test.
    // Create an entry point for each .mocha.js file.
    fs.readdirSync('./test/')
      .filter((file) => file.substr(-9) === '.mocha.js')
      .forEach((file) => {
        const entryName = file.replace(/\.mocha\.js/i, '');
        if (!entry) entry = {};
        entry[entryName] = `./test/${file}`;
      });
    outputFile = '[name].mocha.js';
    target = 'node';
    // Certain optional plugins wanted by dependencies of blockly
    // (jsdom want canvas, jsdom depends on ws which wants
    // bufferutils and utf-8-validate) are loaded via:
    //
    // try {/*...*/ = require('package')} catch (e) {/*...*/}
    //
    // Webpack tries to satisfy the require even though it's in a
    // try/catch, and issues a warning if it can't be found.
    // IgnorePlugin suppresses this.
    plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(canvas|bufferutil|utf-8-validate)$/,
      }),
    );
  }

  return {
    target,
    mode: 'development',
    entry: entry,
    devtool: 'eval-source-map',
    output: {
      path: resolveApp('build'),
      publicPath: '/build/',
      filename: outputFile,
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js', '.json', '.wasm'],
      extensionAlias: {'.js': ['.ts', '.js']},
      // Some deps may require node.js core modules.  Tell node.js what
      // polyfills to use for them when building for non-node.js targets
      // (Or to ignore them if the fallback is false.)
      fallback: {
        util: false,
      },
    },
    module: {
      rules: [
        // Load Blockly source maps.
        {
          test: /(blockly[/\\].*\.js)$/,
          use: [resolvePackage('source-map-loader')],
          enforce: 'pre',
        },
        isTypescript && {
          test: /\.tsx?$/,
          loader: resolvePackage('ts-loader'),
          options: {compilerOptions: {rootDir: '.'}},
        },
      ].filter(Boolean),
    },
    // Ignore spurious warnings from source-map-loader
    // It can't find source maps for some Closure modules and that is expected
    ignoreWarnings: [/Failed to parse source map.*blockly/],
    plugins,
    externals: {jsdom: 'commonjs jsdom'},
  };
};
