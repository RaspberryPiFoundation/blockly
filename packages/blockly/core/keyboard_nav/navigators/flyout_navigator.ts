/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IFlyout} from '../../interfaces/i_flyout.js';
import type {IFocusableNode} from '../../interfaces/i_focusable_node.js';
import {Position} from '../../utils/toolbox.js';
import {FlyoutButtonNavigationPolicy} from '../navigation_policies/flyout_button_navigation_policy.js';
import {FlyoutSeparatorNavigationPolicy} from '../navigation_policies/flyout_separator_navigation_policy.js';
import {Navigator} from './navigator.js';
import {getPhysicalToolboxPosition} from './toolbox_navigator.js';

/**
 * Navigator that handles keyboard navigation within a flyout.
 */
export class FlyoutNavigator extends Navigator {
  constructor(protected flyout: IFlyout) {
    super();
    this.rules.push(
      new FlyoutButtonNavigationPolicy(),
      new FlyoutSeparatorNavigationPolicy(),
    );
  }

  /**
   * Returns the parent toolbox item or previous flyout item when navigating out
   * (left arrow) from a flyout.
   *
   * @param node The flyout item to navigate relative to.
   * @param bypassAdjustments True to skip adjusting navigation based on the
   *     flyout's layout; false (default) to take it into account.
   */
  override getOutNode(
    node?: IFocusableNode | null,
    bypassAdjustments = false,
  ): IFocusableNode | null {
    if (!bypassAdjustments && this.flyout.targetWorkspace) {
      const position = getPhysicalToolboxPosition(this.flyout.targetWorkspace);
      switch (position) {
        case Position.TOP:
        case Position.BOTTOM:
          return this.flyout.RTL
            ? this.getNextNode(node, true)
            : this.getPreviousNode(node, true);
        case Position.RIGHT:
          return null;
      }
    }

    const toolbox = this.flyout.targetWorkspace?.getToolbox();
    if (toolbox) return toolbox.getSelectedItem();

    return null;
  }

  /**
   * Returns the parent toolbox item or next flyout item when navigating in
   * (right arrow) from a flyout.
   *
   * @param node The flyout item to navigate relative to.
   * @param bypassAdjustments True to skip adjusting navigation based on the
   *     flyout's layout; false (default) to take it into account.
   */
  override getInNode(
    node?: IFocusableNode | null,
    bypassAdjustments = false,
  ): IFocusableNode | null {
    if (!bypassAdjustments && this.flyout.targetWorkspace) {
      const position = getPhysicalToolboxPosition(this.flyout.targetWorkspace);
      switch (position) {
        case Position.TOP:
        case Position.BOTTOM:
          return this.flyout.RTL
            ? this.getPreviousNode(node, true)
            : this.getNextNode(node, true);
        case Position.RIGHT:
          return this.getOutNode(node, true);
      }
    }

    return super.getInNode(node);
  }

  /**
   * Returns the parent toolbox item or next flyout item when navigating next
   * (down arrow) from a flyout.
   *
   * @param node The flyout item to navigate relative to.
   * @param bypassAdjustments True to skip adjusting navigation based on the
   *     flyout's layout; false (default) to take it into account.
   */
  override getNextNode(
    node?: IFocusableNode | null,
    bypassAdjustments = false,
  ): IFocusableNode | null {
    if (!bypassAdjustments && this.flyout.targetWorkspace) {
      const position = getPhysicalToolboxPosition(this.flyout.targetWorkspace);
      switch (position) {
        case Position.TOP:
          return null;
        case Position.BOTTOM:
          return this.getOutNode(node, true);
      }
    }

    return super.getNextNode(node);
  }

  /**
   * Returns the parent toolbox item or previous flyout item when navigating
   * previous (up arrow) from a flyout.
   *
   * @param node The flyout item to navigate relative to.
   * @param bypassAdjustments True to skip adjusting navigation based on the
   *     flyout's layout; false (default) to take it into account.
   */
  override getPreviousNode(
    node?: IFocusableNode | null,
    bypassAdjustments = false,
  ): IFocusableNode | null {
    if (!bypassAdjustments && this.flyout.targetWorkspace) {
      const position = getPhysicalToolboxPosition(this.flyout.targetWorkspace);
      switch (position) {
        case Position.TOP:
          return this.getOutNode(node, true);
        case Position.BOTTOM:
          return null;
      }
    }

    return super.getPreviousNode(node);
  }

  /**
   * Returns a list of top-level navigable flyout items.
   */
  protected override getTopLevelItems(): IFocusableNode[] {
    return this.flyout
      .getContents()
      .map((item) => item.getElement())
      .filter((element) => this.isNavigable(element));
  }

  /**
   * Returns whether or not the given node is navigable.
   *
   * @param node A focusable node to check the navigability of.
   * @returns True if the node is navigable, otherwise false.
   */
  protected override isNavigable(node: IFocusableNode) {
    return (
      super.isNavigable(node) &&
      this.flyout
        .getContents()
        .map((item): IFocusableNode => item.getElement())
        .includes(node)
    );
  }
}
