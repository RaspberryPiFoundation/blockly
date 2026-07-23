/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A script that automatically upgrades pieces of the Blockly API
 *     that have been renamed by modifying developers' local files.
 */
'use strict';

import {createSubCommand, extractRequiredInfo} from './command.js';
import fetch from 'node-fetch';
import {readFileSync, statSync, writeFileSync} from 'fs';
import * as versionUtils from './versions.js';
import JSON5 from 'json5';

const DATABASE_URL = `https://raw.githubusercontent.com/RaspberryPiFoundation/blockly/main/packages/blockly/scripts/migration/renamings.json5`;

export const rename = createSubCommand(
  'rename',
  '>=5',
  'Perform renamings for breaking changes',
)
  .option(
    '-i, --in-place [suffix]',
    'do renamings in-place, optionally create backup files with the ' +
      'given suffix. Otherwise output to stdout',
  )
  .option(
    '--database <database-url>',
    'explicitly specify the URL for fetching the renamings database',
  )
  .action(async function () {
    const {fromVersion, toVersion, fileNames} = extractRequiredInfo(this);
    const url = this.opts().database;

    const renamer = new Renamer(await getDatabase(url), fromVersion, toVersion);
    fileNames.forEach((name) => {
      if (statSync(name).isDirectory()) return;
      const contents = readFileSync(name, 'utf8');
      const newContents = renamer.rename(contents);
      const inPlace = this.opts().inPlace;
      if (inPlace) {
        if (typeof inPlace == 'string') {
          writeFileSync(name + inPlace, contents);
        }
        writeFileSync(name, newContents);
        process.stderr.write(`Migrated renamings in ${name}\n`);
      } else {
        process.stdout.write(newContents + '\n');
      }
    });
  });

/**
 * Gets the database of renames.
 * @param {string=} url The URL to fetch the renamings database from, or
 *     undefined to fetch from main.
 * @returns {!Promise<!Object>} The database of renames as an object.
 */
export async function getDatabase(url = undefined) {
  try {
    const response = await fetch(url || DATABASE_URL);
    const body = await response.text();
    return JSON5.parse(body);
  } catch (e) {
    if (e instanceof SyntaxError) {
      process.stderr.write(
        'Unable to parse the renamings database. Please ' +
          'report the issue at github.com/RaspberryPiFoundation/blockly/issues/new/choose\n',
      );
      process.exit();
    }
    throw e;
  }
}

/**
 * An object which can apply a given set of renamings to the contents
 * of JavaScript files, so as to automatically update developer's code
 * where parts of the Blockly API have been renamed.
 */
export class Renamer {
  /**
   * Constructor for the class.
   * @param {!Object} database The database of renames.
   * @param {string} currVersion The version to migrate from.
   * @param {string} newVersion The version to migrate to.
   */
  constructor(database, currVersion, newVersion) {
    /** @private @const {!Array<!VersionRenamer>} */
    this.versionRenamers_ = Renamer.calculateRenamings(
      database,
      currVersion,
      newVersion,
    );
  }

  /**
   * Turns a database of renamings into an intermediate format that is
   * easier to apply.
   * @param {!Object} database The database of renames.
   * @param {string} currVersion The version to migrate from.
   * @param {string} newVersion The version to migrate to.
   * @returns {!Array<!VersionRenamer>} The collection of renamings to perform.
   */
  static calculateRenamings(database, currVersion, newVersion) {
    currVersion = versionUtils.coerce(currVersion);
    newVersion = versionUtils.coerce(newVersion);
    const versions = Object.keys(database).sort(versionUtils.compare);
    const renamers /** !Array<!VersionRenamer> */ = [];
    for (const version of versions) {
      // Only process versions in the range (currVersion, ^newVersion].
      if (versionUtils.lte(version, currVersion)) continue;
      if (versionUtils.gt(version, newVersion)) break;

      renamers.push(new VersionRenamer(database[version]));
    }
    return renamers;
  }

  /**
   * Applies the given renamings directly to a JavaScript string
   * (presumably the contents of a developer's file).
   * @param {string} str The string to apply the renamings in.
   * @returns {string} The string with renamings applied.
   */
  rename(str) {
    return str.replace(dottedIdentifier, (match) => {
      for (const versionRenamer of this.versionRenamers_) {
        match = versionRenamer.rename(match);
      }
      return match;
    });
  }
}

