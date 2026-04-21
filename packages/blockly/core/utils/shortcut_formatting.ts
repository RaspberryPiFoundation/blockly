/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import {Msg} from '../msg.js';
import {ShortcutRegistry} from '../shortcut_registry.js';
import * as userAgent from './useragent.js';

/**
 * Find the primary shortcut for this platform and return it as single string
 * in a short user facing format.
 *
 * @param shortcutName The keyboard shortcut name, e.g. "cut".
 * @returns The formatted shortcut.
 */
export function getShortcutKeysShort(shortcutName: string): string {
  const shortcuts = getShortcutKeys(shortcutName, shortModifierNames);
  if (shortcuts.length) {
    const parts = shortcuts[0];
    return parts.join(userAgent.APPLE ? ' ' : ' + ');
  }

  return '';
}

/**
 * Find the relevant shortcuts for the given shortcut for the current platform.
 * Keys are returned in a long user facing format, e.g. "Command ⌘ Option ⌥ C"
 *
 * @param shortcutName The keyboard shortcut name, e.g. "cut".
 * @returns The formatted shortcuts as individual keys.
 */
export function getShortcutKeysLong(shortcutName: string): string[][] {
  return getShortcutKeys(shortcutName, longModifierNames);
}

const longModifierNames: Record<string, string> = {
  'Control': Msg['CONTROL_KEY'],
  'Meta': Msg['COMMAND_KEY'],
  'Alt': userAgent.APPLE ? Msg['OPTION_KEY'] : Msg['ALT_KEY'],
};

const shortModifierNames: Record<string, string> = {
  'Control': Msg['CONTROL_KEY'],
  'Meta': '⌘',
  'Alt': userAgent.APPLE ? '⌥' : Msg['ALT_KEY'],
};

/**
 * Key names for common characters. These should be used with keyup/keydown
 * events, since the .keyCode property on those is meant to indicate the
 * _physical key_ the user held down on the keyboard. Hence the mapping uses
 * only the unshifted version of each key (e.g. no '#', since that's shift+3).
 * Keypress events on the other hand generate (mostly) ASCII codes since they
 * correspond to *characters* the user typed.
 *
 * For further reference: http://unixpapa.com/js/key.html
 *
 * This list is not localized and therefore some of the key codes are not
 * correct for non-US keyboard layouts.
 *
 * Partially copied from goog.events.keynames and modified to use translatable
 * strings or symbols for keys.
 */
const keyNames: Record<number, string> = {
  8: Msg['BACKSPACE_KEY'],
  9: Msg['TAB_KEY'],
  13: Msg['ENTER_KEY'],
  16: Msg['SHIFT_KEY'],
  17: Msg['CTRL_KEY'],
  18: Msg['ALT_KEY'],
  19: Msg['PAUSE_KEY'],
  20: Msg['CAPS_LOCK_KEY'],
  27: Msg['ESCAPE_KEY'],
  32: Msg['SPACE_KEY'],
  33: Msg['PAGE_UP_KEY'],
  34: Msg['PAGE_DOWN_KEY'],
  35: Msg['END_KEY'],
  36: Msg['HOME_KEY'],
  37: '←',
  38: '↑',
  39: '→',
  40: '↓',
  45: Msg['INSERT_KEY'],
  46: Msg['DELETE_KEY'],
  48: '0',
  49: '1',
  50: '2',
  51: '3',
  52: '4',
  53: '5',
  54: '6',
  55: '7',
  56: '8',
  57: '9',
  59: ';',
  61: '=',
  93: Msg['CONTEXT_MENU_KEY'],
  96: '0',
  97: '1',
  98: '2',
  99: '3',
  100: '4',
  101: '5',
  102: '6',
  103: '7',
  104: '8',
  105: '9',
  106: '×',
  107: '+',
  109: '−',
  110: '.',
  111: '÷',
  112: 'F1',
  113: 'F2',
  114: 'F3',
  115: 'F4',
  116: 'F5',
  117: 'F6',
  118: 'F7',
  119: 'F8',
  120: 'F9',
  121: 'F10',
  122: 'F11',
  123: 'F12',
  186: ';',
  187: '=',
  189: '-',
  188: ',',
  190: '.',
  191: '/',
  192: '`',
  219: '[',
  220: '\\',
  221: ']',
  222: "'",
  224: '⌘',
};

