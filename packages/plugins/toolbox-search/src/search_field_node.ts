/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Blockly from 'blockly/core';

/**
 * Makes the search field a focusable node of the flyout's workspace.
 */
export class SearchFieldNode
  implements Blockly.IFocusableNode, Blockly.IComponent
{
  /**
   * @param id The DOM ID of the input, which the flyout workspace matches
   *     against to resolve focus back to this node. IComponent requires
   *     this exact name.
   * @param input The search input.
   * @param flyout The flyout the field sits above.
   */
  constructor(
    readonly id: string,
    private readonly input: HTMLInputElement,
    private readonly flyout: Blockly.IFlyout,
  ) {}

  /** @returns The search input. */
  getFocusableElement(): HTMLElement | SVGElement {
    return this.input;
  }

  /** @returns The flyout's workspace. */
  getFocusableTree(): Blockly.IFocusableTree {
    return this.flyout.getWorkspace();
  }

  /**
   * @returns Whether the field is on screen. A hidden field can't be focused,
   *     and this is also what keeps it out of other categories' flyouts.
   */
  canBeFocused(): boolean {
    return this.input.parentElement?.style.display !== 'none';
  }

  /** See IFocusableNode.onNodeFocus. */
  onNodeFocus(): void {}

  /** See IFocusableNode.onNodeBlur. */
  onNodeBlur(): void {}
}
