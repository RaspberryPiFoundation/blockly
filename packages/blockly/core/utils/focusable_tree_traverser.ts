/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IFocusableNode} from '../interfaces/i_focusable_node.js';
import type {IFocusableTree} from '../interfaces/i_focusable_tree.js';
import * as dom from '../utils/dom.js';

/**
 * A helper utility for IFocusableTree implementations to aid with common
 * tree traversals.
 */
export class FocusableTreeTraverser {
  private static readonly ACTIVE_CLASS_NAME = 'blocklyActiveFocus';
  private static readonly PASSIVE_CSS_CLASS_NAME = 'blocklyPassiveFocus';
  private static readonly ACTIVE_FOCUS_NODE_CSS_SELECTOR = `.${FocusableTreeTraverser.ACTIVE_CLASS_NAME}`;
  private static readonly PASSIVE_FOCUS_NODE_CSS_SELECTOR = `.${FocusableTreeTraverser.PASSIVE_CSS_CLASS_NAME}`;

  /**
   * Returns the current IFocusableNode that is styled (and thus represented) as
   * having either passive or active focus, only considering HTML and SVG
   * elements.
   *
   * This can match against the tree's root.
   *
   * Note that this will never return a node from a nested sub-tree as that tree
   * should specifically be used to retrieve its focused node.
   *
   * @param tree The IFocusableTree in which to search for a focused node.
   * @returns The IFocusableNode currently with focus, or null if none.
   */
  static findFocusedNode(tree: IFocusableTree): IFocusableNode | null {
    const rootNode = tree.getRootFocusableNode();
    if (!rootNode.canBeFocused()) return null;
    const root = rootNode.getFocusableElement();
    if (
      dom.hasClass(root, FocusableTreeTraverser.ACTIVE_CLASS_NAME) ||
      dom.hasClass(root, FocusableTreeTraverser.PASSIVE_CSS_CLASS_NAME)
    ) {
      // The root has focus.
      return rootNode;
    }

    const activeEl = root.querySelector(this.ACTIVE_FOCUS_NODE_CSS_SELECTOR);
    if (activeEl instanceof HTMLElement || activeEl instanceof SVGElement) {
      const active = FocusableTreeTraverser.findFocusableNodeFor(
        activeEl,
        tree,
      );
      if (active) return active;
    }

    // At most there should be one passive indicator per tree (not considering
    // subtrees).
    const passiveEl = root.querySelector(this.PASSIVE_FOCUS_NODE_CSS_SELECTOR);
    if (passiveEl instanceof HTMLElement || passiveEl instanceof SVGElement) {
      const passive = FocusableTreeTraverser.findFocusableNodeFor(
        passiveEl,
        tree,
      );
      if (passive) return passive;
    }

    return null;
  }

  /**
   * Returns the IFocusableNode corresponding to the specified HTML or SVG
   * element iff it's the root element or a descendent of the root element of
   * the specified IFocusableTree.
   *
   * If the element exists within the specified tree's DOM structure but does
   * not directly correspond to a node, the nearest parent node (or the tree's
   * root) will be returned to represent the provided element.
   *
   * If the tree contains another nested IFocusableTree, the nested tree may be
   * traversed but its nodes will never be returned here per the contract of
   * IFocusableTree.lookUpFocusableNode.
   *
   * The provided element must have a non-null, non-empty ID that conforms to
   * the contract mentioned in IFocusableNode.
   *
   * @param element The HTML or SVG element being sought.
   * @param tree The tree under which the provided element may be a descendant.
   * @returns The matching IFocusableNode, or null if there is no match.
   */
  static findFocusableNodeFor(
    element: HTMLElement | SVGElement,
    tree: IFocusableTree,
  ): IFocusableNode | null {
    // Note that the null check is due to Element.setAttribute() converting null
    // to a string.
    if (!element.id || element.id === 'null') return null;

    // First, match against subtrees.
    const subTreeMatches = tree.getNestedTrees().map((tree) => {
      return FocusableTreeTraverser.findFocusableNodeFor(element, tree);
    });
    if (subTreeMatches.findIndex((match) => !!match) !== -1) {
      // At least one subtree has a match for the element so it cannot be part
      // of the outer tree.
      return null;
    }

    // Second, check against the tree's root.
    const rootNode = tree.getRootFocusableNode();
    if (rootNode.canBeFocused() && element === rootNode.getFocusableElement()) {
      return rootNode;
    }

    // Third, check if the element has a node.
    const matchedChildNode = tree.lookUpFocusableNode(element.id) ?? null;
    if (matchedChildNode) return matchedChildNode;

    // Fourth, recurse up to find the nearest tree/node if it's possible.
    const elementParent = element.parentElement;
    if (!matchedChildNode && elementParent) {
      return FocusableTreeTraverser.findFocusableNodeFor(elementParent, tree);
    }

    // Otherwise, there's no matching node.
    return null;
  }
}
