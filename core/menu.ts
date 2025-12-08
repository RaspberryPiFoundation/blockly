/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Blockly menu similar to Closure's goog.ui.Menu
 *
 * @class
 */
// Former goog.module ID: Blockly.Menu

import * as browserEvents from './browser_events.js';
import type {MenuSeparator} from './menu_separator.js';
import {MenuItem} from './menuitem.js';
import * as aria from './utils/aria.js';
import {Coordinate} from './utils/coordinate.js';
import * as idGenerator from './utils/idgenerator.js';
import type {Size} from './utils/size.js';
import * as style from './utils/style.js';

/**
 * A basic menu class.
 */
export class Menu {
  /**
   * Array of menu items and separators.
   */
  private readonly menuItems: Array<MenuItem | MenuSeparator> = [];

  /**
   * Coordinates of the pointerdown event that caused this menu to open. Used to
   * prevent the consequent pointerup event due to a simple click from
   * activating a menu item immediately.
   */
  openingCoords: Coordinate | null = null;

  /**
   * This is the element that we will listen to the real focus events on.
   * A value of null means no menu item is highlighted.
   */
  private highlightedItem: MenuItem | null = null;

  /** Pointer over event data. */
  private pointerMoveHandler: browserEvents.Data | null = null;

  /** Click event data. */
  private clickHandler: browserEvents.Data | null = null;

  /** Pointer enter event data. */
  private pointerEnterHandler: browserEvents.Data | null = null;

  /** Pointer leave event data. */
  private pointerLeaveHandler: browserEvents.Data | null = null;

  /** Key down event data. */
  private onKeyDownHandler: browserEvents.Data | null = null;

  /** The menu's root DOM element. */
  private element: HTMLDivElement | null = null;

  /** ARIA name for this menu. */
  private roleName: aria.Role | null = null;

  id: string;

  /** Constructs a new Menu instance. */
  constructor() {
    this.id = idGenerator.getNextUniqueId();
  }

  /**
   * Add a new menu item to the bottom of this menu.
   *
   * @param menuItem Menu item or separator to append.
   * @internal
   */
  addChild(menuItem: MenuItem | MenuSeparator) {
    this.menuItems.push(menuItem);
  }

  /**
   * Creates the menu DOM.
   *
   * @param container Element upon which to append this menu.
   * @returns The menu's root DOM element.
   */

  render(container: Element): HTMLDivElement {
    const element = document.createElement('div');
    element.className = 'blocklyMenu';
    element.tabIndex = 0;
    element.id = this.id;
    if (this.roleName) {
      aria.setRole(element, this.roleName);
    }
    this.element = element;

    // Add menu items.
    for (let i = 0, menuItem; (menuItem = this.menuItems[i]); i++) {
      element.appendChild(menuItem.createDom());
    }

    // Add event handlers.
    this.pointerMoveHandler = browserEvents.conditionalBind(
      element,
      'pointermove',
      this,
      this.handlePointerMove,
      true,
    );
    this.clickHandler = browserEvents.conditionalBind(
      element,
      'pointerup',
      this,
      this.handleClick,
      true,
    );
    this.pointerEnterHandler = browserEvents.conditionalBind(
      element,
      'pointerenter',
      this,
      this.handlePointerEnter,
      true,
    );
    this.pointerLeaveHandler = browserEvents.conditionalBind(
      element,
      'pointerleave',
      this,
      this.handlePointerLeave,
      true,
    );
    this.onKeyDownHandler = browserEvents.conditionalBind(
      element,
      'keydown',
      this,
      this.handleKeyEvent,
    );

    container.appendChild(element);
    return element;
  }

  /**
   * Gets the menu's element.
   *
   * @returns The DOM element.
   * @internal
   */
  getElement(): HTMLDivElement | null {
    return this.element;
  }

  /**
   * Focus the menu element.
   *
   * @internal
   */
  focus() {
    const el = this.getElement();
    if (el) {
      el.focus({preventScroll: true});
    }
  }

  /** Blur the menu element. */
  private blur() {
    const el = this.getElement();
    if (el) {
      el.blur();
    }
  }

  /**
   * Set the menu accessibility role.
   *
   * @param roleName role name.
   * @internal
   */
  setRole(roleName: aria.Role) {
    this.roleName = roleName;
  }

