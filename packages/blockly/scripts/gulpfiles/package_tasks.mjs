/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Gulp tasks to package Blockly for distribution on NPM.
 */

import * as gulp from 'gulp';
import concat from 'gulp-concat';
import replace from 'gulp-replace';
import umd from 'gulp-umd';

import * as path from 'path';
import * as fs from 'fs';
import {rimraf} from 'rimraf';
import * as build from './build_tasks.mjs';
import {getPackageJson} from './helper_tasks.mjs';
import {BUILD_DIR, LANG_BUILD_DIR, RELEASE_DIR, TYPINGS_BUILD_DIR} from './config.mjs';

// Path to template files for gulp-umd.
const TEMPLATE_DIR = 'scripts/package/templates';

/**
 * A helper method for wrapping a file into a Universal Module Definition.
 * @param {string} namespace The export namespace.
 * @param {Array<Object>} dependencies An array of dependencies to inject.
 */
function packageUMD(namespace, dependencies, template = 'umd.template') {
  return umd({
    dependencies: function () { return dependencies; },
    namespace: function () { return namespace; },
    exports: function () { return namespace; },
    template: path.join(TEMPLATE_DIR, template)
  });
};

/**
 * This task wraps scripts/package/index.js into a UMD module.
 *
 * This module is the main entrypoint for the blockly package, and
 * loads blockly/core, blockly/blocks and blockly/msg/en and then
 * calls setLocale(en).
 */
function packageIndex() {
  return gulp.src('scripts/package/index.js')
    .pipe(packageUMD('Blockly', [{
        name: 'Blockly',
        amd: 'blockly/core',
        cjs: 'blockly/core',
      },{
        name: 'en',
        amd: 'blockly/msg/en',
        cjs: 'blockly/msg/en',
        global: 'Blockly.Msg',
      },{
        name: 'blocks',
        amd: 'blockly/blocks',
        cjs: 'blockly/blocks',
        global: 'Blockly.Blocks',
      }]))
    .pipe(gulp.dest(RELEASE_DIR));
};

/**
 * This task copies scripts/package/core-node.js into into the
 * package.  This module will be the 'blockly/core' entrypoint for
 * node.js environments.
 *
 * Note that, unlike index.js, this file does not get a UMD wrapper.
 * This is because it is only used in node.js environments and so is
 * guaranteed to be loaded as a CJS module.
 */
function packageCoreNode() {
  return gulp.src('scripts/package/core-node.js')
    .pipe(gulp.dest(RELEASE_DIR));
};

/**
 * This task wraps each of the files in ${BUILD_DIR/msg/ into a UMD module.
 * @example import * as En from 'blockly/msg/en';
 */
function packageLocales() {
  // Remove references to goog.provide and goog.require.
  return gulp.src(`${LANG_BUILD_DIR}/*.js`)
      .pipe(replace(/goog\.[^\n]+/g, ''))
      .pipe(packageUMD('Blockly.Msg', [], 'umd-msg.template'))
      .pipe(gulp.dest(`${RELEASE_DIR}/msg`));
};

/**
 * This task creates a UMD bundle of Blockly which includes the Blockly
 * core files, the built-in blocks, the JavaScript code generator and the
 * English localization files.
 * @example <script src="https://unpkg.com/blockly/blockly.min.js"></script>
 */
function packageUMDBundle() {
  const srcs = [
    `${RELEASE_DIR}/blockly_compressed.js`,
    `${RELEASE_DIR}/msg/en.js`,
    `${RELEASE_DIR}/blocks_compressed.js`,
    `${RELEASE_DIR}/javascript_compressed.js`,
  ];
  return gulp.src(srcs)
      .pipe(concat('blockly.min.js'))
      .pipe(gulp.dest(`${RELEASE_DIR}`));
};


/**
 * This task creates shims for the submodule entrypoints, for the
 * benefit of bundlers and other build tools that do not correctly
 * support the exports declaration in package.json.  These shims just
 * require() and reexport the corresponding *_compressed.js bundle.
 *
 * This should solve issues encountered by users of bundlers that don't
 * support exports at all (e.g. browserify) as well as ones that don't
 * support it in certain circumstances (e.g., when using webpack's
 * resolve.alias configuration option to alias 'blockly' to
 * 'node_modules/blockly', as we formerly did in most plugins, which
 * causes webpack to ignore blockly's package.json entirely).
 *
 * Assumptions:
 * - Such bundlers will _completely_ ignore the exports declaration.
 * - The bundles are intended to be used in a browser—or at least not
 *   in node.js—so the core entrypoint never needs to route to
 *   core-node.js.  This is reasonable since there's little reason to
 *   bundle code for node.js, and node.js has supported the exports
 *   clause since at least v12, consideably older than any version of
 *   node.js we officially support.
 * - It suffices to provide only a CJS entrypoint (because we can only
 *   provide CJS or ESM, not both.  (We could in future switch to
 *   providing only an ESM entrypoint instead, though.)
 *
 * @param {Function} done Callback to call when done.
 */
