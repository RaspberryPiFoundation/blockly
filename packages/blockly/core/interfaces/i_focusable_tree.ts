/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IFocusableNode} from './i_focusable_node.js';

/**
 * Represents a tree of focusable elements with its own active/passive focus
 * context.
 *
 * Note that focus is handled by FocusManager, and tree implementations can have
 * at most one IFocusableNode focused at one time. If the tree itself has focus,
 * then the tree's focused node is considered 'active' ('passive' if another
 * tree has focus).
 *
 * Focus is shared between one or more trees, where each tree can have exactly
 * one active or passive node (and only one active node can exist on the whole
 * page at any given time). The idea of passive focus is to provide context to
 * users on where their focus will be restored upon navigating back to a
 * previously focused tree.
 *
 * Note that if the tree's current focused node (passive or active) is needed,
 * FocusableTreeTraverser.findFocusedNode can be used.
 *
 * Note that if specific nodes are needed to be retrieved for this tree, either
 * use lookUpFocusableNode or FocusableTreeTraverser.findFocusableNodeFor.
 */
export interface IFocusableTree {
  /**
   * Returns the top-level focusable node of the tree.
   *
   * It's expected that the returned node will be focused in cases where
   * FocusManager wants to focus a tree in a situation where it does not
   * currently have a focused node.
   */
  getRootFocusableNode(): IFocusableNode;

  /**
   * Returns the IFocusableNode of this tree that should receive active focus
   * when the tree itself has focus returned to it.
   *
   * There are some very important notes to consider about a tree's focus
   * lifecycle when implementing a version of this method that doesn't return
   * null:
   * 1. A null previousNode does not guarantee first-time focus state as nodes
   *    can be deleted.
   * 2. This method is only used when the tree itself is focused, either through
   *    tab navigation or via FocusManager.focusTree(). In many cases, the
   *    previously focused node will be directly focused instead which will
   *    bypass this method.
   * 3. The default behavior (i.e. returning null here) involves either
   *    restoring the previous node (previousNode) or focusing the tree's root.
   * 4. The provided node may sometimes no longer be valid, such as in the case
   *    an attempt is made to focus a node that has been recently removed from
   *    its parent tree. Implementations can check for the validity of the node
   *    in order to specialize the node to which focus should fall back.
   *
   * This method is largely intended to provide tree implementations with the
   * means of specifying a better default node than their root.
   *
   * @param previousNode The node that previously held passive focus for this
   *     tree, or null if the tree hasn't yet been focused.
   * @returns The IFocusableNode that should now receive focus, or null if
   *     default behavior should be used, instead.
   */
  getRestoredFocusableNode(
    previousNode: IFocusableNode | null,
  ): IFocusableNode | null;

  /**
   * Returns all directly nested trees under this tree.
   *
   * Note that the returned list of trees doesn't need to be stable, however all
   * returned trees *do* need to be registered with FocusManager. Additionally,
   * this must return actual nested trees as omitting a nested tree will affect
   * how focus changes map to a specific node and its tree, potentially leading
   * to user confusion.
   */
  getNestedTrees(): Array<IFocusableTree>;

  /**
   * Returns the IFocusableNode corresponding to the specified element ID, or
   * null if there's no exact node within this tree with that ID or if the ID
   * corresponds to the root of the tree.
   *
   * This will never match against nested trees.
   *
   * @param id The ID of the node's focusable HTMLElement or SVGElement.
   */
  lookUpFocusableNode(id: string): IFocusableNode | null;

  /**
   * Called when a node of this tree has received active focus.
   *
   * Note that a null previousTree does not necessarily indicate that this is
   * the first time Blockly is receiving focus. In fact, few assumptions can be
   * made about previous focus state as a previous null tree simply indicates
   * that Blockly did not hold active focus prior to this tree becoming focused
   * (which can happen due to focus exiting the Blockly injection div, or for
   * other cases like ephemeral focus).
   *
   * See IFocusableNode.onNodeFocus() as implementations have the same
   * restrictions as with that method.
   *
   * @param node The node receiving active focus.
   * @param previousTree The previous tree that held active focus, or null if
   *     none.
   */
  onTreeFocus(node: IFocusableNode, previousTree: IFocusableTree | null): void;

  /**
   * Called when the previously actively focused node of this tree is now
   * passively focused and there is no other active node of this tree taking its
   * place.
   *
   * This has the same implementation restrictions and considerations as
   * onTreeFocus().
   *
   * @param nextTree The next tree receiving active focus, or null if none (such
   *     as in the case that Blockly is entirely losing DOM focus).
   */
  onTreeBlur(nextTree: IFocusableTree | null): void;
}

/**
 * Determines whether the provided object fulfills the contract of
 * IFocusableTree.
 *
 * @param obj The object to test.
 * @returns Whether the provided object can be used as an IFocusableTree.
 */
export function isFocusableTree(obj: any): obj is IFocusableTree {
  return (
    obj &&
    typeof obj.getRootFocusableNode === 'function' &&
    typeof obj.getRestoredFocusableNode === 'function' &&
    typeof obj.getNestedTrees === 'function' &&
    typeof obj.lookUpFocusableNode === 'function' &&
    typeof obj.onTreeFocus === 'function' &&
    typeof obj.onTreeBlur === 'function'
  );
}
