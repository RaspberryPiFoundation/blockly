#!/usr/bin/env node
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Blockly dev scripts entry point.
 * @author samelh@google.com (Sam El-Husseini)
 */

import {spawnSync} from 'child_process';
import {fileURLToPath} from 'url';

const args = process.argv.slice(2);

const availableScripts = [
  'build',
  'start',
  'clean',
  'predeploy',
  'test',
  'auditFix',
];

const script = args[0];
if (availableScripts.includes(script)) {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL(`../scripts/${script}.js`, import.meta.url)),
      ...args.slice(1),
    ],
    {stdio: 'inherit'},
  );
  if (result.signal) {
    if (result.signal === 'SIGKILL') {
      console.log('The build failed because the process exited too early. ');
    } else if (result.signal === 'SIGTERM') {
      console.log('The build failed because the process exited too early. ');
    }
    process.exit(1);
  }
  process.exit(result.status);
} else {
  console.log('Unknown script "' + script + '".');
}
