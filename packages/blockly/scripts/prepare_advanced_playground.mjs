/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'fs';
import * as path from 'path';
import {BUILD_DIR} from './gulpfiles/config.mjs';
import {bundleWithGlobalBlockly} from '../tests/scripts/bundle.mjs';

/**
 * This task bundles the modules used by the advanced playground and generates a
 * file in build/playgrounds. This file is then bundled with the github pages
 * and loaded into the advanced playground.
 */
async function prepareAdvancedPlayground() {
  const OUTPUT_DIR = path.join(BUILD_DIR, 'playgrounds');
  // Create output directory.
  fs.mkdirSync(OUTPUT_DIR, {recursive: true});

  const input = path.join('tests', 'playgrounds', 'advanced_playground.cjs');
  await bundleWithGlobalBlockly({
    entryPoints: [input],
    sourcemap: true,
    outfile: path.join(OUTPUT_DIR, 'advanced_playground.js'),
    define: {'process.env.NODE_ENV': '"development"'},
  });
}

await prepareAdvancedPlayground();
