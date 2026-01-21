/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {FlyoutButton} from '../flyout_button.js';
import type {IFocusableNode} from '../interfaces/i_focusable_node.js';
import type {INavigationPolicy} from '../interfaces/i_navigation_policy.js';

/**
 * Set of rules controlling keyboard navigation from a flyout button.
 */
export class FlyoutButtonNavigationPolicy
  implements INavigationPolicy<FlyoutButton>
{
  /**
   * Returns null since flyout buttons have no children.
   *
   * @param _current The FlyoutButton instance to navigate from.
   * @returns Null.
   */
  getFirstChild(_current: FlyoutButton): IFocusableNode | null {
    return null;
  }

  /**
   * Returns the parent workspace of the given flyout button.
   *
   * @param current The FlyoutButton instance to navigate from.
   * @returns The given flyout button's parent workspace.
   */
  getParent(current: FlyoutButton): IFocusableNode | null {
    return current.getWorkspace();
  }

  /**
   * Returns null since inter-item navigation is done by FlyoutNavigationPolicy.
   *
   * @param _current The FlyoutButton instance to navigate from.
   * @returns Null.
   */
  getNextSibling(_current: FlyoutButton): IFocusableNode | null {
    return null;
  }

  /**
   * Returns null since inter-item navigation is done by FlyoutNavigationPolicy.
   *
   * @param _current The FlyoutButton instance to navigate from.
   * @returns Null.
   */
  getPreviousSibling(_current: FlyoutButton): IFocusableNode | null {
    return null;
  }

  /**
   * Returns whether or not the given flyout button can be navigated to.
   *
   * @param current The instance to check for navigability.
   * @returns True if the given flyout button can be focused.
   */
  isNavigable(current: FlyoutButton): boolean {
    return current.canBeFocused();
  }

  /**
   * Returns whether the given object can be navigated from by this policy.
   *
   * @param current The object to check if this policy applies to.
   * @returns True if the object is a FlyoutButton.
   */
  isApplicable(current: any): current is FlyoutButton {
    return current instanceof FlyoutButton;
  }
}
