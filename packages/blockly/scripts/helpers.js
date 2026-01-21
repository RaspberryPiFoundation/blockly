/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Helper functions for build/test.
 */
/* eslint-env node */

const path = require('path');

/**
 * Replaces OS-specific path with POSIX style path.
 * Simplified implementation based on
 * https://stackoverflow.com/a/63251716/4969945
 *
 * @param {string} target target path
 * @return {string} posix path
 */
function posixPath(target) {
  return target.split(path.sep).join(path.posix.sep);
}

/**
 * Convert a string into a string literal.  Strictly speaking we
 * only need to escape backslash, \r, \n, \u2028 (line separator),
 * \u2029 (paragraph separator) and whichever quote character we're
 * using, but for simplicity we escape all the control characters.
 *
 * Based on https://github.com/google/CodeCity/blob/master/server/code.js
 *
 * @param {string} str The string to convert.
 * @return {string} The value s as a eval-able string literal.
 */
function quote(str) {
  /* eslint-disable no-control-regex */
  /** Regexp for characters to be escaped in a single-quoted string. */
  const singleRE = /[\x00-\x1f\\\u2028\u2029']/g;

  /** Map of control character replacements. */
  const replacements = {
    '\x00': '\\0',
    '\x01': '\\x01',
    '\x02': '\\x02',
    '\x03': '\\x03',
    '\x04': '\\x04',
    '\x05': '\\x05',
    '\x06': '\\x06',
    '\x07': '\\x07',
    '\x08': '\\b',
    '\x09': '\\t',
    '\x0a': '\\n',
    '\x0b': '\\v',
    '\x0c': '\\f',
    '\x0d': '\\r',
    '\x0e': '\\x0e',
    '\x0f': '\\x0f',
    '"': '\\"',
    "'": "\\'",
    '\\': '\\\\',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029',
  };
  /* eslint-enable no-control-regex */

  return "'" + str.replace(singleRE, (c) => replacements[c]) + "'";
}

module.exports = {
  posixPath,
  quote,
};