/**
 * An object which can apply a given set of renamings for a single
 * Blockly version to the individual dotted-identifier paths.
 */
class VersionRenamer {
  /**
   * Constructor for the version renamer.
   * @param {!Object} entry The database entry for a single version.
   */
  constructor(entry) {
    /**
     * List of pre-compiled renamings.
     * @private @const {
     *     !Array<{old: string, new: ?string, get: ?string, set: ?string}>}
     */
    this.renamings_ = [];
    // See the sample entry in renamings.json5 for explanation of the
    // meaning of the different properties on database entries.
    for (const module of entry) {
      // TODO: switch all of the || to ?? if/when we drop Node12.
      const oldModulePath = module.oldPath || module.oldName;
      const newExport = module.newExport ? `.${module.newExport}` : '';
      const newModulePath =
        module.newPath || `${module.newName || oldModulePath}${newExport}`;

      if (module.exports) {
        for (const [oldExportName, info] of Object.entries(module.exports)) {
          const oldExportPath =
            info.oldPath || `${oldModulePath}.${oldExportName}`;
          const newBase = `${info.newModule || newModulePath}.`;
          const renaming = {old: oldExportPath};
          if (info.newPath) {
            // If newPath provided just use that.
            renaming.new = info.newPath;
          } else if (info.getMethod || info.setMethod) {
            renaming.get = info.getMethod
              ? `${newBase}${info.getMethod}`
              : null;
            renaming.set = info.setMethod
              ? `${newBase}${info.setMethod}`
              : null;
          } else {
            renaming.new = `${newBase}${info.newExport || oldExportName}`;
          }
          this.renamings_.push(renaming);
        }
      }

      // Module renamings have to be added at the end so all export renamings
      // can be detected.
      // Eg if we have renamings:
      //   moduleA -> moduleB
      //   moduleA.exportA -> moduleC.exportB
      // And we performed the module rename first, we wouldn't be able to detect
      // the export rename.
      if (newModulePath !== oldModulePath) {
        this.renamings_.push({old: oldModulePath, new: newModulePath});
      }
    }
  }

  /**
   * Applies the renamings directly to a single JavaScript dotted
   * identifier path (e.g. 'foo.bar.baz')
   * @param {string} str The string to apply the renamings in.
   * @returns {string} The string after applying the most relevant renaming.
   */
  rename(str) {
    for (const entry of this.renamings_) {
      if (str.startsWith(entry.old)) {
        const suffix = str.slice(entry.old.length);
        if (suffix && suffix[0] !== '.') {
          // Did not match a whole identifier.
          continue;
        }
        if (!entry.get && !entry.set) {
          // Normal case (no getter/setter).
          return entry.new + suffix;
        }
        process.stderr.write(`NOTE: ${entry.old} has been removed.\n`);
        if (entry.get) {
          process.stderr.write(
            `    - Call ${entry.get}() instead of ` + 'reading it.\n',
          );
        }
        if (entry.set) {
          process.stderr.write(
            `    - Call ${entry.set}(/* new value */) ` +
              'instead of setting it.\n',
          );
        }
        process.stderr.write('You will need to manually verify this update.\n');

        if (entry.get && suffix) {
          // foo.bar.baz => foo.getBar().baz
          return `${entry.get}()${suffix}`;
        }
        const get = entry.set
          ? `call ${entry.get}() to get get value`
          : `can no longer be read`;
        const set = entry.set
          ? `call ${entry.set}(new_value) to set value`
          : `can no longer be set`;
        return `/* FIXME: ${entry.old} has been replaced: ${get}; ${set}. */`;
      }
    }
    return str;
  }
}

/**
 * RegExp matching a dotted identifier path like "foo.bar.baz".  Note
 * that this only matches such paths containing at least one dot, as
 * we expect to be looking for string like "Blockly.<something>" and
 * don't want to try to rename every single variable and every word
 * that appears in each comment!
 */
const dottedIdentifier =
  /[A-Za-z$_][A-Za-z0-9$_]*(\.[A-Za-z$_][A-Za-z0-9$_]*)+/g;
