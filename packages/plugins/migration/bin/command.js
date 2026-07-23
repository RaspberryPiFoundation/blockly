/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview The command building utilities for the migration script.
 */

import chalk from 'chalk';
import semver from 'semver';
import {Command} from 'commander';

// require() is not available in ES modules by default, so we must obtain it.
import {createRequire} from 'module';
const require = createRequire(import.meta.url);
const scriptPackageJson = require('../package.json');

const SCRIPT_NAME = scriptPackageJson.name;

const ROOT_COMMAND = new Command(SCRIPT_NAME)
  .version(
    scriptPackageJson.version,
    '-v, --version',
    'output the version of this script',
  )
  .usage(
    `${chalk.blue('<migration>')} ` +
      `${chalk.green('--from <from-version>')}` +
      '[--to <to-version>] [options] ' +
      `${chalk.green('<file...>')}`,
  );

const HELP_COMMAND = new Command('help')
  .argument('[version]', 'the version of Blockly to provide info about')
  .description('display this help, or help for the specific version')
  .action(function () {
    if (this.args.length) {
      showVersionHelp(this.args[0]);
    } else {
      ROOT_COMMAND.help();
    }
  });

ROOT_COMMAND.addCommand(HELP_COMMAND);

/**
 * Data about all of the migrations for use in help text.
 * @type {!Array<{range: string, name: string, description: string}>}
 */
const migrations = [];

/**
 * Logs information about migrations for the given version.
 * @param {string} version The version to show migrations for.
 */
function showVersionHelp(version) {
  if (!semver.validRange(version)) {
    console.log(`Invalid version: ${version}`);
    return;
  }

  const ranges = migrations.map((migration) => migration.range);
  if (!ranges.some((range) => semver.intersects(range, version))) {
    console.log(`No migrations found for version ${version}`);
    return;
  }

  console.log(`Migrations for version ${version}:`);

  for (const migration of migrations) {
    if (!semver.intersects(migration.range, version)) continue;
    console.log(`  ${chalk.blue(migration.name)}, ${migration.description}`);
  }
}

/**
 * Creates a command with the basic format expected by the migrate script,
 * and automatically adds it as a subcommand. It is then returned so it can be
 * configured.
 * @param {string} name The name of the subcommand.
 * @param {string} targetVersionRange The range of target versions of Blockly
 *     this command assists in migrating to.
 * @param {string} description The description of the new subcommand.
 * @returns {!Command} The basic subcommand.
 */
export function createSubCommand(name, targetVersionRange, description) {
  const migration = {
    name: name,
    description: description,
    range: targetVersionRange,
  };
  migrations.push(migration);

  return new Command(name)
    .description(description)
    .requiredOption('--from <from-version>', 'Blockly version to migrate from')
    .option('--to <to-version>', 'Blockly version to migrate to')
    .argument('<file...>', 'Files to migrate');
}

/**
 * Add the given command as a sub command of the root @blockly/migrate command.
 * @param {Command} command The migration to run.
 */
export function addSubCommand(command) {
  ROOT_COMMAND.addCommand(command);
}

/**
 * Extracts the from-version, to-version, and file names from the options and
 * arguments.
 * @param {Command} command The command to extract the info from.
 * @returns {{
 *   fromVersion: string,
 *   toVersion:string,
 *   fileNames: !Array<string>}} The required info.
 */
export function extractRequiredInfo(command) {
  const jsTsFileMatcher = new RegExp('^(t|j)s', 'i');
  return {
    fromVersion: command.opts().from,
    toVersion: command.opts().to || 'latest',
    fileNames: command.processedArgs[0].filter((filename) => {
      return jsTsFileMatcher.test(filename.split('.').pop());
    }),
  };
}

/**
 * Runs the root command with the current command line arguments and options.
 * @param {!Array<string>=} args The array of string arguments to parse. If not
 *     provided process.argv will be used.
 */
export async function parseAndRunMigrations(args = undefined) {
  // Use parseAsync for async commands like rename (which fetches a database).
  await ROOT_COMMAND.parseAsync(args);
}
