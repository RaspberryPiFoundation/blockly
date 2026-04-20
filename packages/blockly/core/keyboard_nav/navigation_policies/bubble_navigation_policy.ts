/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {BlockSvg} from '../../block_svg.js';
import {Bubble} from '../../bubbles/bubble.js';
import type {Icon} from '../../icons/icon.js';
import type {IFocusableNode} from '../../interfaces/i_focusable_node.js';
import type {INavigationPolicy} from '../../interfaces/i_navigation_policy.js';
import {navigateBlock} from './block_navigation_policy.js';

/**
 * Set of rules controlling keyboard navigation from a Bubble.
 */
export class BubbleNavigationPolicy implements INavigationPolicy<Bubble> {
  /**
   * Returns the first child of the given bubble.
   *
   * @param _current The bubble to return the first child of.
   * @returns Null.
   */
  getFirstChild(_current: Bubble): IFocusableNode | null {
    return null;
  }

  /**
   * Returns the parent of the given bubble.
   *
   * @param current The bubble to return the parent of.
   * @returns The parent block of the given bubble.
   */
  getParent(current: Bubble): IFocusableNode | null {
    return current.getOwner() ?? null;
  }

  /**
   * Returns the next peer node of the given bubble.
   *
   * @param current The bubble to find the following element of.
   * @returns The next navigable item on the bubble's icon's parent block.
   */
  getNextSibling(current: Bubble): IFocusableNode | null {
    return navigateBlock(
      (current.getOwner() as Icon | undefined)?.getSourceBlock() as BlockSvg,
      current,
      1,
    );
  }

  /**
   * Returns the previous peer node of the given bubble.
   *
   * @param current The bubble to find the preceding element of.
   * @returns The previous navigable item on the bubble's icon's parent block.
   */
  getPreviousSibling(current: Bubble): IFocusableNode | null {
    return navigateBlock(
      (current.getOwner() as Icon | undefined)?.getSourceBlock() as BlockSvg,
      current,
      -1,
    );
  }

  /**
   * Returns the row ID of the given bubble.
   *
   * @param current The bubble to retrieve the row ID of.
   * @returns The row ID of the given bubble.
   */
  getRowId(current: Bubble) {
    return (
      (
        (current.getOwner() as Icon | undefined)?.getSourceBlock() as
          | BlockSvg
          | undefined
      )?.getRowId() ?? ''
    );
  }

  /**
   * Returns whether or not the given bubble can be navigated to.
   *
   * @param current The instance to check for navigability.
   * @returns True if the given bubble can be focused.
   */
  isNavigable(current: Bubble): boolean {
    return current.canBeFocused();
  }

  /**
   * Returns whether the given object can be navigated from by this policy.
   *
   * @param current The object to check if this policy applies to.
   * @returns True if the object is an Bubble.
   */
  isApplicable(current: any): current is Bubble {
    return current instanceof Bubble;
  }
}