function packageLegacyEntrypoints(done) {
  for (const entrypoint of [
    'core', 'blocks', 'dart', 'javascript', 'lua', 'php', 'python'
  ]) {
    const bundle =
        (entrypoint === 'core' ? 'blockly' : entrypoint) + '_compressed.js';
    fs.writeFileSync(path.join(RELEASE_DIR, `${entrypoint}.js`),
        `// Shim for backwards-compatibility with bundlers that do not
// support the 'exports' clause in package.json, to allow them
// to load the blockly/${entrypoint} submodule entrypoint.
module.exports = require('./${bundle}');
`);
  }
  done();
}

/**
 * This task copies all the media/* files into the release directory.
 */
function packageMedia() {
  return gulp.src('media/*', {encoding: false})
    .pipe(gulp.dest(`${RELEASE_DIR}/media`));
};

/**
 * This task copies the package.json file into the release directory,
 * with modifications:
 *
 * - The scripts section is removed.
 *
 * Prerequisite: buildLangfiles.
 *
 * @param {Function} done Callback to call when done.
 */
function packageJSON(done) {
  // Copy package.json, so we can safely modify it.
  const json = JSON.parse(JSON.stringify(getPackageJson()));
  // Remove unwanted entries.
  delete json['scripts'];
  // Set "type": "commonjs", since that's what .js files in the
  // package root are.  This should be a no-op since that's the
  // default, but by setting it explicitly we ensure that any chage to
  // the repository top-level package.json to set "type": "module"
  // won't break the published package accidentally.
  json.type = 'commonjs';
  // Write resulting package.json file to release directory.
  if (!fs.existsSync(RELEASE_DIR)) {
    fs.mkdirSync(RELEASE_DIR, {recursive: true});
  }
  fs.writeFileSync(`${RELEASE_DIR}/package.json`,
      JSON.stringify(json, null, 2));
  done();
};

/**
 * This task copies the scripts/package/README.md file into the
 * release directory.  This file is what developers will see at
 * https://www.npmjs.com/package/blockly .
 */
function packageReadme() {
  return gulp.src('scripts/package/README.md')
    .pipe(gulp.dest(RELEASE_DIR));
};

/**
 * This task copies the generated .d.ts files in build/declarations and the
 * hand-written .d.ts files in typings/ into the release directory. The main
 * entrypoint file (index.d.ts) is referenced in package.json in the types
 * property.
 */
function packageDTS() {
  const handwrittenSrcs = [
    'typings/*.d.ts',
    'typings/msg/*.d.ts',
  ];
  return gulp.src(handwrittenSrcs, {base: 'typings'})
      .pipe(gulp.src(`${TYPINGS_BUILD_DIR}/**/*.d.ts`, {ignore: [
	`${TYPINGS_BUILD_DIR}/blocks/**/*`,
      ]}))
      .pipe(replace('AnyDuringMigration', 'any'))
      .pipe(gulp.dest(RELEASE_DIR));
};

/**
 * This task cleans the release directory (by deleting it).
 */
export function cleanReleaseDir() {
  // Sanity check.
  if (RELEASE_DIR === '.' || RELEASE_DIR === '/') {
    return Promise.reject(`Refusing to rm -rf ${RELEASE_DIR}`);
  }
  return rimraf(RELEASE_DIR);
}

/**
 * This task prepares the files to be included in the NPM by copying
 * them into the release directory.
 *
 * This task was formerly called "package" but was renamed in
 * preparation for porting gulpfiles to ESM because "package" is a
 * reserved word.
 *
 * Prerequisite: build.
 */
export const pack = gulp.series(
    gulp.parallel(
        build.cleanBuildDir,
        cleanReleaseDir),
    build.build,
    gulp.parallel(
        packageIndex,
        packageCoreNode,
        packageLegacyEntrypoints,
        packageMedia,
        gulp.series(packageLocales, packageUMDBundle),
        packageJSON,
        packageReadme,
        packageDTS)
    );
