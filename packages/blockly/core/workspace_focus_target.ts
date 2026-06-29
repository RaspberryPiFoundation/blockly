/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IFocusableNode} from './interfaces/i_focusable_node.js';
import type {IFocusableTree} from './interfaces/i_focusable_tree.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * A focusable element representing the workspace as a whole.
 *
 * Focus on the workspace itself (i.e. not on any block, comment, or other
 * content) lands here rather than on the workspace's region element. VoiceOver
 * does not announce a region when focus moves into it from a node already
 * inside that region, so focusing the region directly (e.g. after pressing "W"
 * from a block) would be silent. This is an ordinary focusable node, so moving
 * to it is announced. It carries the stack count and a "workspace" role
 * description; the enclosing region keeps a short, stable label
 * ("Blocks workspace.").
 */
export class WorkspaceFocusTarget implements IFocusableNode {
  /**
   * @param workspace The workspace this focus target represents.
   * @param element The SVG element that receives focus for the workspace.
   */
  constructor(
    private readonly workspace: WorkspaceSvg,
    private readonly element: SVGElement,
  ) {}

  /** See IFocusableNode.getFocusableElement. */
  getFocusableElement(): SVGElement {
    return this.element;
  }

  /** See IFocusableNode.getFocusableTree. */
  getFocusableTree(): IFocusableTree {
    return this.workspace;
  }

  /** See IFocusableNode.onNodeFocus. */
  onNodeFocus(): void {
    this.workspace.handleWorkspaceFocusTargetFocus();
  }

  /** See IFocusableNode.onNodeBlur. */
  onNodeBlur(): void {}

  /** See IFocusableNode.canBeFocused. */
  canBeFocused(): boolean {
    return true;
  }

  /**
   * Returns the workspace this focus target represents.
   *
   * @returns The workspace this focus target represents.
   */
  getWorkspace(): WorkspaceSvg {
    return this.workspace;
  }
}
