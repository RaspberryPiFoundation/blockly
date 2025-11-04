/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Rules configuration for commitlint.
 * https://commitlint.js.org/reference/rules.html#subject-full-stop
 *
 * Extends the conventional-commit spec at
 * https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional
 */

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Warn if not in this list. Allow for judicious creativity.
    'type-enum': [
      1,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'refactor',
        'release',
        'revert',
        'test',
      ],
    ],
    'subject-case': [0],
  },
  helpUrl:
    'https://developers.google.com/blockly/guides/contribute/get-started/commits',
};
