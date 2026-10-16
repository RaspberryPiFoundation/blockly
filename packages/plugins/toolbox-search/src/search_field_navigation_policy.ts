/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Blockly from 'blockly/core';
import {SearchFieldNode} from './search_field_node';

/**
 * Set of rules controlling keyboard navigation from the search field.
 *
 * In a vertical flyout the field is part of the arrow-key cycle, which also
 * makes it the flyout's entry point. In a horizontal flyout it is kept out of
 * that cycle so that left and right stay with the text cursor. It remains the
 * entry point via SearchFlyoutNavigator.isHorizontalEntryPoint().
 */
export class SearchFieldNavigationPolicy implements Blockly.INavigationPolicy<SearchFieldNode> {
  /**
   * @param flyout The flyout the field belongs to.
   */
  constructor(private readonly flyout: Blockly.IFlyout) {}

  /**
   * Returns the first child of the given search field.
   *
   * @returns Null.
   */
  getFirstChild(): Blockly.IFocusableNode | null {
    return null;
  }

  /**
   * Returns the parent of the given search field.
   *
   * @returns Null; SearchFlyoutNavigator places the field itself.
   */
  getParent(): Blockly.IFocusableNode | null {
    return null;
  }

  /**
   * Returns the next sibling of the given search field.
   *
   * @returns Null; its neighbours come from getTopLevelItems().
   */
  getNextSibling(): Blockly.IFocusableNode | null {
    return null;
  }

  /**
   * Returns the previous sibling of the given search field.
   *
   * @returns Null; its neighbours come from getTopLevelItems().
   */
  getPreviousSibling(): Blockly.IFocusableNode | null {
    return null;
  }

  /**
   * Returns the row ID of the given search field.
   *
   * @param current The search field to retrieve the row ID of.
   * @returns The row ID of the given search field.
   */
  getRowId(current: SearchFieldNode): string {
    return current.id;
  }

  /**
   * Returns whether or not the given search field can be navigated to.
   *
   * @param current The instance to check for navigability.
   * @returns True in a vertical flyout, where the field is part of the
   *     arrow-key cycle; false in a horizontal one, where it is reached
   *     explicitly instead.
   */
  isNavigable(current: SearchFieldNode): boolean {
    return current.canBeFocused() && !this.flyout.horizontalLayout;
  }

  /**
   * Returns whether the given object can be navigated from by this policy.
   *
   * @param current The object to check if this policy applies to.
   * @returns True if the object is a SearchFieldNode.
   */
  isApplicable(current: Blockly.IFocusableNode): current is SearchFieldNode {
    return current instanceof SearchFieldNode;
  }
}
