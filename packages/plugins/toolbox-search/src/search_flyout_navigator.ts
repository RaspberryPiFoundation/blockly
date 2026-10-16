/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {SearchFieldNode} from './search_field_node';
import {SearchFieldNavigationPolicy} from './search_field_navigation_policy';

/**
 * Makes the search field the flyout's entry point, so that moving in from
 * the category reaches the field rather than the first block.
 *
 * In a vertical flyout, the user can navigate from the field to the blocks
 * using the up and down arrows.
 * In a horizontal flyout, the left and right arrow keys are still only used
 * for the field's cursor. The match results can be reached with enter instead.
 */
export class SearchFlyoutNavigator extends Blockly.FlyoutNavigator {
  private readonly policy: SearchFieldNavigationPolicy;

  /**
   * @param flyout The flyout being navigated.
   * @param searchNode The search field's focusable node.
   */
  constructor(
    flyout: Blockly.IFlyout,
    private readonly searchNode: SearchFieldNode,
  ) {
    super(flyout);
    this.policy = new SearchFieldNavigationPolicy(flyout);
    this.addNavigationPolicy(this.policy);
  }

  /** Returns a list of top-level navigable flyout items, plus the search field. */
  protected override getTopLevelItems(): Blockly.IFocusableNode[] {
    const items = super.getTopLevelItems();
    return this.policy.isNavigable(this.searchNode)
      ? [this.searchNode, ...items]
      : items;
  }

  /**
   * Returns whether or not the given node is navigable.
   *
   * @param node A focusable node to check the navigability of.
   * @returns True if the node is navigable, otherwise false.
   */
  protected override isNavigable(node: Blockly.IFocusableNode) {
    // The field is never a flyout item, so we check its own policy.
    if (node === this.searchNode) {
      return this.policy.isNavigable(this.searchNode);
    }
    // The placeholder text label is not navigable.
    if (node instanceof Blockly.FlyoutButton && node.isLabel()) return false;
    return super.isNavigable(node);
  }

  /**
   * Returns whether the search field is where arrowing in from the toolbox
   * should land, for whichever of the two methods below is asking.
   *
   * @param requestLastEntry Whether the caller is asking for the last entry
   *     point (true) or the first (false).
   * @returns Whether that caller should return the search field. False
   *     whenever the field is hidden, since this navigator serves every
   *     category's flyout, not just the search category's.
   */
  private isHorizontalEntryPoint(requestLastEntry: boolean): boolean {
    // A vertical flyout puts the field first in getTopLevelItems(), so the
    // inherited getFirstNode() returns it already, and getLastNode() keeps
    // its ordinary meaning, which is what vertical ArrowUp relies on to reach
    // the last result.
    if (!this.flyout.horizontalLayout) return false;
    if (!this.searchNode.canBeFocused()) return false;

    // getInNode() takes the flyout's last node in an RTL horizontal toolbox
    // and its first node otherwise.
    const entryPointIsLast = !!this.flyout.targetWorkspace?.RTL;
    return requestLastEntry === entryPointIsLast;
  }

  /**
   * Gets the first navigable node on the flyout, or null if none exist.
   *
   * @returns The search field in an LTR horizontal flyout, where it is the
   *     entry point but not part of the arrow-key cycle; otherwise the first
   *     item, which in a vertical flyout is the field itself.
   */
  override getFirstNode(): Blockly.IFocusableNode | null {
    return this.isHorizontalEntryPoint(false)
      ? this.searchNode
      : super.getFirstNode();
  }

  /**
   * Gets the last navigable node on the flyout, or null if none exist.
   *
   * @returns The search field in an RTL horizontal flyout, which is the entry
   *     point getInNode() asks for there; otherwise the last item.
   */
  override getLastNode(): Blockly.IFocusableNode | null {
    return this.isHorizontalEntryPoint(true)
      ? this.searchNode
      : super.getLastNode();
  }
}
