/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Utilities for handling versions in migrations.
 */
'use strict';

import semver from 'semver';

/**
 * The version associated with the unreleased version of Blockly.
 * @const {string}
 */
const DEV_VERSION = 'develop';

/**
 * The version associated with the latest released version of Blockly.
 * @const {string}
 */
const LATEST = 'latest';

/**
 * Coerces the given string into a valid version (semver compliant or
 * one of our special values).
 * @param {string} version The version to coerce.
 * @returns  {string} The coerced version.
 */
export function coerce(version) {
  return version === DEV_VERSION || version === LATEST
    ? version
    : semver.coerce(version).toString();
}

/**
 * Compares the given versions. Compatible with Array.sort.
 * @param {string} v1 The first version to compare.
 * @param {string} v2 The second version to compare.
 * @returns {number} A number indicating the relationship between the versions.
 */
export function compare(v1, v2) {
  if (v2 === DEV_VERSION) return v1 === DEV_VERSION ? 0 : -1;
  if (v1 === DEV_VERSION) return 1;
  if (v2 === LATEST) return v1 === LATEST ? 0 : -1;
  if (v1 === LATEST) return 1;
  return semver.compare(v1, v2);
}

/**
 * Returns true if the first version is less than or equal to the second
 * version.
 * @param {string} v1 The version to compare.
 * @param {string} v2 The version to compare against.
 * @returns {boolean} True if the first version is less than or equal to the
 *     second one.
 */
export function lte(v1, v2) {
  return compare(v1, v2) <= 0;
}

/**
 * Returns true if the first version is greater than the second version.
 * @param {string} v1 The version to compare.
 * @param {string} v2 The version to compare against.
 * @returns {boolean} True if the first version is greater than the second one.
 */
export function gt(v1, v2) {
  if (v2 === DEV_VERSION) return false;
  if (v1 === DEV_VERSION) return true;
  if (v2 === LATEST) return false;
  if (v1 === LATEST) return true;
  return semver.gtr(v1, `^${v2}`);
}
