/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The namespace used to keep track of keyboard shortcuts and the
 * key codes used to execute those shortcuts.
 *
 * @class
 */
// Former goog.module ID: Blockly.ShortcutRegistry

import {Scope} from './contextmenu_registry.js';
import {getFocusManager} from './focus_manager.js';
import {KeyCodes} from './utils/keycodes.js';
import * as object from './utils/object.js';
import {WorkspaceSvg} from './workspace_svg.js';

/**
 * Class for the registry of keyboard shortcuts. This is intended to be a
 * singleton. You should not create a new instance, and only access this class
 * from ShortcutRegistry.registry.
 */
export class ShortcutRegistry {
  static readonly registry = new ShortcutRegistry();

  /** Registry of all keyboard shortcuts, keyed by name of shortcut. */
  private shortcuts = new Map<string, KeyboardShortcut>();

  /** Map of key codes to an array of shortcut names. */
  private keyMap = new Map<string, string[]>();

  /** Resets the existing ShortcutRegistry singleton. */
  private constructor() {
    this.reset();
  }

  /** Clear and recreate the registry and keyMap. */
  reset() {
    this.shortcuts.clear();
    this.keyMap.clear();
  }

  /**
   * Registers a keyboard shortcut.
   *
   * @param shortcut The shortcut for this key code.
   * @param allowOverrides True to prevent a warning when overriding an
   *     already registered item.
   * @throws {Error} if a shortcut with the same name already exists.
   */
  register(shortcut: KeyboardShortcut, allowOverrides?: boolean) {
    const registeredShortcut = this.shortcuts.get(shortcut.name);
    if (registeredShortcut && !allowOverrides) {
      throw new Error(`Shortcut named "${shortcut.name}" already exists.`);
    }
    this.shortcuts.set(shortcut.name, shortcut);

    const keyCodes = shortcut.keyCodes;
    if (keyCodes?.length) {
      for (const keyCode of keyCodes) {
        this.addKeyMapping(keyCode, shortcut.name, !!shortcut.allowCollision);
      }
    }
  }

  /**
   * Unregisters a keyboard shortcut registered with the given name. This
   * will also remove any key mappings that reference this shortcut.
   *
   * @param shortcutName The name of the shortcut to unregister.
   * @returns True if an item was unregistered, false otherwise.
   */
  unregister(shortcutName: string): boolean {
    const shortcut = this.shortcuts.get(shortcutName);

    if (!shortcut) {
      console.warn(`Keyboard shortcut named "${shortcutName}" not found.`);
      return false;
    }

    this.removeAllKeyMappings(shortcutName);

    this.shortcuts.delete(shortcutName);
    return true;
  }

  /**
   * Adds a mapping between a keycode and a keyboard shortcut.
   *
   * Normally only one shortcut can be mapped to any given keycode,
   * but setting allowCollisions to true allows a keyboard to be
   * mapped to multiple shortcuts.  In that case, when onKeyDown is
   * called with the given keystroke, it will process the mapped
   * shortcuts in reverse order, from the most- to least-recently
   * mapped).
   *
   * @param keyCode The key code for the keyboard shortcut. If registering a key
   *     code with a modifier (ex: ctrl+c) use
   *     ShortcutRegistry.registry.createSerializedKey;
   * @param shortcutName The name of the shortcut to execute when the given
   *     keycode is pressed.
   * @param allowCollision True to prevent an error when adding a shortcut
   *     to a key that is already mapped to a shortcut.
   * @throws {Error} if the given key code is already mapped to a shortcut.
   */
  addKeyMapping(
    keyCode: string | number | KeyCodes,
    shortcutName: string,
    allowCollision?: boolean,
  ) {
    keyCode = `${keyCode}`;
    const shortcutNames = this.keyMap.get(keyCode);
    if (shortcutNames && !allowCollision) {
      throw new Error(
        `Shortcut named "${shortcutName}" collides with shortcuts "${shortcutNames}"`,
      );
    } else if (shortcutNames && allowCollision) {
      shortcutNames.unshift(shortcutName);
    } else {
      this.keyMap.set(keyCode, [shortcutName]);
    }
  }

  /**
   * Removes a mapping between a keycode and a keyboard shortcut.
   *
   * @param keyCode The key code for the keyboard shortcut. If registering a key
   *     code with a modifier (ex: ctrl+c) use
   *     ShortcutRegistry.registry.createSerializedKey;
   * @param shortcutName The name of the shortcut to execute when the given
   *     keycode is pressed.
   * @param quiet True to not console warn when there is no shortcut to
   *     remove.
   * @returns True if a key mapping was removed, false otherwise.
   */
  removeKeyMapping(
    keyCode: string,
    shortcutName: string,
    quiet?: boolean,
  ): boolean {
    const shortcutNames = this.keyMap.get(keyCode);

    if (!shortcutNames) {
      if (!quiet) {
        console.warn(
          `No keyboard shortcut named "${shortcutName}" registered with key code "${keyCode}"`,
        );
      }
      return false;
    }

    const shortcutIdx = shortcutNames.indexOf(shortcutName);
    if (shortcutIdx > -1) {
      shortcutNames.splice(shortcutIdx, 1);
      if (shortcutNames.length === 0) {
        this.keyMap.delete(keyCode);
      }
      return true;
    }
    if (!quiet) {
      console.warn(
        `No keyboard shortcut named "${shortcutName}" registered with key code "${keyCode}"`,
      );
    }
    return false;
  }

