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
 * @internal
 * @param action The action name, e.g. "cut".
 * @returns The formatted shortcut.
 */
export function getShortActionShortcut(action: string): string {
  const shortcuts = getActionShortcutsAsKeys(action, shortModifierNames);
  if (shortcuts.length) {
    const parts = shortcuts[0];
    return parts.join(userAgent.APPLE ? ' ' : ' + ');
  }

  return '';
}

/**
 * Find the relevant shortcuts for the given action for the current platform.
 * Keys are returned in a long user facing format, e.g. "Command ⌘ Option ⌥ C"
 *
 * @internal
 * @param action The action name, e.g. "cut".
 * @returns The formatted shortcuts as individual keys.
 */
export function getLongActionShortcutsAsKeys(action: string): string[][] {
  return getActionShortcutsAsKeys(action, longModifierNames);
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
 * Find the relevant shortcuts for the given action for the current platform.
 * Keys are returned in a short user facing format, e.g. "⌘ ⌥ C"
 *
 * This could be considerably simpler if we only bound shortcuts relevant to the
 * current platform or tagged them with a platform.
 *
 * @param action The action name, e.g. "cut".
 * @param modifierNames The names to use for the Meta/Control/Alt modifiers.
 * @returns The formatted shortcuts.
 */
function getActionShortcutsAsKeys(
  action: string,
  modifierNames: Record<string, string>,
): string[][] {
  const shortcuts = ShortcutRegistry.registry.getKeyCodesByShortcutName(action);
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
          ? String.fromCharCode(+maybeNumeric)
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
