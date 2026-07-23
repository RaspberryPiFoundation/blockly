/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ContinuousToolbox} from './ContinuousToolbox';
import {ContinuousCategory} from './ContinuousCategory';

/**
 * A Navigator that handles keyboard navigation within a continuous toolbox.
 */
export class ContinuousToolboxNavigator extends Blockly.ToolboxNavigator {
  constructor(protected toolbox: ContinuousToolbox) {
    super(toolbox);
  }

  /**
   * Returns the next node when navigating "in", in this case the first flyout
   * item in the toolbox's currently selected category.
   *
   * @param node The node to navigate relative to.
   * @returns The node "in" relative to the given node.
   */
  override getInNode(
    node = Blockly.getFocusManager().getFocusedNode(),
  ): Blockly.IFocusableNode | null {
    if (!(node instanceof ContinuousCategory)) return null;
    return this.toolbox.getFlyout().headerForCategory(node) ?? null;
  }
}
