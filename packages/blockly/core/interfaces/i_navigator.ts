/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import type {BlockSvg} from '../block_svg.js';
import type {IFocusableNode} from './i_focusable_node.js';
import type {INavigationPolicy} from './i_navigation_policy.js';

/**
 * Coordinates keyboard navigation between focusable nodes.
 *
 * Implemented by {@link Navigator} and specialized navigators such as
 * {@link WorkspaceControlNavigator}.
 */
export interface INavigator {
  /** Adds a navigation ruleset to this navigator. */
  addNavigationPolicy(policy: INavigationPolicy<any>): void;

  /** Returns the first child of the given node, if any. */
  getFirstChild(current: IFocusableNode): IFocusableNode | null;

  /** Returns the parent of the given node, if any. */
  getParent(current: IFocusableNode): IFocusableNode | null;

  /** Returns the next sibling of the given node, if any. */
  getNextSibling(current: IFocusableNode): IFocusableNode | null;

  /** Returns the previous sibling of the given node, if any. */
  getPreviousSibling(current: IFocusableNode): IFocusableNode | null;

  /** Returns the previous node in navigation order, if any. */
  getPreviousNode(node?: IFocusableNode | null): IFocusableNode | null;

  /** Returns the node reached by navigating out, if any. */
  getOutNode(node?: IFocusableNode | null): IFocusableNode | null;

  /** Returns the next node in navigation order, if any. */
  getNextNode(node?: IFocusableNode | null): IFocusableNode | null;

  /** Returns the node reached by navigating in, if any. */
  getInNode(node?: IFocusableNode | null): IFocusableNode | null;

  /** Sets whether navigation loops when reaching the end. */
  setNavigationLoops(loops: boolean): void;

  /** Returns whether navigation loops when reaching the end. */
  getNavigationLoops(): boolean;

  /** Returns the first navigable node in the focused tree, if any. */
  getFirstNode(): IFocusableNode | null;

  /** Returns the last navigable node in the focused tree, if any. */
  getLastNode(): IFocusableNode | null;

  /**
   * Moves between top-level stacks by the given delta.
   *
   * @returns The stack root to focus, or null if none.
   */
  navigateStacks(current: IFocusableNode, delta: number): IFocusableNode | null;

  /** Returns the source block for a focusable node, if any. */
  getSourceBlockFromNode(node: IFocusableNode | null): BlockSvg | null;
}
