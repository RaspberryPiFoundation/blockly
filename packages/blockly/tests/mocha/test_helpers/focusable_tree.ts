/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from '#core/blockly.js';

/**
 * @fileoverview A minimal IFocusableTree implementation shared by the focus
 * tests.
 */

/**
 * Builds the test IFocusableTree implementation.
 *
 * @returns The FocusableTreeImpl class.
 */
export function focusableTreeImplFactory() {
  /** A focusable node wrapping a single element. */
  class FocusableNodeImpl implements Blockly.IFocusableNode {
    element: HTMLElement | SVGElement;
    tree: Blockly.IFocusableTree;

    constructor(
      element: HTMLElement | SVGElement,
      tree: Blockly.IFocusableTree,
    ) {
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
  class FocusableTreeImpl implements Blockly.IFocusableTree {
    nestedTrees: Blockly.IFocusableTree[];
    idToNodeMap: {[key: string]: Blockly.IFocusableNode};
    rootNode: Blockly.IFocusableNode;
    fallbackNode: Blockly.IFocusableNode | null;

    constructor(
      rootElement: HTMLElement | SVGElement,
      nestedTrees: Blockly.IFocusableTree[] = [],
    ) {
      this.nestedTrees = nestedTrees;
      this.idToNodeMap = {};
      this.rootNode = this.addNode(rootElement);
      this.fallbackNode = null;
    }

    addNode(element: HTMLElement | SVGElement) {
      const node = new FocusableNodeImpl(element, this);
      this.idToNodeMap[element.id] = node;
      return node;
    }

    removeNode(node: Blockly.IFocusableNode) {
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

    lookUpFocusableNode(id: string) {
      return this.idToNodeMap[id];
    }

    onTreeFocus() {}

    onTreeBlur() {}

    getNavigator() {
      return new Blockly.Navigator();
    }
  }

  return FocusableTreeImpl;
}

export const FocusableTreeImpl = focusableTreeImplFactory();
export type FocusableTreeImpl = InstanceType<typeof FocusableTreeImpl>;
