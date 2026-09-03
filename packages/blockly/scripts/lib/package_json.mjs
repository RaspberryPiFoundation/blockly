/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Access to the blockly package's package.json.
 */

import * as fs from 'node:fs';
import {fromRoot} from './fs_utils.mjs';

/**
 * Load and return the contents of package.json.
 *
 * The file is re-read on every call so that callers always see
 * up-to-date data, even if it has been modified (e.g. to bump the
 * version number) since the script started.
 *
 * @returns {object} The parsed contents of package.json.
 */
export function getPackageJson() {
  return JSON.parse(fs.readFileSync(fromRoot('package.json'), 'utf8'));
}