/**
 * Gets a user-facing name for a keycode.
 *
 * @param keyCode
 * @returns key name, or the character for the keycode if it's not in the list of known keys.
 */
function getKeyName(keyCode: number): string {
  if (keyCode >= 65 && keyCode <= 90) {
    // letters a-z
    return String.fromCharCode(keyCode);
  }
  const keyName = keyNames[keyCode];
  if (keyName) return keyName;
  console.warn('Unknown key code: ' + keyCode);
  return String.fromCharCode(keyCode);
}

/**
 * Find the relevant shortcuts for the given shortcut for the current platform.
 * Keys are returned in a short user facing format, e.g. "⌘ ⌥ C"
 *
 * This could be considerably simpler if we only bound shortcuts relevant to the
 * current platform or tagged them with a platform.
 *
 * @param shortcutName The keyboard shortcut name, e.g. "cut".
 * @param modifierNames The names to use for the Meta/Control/Alt modifiers.
 * @returns The formatted shortcuts.
 */
function getShortcutKeys(
  shortcutName: string,
  modifierNames: Record<string, string>,
): string[][] {
  const shortcuts =
    ShortcutRegistry.registry.getKeyCodesByShortcutName(shortcutName);
  if (shortcuts.length === 0) {
    return [];
  }
  // See ShortcutRegistry.createSerializedKey for the starting format.
  const shortcutsAsParts = shortcuts.map((shortcut) => shortcut.split('+'));
  // Prefer e.g. Cmd+Shift to Shift+Cmd.
  shortcutsAsParts.forEach((s) =>
    s.sort((a, b) => {
      const aValue = modifierOrder(a);
      const bValue = modifierOrder(b);
      return aValue - bValue;
    }),
  );

  // Needed to prefer Command to Option where we've bound Alt.
  shortcutsAsParts.sort((a, b) => {
    const aValue = a.includes('Meta') ? 1 : 0;
    const bValue = b.includes('Meta') ? 1 : 0;
    return bValue - aValue;
  });
  let currentPlatform = shortcutsAsParts.filter((shortcut) => {
    const isMacShortcut = shortcut.includes('Meta');
    return isMacShortcut === userAgent.APPLE;
  });
  currentPlatform =
    currentPlatform.length === 0 ? shortcutsAsParts : currentPlatform;

  // Prefer simpler shortcuts. This promotes Ctrl+Y for redo.
  currentPlatform.sort((a, b) => {
    return a.length - b.length;
  });
  // If there are modifiers return only one shortcut on the assumption they are
  // intended for different platforms. Otherwise assume they are alternatives.
  const hasModifiers = currentPlatform.some((shortcut) =>
    shortcut.some(
      (key) => 'Meta' === key || 'Alt' === key || 'Control' === key,
    ),
  );
  const chosen = hasModifiers ? [currentPlatform[0]] : currentPlatform;
  return chosen.map((shortcut) => {
    return shortcut
      .map((maybeNumeric) =>
        Number.isFinite(+maybeNumeric)
          ? getKeyName(+maybeNumeric)
          : maybeNumeric,
      )
      .map((k) => upperCaseFirst(modifierNames[k] ?? k));
  });
}

/**
 * Convert the first character to uppercase.
 *
 * @param str String.
 * @returns The string in title case.
 */
function upperCaseFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.substring(1);
}

/**
 * Preferred listing order of untranslated modifiers.
 */
const modifierOrdering: string[] = ['Meta', 'Control', 'Alt', 'Shift'];

function modifierOrder(key: string): number {
  const order = modifierOrdering.indexOf(key);
  // Regular keys at the end.
  return order === -1 ? Number.MAX_VALUE : order;
}
