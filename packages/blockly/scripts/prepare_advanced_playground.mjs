/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
import {execSync} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {BUILD_DIR} from './gulpfiles/config.mjs';

/**
 * This task bundles the modules used by the advanced playground and generates a
 * file in build/playgrounds. This file is then bundled with the github pages
 * and loaded into the advanced playground.
 */
function prepareAdvancedPlayground() {
  const OUTPUT_DIR = path.join(BUILD_DIR, 'playgrounds');
  // Create output directory.
  fs.mkdirSync(OUTPUT_DIR, {recursive: true});
  fs.mkdirSync(path.join('node_modules', '@blockly', 'dev-tools'), {
    recursive: true,
  });
  fs.mkdirSync(path.join('node_modules', '@blockly', 'theme-modern'), {
    recursive: true,
  });

  const input = path.join('tests', 'playgrounds', 'advanced_playground.cjs');
  const bundlePlaygroundCmd = `cp -R ../plugins/dev-tools/dist node_modules/@blockly/dev-tools && 
  cp -R ../plugins/theme-modern/dist node_modules/@blockly/theme-modern && 
  esbuild ${input} \
  --bundle \
  --sourcemap \
  --outfile=${path.join(OUTPUT_DIR, 'advanced_playground.js')} \
  --define:process.env.NODE_ENV='\"development\"'`;
  execSync(bundlePlaygroundCmd, {stdio: 'inherit'});
}

await prepareAdvancedPlayground();
