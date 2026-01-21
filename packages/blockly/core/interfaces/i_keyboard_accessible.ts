/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IKeyboardAccessible

import {KeyboardShortcut} from '../shortcut_registry.js';

/**
 * An interface for an object that handles keyboard shortcuts.
 */
export interface IKeyboardAccessible {
  /**
   * Handles the given keyboard shortcut.
   *
   * @param shortcut The shortcut to be handled.
   * @returns True if the shortcut has been handled, false otherwise.
   */
  onShortcut(shortcut: KeyboardShortcut): boolean;
}
