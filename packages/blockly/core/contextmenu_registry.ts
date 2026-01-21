/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Registry for context menu option items.
 *
 * @class
 */
// Former goog.module ID: Blockly.ContextMenuRegistry

import type {BlockSvg} from './block_svg.js';
import {RenderedWorkspaceComment} from './comments/rendered_workspace_comment.js';
import type {IFocusableNode} from './interfaces/i_focusable_node.js';
import {Coordinate} from './utils/coordinate.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Class for the registry of context menu items. This is intended to be a
 * singleton. You should not create a new instance, and only access this class
 * from ContextMenuRegistry.registry.
 */
export class ContextMenuRegistry {
  static registry: ContextMenuRegistry;
  /** Registry of all registered RegistryItems, keyed by ID. */
  private registeredItems = new Map<string, RegistryItem>();

  /** Resets the existing singleton instance of ContextMenuRegistry. */
  constructor() {
    this.reset();
  }

  /** Clear and recreate the registry. */
  reset() {
    this.registeredItems.clear();
  }

  /**
   * Registers a RegistryItem.
   *
   * @param item Context menu item to register.
   * @throws {Error} if an item with the given ID already exists.
   */
  register(item: RegistryItem) {
    if (this.registeredItems.has(item.id)) {
      throw Error('Menu item with ID "' + item.id + '" is already registered.');
    }
    this.registeredItems.set(item.id, item);
  }

  /**
   * Unregisters a RegistryItem with the given ID.
   *
   * @param id The ID of the RegistryItem to remove.
   * @throws {Error} if an item with the given ID does not exist.
   */
  unregister(id: string) {
    if (!this.registeredItems.has(id)) {
      throw new Error('Menu item with ID "' + id + '" not found.');
    }
    this.registeredItems.delete(id);
  }

  /**
   * @param id The ID of the RegistryItem to get.
   * @returns RegistryItem or null if not found
   */
  getItem(id: string): RegistryItem | null {
    return this.registeredItems.get(id) ?? null;
  }

  /**
   * Gets the valid context menu options for the given scope.
   * Options are only included if the preconditionFn shows
   * they should not be hidden.
   *
   * @param scope Current scope of context menu (i.e., the exact workspace or
   *     block being clicked on).
   * @param menuOpenEvent Event that caused the menu to open.
   * @returns the list of ContextMenuOptions
   */
  getContextMenuOptions(
    scope: Scope,
    menuOpenEvent: Event,
  ): ContextMenuOption[] {
    const menuOptions: ContextMenuOption[] = [];
    for (const item of this.registeredItems.values()) {
      if (item.scopeType) {
        // If the scopeType is present, check to make sure
        // that the option is compatible with the current scope
        if (item.scopeType === ScopeType.BLOCK && !scope.block) continue;
        if (item.scopeType === ScopeType.COMMENT && !scope.comment) continue;
        if (item.scopeType === ScopeType.WORKSPACE && !scope.workspace)
          continue;
      }
      let menuOption:
        | ContextMenuRegistry.CoreContextMenuOption
        | ContextMenuRegistry.SeparatorContextMenuOption
        | ContextMenuRegistry.ActionContextMenuOption;
      menuOption = {
        scope,
        weight: item.weight,
      };

      const precondition = item.preconditionFn?.(scope, menuOpenEvent);
      if (precondition === 'hidden') continue;

      if (item.separator) {
        menuOption = {
          ...menuOption,
          separator: true,
        };
      } else {
        const displayText =
          typeof item.displayText === 'function'
            ? item.displayText(scope)
            : item.displayText;
        menuOption = {
          ...menuOption,
          text: displayText,
          callback: item.callback,
          enabled: precondition === 'enabled',
        };
      }

      menuOptions.push(menuOption);
    }
    menuOptions.sort(function (a, b) {
      return a.weight - b.weight;
    });
    return menuOptions;
  }
}

