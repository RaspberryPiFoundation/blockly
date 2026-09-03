/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Running of gulp tasks from plain node scripts.
 *
 * TODO: Delete this once the build tasks have been converted to plain
 * node scripts, and call them directly instead.
 */

import Module from 'node:module';
import {spawnAsync} from './exec.mjs';
import {PACKAGE_ROOT} from './fs_utils.mjs';

const require = Module.createRequire(import.meta.url);

/** Path to the gulp CLI entrypoint. */
const GULP_CLI = require.resolve('gulp-cli/bin/gulp.js');

/**
 * Run a single gulp task in a subprocess, inheriting stdio so that its
 * output appears interleaved with our own.
 *
 * Tasks are run one per invocation because the gulp CLI runs multiple
 * tasks in parallel rather than in series.
 *
 * @param {string} task Name of the task to run, as exported by gulpfile.mjs.
 * @param {Array<string>=} args Additional arguments to pass to gulp.
 * @returns {Promise<void>} Promise resolved when the task succeeds, and
 *     rejected if it fails.
 */
export function runGulpTask(task, args = []) {
  return spawnAsync(process.execPath, [GULP_CLI, task, ...args], {
    cwd: PACKAGE_ROOT,
    label: `gulp ${task}`,
  });
}
