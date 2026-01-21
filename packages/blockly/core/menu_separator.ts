/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as aria from './utils/aria.js';

/**
 * Representation of a section separator in a menu.
 */
export class MenuSeparator {
  /**
   * DOM element representing this separator in a menu.
   */
  private element: HTMLHRElement | null = null;

  /**
   * Creates the DOM representation of this separator.
   *
   * @returns An <hr> element.
   */
  createDom(): HTMLHRElement {
    this.element = document.createElement('hr');
    this.element.className = 'blocklyMenuSeparator';
    aria.setRole(this.element, aria.Role.SEPARATOR);

    return this.element;
  }

  /**
   * Disposes of this separator.
   */
  dispose() {
    this.element?.remove();
    this.element = null;
  }
}