export namespace ContextMenuRegistry {
  /**
   * Where this menu item should be rendered. If the menu item should be
   * rendered in multiple scopes, e.g. on both a block and a workspace, it
   * should be registered for each scope.
   */
  export enum ScopeType {
    BLOCK = 'block',
    WORKSPACE = 'workspace',
    COMMENT = 'comment',
  }

  /**
   * The actual workspace/block/focused object where the menu is being
   * rendered. This is passed to callback and displayText functions
   * that depend on this information.
   */
  export interface Scope {
    block?: BlockSvg;
    workspace?: WorkspaceSvg;
    comment?: RenderedWorkspaceComment;
    focusedNode?: IFocusableNode;
  }

  /**
   * Fields common to all context menu registry items.
   */
  interface CoreRegistryItem {
    scopeType?: ScopeType;
    weight: number;
    id: string;
    preconditionFn?: (p1: Scope, menuOpenEvent: Event) => string;
  }

  /**
   * A representation of a normal, clickable menu item in the registry.
   */
  interface ActionRegistryItem extends CoreRegistryItem {
    /**
     * @param scope Object that provides a reference to the thing that had its
     *     context menu opened.
     * @param menuOpenEvent The original event that triggered the context menu to open.
     * @param menuSelectEvent The event that triggered the option being selected.
     * @param location The location in screen coordinates where the menu was opened.
     */
    callback: (
      scope: Scope,
      menuOpenEvent: Event,
      menuSelectEvent: Event,
      location: Coordinate,
    ) => void;
    displayText: ((p1: Scope) => string | HTMLElement) | string | HTMLElement;
    separator?: never;
    preconditionFn: (p1: Scope, menuOpenEvent: Event) => string;
  }

  /**
   * A representation of a menu separator item in the registry.
   */
  interface SeparatorRegistryItem extends CoreRegistryItem {
    separator: true;
    callback?: never;
    displayText?: never;
  }

  /**
   * A menu item as entered in the registry.
   */
  export type RegistryItem = ActionRegistryItem | SeparatorRegistryItem;

  /**
   * Fields common to all context menu items as used by contextmenu.ts.
   */
  export interface CoreContextMenuOption {
    scope: Scope;
    weight: number;
  }

  /**
   * A representation of a normal, clickable menu item in contextmenu.ts.
   */
  export interface ActionContextMenuOption extends CoreContextMenuOption {
    text: string | HTMLElement;
    enabled: boolean;
    /**
     * @param scope Object that provides a reference to the thing that had its
     *     context menu opened.
     * @param menuOpenEvent The original event that triggered the context menu to open.
     * @param menuSelectEvent The event that triggered the option being selected.
     * @param location The location in screen coordinates where the menu was opened.
     */
    callback: (
      scope: Scope,
      menuOpenEvent: Event,
      menuSelectEvent: Event,
      location: Coordinate,
    ) => void;
    separator?: never;
  }

  /**
   * A representation of a menu separator item in contextmenu.ts.
   */
  export interface SeparatorContextMenuOption extends CoreContextMenuOption {
    separator: true;
    text?: never;
    enabled?: never;
    callback?: never;
  }

  /**
   * A menu item as presented to contextmenu.ts.
   */
  export type ContextMenuOption =
    | ActionContextMenuOption
    | SeparatorContextMenuOption;

  /**
   * A subset of ContextMenuOption corresponding to what was publicly
   * documented.  ContextMenuOption should be preferred for new code.
   */
  export interface LegacyContextMenuOption {
    text: string;
    enabled: boolean;
    callback: (p1: Scope) => void;
    separator?: never;
  }

  /**
   * Singleton instance of this class. All interactions with this class should
   * be done on this object.
   */
  ContextMenuRegistry.registry = new ContextMenuRegistry();
}

export type ScopeType = ContextMenuRegistry.ScopeType;
export const ScopeType = ContextMenuRegistry.ScopeType;
export type Scope = ContextMenuRegistry.Scope;
export type RegistryItem = ContextMenuRegistry.RegistryItem;
export type ContextMenuOption = ContextMenuRegistry.ContextMenuOption;
export type LegacyContextMenuOption =
  ContextMenuRegistry.LegacyContextMenuOption;
