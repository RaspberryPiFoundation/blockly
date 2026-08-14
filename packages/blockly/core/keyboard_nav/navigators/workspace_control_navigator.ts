/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import type {BlockSvg} from '../../block_svg.js';
import type {IFocusableNode} from '../../interfaces/i_focusable_node.js';
import type {INavigationPolicy} from '../../interfaces/i_navigation_policy.js';
import type {INavigator} from '../../interfaces/i_navigator.js';

/**
 * No-op navigator for single-node workspace controls (trashcan, zoom).
 */
export class WorkspaceControlNavigator implements INavigator {
  addNavigationPolicy(_policy: INavigationPolicy<any>) {}

  getFirstChild() {
    return null;
  }

  getParent() {
    return null;
  }

  getNextSibling() {
    return null;
  }

  getPreviousSibling() {
    return null;
  }

  getPreviousNode() {
    return null;
  }

  getOutNode() {
    return null;
  }

  getNextNode() {
    return null;
  }

  getInNode() {
    return null;
  }

  setNavigationLoops(_loops: boolean) {}

  getNavigationLoops() {
    return false;
  }

  getFirstNode() {
    return null;
  }

  getLastNode() {
    return null;
  }

  getNavigableItems(_root?: IFocusableNode | null): IFocusableNode[] {
    return [];
  }

  navigateStacks() {
    return null;
  }

  getSourceBlockFromNode(_node: IFocusableNode | null): BlockSvg | null {
    return null;
  }
}
