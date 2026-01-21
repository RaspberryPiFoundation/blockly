/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {BlockSvg} from '../block_svg.js';
import {Field} from '../field.js';
import type {IFocusableNode} from '../interfaces/i_focusable_node.js';
import type {INavigationPolicy} from '../interfaces/i_navigation_policy.js';
import {navigateBlock} from './block_navigation_policy.js';

/**
 * Set of rules controlling keyboard navigation from a field.
 */
export class FieldNavigationPolicy implements INavigationPolicy<Field<any>> {
  /**
   * Returns null since fields do not have children.
   *
   * @param _current The field to navigate from.
   * @returns Null.
   */
  getFirstChild(_current: Field<any>): IFocusableNode | null {
    return null;
  }

  /**
   * Returns the parent block of the given field.
   *
   * @param current The field to navigate from.
   * @returns The given field's parent block.
   */
  getParent(current: Field<any>): IFocusableNode | null {
    return current.getSourceBlock() as BlockSvg;
  }

  /**
   * Returns the next field or input following the given field.
   *
   * @param current The field to navigate from.
   * @returns The next field or input in the given field's block.
   */
  getNextSibling(current: Field<any>): IFocusableNode | null {
    return navigateBlock(current, 1);
  }

  /**
   * Returns the field or input preceding the given field.
   *
   * @param current The field to navigate from.
   * @returns The preceding field or input in the given field's block.
   */
  getPreviousSibling(current: Field<any>): IFocusableNode | null {
    return navigateBlock(current, -1);
  }

  /**
   * Returns whether or not the given field can be navigated to.
   *
   * @param current The instance to check for navigability.
   * @returns True if the given field can be focused and navigated to.
   */
  isNavigable(current: Field<any>): boolean {
    return (
      current.canBeFocused() &&
      current.isVisible() &&
      (current.isClickable() || current.isCurrentlyEditable()) &&
      !(
        current.getSourceBlock()?.isSimpleReporter() &&
        current.isFullBlockField()
      ) &&
      current.getParentInput().isVisible()
    );
  }

  /**
   * Returns whether the given object can be navigated from by this policy.
   *
   * @param current The object to check if this policy applies to.
   * @returns True if the object is a Field.
   */
  isApplicable(current: any): current is Field {
    return current instanceof Field;
  }
}
