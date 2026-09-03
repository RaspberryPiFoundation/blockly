/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Gulp script to build Blockly for Node & NPM.
 * Run this script by calling "npm install" in this directory.
 */

// Needed to prevent prettier from munging exports order, due to
// https://github.com/simonhaenisch/prettier-plugin-organize-imports/issues/146
// - but has the unfortunate side effect of suppressing ordering of
// imports too:
//
// organize-imports-ignore

import {parallel} from 'gulp';
import {
  deployDemos,
  deployDemosBeta,
  prepareDemos,
} from './scripts/gulpfiles/appengine_tasks.mjs';
import {
  build,
  buildAdvancedCompilationTest,
  cleanBuildDir,
  langfiles,
  messages,
  minify,
  tsc,
} from './scripts/gulpfiles/build_tasks.mjs';
import {docs} from './scripts/gulpfiles/docs_tasks.mjs';
import {generators, test} from './scripts/gulpfiles/test_tasks.mjs';
import {cleanReleaseDir} from './scripts/lib/release_dir.mjs';

const clean = parallel(cleanBuildDir, cleanReleaseDir);

// Default target if gulp invoked without specifying.
export default build;

// Main sequence targets.  They already invoke prerequisites.  Listed
// in typical order of invocation, and strictly listing prerequisites
// before dependants.
//
// prettier-ignore
export {
  langfiles,
  tsc,
  minify,
  build,
  prepareDemos,
  deployDemosBeta,
  deployDemos,
}

// Manually-invokable targets that also invoke prerequisites where
// required.
//
// prettier-ignore
export {
  messages, // Generate msg/json/en.json et al.
  cleanBuildDir,
  clean,
  test,
  generators as testGenerators,
  buildAdvancedCompilationTest,
  docs,
}
