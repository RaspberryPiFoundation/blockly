/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Any gulp helper functions.
 */

import Module from "node:module";

const require = Module.createRequire(import.meta.url);

/**
 * Load and return the contents of package.json.
 *
 * Uses require() rather than import, and clears the require cache, to
 * ensure the loaded package.json data is up to date.
 */
export function getPackageJson() {
  delete require.cache[require.resolve('../../package.json')];
  return require('../../package.json');
}