  /** Dispose of this menu. */
  dispose() {
    // Remove event handlers.
    if (this.pointerMoveHandler) {
      browserEvents.unbind(this.pointerMoveHandler);
      this.pointerMoveHandler = null;
    }
    if (this.clickHandler) {
      browserEvents.unbind(this.clickHandler);
      this.clickHandler = null;
    }
    if (this.pointerEnterHandler) {
      browserEvents.unbind(this.pointerEnterHandler);
      this.pointerEnterHandler = null;
    }
    if (this.pointerLeaveHandler) {
      browserEvents.unbind(this.pointerLeaveHandler);
      this.pointerLeaveHandler = null;
    }
    if (this.onKeyDownHandler) {
      browserEvents.unbind(this.onKeyDownHandler);
      this.onKeyDownHandler = null;
    }

    // Remove menu items.
    for (let i = 0, menuItem; (menuItem = this.menuItems[i]); i++) {
      menuItem.dispose();
    }
    this.element = null;
  }

  // Child component management.

  /**
   * Returns the child menu item that owns the given DOM element,
   * or null if no such menu item is found.
   *
   * @param elem DOM element whose owner is to be returned.
   * @returns Menu item for which the DOM element belongs to.
   */
  private getMenuItem(elem: Element): MenuItem | null {
    const menuElem = this.getElement();
    // Node might be the menu border (resulting in no associated menu item), or
    // a menu item's div, or some element within the menu item.
    // Walk up parents until one meets either the menu's root element, or
    // a menu item's div.
    let currentElement: Element | null = elem;
    while (currentElement && currentElement !== menuElem) {
      if (currentElement.classList.contains('blocklyMenuItem')) {
        // Having found a menu item's div, locate that menu item in this menu.
        const items = this.getMenuItems();
        for (let i = 0, menuItem; (menuItem = items[i]); i++) {
          if (menuItem.getElement() === currentElement) {
            return menuItem;
          }
        }
      }
      currentElement = currentElement.parentElement;
    }
    return null;
  }

  // Highlight management.

  /**
   * Highlights the given menu item, or clears highlighting if null.
   *
   * @param item Item to highlight, or null.
   * @internal
   */
  setHighlighted(item: MenuItem | null) {
    const currentHighlighted = this.highlightedItem;
    if (currentHighlighted) {
      currentHighlighted.setHighlighted(false);
      this.highlightedItem = null;
    }
    if (item) {
      item.setHighlighted(true);
      this.highlightedItem = item;
      // Bring the highlighted item into view. This has no effect if the menu is
      // not scrollable.
      const menuElement = this.getElement();
      const menuItemElement = item.getElement();
      if (!menuElement || !menuItemElement) return;

      style.scrollIntoContainerView(menuItemElement, menuElement);
      aria.setState(menuElement, aria.State.ACTIVEDESCENDANT, item.getId());
    }
  }

  /**
   * Highlights the next highlightable item (or the first if nothing is
   * currently highlighted).
   *
   * @internal
   */
  highlightNext() {
    const index = this.highlightedItem
      ? this.getMenuItems().indexOf(this.highlightedItem)
      : -1;
    this.highlightHelper(index, 1);
  }

  /**
   * Highlights the previous highlightable item (or the last if nothing is
   * currently highlighted).
   *
   * @internal
   */
  highlightPrevious() {
    const index = this.highlightedItem
      ? this.getMenuItems().indexOf(this.highlightedItem)
      : -1;
    this.highlightHelper(index < 0 ? this.menuItems.length : index, -1);
  }

  /** Highlights the first highlightable item. */
  private highlightFirst() {
    this.highlightHelper(-1, 1);
  }

  /** Highlights the last highlightable item. */
  private highlightLast() {
    this.highlightHelper(this.menuItems.length, -1);
  }

  /**
   * Helper function that manages the details of moving the highlight among
   * child menuitems in response to keyboard events.
   *
   * @param startIndex Start index.
   * @param delta Step direction: 1 to go down, -1 to go up.
   */
  private highlightHelper(startIndex: number, delta: number) {
    let index = startIndex + delta;
    let menuItem;
    const items = this.getMenuItems();
    while ((menuItem = items[index])) {
      if (menuItem.isEnabled()) {
        this.setHighlighted(menuItem);
        break;
      }
      index += delta;
    }
  }

