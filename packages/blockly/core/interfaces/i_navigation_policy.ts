/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IFocusableNode} from './i_focusable_node.js';

/**
 * A set of rules that specify where keyboard navigation should proceed.
 */
export interface INavigationPolicy<T> {
  /**
   * Returns the first child element of the given element, if any.
   *
   * @param current The element which the user is navigating into.
   * @returns The current element's first child, or null if it has none.
   */
  getFirstChild(current: T): IFocusableNode | null;

  /**
   * Returns the parent element of the given element, if any.
   *
   * @param current The element which the user is navigating out of.
   * @returns The parent element of the current element, or null if it has none.
   */
  getParent(current: T): IFocusableNode | null;

  /**
   * Returns the peer element following the given element, if any.
   *
   * @param current The element which the user is navigating past.
   * @returns The next peer element of the current element, or null if there is
   *     none.
   */
  getNextSibling(current: T): IFocusableNode | null;

  /**
   * Returns the peer element preceding the given element, if any.
   *
   * @param current The element which the user is navigating past.
   * @returns The previous peer element of the current element, or null if
   *     there is none.
   */
  getPreviousSibling(current: T): IFocusableNode | null;

  /**
   * Returns whether or not the given instance should be reachable via keyboard
   * navigation.
   *
   * Implementors should generally return true, unless there are circumstances
   * under which this item should be skipped while using keyboard navigation.
   * Common examples might include being disabled, invalid, readonly, or purely
   * a visual decoration. For example, while Fields are navigable, non-editable
   * fields return false, since they cannot be interacted with when focused.
   *
   * @returns True if this element should be included in keyboard navigation.
   */
  isNavigable(current: T): boolean;

  /**
   * Returns whether or not this navigation policy corresponds to the type of
   * the given object.
   *
   * @param current An instance to check whether this policy applies to.
   * @returns True if the given object is of a type handled by this policy.
   */
  isApplicable(current: any): current is T;
}
