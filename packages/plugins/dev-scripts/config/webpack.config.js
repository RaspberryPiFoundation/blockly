/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Webpack configuration file.
 * @author samelh@google.com (Sam El-Husseini)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);
const exists = (relativePath) => fs.existsSync(resolveApp(relativePath));

const packageJson = require(resolveApp('package.json'));

module.exports = (env) => {
  const mode = env.mode;
  const isDevelopment = mode === 'development';
  const isProduction = mode === 'production';
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

  if (isProduction) {
    // Production.
    if (exists('./src/index.js')) entry = './src/index.js';
    if (exists('./src/index.ts')) entry = './src/index.ts';
    outputFile = 'index.js';
  } else if (isDevelopment) {
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
    mode: isProduction ? 'production' : 'development',
    entry: entry,
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    output: {
      path: isProduction ? resolveApp('dist') : resolveApp('build'),
      publicPath: isProduction ? '/dist/' : '/build/',
      filename: outputFile,
      library: {
        type: 'umd',
      },
      globalObject: 'this',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js', '.json', '.wasm'],
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
          use: [require.resolve('source-map-loader')],
          enforce: 'pre',
        },
        isTypescript && {
          test: /\.tsx?$/,
          loader: require.resolve('ts-loader'),
          options: isProduction ? {} : {compilerOptions: {rootDir: '.'}},
        },
      ].filter(Boolean),
    },
    // Ignore spurious warnings from source-map-loader
    // It can't find source maps for some Closure modules and that is expected
    ignoreWarnings: [/Failed to parse source map.*blockly/],
    plugins,
    externals: isProduction
      ? {
          'blockly': {
            root: 'Blockly',
            commonjs: 'blockly',
            commonjs2: 'blockly',
            amd: 'blockly',
          },
          'blockly/core': {
            root: 'Blockly',
            commonjs: 'blockly/core',
            commonjs2: 'blockly/core',
            amd: 'blockly/core',
          },
          'blockly/javascript': {
            root: 'Blockly.JavaScript',
            commonjs: 'blockly/javascript',
            commonjs2: 'blockly/javascript',
            amd: 'blockly/javascript',
          },
          'blockly/python': {
            root: 'Blockly.Python',
            commonjs: 'blockly/python',
            commonjs2: 'blockly/python',
            amd: 'blockly/python',
          },
          'blockly/dart': {
            root: 'Blockly.Dart',
            commonjs: 'blockly/dart',
            commonjs2: 'blockly/dart',
            amd: 'blockly/dart',
          },
          'blockly/php': {
            root: 'Blockly.PHP',
            commonjs: 'blockly/php',
            commonjs2: 'blockly/php',
            amd: 'blockly/php',
          },
          'blockly/lua': {
            root: 'Blockly.Lua',
            commonjs: 'blockly/lua',
            commonjs2: 'blockly/lua',
            amd: 'blockly/lua',
          },
          'jsdom': 'commonjs jsdom',
        }
      : {jsdom: 'commonjs jsdom'},
  };
};
