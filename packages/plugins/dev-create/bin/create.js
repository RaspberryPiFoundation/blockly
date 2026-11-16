#!/usr/bin/env node
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A script for creating Blockly packages based on pre-existing
 * templates.
 */

import {Command} from 'commander';
import fs from 'fs-extra';
import path from 'path';
import {createApp} from './app.js';
import {createPlugin} from './plugin.js';

const pluginTypes = ['plugin', 'field', 'block', 'theme'];
const scriptPackageJson = JSON.parse(
  fs.readFileSync(path.join(import.meta.dirname, '../package.json'), 'utf8'),
);
const scriptName = scriptPackageJson.name;

const program = new Command(scriptName);

program
  .command('plugin', {isDefault: true})
  .description('Create a new plugin for Blockly.')
  .version(scriptPackageJson.version)
  .argument('<plugin-name>', 'Name of your plugin.')
  .option(
    '-d, --dir <directory-name>',
    'specify the directory name to use; defaults to name of plugin',
  )
  .option(
    '-t, --type <plugin-type>',
    `specify the type of the plugin. One of ${pluginTypes.join(', ')}`,
  )
  .option('--typescript', 'use typescript')
  .option('--author <author>', 'author, eg: Blockly Team')
  .option('--first-party', 'create a first-party plugin')
  .option('--skip-install', 'skip running `npm install` after creation')
  .action((name, options) => {
    createPlugin(name, options);
  });

program
  .command('application')
  .alias('app')
  .description('Create a new application that uses Blockly.')
  .version(scriptPackageJson.version)
  .argument('<name>', 'Name of your application. You can change this later.')
  .option(
    '-d, --dir <directory-name>',
    'specify the directory name to use; defaults to name of application',
  )
  .option('--typescript', 'use typescript')
  .option('--author <author>', 'author, eg: Blockly Team')
  .option('--skip-install', 'skip running `npm install` after creation')
  .action((name, options) => {
    createApp(name, options);
  });

program.parse(process.argv);