  /**
   * Removes all the key mappings for a shortcut with the given name.
   * Useful when changing the default key mappings and the key codes registered
   * to the shortcut are unknown.
   *
   * @param shortcutName The name of the shortcut to remove from the key map.
   */
  removeAllKeyMappings(shortcutName: string) {
    for (const keyCode of this.keyMap.keys()) {
      this.removeKeyMapping(keyCode, shortcutName, /* quiet= */ true);
    }
  }

  /**
   * Sets the key map. Setting the key map will override any default key
   * mappings.
   *
   * @param newKeyMap The object with key code to shortcut names.
   */
  setKeyMap(newKeyMap: {[key: string]: string[]}) {
    this.keyMap.clear();
    for (const key in newKeyMap) {
      this.keyMap.set(key, newKeyMap[key]);
    }
  }

  /**
   * Gets the current key map.
   *
   * @returns The object holding key codes to ShortcutRegistry.KeyboardShortcut.
   */
  getKeyMap(): {[key: string]: string[]} {
    const legacyKeyMap: {[key: string]: string[]} = Object.create(null);
    for (const [key, value] of this.keyMap) {
      legacyKeyMap[key] = value;
    }
    return legacyKeyMap;
  }

  /**
   * Gets the registry of keyboard shortcuts.
   *
   * @returns The registry of keyboard shortcuts.
   */
  getRegistry(): {[key: string]: KeyboardShortcut} {
    const legacyRegistry: {[key: string]: KeyboardShortcut} =
      Object.create(null);
    for (const [key, value] of this.shortcuts) {
      legacyRegistry[key] = value;
    }
    return object.deepMerge(Object.create(null), legacyRegistry);
  }

