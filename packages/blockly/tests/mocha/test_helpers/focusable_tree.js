/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A minimal IFocusableTree implementation shared by the focus
 * tests.
 */

/**
 * Builds the test IFocusableTree implementation.
 *
 * @returns {!Function} The FocusableTreeImpl class.
 */
export function focusableTreeImplFactory() {
  /** A focusable node wrapping a single element. */
  class FocusableNodeImpl {
    constructor(element, tree) {
      this.element = element;
      this.tree = tree;
    }

    getFocusableElement() {
      return this.element;
    }

    getFocusableTree() {
      return this.tree;
    }

    onNodeFocus() {}

    onNodeBlur() {}

    canBeFocused() {
      return true;
    }
  }

  /**
   * A focusable tree whose nodes are looked up by element ID.
   *
   * Tests can set `fallbackNode` to control getRestoredFocusableNode(), and
   * override `canBeFocused` on an individual node to make it unfocusable.
   */
  class FocusableTreeImpl {
    constructor(rootElement, nestedTrees = []) {
      this.nestedTrees = nestedTrees;
      this.idToNodeMap = {};
      this.rootNode = this.addNode(rootElement);
      this.fallbackNode = null;
    }

    addNode(element) {
      const node = new FocusableNodeImpl(element, this);
      this.idToNodeMap[element.id] = node;
      return node;
    }

    removeNode(node) {
      delete this.idToNodeMap[node.getFocusableElement().id];
    }

    getRootFocusableNode() {
      return this.rootNode;
    }

    getRestoredFocusableNode() {
      return this.fallbackNode;
    }

    getNestedTrees() {
      return this.nestedTrees;
    }

    lookUpFocusableNode(id) {
      return this.idToNodeMap[id];
    }

    onTreeFocus() {}

    onTreeBlur() {}
  }

  return FocusableTreeImpl;
}

export const FocusableTreeImpl = focusableTreeImplFactory();
