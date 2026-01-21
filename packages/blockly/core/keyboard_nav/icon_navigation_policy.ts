/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {BlockSvg} from '../block_svg.js';
import {getFocusManager} from '../focus_manager.js';
import {CommentIcon} from '../icons/comment_icon.js';
import {Icon} from '../icons/icon.js';
import {MutatorIcon} from '../icons/mutator_icon.js';
import type {IFocusableNode} from '../interfaces/i_focusable_node.js';
import type {INavigationPolicy} from '../interfaces/i_navigation_policy.js';
import {navigateBlock} from './block_navigation_policy.js';

/**
 * Set of rules controlling keyboard navigation from an icon.
 */
export class IconNavigationPolicy implements INavigationPolicy<Icon> {
  /**
   * Returns the first child of the given icon.
   *
   * @param current The icon to return the first child of.
   * @returns Null.
   */
  getFirstChild(current: Icon): IFocusableNode | null {
    if (
      current instanceof MutatorIcon &&
      current.bubbleIsVisible() &&
      getFocusManager().getFocusedNode() === current
    ) {
      return current.getBubble()?.getWorkspace() ?? null;
    } else if (
      current instanceof CommentIcon &&
      current.bubbleIsVisible() &&
      getFocusManager().getFocusedNode() === current
    ) {
      return current.getBubble()?.getEditor() ?? null;
    }

    return null;
  }

  /**
   * Returns the parent of the given icon.
   *
   * @param current The icon to return the parent of.
   * @returns The source block of the given icon.
   */
  getParent(current: Icon): IFocusableNode | null {
    return current.getSourceBlock() as BlockSvg;
  }

  /**
   * Returns the next peer node of the given icon.
   *
   * @param current The icon to find the following element of.
   * @returns The next icon, field or input following this icon, if any.
   */
  getNextSibling(current: Icon): IFocusableNode | null {
    return navigateBlock(current, 1);
  }

  /**
   * Returns the previous peer node of the given icon.
   *
   * @param current The icon to find the preceding element of.
   * @returns The icon's previous icon, if any.
   */
  getPreviousSibling(current: Icon): IFocusableNode | null {
    return navigateBlock(current, -1);
  }

  /**
   * Returns whether or not the given icon can be navigated to.
   *
   * @param current The instance to check for navigability.
   * @returns True if the given icon can be focused.
   */
  isNavigable(current: Icon): boolean {
    return current.canBeFocused();
  }

  /**
   * Returns whether the given object can be navigated from by this policy.
   *
   * @param current The object to check if this policy applies to.
   * @returns True if the object is an Icon.
   */
  isApplicable(current: any): current is Icon {
    return current instanceof Icon;
  }
}
