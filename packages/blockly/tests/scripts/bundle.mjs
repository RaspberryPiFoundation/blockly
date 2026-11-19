/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Bundles plugins for pages and test harnesses that load
 * Blockly as a global rather than importing it.
 */

import {build} from 'esbuild';

/**
 * An esbuild plugin that resolves imports of `blockly/core` and the
 * generators to the globals set by the build/*.loader.mjs files, so a bundle
 * shares the page's copy of Blockly rather than including its own.
 */
const globalBlocklyPlugin = {
  name: 'global-blockly',
  setup(build) {
    build.onResolve(
      {filter: /^blockly\/(core|dart|javascript|lua|php|python)$/},
      (args) => ({path: args.path, namespace: 'global-blockly'}),
    );
    build.onLoad({filter: /.*/, namespace: 'global-blockly'}, (args) => {
      const chunk = args.path.split('/')[1];
      const global = chunk === 'core' ? 'Blockly' : chunk;
      return {contents: `module.exports = globalThis.${global};`};
    });
  },
};

/**
 * Bundles code into a classic script that uses the global Blockly and
 * generators.
 * @param {!Object} options esbuild build options, such as the entry point and
 *     output location.
 * @returns {Promise<!Object>} The esbuild build result.
 */
export function bundleWithGlobalBlockly(options) {
  return build({
    bundle: true,
    format: 'iife',
    ...options,
    plugins: [globalBlocklyPlugin],
  });
}

/**
 * Bundles `@blockly/block-test` into a classic script.
 *
 * The test blocks register with the global Blockly the tests run against.
 * @returns {Promise<string>} The source of the bundled script.
 */
export async function bundleBlockTest() {
  const {outputFiles} = await bundleWithGlobalBlockly({
    stdin: {
      contents: `
        import {toolboxTestBlocks, toolboxTestBlocksInit} from '@blockly/block-test';
        globalThis.toolboxTestBlocks = toolboxTestBlocks;
        globalThis.toolboxTestBlocksInit = toolboxTestBlocksInit;
      `,
      resolveDir: import.meta.dirname,
    },
    write: false,
  });
  return outputFiles[0].text;
}
