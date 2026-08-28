/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import {globSync} from 'glob';
import * as fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import * as path from 'node:path';

const require = createRequire(import.meta.url);

const TEST_DIR = 'tests/mocha';
const OUT_DIR = 'build/tests';
const ENTRY_POINT = path.posix.join(OUT_DIR, 'bundle-entry.js');

/**
 * Writes out a file that loads the in-browser Mocha test bootstrap code and
 * the tests themselves, and acts as an entrypoint for esbuild to enumerate and
 * bundle the various scripts that make up the test suite.
 */
async function writeEntryPoint() {
  const tests = globSync('**/*_test.{js,ts}', {cwd: TEST_DIR}).sort();
  const dir = path.posix.relative(path.posix.dirname(ENTRY_POINT), TEST_DIR);

  await fs.writeFile(
    ENTRY_POINT,
    [
      `import '${dir}/browser-setup.js';`,
      ...tests.map((file) => `import '${dir}/${file}';`),
    ].join('\n'),
  );
}

await fs.mkdir(OUT_DIR, {recursive: true});
// Resolve and copy Mocha's prebuilt browser distribution.
await fs.copyFile(
  require.resolve('mocha/mocha.js'),
  path.join(OUT_DIR, 'mocha.js'),
);
// Write out the esbuild entrypoint that imports the test files.
await writeEntryPoint();
