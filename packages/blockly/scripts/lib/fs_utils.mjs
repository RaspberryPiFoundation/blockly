/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Filesystem helpers for the build and packaging scripts.
 */

import {globSync} from 'glob';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Maximum number of file operations to have in flight at once, across
 * everything in this module.  Each one holds file descriptors open
 * while it runs, so letting the number of files being processed decide
 * how many run concurrently risks EMFILE errors on systems with a low
 * file descriptor limit.
 */
const MAX_OPEN_FILES = 32;

/** Number of file operations currently in flight. */
let openFiles = 0;

/** Callbacks of the operations waiting for a free slot, in order. */
const waiting = [];

/**
 * Absolute path to the root of the blockly package.  All of the paths
 * in config.mjs are relative to this directory.
 */
export const PACKAGE_ROOT = path.resolve(import.meta.dirname, '..', '..');

/**
 * Resolve a package-root-relative path to an absolute one, so that
 * scripts work regardless of the current working directory.  Segments
 * that are already absolute are returned as-is.
 *
 * @param {...string} segments Path segments, relative to the package root.
 * @returns {string} The corresponding absolute path.
 */
export function fromRoot(...segments) {
  return path.resolve(PACKAGE_ROOT, ...segments);
}

/**
 * Run an operation that opens files, waiting first if MAX_OPEN_FILES
 * of them are already in flight.  This makes it safe to start an
 * operation per file without regard for how many files there are.
 *
 * @param {function(): Promise<T>} operation The operation to run.
 * @returns {Promise<T>} The result of the operation.
 * @template T
 */
async function withOpenFile(operation) {
  if (openFiles < MAX_OPEN_FILES) {
    openFiles++;
  } else {
    await new Promise((resolve) => waiting.push(resolve));
  }
  try {
    return await operation();
  } finally {
    const next = waiting.shift();
    if (next) {
      // Hand our slot directly to the next operation in line, rather
      // than releasing it and letting them race for it.
      next();
    } else {
      openFiles--;
    }
  }
}

/**
 * Write a text file, creating its parent directories if needed.
 *
 * @param {string} file Path of the file to write, relative to the
 *     package root.
 * @param {string} contents Contents to write.
 */
export async function writeFile(file, contents) {
  const target = fromRoot(file);
  await fs.mkdir(path.dirname(target), {recursive: true});
  await fs.writeFile(target, contents);
}

/**
 * Copy the files matching one or more glob patterns into a destination
 * directory, preserving each file's path relative to the source
 * directory.
 *
 * @param {object} options Options object.
 * @param {string} options.from Directory the patterns are relative to,
 *     itself relative to the package root.
 * @param {string[]} options.patterns Glob patterns, relative to `from`.
 * @param {string} options.to Destination directory, relative to the
 *     package root.
 * @param {string[]=} options.ignore Glob patterns to exclude.
 * @param {function(string): string=} options.transform If supplied, the
 *     contents of each file are read as UTF-8, passed through this
 *     function, and the result written out.  Files are copied verbatim
 *     (and so binary-safe) if it is omitted.
 * @returns {Promise<void>} Promise resolved when copying is complete.
 */
export async function copyFiles({from, patterns, to, ignore = [], transform}) {
  const files = globSync(patterns, {
    cwd: fromRoot(from),
    ignore,
    nodir: true,
    posix: true,
  });
  await Promise.all(
    files.map((file) =>
      withOpenFile(async () => {
        const src = fromRoot(from, file);
        const dest = fromRoot(to, file);
        await fs.mkdir(path.dirname(dest), {recursive: true});
        if (transform) {
          await fs.writeFile(dest, transform(await fs.readFile(src, 'utf8')));
        } else {
          await fs.copyFile(src, dest);
        }
      }),
    ),
  );
}
