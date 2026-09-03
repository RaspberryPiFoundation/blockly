/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Management of the release directory, from which the
 * blockly npm package is published.
 */

import * as fs from 'node:fs/promises';
import {RELEASE_DIR} from '../gulpfiles/config.mjs';
import {fromRoot} from './fs_utils.mjs';

/**
 * Clean the release directory (by deleting it).
 *
 * @returns {Promise<void>} Promise resolved once the directory is gone.
 */
export async function cleanReleaseDir() {
  // Sanity check.
  if (RELEASE_DIR === '.' || RELEASE_DIR === '/') {
    throw new Error(`Refusing to rm -rf ${RELEASE_DIR}`);
  }
  await fs.rm(fromRoot(RELEASE_DIR), {force: true, recursive: true});
}