  // Pointer events.

  /**
   * Handles pointermove events. Highlight menu items as the user hovers over
   * them.
   *
   * @param e Pointer event to handle.
   */
  private handlePointerMove(e: PointerEvent) {
    // Check whether the pointer actually did move. Move events are triggered if
    // the element underneath the pointer moves, even if the pointer itself has
    // remained stationary. In the case where the pointer is hovering over
    // the menu but the user is navigating through the list of items via the
    // keyboard and causing items off the end of the menu to scroll into view,
    // a pointermove event would be triggered due to the pointer now being over
    // a new child, but we don't want to highlight the item that's now under the
    // pointer.
    const delta = Math.max(Math.abs(e.movementX), Math.abs(e.movementY));
    if (delta === 0) return;

    const menuItem = this.getMenuItem(e.target as Element);

    if (menuItem) {
      if (menuItem.isEnabled()) {
        if (this.highlightedItem !== menuItem) {
          this.setHighlighted(menuItem);
        }
      } else {
        this.setHighlighted(null);
      }
    }
  }

  /**
   * Handles click events. Pass the event onto the child menuitem to handle.
   *
   * @param e Click event to handle.
   */
  private handleClick(e: PointerEvent) {
    const oldCoords = this.openingCoords;
    // Clear out the saved opening coords immediately so they're not used twice.
    this.openingCoords = null;
    if (oldCoords && typeof e.clientX === 'number') {
      const newCoords = new Coordinate(e.clientX, e.clientY);
      if (Coordinate.distance(oldCoords, newCoords) < 1) {
        // This menu was opened by a pointerdown and we're handling the
        // consequent click event. The coords haven't changed, meaning this was
        // the same opening event. Don't do the usual behavior because the menu
        // just popped up under the pointer and the user didn't mean to activate
        // this item.
        return;
      }
    }

    const menuItem = this.getMenuItem(e.target as Element);
    if (menuItem) {
      menuItem.performAction(e);
    }
  }

  /**
   * Handles pointer enter events. Focus the element.
   *
   * @param _e Pointer event to handle.
   */
  private handlePointerEnter(_e: PointerEvent) {
    this.focus();
  }

  /**
   * Handles pointer leave events by clearing the active highlight.
   *
   * @param _e Pointer event to handle.
   */
  private handlePointerLeave(_e: PointerEvent) {
    if (this.getElement()) {
      this.setHighlighted(null);
    }
  }

  // Keyboard events.

  /**
   * Attempts to handle a keyboard event.
   *
   * @param e Key event to handle.
   */
  private handleKeyEvent(e: Event) {
    if (!this.menuItems.length) {
      // Empty menu.
      return;
    }
    const keyboardEvent = e as KeyboardEvent;
    if (
      keyboardEvent.shiftKey ||
      keyboardEvent.ctrlKey ||
      keyboardEvent.metaKey ||
      keyboardEvent.altKey
    ) {
      // Do not handle the key event if any modifier key is pressed.
      return;
    }

    const highlighted = this.highlightedItem;
    switch (keyboardEvent.key) {
      case 'Enter':
      case ' ':
        if (highlighted) {
          highlighted.performAction(e);
        }
        break;

      case 'ArrowUp':
        this.highlightPrevious();
        break;

      case 'ArrowDown':
        this.highlightNext();
        break;

      case 'PageUp':
      case 'Home':
        this.highlightFirst();
        break;

      case 'PageDown':
      case 'End':
        this.highlightLast();
        break;

      default:
        // Not a key the menu is interested in.
        return;
    }
    // The menu used this key, don't let it have secondary effects.
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Get the size of a rendered menu.
   *
   * @returns Object with width and height properties.
   * @internal
   */
  getSize(): Size {
    const menuDom = this.getElement() as HTMLDivElement;
    const menuSize = style.getSize(menuDom);
    // Recalculate height for the total content, not only box height.
    menuSize.height = menuDom.scrollHeight;
    return menuSize;
  }

  /**
   * Returns the action menu items (omitting separators) in this menu.
   *
   * @returns The MenuItem objects displayed in this menu.
   */
  private getMenuItems(): MenuItem[] {
    return this.menuItems.filter((item) => item instanceof MenuItem);
  }
}
