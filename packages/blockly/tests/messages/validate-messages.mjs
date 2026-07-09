#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A script to validate that the localized message files
 * (msg/json/*.json) specify the same positional placeholders (%1, %2, ...)
 * as the English source (msg/json/en.json).
 *
 * Only messages that are referenced by a block's `messageN` property are
 * treated as errors.  Those messages are expanded by
 * Block.prototype.interpolate(), which throws if the expanded message does
 * not reference each of the block's args exactly once.  A translation that
 * drops, duplicates or invents a placeholder therefore makes the block
 * impossible to construct in that language.
 *
 * Messages that are not used as block messages (tooltips, context menu
 * entries, help URLs, ...) are only reported as warnings: they are
 * substituted with String.prototype.replace() or are not tokenized at all,
 * so a bad placeholder degrades the text rather than throwing.
 */

import {readFile, readdir} from 'fs/promises';

/** @type {URL} Directory containing the message files. */
const MSG_DIR = new URL('../../msg/json/', import.meta.url);

/** @type {URL} Directory containing the block definitions. */
const BLOCKS_DIR = new URL('../../blocks/', import.meta.url);

/**
 * Message files that do not contain translations of English messages.
 *
 * @type {Set<string>}
 */
const NOT_TRANSLATIONS = new Set([
  'constants.json', // Generated; block colours, not text.
  'synonyms.json', // Generated; maps message keys to other message keys.
  'qqq.json', // Translator documentation, not a translation.
  'en.json', // The reference messages.
]);

/**
 * Translations that are known to specify the wrong placeholders, and which
 * therefore break their block in that language.  Files in msg/json/ are
 * maintained on Translatewiki and cannot be fixed with a pull request here
 * (see msg/json/README.md), so they are tolerated until the translation is
 * corrected upstream.
 *
 * Remove an entry once Translatewiki has been updated; this script reports
 * entries that no longer correspond to a real problem.
 *
 * @type {Map<string, string>} Maps `<locale>/<message key>` to the reason.
 */
const KNOWN_BAD_TRANSLATIONS = new Map([
  ['eu/LISTS_LENGTH_TITLE', 'Basque translation omits %1.'],
  ['lki/CONTROLS_REPEAT_TITLE', 'Laki translation omits %1.'],
  ['sd/CONTROLS_REPEAT_TITLE', 'Sindhi translation uses ٪ (U+066A) not %1.'],
]);

/**
 * Returns the positional placeholders referenced by a message, in the order
 * they appear.  This mirrors the state machine in
 * core/utils/parsing.ts::tokenizeInterpolationInternal():
 *
 * - `%%` is an escaped literal percent sign.
 * - `%` followed by one or more digits is a positional placeholder.
 * - `%{...}` is a reference to another message, not a placeholder.
 * - `%` followed by anything else is a literal.
 *
 * @param {string} message The message to scan.
 * @returns {number[]} The placeholder numbers referenced by the message.
 */
function getPlaceholders(message) {
  const placeholders = [];
  let i = 0;
  while (i < message.length) {
    if (message[i] !== '%') {
      i++;
      continue;
    }
    const next = message[i + 1];
    if (next === '%') {
      i += 2;
    } else if (next === '{') {
      const end = message.indexOf('}', i);
      i = end === -1 ? i + 2 : end + 1;
    } else if (next >= '0' && next <= '9') {
      let end = i + 1;
      while (
        end < message.length &&
        message[end] >= '0' &&
        message[end] <= '9'
      ) {
        end++;
      }
      placeholders.push(Number(message.slice(i + 1, end)));
      i = end;
    } else {
      i += 2;
    }
  }
  return placeholders;
}

/**
 * Returns the names of the messages that are referenced by a block's
 * `messageN` property, and which are therefore expanded by
 * Block.prototype.interpolate().
 *
 * @returns {Promise<Set<string>>} The referenced message keys.
 */
async function getBlockMessageKeys() {
  const keys = new Set();
  const files = (await readdir(BLOCKS_DIR)).filter((file) =>
    file.endsWith('.ts'),
  );
  for (const file of files) {
    const source = await readFile(new URL(file, BLOCKS_DIR), 'utf8');
    // Matches e.g. 'message0': '%{BKY_CONTROLS_REPEAT_TITLE}',
    const messages = source.matchAll(/['"]message\d+['"]:\s*(['"])(.*?)\1/g);
    for (const [, , value] of messages) {
      for (const [, key] of value.matchAll(/%\{BKY_([A-Za-z0-9_]+)\}/g)) {
        keys.add(key);
      }
    }
  }
  return keys;
}

/**
 * Returns whether a message is a URL.  Blockly substitutes these with
 * replaceMessageReferences(), which does not parse positional placeholders.
 *
 * @param {string} message The message to test.
 * @returns {boolean} True if the message is a URL.
 */
function isUrl(message) {
  return /^https?:\/\//.test(message);
}

