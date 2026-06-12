/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import {getFocusManager} from '../../focus_manager.js';
import type {IFocusableNode} from '../../interfaces/i_focusable_node.js';
import {isSelectableToolboxItem} from '../../interfaces/i_selectable_toolbox_item.js';
import type {IToolbox} from '../../interfaces/i_toolbox.js';
import {Position} from '../../utils/toolbox.js';
import type {WorkspaceSvg} from '../../workspace_svg.js';
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
   * Returns the flyout's first item (if any) or next toolbox item when
   * navigating in (right arrow) from a toolbox.
   *
   * @param node The toolbox item to navigate relative to.
   * @param bypassAdjustments True to skip adjusting navigation based on the
   *     toolbox's layout; false (default) to take it into account.
   */
  override getInNode(
    node = getFocusManager().getFocusedNode(),
    bypassAdjustments = false,
  ): IFocusableNode | null {
    const position = getPhysicalToolboxPosition(this.toolbox.getWorkspace());
    if (!bypassAdjustments) {
      switch (position) {
        case Position.TOP:
        case Position.BOTTOM:
          return this.getNextNode(node, true);
        case Position.RIGHT:
          return this.getOutNode(node, true);
      }
    }

    if (
      !isSelectableToolboxItem(node) ||
      (isSelectableToolboxItem(node) && !node.getContents().length)
    ) {
      return null;
    }

    const flyoutNavigator = this.toolbox
      .getFlyout()
      ?.getWorkspace()
      .getNavigator();
    if (!flyoutNavigator) return null;

    return this.toolbox.getWorkspace().RTL &&
      (position === Position.TOP || position === Position.BOTTOM)
      ? flyoutNavigator.getLastNode()
      : flyoutNavigator.getFirstNode();
  }

  /**
   * Returns the flyout's first item (if any) or previous toolbox item when
   * navigating out (left arrow) from a toolbox.
   *
   * @param node The toolbox item to navigate relative to.
   * @param bypassAdjustments True to skip adjusting navigation based on the
   *     toolbox's layout; false (default) to take it into account.
   */
  override getOutNode(
    node?: IFocusableNode | null,
    bypassAdjustments = false,
  ): IFocusableNode | null {
    if (!bypassAdjustments) {
      const position = getPhysicalToolboxPosition(this.toolbox.getWorkspace());
      switch (position) {
        case Position.TOP:
        case Position.BOTTOM:
          return this.getPreviousNode(node, true);
        case Position.RIGHT:
          return this.getInNode(node, true);
      }
    }

    return super.getOutNode(node);
  }

  /**
   * Returns the flyout's first item (if any) or next toolbox item when
   * navigating next (down arrow) from a toolbox.
   *
   * @param node The toolbox item to navigate relative to.
   * @param bypassAdjustments True to skip adjusting navigation based on the
   *     toolbox's layout; false (default) to take it into account.
   */
  override getNextNode(
    node?: IFocusableNode | null,
    bypassAdjustments = false,
  ): IFocusableNode | null {
    if (!bypassAdjustments) {
      const position = getPhysicalToolboxPosition(this.toolbox.getWorkspace());
      switch (position) {
        case Position.TOP:
          return this.getInNode(node, true);
        case Position.BOTTOM:
          return this.getOutNode(node, true);
      }
    }

    return super.getNextNode(node);
  }

  /**
   * Returns the flyout's first item (if any) or previous toolbox item when
   * navigating previous (up arrow) from a toolbox.
   *
   * @param node The toolbox item to navigate relative to.
   * @param bypassAdjustments True to skip adjusting navigation based on the
   *     toolbox's layout; false (default) to take it into account.
   */
  override getPreviousNode(
    node?: IFocusableNode | null,
    bypassAdjustments = false,
  ): IFocusableNode | null {
    if (!bypassAdjustments) {
      const position = getPhysicalToolboxPosition(this.toolbox.getWorkspace());
      switch (position) {
        case Position.TOP:
          return this.getOutNode(node, true);
        case Position.BOTTOM:
          return this.getInNode(node, true);
      }
    }

    return super.getPreviousNode(node);
  }

  /**
   * Returns a list of all toolbox items.
   */
  protected override getTopLevelItems(): IFocusableNode[] {
    return this.toolbox.getToolboxItems();
  }
}

/**
 * Although developers specify the toolbox position as "start" or "end", this
 * gets normalized by the injection options parser based on RTL, such that "end"
 * in RTL means the left. When dealing with arrow keys, we want the actual/
 * physical position on screen, not the logical position. This function converts
 * the stored logical position to the physical position.
 *
 * @internal
 * @param workspace The workspace to use injection options from.
 * @returns The physical location of the toolbox/flyout on screen.
 */
export function getPhysicalToolboxPosition(workspace: WorkspaceSvg): Position {
  const logicalPosition = workspace.options.toolboxPosition;
  if (
    workspace.options.RTL &&
    !(logicalPosition === Position.TOP || logicalPosition === Position.BOTTOM)
  ) {
    return logicalPosition === Position.LEFT ? Position.RIGHT : Position.LEFT;
  }

  return logicalPosition;
}
