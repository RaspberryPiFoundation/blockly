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
await writeEntryPoint();

// Copy files loaded directly by index.html into the build/test directory,
// resolving their paths in the process.
const VENDORED_SCRIPTS = [
  // Prebuilt browser bundle.
  {from: 'mocha/mocha.js', to: 'mocha.js'},
  // Loaded directly to avoid the two-Blockly problem.
  {from: '@blockly/block-test/dist/index.js', to: 'block-test.js'},
];

for (const {from, to} of VENDORED_SCRIPTS) {
  await fs.copyFile(require.resolve(from), path.join(OUT_DIR, to));
}
