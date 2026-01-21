/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {FocusManager} from '../../build/src/core/focus_manager.js';
import {FocusableTreeTraverser} from '../../build/src/core/utils/focusable_tree_traverser.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

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

class FocusableTreeImpl {
  constructor(rootElement, nestedTrees) {
    this.nestedTrees = nestedTrees;
    this.idToNodeMap = {};
    this.rootNode = this.addNode(rootElement);
  }

  addNode(element) {
    const node = new FocusableNodeImpl(element, this);
    this.idToNodeMap[element.id] = node;
    return node;
  }

  getRootFocusableNode() {
    return this.rootNode;
  }

  getRestoredFocusableNode() {
    return null;
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

suite('FocusableTreeTraverser', function () {
  setup(function () {
    sharedTestSetup.call(this);

    const createFocusableTree = function (rootElementId, nestedTrees) {
      return new FocusableTreeImpl(
        document.getElementById(rootElementId),
        nestedTrees || [],
      );
    };
    const createFocusableNode = function (tree, elementId) {
      return tree.addNode(document.getElementById(elementId));
    };

    this.testFocusableTree1 = createFocusableTree('testFocusableTree1');
    this.testFocusableTree1Node1 = createFocusableNode(
      this.testFocusableTree1,
      'testFocusableTree1.node1',
    );
    this.testFocusableTree1Node1Child1 = createFocusableNode(
      this.testFocusableTree1,
      'testFocusableTree1.node1.child1',
    );
    this.testFocusableTree1Node2 = createFocusableNode(
      this.testFocusableTree1,
      'testFocusableTree1.node2',
    );
    this.testFocusableNestedTree4 = createFocusableTree(
      'testFocusableNestedTree4',
    );
    this.testFocusableNestedTree4Node1 = createFocusableNode(
      this.testFocusableNestedTree4,
      'testFocusableNestedTree4.node1',
    );
    this.testFocusableNestedTree5 = createFocusableTree(
      'testFocusableNestedTree5',
    );
    this.testFocusableNestedTree5Node1 = createFocusableNode(
      this.testFocusableNestedTree5,
      'testFocusableNestedTree5.node1',
    );
    this.testFocusableTree2 = createFocusableTree('testFocusableTree2', [
      this.testFocusableNestedTree4,
      this.testFocusableNestedTree5,
    ]);
    this.testFocusableTree2Node1 = createFocusableNode(
      this.testFocusableTree2,
      'testFocusableTree2.node1',
    );
  });

  teardown(function () {
    sharedTestTeardown.call(this);

    const removeFocusIndicators = function (element) {
      element.classList.remove(
        FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    };

    // Ensure all node CSS styles are reset so that state isn't leaked between tests.
    removeFocusIndicators(document.getElementById('testFocusableTree1'));
    removeFocusIndicators(document.getElementById('testFocusableTree1.node1'));
    removeFocusIndicators(
      document.getElementById('testFocusableTree1.node1.child1'),
    );
    removeFocusIndicators(document.getElementById('testFocusableTree1.node2'));
    removeFocusIndicators(document.getElementById('testFocusableTree2'));
    removeFocusIndicators(document.getElementById('testFocusableTree2.node1'));
    removeFocusIndicators(document.getElementById('testFocusableNestedTree4'));
    removeFocusIndicators(
      document.getElementById('testFocusableNestedTree4.node1'),
    );
    removeFocusIndicators(document.getElementById('testFocusableNestedTree5'));
    removeFocusIndicators(
      document.getElementById('testFocusableNestedTree5.node1'),
    );
  });

  suite('findFocusedNode()', function () {
    test('for tree with no highlights returns null', function () {
      const tree = this.testFocusableTree1;

      const finding = FocusableTreeTraverser.findFocusedNode(tree);

      assert.isNull(finding);
    });

    test('for tree with root active highlight returns root node', function () {
      const tree = this.testFocusableTree1;
      const rootNode = tree.getRootFocusableNode();
      rootNode
        .getFocusableElement()
        .classList.add(FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME);

      const finding = FocusableTreeTraverser.findFocusedNode(tree);

      assert.strictEqual(finding, rootNode);
    });

    test('for tree with root passive highlight returns root node', function () {
      const tree = this.testFocusableTree1;
      const rootNode = tree.getRootFocusableNode();
      rootNode
        .getFocusableElement()
        .classList.add(FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);

      const finding = FocusableTreeTraverser.findFocusedNode(tree);

      assert.strictEqual(finding, rootNode);
    });

    test('for tree with node active highlight returns node', function () {
      const tree = this.testFocusableTree1;
      const node = this.testFocusableTree1Node1;
      node
        .getFocusableElement()
        .classList.add(FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME);

      const finding = FocusableTreeTraverser.findFocusedNode(tree);

      assert.strictEqual(finding, node);
    });

    test('for tree with node passive highlight returns node', function () {
      const tree = this.testFocusableTree1;
      const node = this.testFocusableTree1Node1;
      node
        .getFocusableElement()
        .classList.add(FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);

      const finding = FocusableTreeTraverser.findFocusedNode(tree);

      assert.strictEqual(finding, node);
    });

    test('for tree with nested node active highlight returns node', function () {
      const tree = this.testFocusableTree1;
      const node = this.testFocusableTree1Node1Child1;
      node
        .getFocusableElement()
        .classList.add(FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME);

      const finding = FocusableTreeTraverser.findFocusedNode(tree);

      assert.strictEqual(finding, node);
    });

    test('for tree with nested node passive highlight returns node', function () {
      const tree = this.testFocusableTree1;
      const node = this.testFocusableTree1Node1Child1;
      node
        .getFocusableElement()
        .classList.add(FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);

      const finding = FocusableTreeTraverser.findFocusedNode(tree);

      assert.strictEqual(finding, node);
    });

    test('for tree with nested tree root active no parent highlights returns root', function () {
      const tree = this.testFocusableNestedTree4;
      const rootNode = this.testFocusableNestedTree4.getRootFocusableNode();
      rootNode
        .getFocusableElement()
        .classList.add(FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME);

      const finding = FocusableTreeTraverser.findFocusedNode(tree);

      assert.strictEqual(finding, rootNode);
    });

    test('for tree with nested tree root passive no parent highlights returns root', function () {
      const tree = this.testFocusableNestedTree4;
      const rootNode = this.testFocusableNestedTree4.getRootFocusableNode();
      rootNode
        .getFocusableElement()
        .classList.add(FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);

      const finding = FocusableTreeTraverser.findFocusedNode(tree);

      assert.strictEqual(finding, rootNode);
    });

    test('for tree with nested tree node active no parent highlights returns node', function () {
      const tree = this.testFocusableNestedTree4;
      const node = this.testFocusableNestedTree4Node1;
      node
        .getFocusableElement()
        .classList.add(FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME);

      const finding = FocusableTreeTraverser.findFocusedNode(tree);

      assert.strictEqual(finding, node);
    });

    test('for tree with nested tree root passive no parent highlights returns null', function () {
      const tree = this.testFocusableNestedTree4;
      const node = this.testFocusableNestedTree4Node1;
      node
        .getFocusableElement()
        .classList.add(FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);

      const finding = FocusableTreeTraverser.findFocusedNode(tree);

      assert.strictEqual(finding, node);
    });

    test('for tree with nested tree root active parent node passive returns parent node', function () {
      const tree = this.testFocusableNestedTree4;
      const rootNode = this.testFocusableNestedTree4.getRootFocusableNode();
      this.testFocusableTree2Node1
        .getFocusableElement()
        .classList.add(FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);
      rootNode
        .getFocusableElement()
        .classList.add(FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME);

      const finding = FocusableTreeTraverser.findFocusedNode(
        this.testFocusableTree2,
      );

      assert.strictEqual(finding, this.testFocusableTree2Node1);
    });

    test('for tree with nested tree root passive parent node passive returns parent node', function () {
      const tree = this.testFocusableNestedTree4;
      const rootNode = this.testFocusableNestedTree4.getRootFocusableNode();
      this.testFocusableTree2Node1
        .getFocusableElement()
        .classList.add(FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);
      rootNode
        .getFocusableElement()
        .classList.add(FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);

      const finding = FocusableTreeTraverser.findFocusedNode(
        this.testFocusableTree2,
      );

      assert.strictEqual(finding, this.testFocusableTree2Node1);
    });

    test('for tree with nested tree node active parent node passive returns parent node', function () {
      const tree = this.testFocusableNestedTree4;
      const node = this.testFocusableNestedTree4Node1;
      this.testFocusableTree2Node1
        .getFocusableElement()
        .classList.add(FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);
      node
        .getFocusableElement()
        .classList.add(FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME);

      const finding = FocusableTreeTraverser.findFocusedNode(
        this.testFocusableTree2,
      );

      assert.strictEqual(finding, this.testFocusableTree2Node1);
    });

    test('for tree with nested tree node passive parent node passive returns parent node', function () {
      const tree = this.testFocusableNestedTree4;
      const node = this.testFocusableNestedTree4Node1;
      this.testFocusableTree2Node1
        .getFocusableElement()
        .classList.add(FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);
      node
        .getFocusableElement()
        .classList.add(FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);

      const finding = FocusableTreeTraverser.findFocusedNode(
        this.testFocusableTree2,
      );

      assert.strictEqual(finding, this.testFocusableTree2Node1);
    });
  });

  suite('findFocusableNodeFor()', function () {
    test('for element without ID returns null', function () {
      const tree = this.testFocusableTree1;
      const rootNode = tree.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      const oldId = rootElem.id;
      // Normally it's not valid to miss an ID, but it can realistically happen.
      rootElem.removeAttribute('id');

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        rootElem,
        tree,
      );
      // Restore the ID for other tests.
      rootElem.setAttribute('id', oldId);

      assert.isNull(finding);
    });

    test('for element with null ID returns null', function () {
      const tree = this.testFocusableTree1;
      const rootNode = tree.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      const oldId = rootElem.id;
      // Normally it's not valid to miss an ID, but it can realistically happen.
      rootElem.setAttribute('id', null);

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        rootElem,
        tree,
      );
      // Restore the ID for other tests.
      rootElem.setAttribute('id', oldId);

      assert.isNull(finding);
    });

    test('for element with null ID string returns null', function () {
      const tree = this.testFocusableTree1;
      const rootNode = tree.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      const oldId = rootElem.id;
      // This is a quirky version of the null variety above that's actually
      // functionallity equivalent (since 'null' is converted to a string).
      rootElem.setAttribute('id', 'null');

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        rootElem,
        tree,
      );
      // Restore the ID for other tests.
      rootElem.setAttribute('id', oldId);

      assert.isNull(finding);
    });

    test('for element with empty ID returns null', function () {
      const tree = this.testFocusableTree1;
      const rootNode = tree.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      const oldId = rootElem.id;
      // An empty ID is invalid since it will potentially conflict with other
      // elements, and element IDs must be unique for focus management.
      rootElem.setAttribute('id', '');

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        rootElem,
        tree,
      );
      // Restore the ID for other tests.
      rootElem.setAttribute('id', oldId);

      assert.isNull(finding);
    });

    test('for root element returns root', function () {
      const tree = this.testFocusableTree1;
      const rootNode = tree.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        rootElem,
        tree,
      );

      assert.strictEqual(finding, rootNode);
    });

    test('for element for different tree root returns null', function () {
      const tree = this.testFocusableTree1;
      const rootNode = this.testFocusableTree2.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        rootElem,
        tree,
      );

      assert.isNull(finding);
    });

