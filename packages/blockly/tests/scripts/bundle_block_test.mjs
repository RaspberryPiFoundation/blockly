/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Bundles `@blockly/block-test` for test harnesses that load
 * Blockly as a global rather than importing it.
 */

import {build} from 'esbuild';

/**
 * Bundles `@blockly/block-test` into a classic script.
 *
 * The bundle uses the global Blockly rather than including its own copy, so
 * the test blocks register with the Blockly the tests run against. Running it
 * also exposes toolboxTestBlocks and toolboxTestBlocksInit on globalThis.
 * @returns {Promise<string>} The source of the bundled script.
 */
export async function bundleBlockTest() {
  const {outputFiles} = await build({
    stdin: {
      contents: `
        import {toolboxTestBlocks, toolboxTestBlocksInit} from '@blockly/block-test';
        globalThis.toolboxTestBlocks = toolboxTestBlocks;
        globalThis.toolboxTestBlocksInit = toolboxTestBlocksInit;
      `,
      resolveDir: import.meta.dirname,
    },
    bundle: true,
    write: false,
    format: 'iife',
    plugins: [
      {
        name: 'global-blockly',
        setup(build) {
          build.onResolve({filter: /^blockly\/core$/}, () => ({
            path: 'blockly/core',
            namespace: 'global-blockly',
          }));
          build.onLoad({filter: /.*/, namespace: 'global-blockly'}, () => ({
            contents: 'module.exports = globalThis.Blockly;',
          }));
        },
      },
    ],
  });
  return outputFiles[0].text;
}
