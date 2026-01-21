/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {TextInputBubble} from '../bubbles/textinput_bubble.js';
import type {IFocusableNode} from '../interfaces/i_focusable_node.js';
import type {INavigationPolicy} from '../interfaces/i_navigation_policy.js';

/**
 * Set of rules controlling keyboard navigation from an TextInputBubble.
 */
export class BlockCommentNavigationPolicy
  implements INavigationPolicy<TextInputBubble>
{
  /**
   * Returns the first child of the given block comment.
   *
   * @param current The block comment to return the first child of.
   * @returns The text editor of the given block comment bubble.
   */
  getFirstChild(current: TextInputBubble): IFocusableNode | null {
    return current.getEditor();
  }

  /**
   * Returns the parent of the given block comment.
   *
   * @param current The block comment to return the parent of.
   * @returns The parent block of the given block comment.
   */
  getParent(current: TextInputBubble): IFocusableNode | null {
    return current.getOwner() ?? null;
  }

  /**
   * Returns the next peer node of the given block comment.
   *
   * @param _current The block comment to find the following element of.
   * @returns Null.
   */
  getNextSibling(_current: TextInputBubble): IFocusableNode | null {
    return null;
  }

  /**
   * Returns the previous peer node of the given block comment.
   *
   * @param _current The block comment to find the preceding element of.
   * @returns Null.
   */
  getPreviousSibling(_current: TextInputBubble): IFocusableNode | null {
    return null;
  }

  /**
   * Returns whether or not the given block comment can be navigated to.
   *
   * @param current The instance to check for navigability.
   * @returns True if the given block comment can be focused.
   */
  isNavigable(current: TextInputBubble): boolean {
    return current.canBeFocused();
  }

  /**
   * Returns whether the given object can be navigated from by this policy.
   *
   * @param current The object to check if this policy applies to.
   * @returns True if the object is an TextInputBubble.
   */
  isApplicable(current: any): current is TextInputBubble {
    return current instanceof TextInputBubble;
  }
}
