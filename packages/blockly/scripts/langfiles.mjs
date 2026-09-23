/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Functions for building language files.
 */

import {execSync} from 'child_process';
import {mkdirSync, readdirSync} from 'fs';
import {writeFile} from 'fs/promises';
import * as path from 'path';

import {LANG_BUILD_DIR, PYTHON, RELEASE_DIR} from './build_constants.mjs';

let languages = null;

/**
 * Get list of languages to build langfiles and/or shims for, based on .json
 * files in msg/json/, skipping certain entries that do not correspond to an
 * actual language).  Results are cached as this is called from both
 * buildLangfiles and buildLangfileShims.
 */
function getLanguages() {
  if (!languages) {
    const skip = /^(keys|synonyms|qqq|constants)\.json$/;
    languages = readdirSync(path.join('msg', 'json'))
      .filter((file) => file.endsWith('json') && !skip.test(file))
      .map((file) => file.replace(/\.json$/, ''));
  }
  return languages;
}

/**
 * This task builds Blockly's lang files.
 *     msg/*.js
 */
function buildLangfiles() {
  // Create output directory.
  mkdirSync(LANG_BUILD_DIR, {recursive: true});

  // Run create_messages.py.
  const inputFiles = getLanguages().map((lang) =>
    path.join('msg', 'json', `${lang}.json`),
  );

  const createMessagesCmd = `${PYTHON} ./scripts/i18n/create_messages.py \
  --source_lang_file ${path.join('msg', 'json', 'en.json')} \
  --source_synonym_file ${path.join('msg', 'json', 'synonyms.json')} \
  --source_constants_file ${path.join('msg', 'json', 'constants.json')} \
  --key_file ${path.join('msg', 'json', 'keys.json')} \
  --output_dir ${LANG_BUILD_DIR} \
  --quiet ${inputFiles.join(' ')}`;
  execSync(createMessagesCmd, {stdio: 'inherit'});
}

/**
 * This task builds the ESM wrappers used by the langfiles "import"
 * entrypoints declared in package.json.
 */
async function buildLangfileShims() {
  // Create output directory.
  mkdirSync(path.join(RELEASE_DIR, 'msg'), {recursive: true});

  // Get the names of the exports from the langfile by require()ing
  // msg/messages.js and letting it mutate the (global) Blockly.Msg.
  // (We have to do it this way because messages.js is a script and
  // not a CJS module with exports.)
  globalThis.Blockly = {Msg: {}};
  await import('../msg/messages.js');
  const exportedNames = Object.keys(globalThis.Blockly.Msg);
  delete globalThis.Blockly;

  await Promise.all(
    getLanguages().map(async (lang) => {
      // Write an ESM wrapper that imports the CJS module and re-exports
      // its named exports.
      const cjsPath = `./${lang}.js`;
      const wrapperPath = path.join(RELEASE_DIR, 'msg', `${lang}.mjs`);
      const safeLang = lang.replace(/-/g, '_');

      await writeFile(
        wrapperPath,
        `import ${safeLang} from '${cjsPath}';
export const {
${exportedNames.map((name) => `  ${name},`).join('\n')}
} = ${safeLang};
`,
      );
    }),
  );
}

/**
 * Run all of the functions needed to build langfiles.
 */
async function langfiles() {
  await buildLangfiles();
  await buildLangfileShims();
}

await langfiles();
