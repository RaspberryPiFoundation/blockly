/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const {reporters, Runner} = require('mocha');
/**
 * Mocha reporter that prints only the run totals, plus the details of any
 * failures.
 */
class Quiet extends reporters.Base {
  constructor(runner, options) {
    super(runner, options);
    runner.once(Runner.constants.EVENT_RUN_END, () => this.epilogue());
  }
}

module.exports = Quiet;
