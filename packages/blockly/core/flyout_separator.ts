/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IBoundedElement} from './interfaces/i_bounded_element.js';
import type {IFocusableNode} from './interfaces/i_focusable_node.js';
import type {IFocusableTree} from './interfaces/i_focusable_tree.js';
import {Rect} from './utils/rect.js';

/**
 * Representation of a gap between elements in a flyout.
 */
export class FlyoutSeparator implements IBoundedElement, IFocusableNode {
  private x = 0;
  private y = 0;

  /**
   * Creates a new separator.
   *
   * @param gap The amount of space this separator should occupy.
   * @param axis The axis along which this separator occupies space.
   */
  constructor(
    private gap: number,
    private axis: SeparatorAxis,
  ) {}

  /**
   * Returns the bounding box of this separator.
   *
   * @returns The bounding box of this separator.
   */
  getBoundingRectangle(): Rect {
    switch (this.axis) {
      case SeparatorAxis.X:
        return new Rect(this.y, this.y, this.x, this.x + this.gap);
      case SeparatorAxis.Y:
        return new Rect(this.y, this.y + this.gap, this.x, this.x);
    }
  }

  /**
   * Repositions this separator.
   *
   * @param dx The distance to move this separator on the X axis.
   * @param dy The distance to move this separator on the Y axis.
   * @param _reason The reason this move was initiated.
   */
  moveBy(dx: number, dy: number, _reason?: string[]) {
    this.x += dx;
    this.y += dy;
  }

  /**
   * Returns false to prevent this separator from being navigated to by the
   * keyboard.
   *
   * @returns False.
   */
  isNavigable() {
    return false;
  }

  /** See IFocusableNode.getFocusableElement. */
  getFocusableElement(): HTMLElement | SVGElement {
    throw new Error('Cannot be focused');
  }

  /** See IFocusableNode.getFocusableTree. */
  getFocusableTree(): IFocusableTree {
    throw new Error('Cannot be focused');
  }

  /** See IFocusableNode.onNodeFocus. */
  onNodeFocus(): void {}

  /** See IFocusableNode.onNodeBlur. */
  onNodeBlur(): void {}

  /** See IFocusableNode.canBeFocused. */
  canBeFocused(): boolean {
    return false;
  }
}

/**
 * Representation of an axis along which a separator occupies space.
 */
export const enum SeparatorAxis {
  X = 'x',
  Y = 'y',
}
