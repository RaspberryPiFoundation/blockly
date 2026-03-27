/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {IFocusableNode} from '../../blockly.js';
import type {IFlyout} from '../../interfaces/i_flyout.js';
import {FlyoutButtonNavigationPolicy} from '../navigation_policies/flyout_button_navigation_policy.js';
import {FlyoutSeparatorNavigationPolicy} from '../navigation_policies/flyout_separator_navigation_policy.js';
import {Navigator} from './navigator.js';

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
   * Returns the toolbox when navigating to the left in a flyout.
   */
  override getOutNode(): IFocusableNode | null {
    const toolbox = this.flyout.targetWorkspace?.getToolbox();
    if (toolbox) return toolbox.getSelectedItem();

    return null;
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
