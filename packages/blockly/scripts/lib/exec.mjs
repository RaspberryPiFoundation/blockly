/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Helpers for running other commands in a CLI.
 *
 * These all inherit the current working directory unless told
 * otherwise.
 */

import {execSync, spawn} from 'node:child_process';

/**
 * Run a command, forwarding its output to this process's stdio.
 *
 * @param {string} command The command to run.
 */
export function run(command) {
  execSync(command, {stdio: 'inherit'});
}

/**
 * Run a command and return its trimmed stdout.
 * Used when the output of a command is needed as a value.
 *
 * @param {string} command The command to run.
 * @returns {string} The command's output.
 */
export function capture(command) {
  return execSync(command, {encoding: 'utf8'}).trim();
}

/**
 * Run a command in a subprocess without a shell, forwarding its output
 * to this process's stdio.
 *
 * Unlike run(), this does not block the event loop, so several
 * commands can be run concurrently.
 *
 * @param {string} command The command to run.
 * @param {Array<string>=} args Arguments to pass to the command.
 * @param {object=} options Options for child_process.spawn, plus an
 *     optional label to use in place of the command name when
 *     reporting failure.
 * @returns {Promise<void>} Promise resolved when the command succeeds,
 *     and rejected if it fails.
 */
export function spawnAsync(command, args = [], {label, ...options} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: 'inherit', ...options});
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      const reason = signal ? `signal ${signal}` : `exit code ${code}`;
      reject(new Error(`${label ?? command} failed with ${reason}`));
    });
  });
}
