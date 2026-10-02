/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {SearchFieldNode} from './search_field_node';

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
  /**
   * @param flyout The flyout being navigated.
   * @param searchNode The search field's focusable node.
   */
  constructor(
    flyout: Blockly.IFlyout,
    private readonly searchNode: SearchFieldNode,
  ) {
    super(flyout);
  }

  /**
   * @returns Whether the search field takes part in arrow-key navigation.
   */
  private cyclesThroughSearchField(): boolean {
    return !this.flyout.horizontalLayout && this.searchNode.canBeFocused();
  }

  /** @returns The flyout's items, not counting the search field. */
  private getFlyoutItems(): Blockly.IFocusableNode[] {
    return super.getTopLevelItems();
  }

  /** @returns The first result, or null if the search matched nothing. */
  getFirstItem(): Blockly.IFocusableNode | null {
    return this.getFlyoutItems()[0] ?? null;
  }

  /** @returns The last result, or null if the search matched nothing. */
  getLastItem(): Blockly.IFocusableNode | null {
    const items = this.getFlyoutItems();
    return items[items.length - 1] ?? null;
  }

  /** @returns The items to cycle through with the arrow keys. */
  protected override getTopLevelItems(): Blockly.IFocusableNode[] {
    const items = this.getFlyoutItems();
    return this.cyclesThroughSearchField()
      ? [this.searchNode, ...items]
      : items;
  }

  /**
   * @param node The node to check.
   * @returns Whether the node can be navigated to. The base implementation
   *     only admits the flyout's own contents.
   */
  protected override isNavigable(node: Blockly.IFocusableNode) {
    if (node === this.searchNode) return this.cyclesThroughSearchField();
    return super.isNavigable(node);
  }

  /**
   * @returns The search field, so that arrowing in from the toolbox lands
   *     there whichever way the flyout is laid out.
   */
  override getFirstNode(): Blockly.IFocusableNode | null {
    if (this.searchNode.canBeFocused()) return this.searchNode;
    return super.getFirstNode();
  }
}
