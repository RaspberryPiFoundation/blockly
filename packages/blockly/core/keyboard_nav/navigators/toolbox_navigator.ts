/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import {getFocusManager} from '../../focus_manager.js';
import type {IFocusableNode} from '../../interfaces/i_focusable_node.js';
import {isSelectableToolboxItem} from '../../interfaces/i_selectable_toolbox_item.js';
import type {IToolbox} from '../../interfaces/i_toolbox.js';
import {ToolboxItemNavigationPolicy} from '../navigation_policies/toolbox_item_navigation_policy.js';
import {Navigator} from './navigator.js';

/**
 * Navigator that handles keyboard navigation within a toolbox.
 */
export class ToolboxNavigator extends Navigator {
  constructor(protected toolbox: IToolbox) {
    super();
    this.rules = [new ToolboxItemNavigationPolicy()];
  }

  /**
   * Returns the flyout's first item when navigating to the right in a toolbox
   * from a toolbox item that has a flyout.
   */
  override getInNode(
    current = getFocusManager().getFocusedNode(),
  ): IFocusableNode | null {
    if (isSelectableToolboxItem(current) && !current.getContents().length) {
      return null;
    }

    return (
      this.toolbox.getFlyout()?.getWorkspace().getRestoredFocusableNode(null) ??
      null
    );
  }

  /**
   * Returns a list of all toolbox items.
   */
  protected override getTopLevelItems(): IFocusableNode[] {
    return this.toolbox.getToolboxItems();
  }
}