    test('for element for different tree node returns null', function () {
      const tree = this.testFocusableTree1;
      const nodeElem = this.testFocusableTree2Node1.getFocusableElement();

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        nodeElem,
        tree,
      );

      assert.isNull(finding);
    });

    test('for node element in tree returns node', function () {
      const tree = this.testFocusableTree1;
      const nodeElem = this.testFocusableTree1Node1.getFocusableElement();

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        nodeElem,
        tree,
      );

      assert.strictEqual(finding, this.testFocusableTree1Node1);
    });

    test('for non-node element in tree returns root', function () {
      const tree = this.testFocusableTree1;
      const unregElem = document.getElementById(
        'testFocusableTree1.node2.unregisteredChild1',
      );

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        unregElem,
        tree,
      );

      // An unregistered element should map to the closest node.
      assert.strictEqual(finding, this.testFocusableTree1Node2);
    });

    test('for nested node element in tree returns node', function () {
      const tree = this.testFocusableTree1;
      const nodeElem = this.testFocusableTree1Node1Child1.getFocusableElement();

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        nodeElem,
        tree,
      );

      // The nested node should be returned.
      assert.strictEqual(finding, this.testFocusableTree1Node1Child1);
    });

    test('for nested node element in tree returns node', function () {
      const tree = this.testFocusableTree1;
      const unregElem = document.getElementById(
        'testFocusableTree1.node1.child1.unregisteredChild1',
      );

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        unregElem,
        tree,
      );

      // An unregistered element should map to the closest node.
      assert.strictEqual(finding, this.testFocusableTree1Node1Child1);
    });

    test('for nested node element in tree returns node', function () {
      const tree = this.testFocusableTree1;
      const unregElem = document.getElementById(
        'testFocusableTree1.unregisteredChild1',
      );

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        unregElem,
        tree,
      );

      // An unregistered element should map to the closest node (or root).
      assert.strictEqual(finding, tree.getRootFocusableNode());
    });

    test('for nested tree root returns nested tree root', function () {
      const tree = this.testFocusableNestedTree4;
      const rootNode = tree.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        rootElem,
        tree,
      );

      assert.strictEqual(finding, rootNode);
    });

    test('for nested tree node returns nested tree node', function () {
      const tree = this.testFocusableNestedTree4;
      const nodeElem = this.testFocusableNestedTree4Node1.getFocusableElement();

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        nodeElem,
        tree,
      );

      // The node of the nested tree should be returned.
      assert.strictEqual(finding, this.testFocusableNestedTree4Node1);
    });

    test('for nested element in nested tree node returns nearest nested node', function () {
      const tree = this.testFocusableNestedTree4;
      const unregElem = document.getElementById(
        'testFocusableNestedTree4.node1.unregisteredChild1',
      );

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        unregElem,
        tree,
      );

      // An unregistered element should map to the closest node.
      assert.strictEqual(finding, this.testFocusableNestedTree4Node1);
    });

    test('for nested tree node under root with different tree base returns null', function () {
      const tree = this.testFocusableTree2;
      const nodeElem = this.testFocusableNestedTree5Node1.getFocusableElement();

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        nodeElem,
        tree,
      );

      // The nested node hierarchically sits below the outer tree, but using
      // that tree as the basis should yield null since it's not a direct child.
      assert.isNull(finding);
    });

    test('for nested tree node under node with different tree base returns null', function () {
      const tree = this.testFocusableTree2;
      const nodeElem = this.testFocusableNestedTree4Node1.getFocusableElement();

      const finding = FocusableTreeTraverser.findFocusableNodeFor(
        nodeElem,
        tree,
      );

      // The nested node hierarchically sits below the outer tree, but using
      // that tree as the basis should yield null since it's not a direct child.
      assert.isNull(finding);
    });
  });
});
