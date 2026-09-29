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

import {
  deployDemos,
  deployDemosBeta,
  prepareDemos,
} from './scripts/gulpfiles/appengine_tasks.mjs';

// Main sequence targets.  They already invoke prerequisites.  Listed
// in typical order of invocation, and strictly listing prerequisites
// before dependants.
//
// prettier-ignore
export {
  prepareDemos,
  deployDemosBeta,
  deployDemos,
}