  /**
   * Handles key down events.
   *
   * - Any `KeyboardShortcut`(s) mapped to the keycodes that cause
   *   event `e` to be fired will be processed, in order from least-
   *   to most-recently registered.
   * - If the shortcut's `preconditionFn` exists it will be called.
   *   If `preconditionFn` returns false the shortcut's `callback`
   *   function will be skipped.  Processing will continue with the
   *   next shortcut, if any.
   * - The shortcut's `callback` function will then be called.  If it
   *   returns true, processing will terminate and `onKeyDown` will
   *   return true.  If it returns false, processing will continue
   *   with with the next shortcut, if any.
   * - If all registered shortcuts for the given keycode have been
   *   processed without any having returned true, `onKeyDown` will
   *   return false.
   *
   * @param workspace The main workspace where the event was captured.
   * @param e The key down event.
   * @returns True if the event was handled, false otherwise.
   */
  onKeyDown(workspace: WorkspaceSvg, e: KeyboardEvent): boolean {
    const key = this.serializeKeyEvent(e);
    const shortcutNames = this.getShortcutNamesByKeyCode(key);
    if (!shortcutNames) return false;
    for (const shortcutName of shortcutNames) {
      const shortcut = this.shortcuts.get(shortcutName);
      if (
        !shortcut ||
        (shortcut.preconditionFn &&
          !shortcut.preconditionFn(workspace, {
            focusedNode: getFocusManager().getFocusedNode() ?? undefined,
          }))
      ) {
        continue;
      }
      // If the key has been handled, stop processing shortcuts.
      if (
        shortcut.callback?.(workspace, e, shortcut, {
          focusedNode: getFocusManager().getFocusedNode() ?? undefined,
        })
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets the shortcuts registered to the given key code.
   *
   * @param keyCode The serialized key code.
   * @returns The list of shortcuts to call when the given keyCode is used.
   *     Undefined if no shortcuts exist.
   */
  getShortcutNamesByKeyCode(keyCode: string): string[] | undefined {
    // Copy the list of shortcuts in case one of them unregisters itself
    // in its callback.
    return this.keyMap.get(keyCode)?.slice() || [];
  }

  /**
   * Gets the serialized key codes that the shortcut with the given name is
   * registered under.
   *
   * @param shortcutName The name of the shortcut.
   * @returns An array with all the key codes the shortcut is registered under.
   */
  getKeyCodesByShortcutName(shortcutName: string): string[] {
    const keys = [];
    for (const [keyCode, shortcuts] of this.keyMap) {
      const shortcutIdx = shortcuts.indexOf(shortcutName);
      if (shortcutIdx > -1) {
        keys.push(keyCode);
      }
    }
    return keys;
  }

  /**
   * Serializes a key event.
   *
   * @param e A key down event.
   * @returns The serialized key code for the given event.
   */
  private serializeKeyEvent(e: KeyboardEvent): string {
    let serializedKey = '';
    for (const modifier in ShortcutRegistry.modifierKeys) {
      if (e.getModifierState(modifier)) {
        if (serializedKey !== '') {
          serializedKey += '+';
        }
        serializedKey += modifier;
      }
    }
    if (serializedKey !== '' && e.keyCode) {
      serializedKey += '+' + e.keyCode;
    } else if (e.keyCode) {
      serializedKey = String(e.keyCode);
    }
    return serializedKey;
  }

  /**
   * Checks whether any of the given modifiers are not valid.
   *
   * @param modifiers List of modifiers to be used with the key.
   * @throws {Error} if the modifier is not in the valid modifiers list.
   */
  private checkModifiers(modifiers: KeyCodes[]) {
    for (const modifier of modifiers) {
      if (!(modifier in ShortcutRegistry.modifierKeys)) {
        throw new Error(modifier + ' is not a valid modifier key.');
      }
    }
  }

  /**
   * Creates the serialized key code that will be used in the key map.
   *
   * @param keyCode Number code representing the key.
   * @param modifiers List of modifier key codes to be used with the key. All
   *     valid modifiers can be found in the `ShortcutRegistry.modifierKeys`.
   * @returns The serialized key code for the given modifiers and key.
   */
  createSerializedKey(keyCode: number, modifiers: KeyCodes[] | null): string {
    let serializedKey = '';

    if (modifiers) {
      this.checkModifiers(modifiers);
      for (const modifier in ShortcutRegistry.modifierKeys) {
        const modifierKeyCode = (
          ShortcutRegistry.modifierKeys as AnyDuringMigration
        )[modifier];
        if (modifiers.includes(modifierKeyCode)) {
          if (serializedKey !== '') {
            serializedKey += '+';
          }
          serializedKey += modifier;
        }
      }
    }

    if (serializedKey !== '' && keyCode) {
      serializedKey += '+' + keyCode;
    } else if (keyCode) {
      serializedKey = `${keyCode}`;
    }
    return serializedKey;
  }
}

export namespace ShortcutRegistry {
  /** Interface defining a keyboard shortcut. */
  export interface KeyboardShortcut {
    /**
     * The function to be called when the shorctut is invoked.
     *
     * @param workspace The `WorkspaceSvg` when the shortcut was
     *     invoked.
     * @param e The event that caused the shortcut to be activated.
     * @param shortcut The `KeyboardShortcut` that was activated
     *     (i.e., the one this callback is attached to).
     * @param scope Information about the focused item when the
     * shortcut was invoked.
     * @returns Returning true ends processing of the invoked keycode.
     *     Returning false causes processing to continue with the
     *     next-most-recently registered shortcut for the invoked
     *     keycode.
     */
    callback?: (
      workspace: WorkspaceSvg,
      e: Event,
      shortcut: KeyboardShortcut,
      scope: Scope,
    ) => boolean;

    /** The name of the shortcut.  Should be unique. */
    name: string;

    /**
     * A function to be called when the shortcut is invoked, before
     * calling `callback`, to decide if this shortcut is applicable in
     * the current situation.
     *
     * @param workspace The `WorkspaceSvg` where the shortcut was
     *     invoked.
     * @param scope Information about the focused item when the
     * shortcut would be invoked.
     * @returns True iff `callback` function should be called.
     */
    preconditionFn?: (workspace: WorkspaceSvg, scope: Scope) => boolean;

    /** Optional arbitray extra data attached to the shortcut. */
    metadata?: object;

    /**
     * Optional list of key codes to be bound (via
     * ShortcutRegistry.prototype.addKeyMapping) to this shortcut.
     */
    keyCodes?: (number | string)[];

    /**
     * Value of `allowCollision` to pass to `addKeyMapping` when
     * binding this shortcut's `.keyCodes` (if any).
     *
     * N.B.: this is only used for binding keycodes at the time this
     * shortcut is initially registered, not for any subsequent
     * `addKeyMapping` calls that happen to reference this shortcut's
     * name.
     */
    allowCollision?: boolean;
  }

  /** Supported modifiers. */
  export enum modifierKeys {
    Shift = KeyCodes.SHIFT,
    Control = KeyCodes.CTRL,
    Alt = KeyCodes.ALT,
    Meta = KeyCodes.META,
  }
}

export type KeyboardShortcut = ShortcutRegistry.KeyboardShortcut;
// No need to export ShorcutRegistry.modifierKeys from the module at this time
// because (1) it wasn't automatically converted by the automatic migration
// script, (2) the name doesn't follow the styleguide.
