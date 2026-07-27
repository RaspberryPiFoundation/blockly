/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {browserEvents, utils} from 'blockly/core';

/**
 * Class representing an item in a grid.
 */
export class GridItem {
  /** The DOM element for the grid item. */
  private element: HTMLButtonElement;

  /** Identifier for a click handler to unregister during dispose(). */
  private clickHandler: browserEvents.Data | null;

  /** Callback to invoke when this item is selected. */
  private selectionCallback: ((selectedItem: GridItem) => void) | null;

  /** Whether or not this item is currently selected. */
  private selected = false;

  /**
   * Creates a new GridItem.
   *
   * @param container The parent element of this grid item in the DOM.
   * @param content The content to display in this grid item.
   * @param value The programmatic value of this grid item.
   * @param ariaLabel An accessibility label that describes the contents of this
   *     grid item to screenreaders.
   * @param selectionCallback Function to call when this item is selected.
   */
  constructor(
    container: HTMLElement,
    content: string | HTMLElement,
    private readonly value: string,
    ariaLabel: string | undefined,
    selectionCallback: (selectedItem: GridItem) => void,
  ) {
    this.selectionCallback = selectionCallback;

    const cell = document.createElement('div');
    utils.aria.setRole(cell, utils.aria.Role.GRIDCELL);

    this.element = document.createElement('button');
    this.element.id = utils.idGenerator.getNextUniqueId();
    this.element.className = 'blocklyFieldGridItem';
    this.clickHandler = browserEvents.conditionalBind(
      this.element,
      'click',
      this,
      this.onClick,
      true,
    );
    cell.appendChild(this.element);
    container.appendChild(cell);

    const contentDom =
      typeof content === 'string' ? document.createTextNode(content) : content;
    this.element.appendChild(contentDom);

    if (ariaLabel) {
      utils.aria.setState(this.element, utils.aria.State.LABEL, ariaLabel);
    }
  }

  /**
   * Disposes of this grid item.
   */
  dispose() {
    this.selectionCallback = null;
    this.element.remove();
    if (this.clickHandler) {
      browserEvents.unbind(this.clickHandler);
      this.clickHandler = null;
    }
  }

  /**
   * Gets the unique (within the grid) ID for this grid item.
   *
   * @returns This item's unique ID.
   */
  getId(): string {
    return this.element.id;
  }

  /**
   * Gets the value associated with this grid item.
   *
   * @returns Value associated with this grid item.
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Returns whether or not this grid item is selected.
   *
   * @returns True if this grid item is selected, otherwise false.
   */
  isSelected() {
    return this.selected;
  }

  /**
   * Sets whether or not this grid item is selected.
   *
   * @param selected True if this grid item should be selected, otherwise false.
   */
  setSelected(selected: boolean) {
    this.selected = selected;
    utils.aria.setState(this.element, utils.aria.State.SELECTED, this.selected);
    this.element.classList.toggle(
      'blocklyFieldGridItemSelected',
      this.selected,
    );
    if (this.isSelected()) {
      this.focus();
    }
  }

  /**
   * Handles clicks on this grid item by marking it as selected.
   */
  private onClick() {
    this.setSelected(true);
    this.selectionCallback?.(this);
  }

  /**
   * Makes this grid item the browser focus target, and scrolls it into view
   * if needed.
   */
  focus() {
    // Focus the element, but don't scroll the document since that's too
    // aggressive.
    this.element.focus({preventScroll: true});

    const scrollingParent = this.element.offsetParent;
    if (!scrollingParent) return;
    const offsetTop = this.element.offsetTop;
    const scrollTop = scrollingParent.scrollTop;
    const spacing = this.getInterItemSpacing();

    // Scroll the element into view if it's offscreen above the grid's viewport.
    if (offsetTop < scrollTop) {
      scrollingParent.scrollTo(0, offsetTop - spacing);
    } else if (
      offsetTop + this.element.offsetHeight >
      scrollTop + scrollingParent.clientHeight
    ) {
      // Scroll into view if this item is below the grid's viewport.
      scrollingParent.scrollBy(
        0,
        offsetTop +
          this.element.clientHeight -
          (scrollTop + scrollingParent.clientHeight) +
          spacing,
      );
    }
  }

  /**
   * Returns the vertical spacing between grid items in pixels.
   *
   * This value can be specified by the user in CSS, so we can't just use a
   * hardcoded value. Moreover, while we could check our computed style, the
   * grid gap can be specified in several units. Instead, this somewhat hackily
   * finds all the sibling items in this grid and loops through them until it
   * encounters one with a different vertical location from its predecessor,
   * then computes the effective gap based on their relative position and
   * height.
   *
   * @returns The vertical distance between items in this grid.
   */
  private getInterItemSpacing() {
    const grid = this.element.closest('.blocklyFieldGrid');
    if (!grid) return 0;

    const items = [
      ...grid.querySelectorAll('.blocklyFieldGridItem'),
    ] as HTMLElement[];
    if (!items.length) return 0;

    const initialTop = items[0].offsetTop;
    const initialHeight = items[0].offsetHeight;
    for (const item of items) {
      if (item.offsetTop !== initialTop) {
        return item.offsetTop - initialHeight - initialTop;
      }
    }

    return 0;
  }
}