/**
 * Compares two sets of placeholders.
 *
 * @param {number[]} expected Placeholders used by the English message.
 * @param {number[]} actual Placeholders used by the translated message.
 * @returns {string} A description of the difference, or '' if they match.
 */
function comparePlaceholders(expected, actual) {
  const ascending = (a, b) => a - b;
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = [...expectedSet]
    .filter((n) => !actualSet.has(n))
    .sort(ascending);
  const extra = [...actualSet]
    .filter((n) => !expectedSet.has(n))
    .sort(ascending);
  const duplicated = actual.length !== actualSet.size;

  const problems = [];
  if (missing.length) problems.push(`missing %${missing.join(', %')}`);
  if (extra.length) problems.push(`unexpected %${extra.join(', %')}`);
  if (duplicated) problems.push('duplicate placeholders');
  return problems.join('; ');
}

/**
 * Validates the placeholders used by every translated message.
 *
 * @returns {Promise<void>} Exits with a non-zero status if a block message
 *     is mistranslated.
 */
async function validateMessages() {
  // Some blocks refer to a message by a synonym; the translations only ever
  // define the message it is a synonym of.
  const synonyms = JSON.parse(
    await readFile(new URL('synonyms.json', MSG_DIR), 'utf8'),
  );

  const blockMessageKeys = new Set(
    [...(await getBlockMessageKeys())].map((key) => synonyms[key] ?? key),
  );
  if (!blockMessageKeys.size) {
    console.error(
      'Found no block messages; the block definitions may have moved.',
    );
    process.exit(1);
  }

  const en = JSON.parse(await readFile(new URL('en.json', MSG_DIR), 'utf8'));
  for (const key of blockMessageKeys) {
    if (typeof en[key] !== 'string') {
      console.error(`en.json is missing block message ${key}.`);
      process.exit(1);
    }
  }

  const localeFiles = (await readdir(MSG_DIR)).filter(
    (file) => file.endsWith('.json') && !NOT_TRANSLATIONS.has(file),
  );

  const errors = [];
  const warnings = [];
  const unusedExceptions = new Set(KNOWN_BAD_TRANSLATIONS.keys());

  for (const file of localeFiles) {
    const locale = file.slice(0, -'.json'.length);
    const messages = JSON.parse(await readFile(new URL(file, MSG_DIR), 'utf8'));

    for (const [key, message] of Object.entries(messages)) {
      // Metadata (@metadata) and non-string values are not messages.
      if (key.startsWith('@') || typeof message !== 'string') continue;
      // A translation of a message that no longer exists is harmless.
      if (typeof en[key] !== 'string') continue;
      // URLs are substituted with replaceMessageReferences(), which does not
      // parse positional placeholders.  Percent-encoded octets in a
      // translated URL (e.g. %D8%B1) would otherwise look like placeholders.
      if (isUrl(en[key]) || isUrl(message)) continue;

      const problem = comparePlaceholders(
        getPlaceholders(en[key]),
        getPlaceholders(message),
      );
      if (!problem) continue;

      if (!blockMessageKeys.has(key)) {
        warnings.push({locale, key, problem});
        continue;
      }

      const exception = `${locale}/${key}`;
      if (KNOWN_BAD_TRANSLATIONS.has(exception)) {
        unusedExceptions.delete(exception);
        continue;
      }
      errors.push(
        `${exception}: ${problem}\n` +
          `      en: ${JSON.stringify(en[key])}\n` +
          `  ${locale.padStart(6)}: ${JSON.stringify(message)}`,
      );
    }
  }

  if (warnings.length) {
    // These messages are substituted with String.prototype.replace() or are
    // not tokenized, so they are reported in aggregate rather than failing.
    const byKey = new Map();
    for (const {key, problem} of warnings) {
      if (!byKey.has(key)) byKey.set(key, {count: 0, problem});
      byKey.get(key).count++;
    }
    console.warn(
      `${warnings.length} translation(s) of ${byKey.size} non-block ` +
        `message(s) do not use the same placeholders as en.json.  The text ` +
        `is degraded but no block is broken:`,
    );
    for (const [key, {count, problem}] of [...byKey].sort(
      (a, b) => b[1].count - a[1].count,
    )) {
      console.warn(`  ${key}: ${problem} (${count} language(s))`);
    }
    console.warn('');
  }

  for (const exception of unusedExceptions) {
    errors.push(
      `${exception} is listed in KNOWN_BAD_TRANSLATIONS but is now valid.  ` +
        `Please remove it from tests/messages/validate-messages.mjs.`,
    );
  }

  if (errors.length) {
    console.error(
      `${errors.length} block message(s) specify the wrong placeholders.  ` +
        `Blocks using them cannot be constructed in that language:`,
    );
    for (const error of errors) console.error(`  ${error}`);
    process.exit(1);
  }

  console.log(
    `Validated placeholders in ${blockMessageKeys.size} block messages ` +
      `across ${localeFiles.length} languages.`,
  );
}

validateMessages();
