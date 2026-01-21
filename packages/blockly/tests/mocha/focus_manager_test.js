/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FocusManager,
  getFocusManager,
} from '../../build/src/core/focus_manager.js';
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

suite('FocusManager', function () {
  const ACTIVE_FOCUS_NODE_CSS_SELECTOR = `.${FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME}`;
  const PASSIVE_FOCUS_NODE_CSS_SELECTOR = `.${FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME}`;

  setup(function () {
    sharedTestSetup.call(this);
    this.focusManager = getFocusManager();

    this.allFocusableTrees = [];
    this.allFocusableNodes = [];
    this.createFocusableTree = function (rootElementId, nestedTrees) {
      const tree = new FocusableTreeImpl(
        document.getElementById(rootElementId),
        nestedTrees || [],
      );
      this.allFocusableTrees.push(tree);
      return tree;
    };
    this.createFocusableNode = function (tree, elementId) {
      const node = tree.addNode(document.getElementById(elementId));
      this.allFocusableNodes.push(node);
      return node;
    };

    this.testFocusableTree1 = this.createFocusableTree('testFocusableTree1');
    this.testFocusableTree1Node1 = this.createFocusableNode(
      this.testFocusableTree1,
      'testFocusableTree1.node1',
    );
    this.testFocusableTree1Node1Child1 = this.createFocusableNode(
      this.testFocusableTree1,
      'testFocusableTree1.node1.child1',
    );
    this.testFocusableTree1Node2 = this.createFocusableNode(
      this.testFocusableTree1,
      'testFocusableTree1.node2',
    );
    this.testFocusableNestedTree4 = this.createFocusableTree(
      'testFocusableNestedTree4',
    );
    this.testFocusableNestedTree4Node1 = this.createFocusableNode(
      this.testFocusableNestedTree4,
      'testFocusableNestedTree4.node1',
    );
    this.testFocusableNestedTree5 = this.createFocusableTree(
      'testFocusableNestedTree5',
    );
    this.testFocusableNestedTree5Node1 = this.createFocusableNode(
      this.testFocusableNestedTree5,
      'testFocusableNestedTree5.node1',
    );
    this.testFocusableTree2 = this.createFocusableTree('testFocusableTree2', [
      this.testFocusableNestedTree4,
      this.testFocusableNestedTree5,
    ]);
    this.testFocusableTree2Node1 = this.createFocusableNode(
      this.testFocusableTree2,
      'testFocusableTree2.node1',
    );

    this.testFocusableGroup1 = this.createFocusableTree('testFocusableGroup1');
    this.testFocusableGroup1Node1 = this.createFocusableNode(
      this.testFocusableGroup1,
      'testFocusableGroup1.node1',
    );
    this.testFocusableGroup1Node1Child1 = this.createFocusableNode(
      this.testFocusableGroup1,
      'testFocusableGroup1.node1.child1',
    );
    this.testFocusableGroup1Node2 = this.createFocusableNode(
      this.testFocusableGroup1,
      'testFocusableGroup1.node2',
    );
    this.testFocusableNestedGroup4 = this.createFocusableTree(
      'testFocusableNestedGroup4',
    );
    this.testFocusableNestedGroup4Node1 = this.createFocusableNode(
      this.testFocusableNestedGroup4,
      'testFocusableNestedGroup4.node1',
    );
    this.testFocusableGroup2 = this.createFocusableTree('testFocusableGroup2', [
      this.testFocusableNestedGroup4,
    ]);
    this.testFocusableGroup2Node1 = this.createFocusableNode(
      this.testFocusableGroup2,
      'testFocusableGroup2.node1',
    );
  });

  teardown(function () {
    sharedTestTeardown.call(this);

    // Ensure all node CSS styles are reset so that state isn't leaked between tests.
    const activeElems = document.querySelectorAll(
      ACTIVE_FOCUS_NODE_CSS_SELECTOR,
    );
    const passiveElems = document.querySelectorAll(
      PASSIVE_FOCUS_NODE_CSS_SELECTOR,
    );
    for (const elem of activeElems) {
      elem.classList.remove(FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME);
    }
    for (const elem of passiveElems) {
      elem.classList.remove(FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME);
    }

    // Ensure any set tab indexes are properly reset between tests.
    for (const tree of this.allFocusableTrees) {
      tree
        .getRootFocusableNode()
        .getFocusableElement()
        .removeAttribute('tabindex');
    }
    for (const node of this.allFocusableNodes) {
      node.getFocusableElement().removeAttribute('tabindex');
    }
    this.allFocusableTrees = [];
    this.allFocusableNodes = [];

    // Reset the current active element.
    document.body.focus();
  });

  assert.includesClass = function (classList, className) {
    assert.isTrue(
      classList.contains(className),
      'Expected class list to include: ' + className,
    );
  };

  assert.notIncludesClass = function (classList, className) {
    assert.isFalse(
      classList.contains(className),
      'Expected class list to not include: ' + className,
    );
  };

  /* Basic lifecycle tests. */

  suite('registerTree()', function () {
    test('once does not throw', function () {
      this.focusManager.registerTree(this.testFocusableTree1);

      // The test should pass due to no exception being thrown.
    });

    test('twice for same tree throws error', function () {
      this.focusManager.registerTree(this.testFocusableTree1);

      const errorMsgRegex =
        /Attempted to re-register already registered tree.+?/;
      assert.throws(
        () => this.focusManager.registerTree(this.testFocusableTree1),
        errorMsgRegex,
      );
    });

    test('twice with different trees does not throw', function () {
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.registerTree(this.testFocusableGroup1);

      // The test shouldn't throw since two different trees were registered.
    });

    test('register after an unregister does not throw', function () {
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.unregisterTree(this.testFocusableTree1);

      this.focusManager.registerTree(this.testFocusableTree1);

      // The second register should not fail since the tree was previously unregistered.
    });

    test('for tree with missing ID throws error', function () {
      const rootNode = this.testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      const oldId = rootElem.id;
      rootElem.removeAttribute('id');

      const errorMsgRegex =
        /Attempting to register a tree with a root element that has an invalid ID.+?/;
      assert.throws(
        () => this.focusManager.registerTree(this.testFocusableTree1),
        errorMsgRegex,
      );
      // Restore the ID for other tests.
      rootElem.id = oldId;
    });

    test('for tree with null ID throws error', function () {
      const rootNode = this.testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      const oldId = rootElem.id;
      rootElem.setAttribute('id', null);

      const errorMsgRegex =
        /Attempting to register a tree with a root element that has an invalid ID.+?/;
      assert.throws(
        () => this.focusManager.registerTree(this.testFocusableTree1),
        errorMsgRegex,
      );
      // Restore the ID for other tests.
      rootElem.id = oldId;
    });

    test('for tree with empty throws error', function () {
      const rootNode = this.testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      const oldId = rootElem.id;
      rootElem.setAttribute('id', '');

      const errorMsgRegex =
        /Attempting to register a tree with a root element that has an invalid ID.+?/;
      assert.throws(
        () => this.focusManager.registerTree(this.testFocusableTree1),
        errorMsgRegex,
      );
      // Restore the ID for other tests.
      rootElem.id = oldId;
    });

    test('for unmanaged tree does not overwrite tab index', function () {
      this.focusManager.registerTree(this.testFocusableTree1, false);

      const rootNode = this.testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      assert.isNull(rootElem.getAttribute('tabindex'));
    });

    test('for unmanaged tree with custom tab index does not overwrite tab index', function () {
      const rootNode = this.testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      rootElem.tabIndex = -1;

      this.focusManager.registerTree(this.testFocusableTree1, false);

      // The custom tab index shouldn't be overwritten for an unmanaged tree.
      assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
    });

    test('for managed tree overwrites root tab index to be tab navigable', function () {
      this.focusManager.registerTree(this.testFocusableTree1, true);

      const rootNode = this.testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      assert.strictEqual(rootElem.getAttribute('tabindex'), '0');
    });

    test('for managed tree with custom tab index overwrites root tab index to be tab navigable', function () {
      const rootNode = this.testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      rootElem.tabIndex = -1;

      this.focusManager.registerTree(this.testFocusableTree1, true);

      // A custom tab index should be overwritten for a managed tree.
      assert.strictEqual(rootElem.getAttribute('tabindex'), '0');
    });
  });

  suite('unregisterTree()', function () {
    test('for not yet registered tree throws', function () {
      const errorMsgRegex = /Attempted to unregister not registered tree.+?/;
      assert.throws(
        () => this.focusManager.unregisterTree(this.testFocusableTree1),
        errorMsgRegex,
      );
    });

    test('for registered tree does not throw', function () {
      this.focusManager.registerTree(this.testFocusableTree1);

      this.focusManager.unregisterTree(this.testFocusableTree1);

      // Unregistering a registered tree should not fail.
    });

    test('twice for registered tree throws', function () {
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.unregisterTree(this.testFocusableTree1);

      const errorMsgRegex = /Attempted to unregister not registered tree.+?/;
      assert.throws(
        () => this.focusManager.unregisterTree(this.testFocusableTree1),
        errorMsgRegex,
      );
    });

    test('for unmanaged tree with custom tab index does not change tab index', function () {
      this.focusManager.registerTree(this.testFocusableTree1, false);
      const rootNode = this.testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      rootElem.tabIndex = -1;

      this.focusManager.unregisterTree(this.testFocusableTree1);

      // Unregistering an unmanaged tree shouldn't change its tab index.
      assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
    });

    test('for managed tree removes tab index', function () {
      this.focusManager.registerTree(this.testFocusableTree1, true);

      this.focusManager.unregisterTree(this.testFocusableTree1);

      // Unregistering a managed tree should remove its tab index.
      const rootNode = this.testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      assert.isNull(rootElem.getAttribute('tabindex'));
    });

    test('for managed tree with custom tab index removes tab index', function () {
      this.focusManager.registerTree(this.testFocusableTree1, true);
      const rootNode = this.testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      rootElem.tabIndex = -1;

      this.focusManager.unregisterTree(this.testFocusableTree1);

      // Unregistering a managed tree should remove its tab index.
      assert.isNull(rootElem.getAttribute('tabindex'));
    });
  });

  suite('isRegistered()', function () {
    test('for not registered tree returns false', function () {
      const isRegistered = this.focusManager.isRegistered(
        this.testFocusableTree1,
      );

      assert.isFalse(isRegistered);
    });

    test('for registered tree returns true', function () {
      this.focusManager.registerTree(this.testFocusableTree1);

      const isRegistered = this.focusManager.isRegistered(
        this.testFocusableTree1,
      );

      assert.isTrue(isRegistered);
    });

    test('for unregistered tree returns false', function () {
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.unregisterTree(this.testFocusableTree1);

      const isRegistered = this.focusManager.isRegistered(
        this.testFocusableTree1,
      );

      assert.isFalse(isRegistered);
    });

    test('for re-registered tree returns true', function () {
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.unregisterTree(this.testFocusableTree1);
      this.focusManager.registerTree(this.testFocusableTree1);

      const isRegistered = this.focusManager.isRegistered(
        this.testFocusableTree1,
      );

      assert.isTrue(isRegistered);
    });

    test('for unregistered tree with other registered tree returns false', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.unregisterTree(this.testFocusableTree1);

      const isRegistered = this.focusManager.isRegistered(
        this.testFocusableTree1,
      );

      assert.isFalse(isRegistered);
    });
  });

  suite('getFocusedTree()', function () {
    test('by default returns null', function () {
      const focusedTree = this.focusManager.getFocusedTree();

      assert.isNull(focusedTree);
    });
  });

  suite('getFocusedNode()', function () {
    test('by default returns null', function () {
      const focusedNode = this.focusManager.getFocusedNode();

      assert.isNull(focusedNode);
    });

    test('after focusing unfocusable node returns null', function () {
      this.testFocusableTree1Node1.canBeFocused = () => false;
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.focusNode(this.testFocusableTree1Node1);

      const focusedNode = this.focusManager.getFocusedNode();

      // Unfocusable nodes should not be focused.
      assert.isNull(focusedNode);
    });
  });

  suite('focusTree()', function () {
    test('for not registered tree throws', function () {
      const errorMsgRegex = /Attempted to focus unregistered tree.+?/;
      assert.throws(
        () => this.focusManager.focusTree(this.testFocusableTree1),
        errorMsgRegex,
      );
    });

    test('for unregistered tree throws', function () {
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.unregisterTree(this.testFocusableTree1);

      const errorMsgRegex = /Attempted to focus unregistered tree.+?/;
      assert.throws(
        () => this.focusManager.focusTree(this.testFocusableTree1),
        errorMsgRegex,
      );
    });
  });

  test('unfocused node does not have a tab index by default', function () {
    const elem = this.testFocusableTree1Node1.getFocusableElement();

    // This is slightly testing the test setup, but it acts as a precondition sanity test for the
    // other tab index tests below. Important: 'getAttribute' is used here since direct access to
    // 'tabIndex' can default the value returned even when the tab index isn't set.
    assert.isNull(elem.getAttribute('tabindex'));
  });

  suite('focusNode()', function () {
    test('for not registered node throws', function () {
      const errorMsgRegex = /Attempted to focus unregistered node.+?/;
      assert.throws(
        () => this.focusManager.focusNode(this.testFocusableTree1Node1),
        errorMsgRegex,
      );
    });

    test('for unregistered node throws', function () {
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.unregisterTree(this.testFocusableTree1);

      const errorMsgRegex = /Attempted to focus unregistered node.+?/;
      assert.throws(
        () => this.focusManager.focusNode(this.testFocusableTree1Node1),
        errorMsgRegex,
      );
    });

    test('focuses element', function () {
      this.focusManager.registerTree(this.testFocusableTree1);

      this.focusManager.focusNode(this.testFocusableTree1Node1);

      const nodeElem = this.testFocusableTree1Node1.getFocusableElement();
      assert.strictEqual(document.activeElement, nodeElem);
    });

    test('fires focusin event', function () {
      let focusCount = 0;
      const focusListener = () => focusCount++;
      document.addEventListener('focusin', focusListener);
      this.focusManager.registerTree(this.testFocusableTree1);

      this.focusManager.focusNode(this.testFocusableTree1Node1);
      document.removeEventListener('focusin', focusListener);

      // There should be exactly 1 focus event fired from focusNode().
      assert.strictEqual(focusCount, 1);
    });

    test('for orphaned node returns tree root by default', function () {
      this.focusManager.registerTree(this.testFocusableTree1);
      this.testFocusableTree1.removeNode(this.testFocusableTree1Node1);

      this.focusManager.focusNode(this.testFocusableTree1Node1);

      // Focusing an invalid node should fall back to the tree root when it has no restoration
      // fallback node.
      const currentNode = this.focusManager.getFocusedNode();
      const treeRoot = this.testFocusableTree1.getRootFocusableNode();
      assert.strictEqual(currentNode, treeRoot);
    });

    test('for orphaned node returns specified fallback node', function () {
      this.focusManager.registerTree(this.testFocusableTree1);
      this.testFocusableTree1.fallbackNode = this.testFocusableTree1Node2;
      this.testFocusableTree1.removeNode(this.testFocusableTree1Node1);

      this.focusManager.focusNode(this.testFocusableTree1Node1);

      // Focusing an invalid node should fall back to the restored fallback.
      const currentNode = this.focusManager.getFocusedNode();
      assert.strictEqual(currentNode, this.testFocusableTree1Node2);
    });

    test('restores focus when element quietly loses focus', function () {
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.focusNode(this.testFocusableTree1Node1);
      // Remove the FocusManager's listeners to simulate not receiving a focus
      // event when focus is lost. This can happen in Firefox and Safari when an
      // element is removed and then re-added to the DOM. This is a contrived
      // setup to achieve the same outcome on all browsers. For context, see:
      // https://github.com/google/blockly-keyboard-experimentation/issues/87.
      for (const registeredListener of this.globalDocumentEventListeners) {
        const eventType = registeredListener.type;
        const eventListener = registeredListener.listener;
        document.removeEventListener(eventType, eventListener);
      }
      document.body.focus();

      this.focusManager.focusNode(this.testFocusableTree1Node1);

      const currentNode = this.focusManager.getFocusedNode();
      const currentElem = currentNode?.getFocusableElement();
      assert.strictEqual(currentNode, this.testFocusableTree1Node1);
      assert.strictEqual(document.activeElement, currentElem);
    });

    test('restores focus when element and new node focused', function () {
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.focusNode(this.testFocusableTree1Node1);
      // Remove the FocusManager's listeners to simulate not receiving a focus
      // event when focus is lost. This can happen in Firefox and Safari when an
      // element is removed and then re-added to the DOM. This is a contrived
      // setup to achieve the same outcome on all browsers. For context, see:
      // https://github.com/google/blockly-keyboard-experimentation/issues/87.
      for (const registeredListener of this.globalDocumentEventListeners) {
        const eventType = registeredListener.type;
        const eventListener = registeredListener.listener;
        document.removeEventListener(eventType, eventListener);
      }
      document.body.focus();

      this.focusManager.focusNode(this.testFocusableTree1Node2);

      const currentNode = this.focusManager.getFocusedNode();
      const currentElem = currentNode?.getFocusableElement();
      assert.strictEqual(currentNode, this.testFocusableTree1Node2);
      assert.strictEqual(document.activeElement, currentElem);
    });

    test('for unfocused node calls onNodeFocus once', function () {
      sinon.spy(this.testFocusableTree1Node1, 'onNodeFocus');
      this.focusManager.registerTree(this.testFocusableTree1);

      this.focusManager.focusNode(this.testFocusableTree1Node1);

      assert.strictEqual(this.testFocusableTree1Node1.onNodeFocus.callCount, 1);
    });

    test('for previously focused node calls onNodeBlur once', function () {
      sinon.spy(this.testFocusableTree1Node1, 'onNodeBlur');
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.focusNode(this.testFocusableTree1Node1);

      this.focusManager.focusNode(this.testFocusableTree1Node2);

      assert.strictEqual(this.testFocusableTree1Node1.onNodeBlur.callCount, 1);
    });

    test('for unfocused tree calls onTreeFocus once', function () {
      sinon.spy(this.testFocusableTree1, 'onTreeFocus');
      this.focusManager.registerTree(this.testFocusableTree1);

      this.focusManager.focusNode(this.testFocusableTree1Node1);

      assert.strictEqual(this.testFocusableTree1.onTreeFocus.callCount, 1);
    });

    test('for previously focused tree calls onTreeBlur once', function () {
      sinon.spy(this.testFocusableTree1, 'onTreeBlur');
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.focusNode(this.testFocusableTree1Node1);

      this.focusManager.focusNode(this.testFocusableTree2Node1);

      assert.strictEqual(this.testFocusableTree1.onTreeBlur.callCount, 1);
    });

    test('for same node twice calls onNodeFocus once', function () {
      sinon.spy(this.testFocusableTree1Node1, 'onNodeFocus');
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.focusNode(this.testFocusableTree1Node1);

      // Call focus for the same node a second time.
      this.focusManager.focusNode(this.testFocusableTree1Node1);

      // Despite two calls to focus the node should only focus once.
      assert.strictEqual(this.testFocusableTree1Node1.onNodeFocus.callCount, 1);
    });

    test('for unfocusable node does not call onNodeFocus', function () {
      sinon.spy(this.testFocusableTree1Node1, 'onNodeFocus');
      this.testFocusableTree1Node1.canBeFocused = () => false;
      this.focusManager.registerTree(this.testFocusableTree1);

      this.focusManager.focusNode(this.testFocusableTree1Node1);

      // Unfocusable nodes should not be focused, nor have their callbacks called.
      assert.strictEqual(this.testFocusableTree1Node1.onNodeFocus.callCount, 0);
    });

    test('for unfocused node overwrites tab index', function () {
      this.focusManager.registerTree(this.testFocusableTree1);

      this.focusManager.focusNode(this.testFocusableTree1Node1);

      // Focusing an element should overwrite its tab index.
      const elem = this.testFocusableTree1Node1.getFocusableElement();
      assert.strictEqual(elem.getAttribute('tabindex'), '-1');
    });

    test('for previously focused node keeps new tab index', function () {
      this.focusManager.registerTree(this.testFocusableTree1);
      this.focusManager.focusNode(this.testFocusableTree1Node1);

      this.focusManager.focusNode(this.testFocusableTree1Node2);

      // The previously focused element should retain its tab index.
      const elem = this.testFocusableTree1Node1.getFocusableElement();
      assert.strictEqual(elem.getAttribute('tabindex'), '-1');
    });

    test('for node with custom tab index does not change tab index', function () {
      this.focusManager.registerTree(this.testFocusableTree1);
      const elem = this.testFocusableTree1Node1.getFocusableElement();
      elem.tabIndex = 0;

      this.focusManager.focusNode(this.testFocusableTree1Node1);

      // If the node already has a tab index set then it should retain that index.
      assert.strictEqual(elem.getAttribute('tabindex'), '0');
    });

    suite('for unmanaged tree', function () {
      test('focused root overwrites tab index', function () {
        this.focusManager.registerTree(this.testFocusableTree1, false);
        const rootNode = this.testFocusableTree1.getRootFocusableNode();

        this.focusManager.focusNode(rootNode);

        // Focusing an unmanaged tree's root should overwrite its tab index.
        const rootElem = rootNode.getFocusableElement();
        assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
      });

      test('focused root with custom tab index does not change tab index', function () {
        this.focusManager.registerTree(this.testFocusableTree1, false);
        const rootNode = this.testFocusableTree1.getRootFocusableNode();
        const rootElem = rootNode.getFocusableElement();
        rootElem.tabIndex = 0;

        this.focusManager.focusNode(rootNode);

        // If the node already has a tab index set then it should retain that index.
        assert.strictEqual(rootElem.getAttribute('tabindex'), '0');
      });

      test('focused node in a tree after unmanaged was focused should keep previous root unchanged', function () {
        this.focusManager.registerTree(this.testFocusableTree1, false);
        this.focusManager.registerTree(this.testFocusableTree2, false);
        const rootNode = this.testFocusableTree1.getRootFocusableNode();
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusNode(this.testFocusableTree2Node1);

        // Focusing a different tree shouldn't change the root of the previous tree if it's unmanaged.
        const rootElem = rootNode.getFocusableElement();
        assert.isNull(rootElem.getAttribute('tabindex'));
      });

      test('focused node in a tree after unmanaged was root focused should make previous root tab navigable', function () {
        this.focusManager.registerTree(this.testFocusableTree1, false);
        this.focusManager.registerTree(this.testFocusableTree2, false);
        const rootNode = this.testFocusableTree1.getRootFocusableNode();
        this.focusManager.focusTree(this.testFocusableTree1);

        this.focusManager.focusNode(this.testFocusableTree2Node1);

        // The previous tree's root should be kept unchanged (since it was managed).
        const rootElem = rootNode.getFocusableElement();
        assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
      });
    });

    suite('for managed tree', function () {
      test('for unfocused node in managed tree overwrites tab index', function () {
        this.focusManager.registerTree(this.testFocusableTree1, true);

        this.focusManager.focusNode(this.testFocusableTree1Node1);

        // Focusing an element should overwrite its tab index.
        const elem = this.testFocusableTree1Node1.getFocusableElement();
        assert.strictEqual(elem.getAttribute('tabindex'), '-1');
      });

      test('for previously focused node in managed tree keeps new tab index', function () {
        this.focusManager.registerTree(this.testFocusableTree1, true);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusNode(this.testFocusableTree1Node2);

        // The previously focused element should retain its tab index.
        const elem = this.testFocusableTree1Node1.getFocusableElement();
        assert.strictEqual(elem.getAttribute('tabindex'), '-1');
      });

      test('focused root makes root non-tab navigable', function () {
        this.focusManager.registerTree(this.testFocusableTree1, true);
        const rootNode = this.testFocusableTree1.getRootFocusableNode();

        this.focusManager.focusNode(rootNode);

        // Focusing the root in a managed tree should make it non-tab navigable.
        const rootElem = rootNode.getFocusableElement();
        assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
      });

      test('focused root with custom tab index should overwrite tab index', function () {
        this.focusManager.registerTree(this.testFocusableTree1, true);
        const rootNode = this.testFocusableTree1.getRootFocusableNode();
        const rootElem = rootNode.getFocusableElement();
        rootElem.tabIndex = 0;

        this.focusManager.focusNode(rootNode);

        // Custom tab indexes are overwritten for the root in a managed tree.
        assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
      });

      test('focused node tree root makes root non-tab navigable', function () {
        this.focusManager.registerTree(this.testFocusableTree1, true);
        const rootNode = this.testFocusableTree1.getRootFocusableNode();

        this.focusManager.focusNode(this.testFocusableTree1Node1);

        // Focusing a node of a managed tree should make the root non-tab navigable.
        const rootElem = rootNode.getFocusableElement();
        assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
      });

      test('focused node root with custom tab index should overwrite tab index', function () {
        this.focusManager.registerTree(this.testFocusableTree1, true);
        const rootNode = this.testFocusableTree1.getRootFocusableNode();
        const rootElem = rootNode.getFocusableElement();
        rootElem.tabIndex = 0;

        this.focusManager.focusNode(this.testFocusableTree1Node1);

        // Custom tab indexes are overwritten for the root in a managed tree even when a tree's node
        // is focused.
        assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
      });

      test('focused node in a tree after managed was focused should make previous root tab navigable', function () {
        this.focusManager.registerTree(this.testFocusableTree1, true);
        this.focusManager.registerTree(this.testFocusableTree2, false);
        const rootNode = this.testFocusableTree1.getRootFocusableNode();
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusNode(this.testFocusableTree2Node1);

        // Focusing a different tree shouldn't after a managed tree should make the managed tree tab
        // navigable.
        const rootElem = rootNode.getFocusableElement();
        assert.strictEqual(rootElem.getAttribute('tabindex'), '0');
      });

      test('focused node in a tree after managed was root focused should make previous root tab navigable', function () {
        this.focusManager.registerTree(this.testFocusableTree1, true);
        this.focusManager.registerTree(this.testFocusableTree2, false);
        const rootNode = this.testFocusableTree1.getRootFocusableNode();
        this.focusManager.focusTree(this.testFocusableTree1);

        this.focusManager.focusNode(this.testFocusableTree2Node1);

        // Focusing a different tree shouldn't after a managed tree should make the managed tree tab
        // navigable.
        const rootElem = rootNode.getFocusableElement();
        assert.strictEqual(rootElem.getAttribute('tabindex'), '0');
      });
    });
  });

  suite('getFocusManager()', function () {
    test('returns non-null manager', function () {
      const manager = getFocusManager();

      assert.isNotNull(manager);
    });

    test('returns the exact same instance in subsequent calls', function () {
      const manager1 = getFocusManager();
      const manager2 = getFocusManager();

      assert.strictEqual(manager2, manager1);
    });
  });

  /* Focus tests for HTML trees. */

  suite('focus*() switching in HTML tree', function () {
    suite('getFocusedTree()', function () {
      test('registered tree focusTree()ed no prev focus returns tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);

        this.focusManager.focusTree(this.testFocusableTree1);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree1,
        );
      });

      test('registered tree focusTree()ed prev node focused returns tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusTree(this.testFocusableTree1);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree1,
        );
      });

      test('registered tree focusTree()ed diff tree prev focused returns new tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusTree(this.testFocusableTree1);

        this.focusManager.focusTree(this.testFocusableTree2);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree2,
        );
      });

      test('registered tree focusTree()ed diff tree node prev focused returns new tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusTree(this.testFocusableTree2);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree2,
        );
      });

      test('registered root focusNode()ed no prev focus returns tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);

        this.focusManager.focusNode(
          this.testFocusableTree1.getRootFocusableNode(),
        );

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree1,
        );
      });

      test("registered node focusNode()ed no prev focus returns node's tree", function () {
        this.focusManager.registerTree(this.testFocusableTree1);

        this.focusManager.focusNode(this.testFocusableTree1Node1);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree1,
        );
      });

      test("registered subnode focusNode()ed no prev focus returns node's tree", function () {
        this.focusManager.registerTree(this.testFocusableTree1);

        this.focusManager.focusNode(this.testFocusableTree1Node1Child1);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree1,
        );
      });

      test('registered node focusNode()ed after prev node focus returns same tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusNode(this.testFocusableTree1Node2);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree1,
        );
      });

      test("registered node focusNode()ed after prev node focus diff tree returns new node's tree", function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusNode(this.testFocusableTree2Node1);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree2,
        );
      });

      test("registered tree root focusNode()ed after prev node focus diff tree returns new node's tree", function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusNode(
          this.testFocusableTree2.getRootFocusableNode(),
        );

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree2,
        );
      });

      test('unregistered tree focusTree()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.focusTree(this.testFocusableTree1);

        this.focusManager.unregisterTree(this.testFocusableTree1);

        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('unregistered tree focusNode()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.unregisterTree(this.testFocusableTree1);

        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('unregistered tree focusNode()ed with prev node prior focused returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree2Node1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('unregistered tree focusNode()ed with prev node recently focused returns new tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);
        this.focusManager.focusNode(this.testFocusableTree2Node1);

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree2,
        );
      });

      test('nested tree focusTree()ed with no prev focus returns nested tree', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);

        this.focusManager.focusTree(this.testFocusableNestedTree4);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableNestedTree4,
        );
      });

      test('nested tree node focusNode()ed with no prev focus returns nested tree', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);

        this.focusManager.focusNode(this.testFocusableNestedTree4Node1);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableNestedTree4,
        );
      });

      test('nested tree node focusNode()ed after parent focused returns nested tree', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);
        this.focusManager.focusNode(this.testFocusableTree2Node1);

        this.focusManager.focusNode(this.testFocusableNestedTree4Node1);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableNestedTree4,
        );
      });
    });
    suite('getFocusedNode()', function () {
      test('registered tree focusTree()ed no prev focus returns root node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);

        this.focusManager.focusTree(this.testFocusableTree1);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree1.getRootFocusableNode(),
        );
      });

      test('registered tree focusTree()ed prev node focused returns original node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusTree(this.testFocusableTree1);

        // The original node retains focus since the tree already holds focus (per focusTree's
        // contract).
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree1Node1,
        );
      });

      test('registered tree focusTree()ed diff tree prev focused returns new root node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusTree(this.testFocusableTree1);

        this.focusManager.focusTree(this.testFocusableTree2);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree2.getRootFocusableNode(),
        );
      });

      test('registered tree focusTree()ed diff tree node prev focused returns new root node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusTree(this.testFocusableTree2);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree2.getRootFocusableNode(),
        );
      });

      test('registered root focusNode()ed no prev focus returns root node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);

        this.focusManager.focusNode(
          this.testFocusableTree1.getRootFocusableNode(),
        );

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree1.getRootFocusableNode(),
        );
      });

      test('registered node focusNode()ed no prev focus returns node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);

        this.focusManager.focusNode(this.testFocusableTree1Node1);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree1Node1,
        );
      });

      test('registered subnode focusNode()ed no prev focus returns subnode', function () {
        this.focusManager.registerTree(this.testFocusableTree1);

        this.focusManager.focusNode(this.testFocusableTree1Node1Child1);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree1Node1Child1,
        );
      });

      test('registered node focusNode()ed after prev node focus returns new node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusNode(this.testFocusableTree1Node2);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree1Node2,
        );
      });

      test('registered node focusNode()ed after prev node focus diff tree returns new node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusNode(this.testFocusableTree2Node1);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree2Node1,
        );
      });

      test('registered tree root focusNode()ed after prev node focus diff tree returns new root', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusNode(
          this.testFocusableTree2.getRootFocusableNode(),
        );

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree2.getRootFocusableNode(),
        );
      });

      test('unregistered tree focusTree()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.focusTree(this.testFocusableTree1);

        this.focusManager.unregisterTree(this.testFocusableTree1);

        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('unregistered tree focusNode()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.unregisterTree(this.testFocusableTree1);

        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('unregistered tree focusNode()ed with prev node prior focused returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree2Node1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('unregistered tree focusNode()ed with prev node recently focused returns new node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);
        this.focusManager.focusNode(this.testFocusableTree2Node1);

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree2Node1,
        );
      });

      test('nested tree focusTree()ed with no prev focus returns nested root', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);

        this.focusManager.focusTree(this.testFocusableNestedTree4);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableNestedTree4.getRootFocusableNode(),
        );
      });

      test('nested tree node focusNode()ed with no prev focus returns focused node', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);

        this.focusManager.focusNode(this.testFocusableNestedTree4Node1);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableNestedTree4Node1,
        );
      });

      test('nested tree node focusNode()ed after parent focused returns focused node', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);
        this.focusManager.focusNode(this.testFocusableTree2Node1);

        this.focusManager.focusNode(this.testFocusableNestedTree4Node1);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableNestedTree4Node1,
        );
      });

      test('deletion after focusNode() returns null', function () {
        const rootElem = document.createElement('div');
        const nodeElem = document.createElement('div');
        rootElem.setAttribute('id', 'focusRoot');
        rootElem.setAttribute('tabindex', '-1');
        nodeElem.setAttribute('id', 'focusNode');
        nodeElem.setAttribute('tabindex', '-1');
        nodeElem.textContent = 'Focusable node';
        rootElem.appendChild(nodeElem);
        document.body.appendChild(rootElem);
        const root = this.createFocusableTree('focusRoot');
        const node = this.createFocusableNode(root, 'focusNode');
        this.focusManager.registerTree(root);
        this.focusManager.focusNode(node);

        node.getFocusableElement().remove();

        assert.notStrictEqual(this.focusManager.getFocusedNode(), node);
        rootElem.remove(); // Cleanup.
      });
    });
    suite('CSS classes', function () {
      test('registered tree focusTree()ed no prev focus root elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);

        this.focusManager.focusTree(this.testFocusableTree1);

        const rootElem = this.testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed prev node focused original elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusTree(this.testFocusableTree1);

        // The original node retains active focus since the tree already holds focus (per
        // focusTree's contract).
        const nodeElem = this.testFocusableTree1Node1.getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed diff tree prev focused new root elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusTree(this.testFocusableTree1);

        this.focusManager.focusTree(this.testFocusableTree2);

        const rootElem = this.testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed diff tree node prev focused new root elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusTree(this.testFocusableTree2);

        const rootElem = this.testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered root focusNode()ed no prev focus returns root elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);

        this.focusManager.focusNode(
          this.testFocusableTree1.getRootFocusableNode(),
        );

        const rootElem = this.testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed no prev focus node elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);

        this.focusManager.focusNode(this.testFocusableTree1Node1);

        const nodeElem = this.testFocusableTree1Node1.getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus same tree old node elem has no focus property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusNode(this.testFocusableTree1Node2);

        const prevNodeElem = this.testFocusableTree1Node1.getFocusableElement();
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus same tree new node elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusNode(this.testFocusableTree1Node2);

        const newNodeElem = this.testFocusableTree1Node2.getFocusableElement();
        assert.includesClass(
          newNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          newNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus diff tree old node elem has passive property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusNode(this.testFocusableTree2Node1);

        const prevNodeElem = this.testFocusableTree1Node1.getFocusableElement();
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus diff tree new node elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusNode(this.testFocusableTree2Node1);

        const newNodeElem = this.testFocusableTree2Node1.getFocusableElement();
        assert.includesClass(
          newNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          newNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree root focusNode()ed after prev node focus diff tree new root has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.focusNode(
          this.testFocusableTree2.getRootFocusableNode(),
        );

        const rootElem = this.testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusTree()ed with no prev focus removes focus', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.focusTree(this.testFocusableTree1);

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators.
        const rootElem = this.testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusNode()ed with no prev focus removes focus', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators.
        const nodeElem = this.testFocusableTree1Node1.getFocusableElement();
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusNode()ed with prev node prior removes focus from removed tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree2Node1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators. However, the old node
        // should still have passive indication.
        const otherNodeElem =
          this.testFocusableTree2Node1.getFocusableElement();
        const removedNodeElem =
          this.testFocusableTree1Node1.getFocusableElement();
        assert.includesClass(
          otherNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          otherNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusNode()ed with prev node recently removes focus from removed tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);
        this.focusManager.focusNode(this.testFocusableTree2Node1);

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators. However, the new node
        // should still have active indication.
        const otherNodeElem =
          this.testFocusableTree2Node1.getFocusableElement();
        const removedNodeElem =
          this.testFocusableTree1Node1.getFocusableElement();
        assert.includesClass(
          otherNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          otherNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focusNode() multiple nodes in same tree with switches ensure passive focus has gone', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);
        this.focusManager.focusNode(this.testFocusableTree2Node1);

        this.focusManager.focusNode(this.testFocusableTree1Node2);

        // When switching back to the first tree, ensure the original passive node is no longer
        // passive now that the new node is active.
        const node1 = this.testFocusableTree1Node1.getFocusableElement();
        const node2 = this.testFocusableTree1Node2.getFocusableElement();
        assert.notIncludesClass(
          node1.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          node2.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed other tree node passively focused tree node now has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusNode(this.testFocusableTree1Node1);
        this.focusManager.focusNode(this.testFocusableTree2Node1);

        this.focusManager.focusTree(this.testFocusableTree1);

        // The original node in the tree should be moved from passive to active focus per the
        // contract of focusTree). Also, the root of the tree should have no focus indication.
        const nodeElem = this.testFocusableTree1Node1.getFocusableElement();
        const rootElem = this.testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focus on root, node in diff tree, then node in first tree; root should have focus gone', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.focusTree(this.testFocusableTree1);
        this.focusManager.focusNode(this.testFocusableTree2Node1);

        this.focusManager.focusNode(this.testFocusableTree1Node1);

        const nodeElem = this.testFocusableTree1Node1.getFocusableElement();
        const rootElem = this.testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree focusTree()ed with no prev root has active focus', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);

        this.focusManager.focusTree(this.testFocusableNestedTree4);

        const rootElem = this.testFocusableNestedTree4
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focusNode()ed with no prev focus node has active focus', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);

        this.focusManager.focusNode(this.testFocusableNestedTree4Node1);

        const nodeElem =
          this.testFocusableNestedTree4Node1.getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focusNode()ed after parent focused prev has passive node has active', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);
        this.focusManager.focusNode(this.testFocusableTree2Node1);

        this.focusManager.focusNode(this.testFocusableNestedTree4Node1);

        const prevNodeElem = this.testFocusableTree2Node1.getFocusableElement();
        const currNodeElem =
          this.testFocusableNestedTree4Node1.getFocusableElement();
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          currNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });
    });
  });

  suite('DOM focus() switching in HTML tree', function () {
    suite('getFocusedTree()', function () {
      test('registered root focus()ed no prev focus returns tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1').tabIndex = -1;

        document.getElementById('testFocusableTree1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree1,
        );
      });

      test("registered node focus()ed no prev focus returns node's tree", function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;

        document.getElementById('testFocusableTree1.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree1,
        );
      });

      test("registered subnode focus()ed no prev focus returns node's tree", function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1.child1').tabIndex =
          -1;

        document.getElementById('testFocusableTree1.node1.child1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree1,
        );
      });

      test('registered node focus()ed after prev node focus returns same tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node2').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testFocusableTree1.node2').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree1,
        );
      });

      test("registered node focus()ed after prev node focus diff tree returns new node's tree", function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testFocusableTree2.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree2,
        );
      });

      test("registered tree root focus()ed after prev node focus diff tree returns new node's tree", function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testFocusableTree2').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree2,
        );
      });

      test("non-registered node subelement focus()ed returns node's tree", function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById(
          'testFocusableTree1.node2.unregisteredChild1',
        ).tabIndex = -1;

        document
          .getElementById('testFocusableTree1.node2.unregisteredChild1')
          .focus();

        // The tree of the unregistered child element should take focus.
        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree1,
        );
      });

      test('non-registered tree focus()ed returns null', function () {
        document.getElementById('testUnregisteredFocusableTree3').tabIndex = -1;

        document.getElementById('testUnregisteredFocusableTree3').focus();

        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('non-registered tree node focus()ed returns null', function () {
        document.getElementById(
          'testUnregisteredFocusableTree3.node1',
        ).tabIndex = -1;

        document.getElementById('testUnregisteredFocusableTree3.node1').focus();

        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('non-registered tree node focus()ed after registered node focused returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById(
          'testUnregisteredFocusableTree3.node1',
        ).tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testUnregisteredFocusableTree3.node1').focus();

        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('unfocusable element focus()ed after registered node focused returns original tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testUnfocusableElement').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree1,
        );
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1').tabIndex = -1;
        document.getElementById('testFocusableTree1').focus();

        this.focusManager.unregisterTree(this.testFocusableTree1);

        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableTree1);

        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('unregistered tree focus()ed with prev node prior focused returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').focus();
        document.getElementById('testFocusableTree1.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('unregistered tree focus()ed with prev node recently focused returns new tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();
        document.getElementById('testFocusableTree2.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree2,
        );
      });

      test('unregistered tree focus()ed with prev node after unregistering returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();
        document.getElementById('testFocusableTree2.node1').focus();
        this.focusManager.unregisterTree(this.testFocusableTree1);

        document.getElementById('testFocusableTree1.node1').focus();

        // Attempting to focus a now removed tree should result in nothing being
        // focused since the removed tree can have DOM focus, but that focus is
        // ignored by FocusManager.
        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('nested tree focusTree()ed with no prev focus returns nested tree', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);
        document.getElementById('testFocusableNestedTree4').tabIndex = -1;

        document.getElementById('testFocusableNestedTree4').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableNestedTree4,
        );
      });

      test('nested tree node focusNode()ed with no prev focus returns nested tree', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);
        document.getElementById('testFocusableNestedTree4.node1').tabIndex = -1;

        document.getElementById('testFocusableNestedTree4.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableNestedTree4,
        );
      });

      test('nested tree node focusNode()ed after parent focused returns nested tree', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableNestedTree4.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').focus();

        document.getElementById('testFocusableNestedTree4.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableNestedTree4,
        );
      });
    });
    suite('getFocusedNode()', function () {
      test('registered root focus()ed no prev focus returns root node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1').tabIndex = -1;

        document.getElementById('testFocusableTree1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree1.getRootFocusableNode(),
        );
      });

      test('registered node focus()ed no prev focus returns node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;

        document.getElementById('testFocusableTree1.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree1Node1,
        );
      });

      test('registered subnode focus()ed no prev focus returns subnode', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1.child1').tabIndex =
          -1;

        document.getElementById('testFocusableTree1.node1.child1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree1Node1Child1,
        );
      });

      test('registered node focus()ed after prev node focus returns new node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node2').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testFocusableTree1.node2').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree1Node2,
        );
      });

      test('registered node focus()ed after prev node focus diff tree returns new node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testFocusableTree2.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree2Node1,
        );
      });

      test('registered tree root focus()ed after prev node focus diff tree returns new root', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testFocusableTree2').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree2.getRootFocusableNode(),
        );
      });

      test('non-registered node subelement focus()ed returns nearest node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById(
          'testFocusableTree1.node2.unregisteredChild1',
        ).tabIndex = -1;

        document
          .getElementById('testFocusableTree1.node2.unregisteredChild1')
          .focus();

        // The nearest node of the unregistered child element should take focus.
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree1Node2,
        );
      });

      test('non-registered tree focus()ed returns null', function () {
        document.getElementById('testUnregisteredFocusableTree3').tabIndex = -1;

        document.getElementById('testUnregisteredFocusableTree3').focus();

        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('non-registered tree node focus()ed returns null', function () {
        document.getElementById(
          'testUnregisteredFocusableTree3.node1',
        ).tabIndex = -1;

        document.getElementById('testUnregisteredFocusableTree3.node1').focus();

        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('non-registered tree node focus()ed after registered node focused returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById(
          'testUnregisteredFocusableTree3.node1',
        ).tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testUnregisteredFocusableTree3.node1').focus();

        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('unfocusable element focus()ed after registered node focused returns original node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testUnfocusableElement').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree1Node1,
        );
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1').tabIndex = -1;
        document.getElementById('testFocusableTree1').focus();

        this.focusManager.unregisterTree(this.testFocusableTree1);

        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableTree1);

        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('unregistered tree focus()ed with prev node prior focused returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').focus();
        document.getElementById('testFocusableTree1.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('unregistered tree focus()ed with prev node recently focused returns new node', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();
        document.getElementById('testFocusableTree2.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree2Node1,
        );
      });

      test('unregistered tree focus()ed with prev node after unregistering returns null', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();
        document.getElementById('testFocusableTree2.node1').focus();
        this.focusManager.unregisterTree(this.testFocusableTree1);

        document.getElementById('testFocusableTree1.node1').focus();

        // Attempting to focus a now removed tree should result in nothing being
        // focused since the removed tree can have DOM focus, but that focus is
        // ignored by FocusManager.
        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('nested tree focus()ed with no prev focus returns nested root', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);
        document.getElementById('testFocusableNestedTree4').tabIndex = -1;

        document.getElementById('testFocusableNestedTree4').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableNestedTree4.getRootFocusableNode(),
        );
      });

      test('nested tree node focus()ed with no prev focus returns focused node', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);
        document.getElementById('testFocusableNestedTree4.node1').tabIndex = -1;

        document.getElementById('testFocusableNestedTree4.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableNestedTree4Node1,
        );
      });

      test('nested tree node focus()ed after parent focused returns focused node', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableNestedTree4.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').focus();

        document.getElementById('testFocusableNestedTree4.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableNestedTree4Node1,
        );
      });

      test('deletion after focus() returns null', function () {
        const rootElem = document.createElement('div');
        const nodeElem = document.createElement('div');
        rootElem.setAttribute('id', 'focusRoot');
        rootElem.setAttribute('tabindex', '-1');
        nodeElem.setAttribute('id', 'focusNode');
        nodeElem.setAttribute('tabindex', '-1');
        nodeElem.textContent = 'Focusable node';
        rootElem.appendChild(nodeElem);
        document.body.appendChild(rootElem);
        const root = this.createFocusableTree('focusRoot');
        const node = this.createFocusableNode(root, 'focusNode');
        this.focusManager.registerTree(root);
        document.getElementById('focusNode').tabIndex = -1;
        document.getElementById('focusNode').focus();

        node.getFocusableElement().remove();

        assert.notStrictEqual(this.focusManager.getFocusedNode(), node);
        rootElem.remove(); // Cleanup.
      });

      test('after focus() after trying to focusNode() an unfocusable node updates returns focus()ed node', function () {
        this.testFocusableTree1Node1.canBeFocused = () => false;
        document.getElementById('testFocusableTree1.node2').tabIndex = -1;
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        document.getElementById('testFocusableTree1.node2').focus();

        // focus()ing a new node should overwrite a failed attempt to focusNode() an unfocusable
        // node. This verifies that DOM focus syncing is properly reenabled by FocusManager.
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree1Node2,
        );
      });

      test('after focus() after trying to focusNode() the same node twice returns focus()ed node', function () {
        document.getElementById('testFocusableTree1.node2').tabIndex = -1;
        this.focusManager.registerTree(this.testFocusableTree1);
        // Intentionally try to focus the same node twice.
        this.focusManager.focusNode(this.testFocusableTree1Node1);
        this.focusManager.focusNode(this.testFocusableTree1Node1);

        document.getElementById('testFocusableTree1.node2').focus();

        // focus()ing a new node should overwrite a failed attempt to focusNode() the same node
        // twice. This verifies that DOM focus syncing is properly reenabled by FocusManager.
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree1Node2,
        );
      });
    });
    suite('CSS classes', function () {
      test('registered root focus()ed no prev focus returns root elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1').tabIndex = -1;

        document.getElementById('testFocusableTree1').focus();

        const rootElem = this.testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed no prev focus node elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;

        document.getElementById('testFocusableTree1.node1').focus();

        const nodeElem = this.testFocusableTree1Node1.getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus same tree old node elem has no focus property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node2').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testFocusableTree1.node2').focus();

        const prevNodeElem = this.testFocusableTree1Node1.getFocusableElement();
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus same tree new node elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node2').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testFocusableTree1.node2').focus();

        const newNodeElem = this.testFocusableTree1Node2.getFocusableElement();
        assert.includesClass(
          newNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          newNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus diff tree old node elem has passive property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testFocusableTree2.node1').focus();

        const prevNodeElem = this.testFocusableTree1Node1.getFocusableElement();
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus diff tree new node elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testFocusableTree2.node1').focus();

        const newNodeElem = this.testFocusableTree2Node1.getFocusableElement();
        assert.includesClass(
          newNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          newNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree root focus()ed after prev node focus diff tree new root has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testFocusableTree2').focus();

        const rootElem = this.testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('non-registered node subelement focus()ed nearest node has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById(
          'testFocusableTree1.node2.unregisteredChild1',
        ).tabIndex = -1;

        document
          .getElementById('testFocusableTree1.node2.unregisteredChild1')
          .focus();

        // The nearest node of the unregistered child element should be actively focused.
        const nodeElem = this.testFocusableTree1Node2.getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('non-registered tree focus()ed has no focus', function () {
        document.getElementById('testUnregisteredFocusableTree3').tabIndex = -1;

        document.getElementById('testUnregisteredFocusableTree3').focus();

        assert.isNull(this.focusManager.getFocusedNode());
        const rootElem = document.getElementById(
          'testUnregisteredFocusableTree3',
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('non-registered tree node focus()ed has no focus', function () {
        document.getElementById(
          'testUnregisteredFocusableTree3.node1',
        ).tabIndex = -1;

        document.getElementById('testUnregisteredFocusableTree3.node1').focus();

        assert.isNull(this.focusManager.getFocusedNode());
        const nodeElem = document.getElementById(
          'testUnregisteredFocusableTree3.node1',
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unfocsable element focus()ed after registered node focused original node has active focus', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        document.getElementById('testUnfocusableElement').focus();

        // The original node should be unchanged, and the unregistered node should not have any
        // focus indicators.
        const nodeElem = document.getElementById('testFocusableTree1.node1');
        const attemptedNewNodeElem = document.getElementById(
          'testUnfocusableElement',
        );
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          attemptedNewNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          attemptedNewNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with no prev focus removes focus', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1').tabIndex = -1;
        document.getElementById('testFocusableTree1').focus();

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators.
        const rootElem = this.testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with no prev focus removes focus', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators.
        const nodeElem = this.testFocusableTree1Node1.getFocusableElement();
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with prev node prior removes focus from removed tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').focus();
        document.getElementById('testFocusableTree1.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators. However, the old node
        // should still have passive indication.
        const otherNodeElem =
          this.testFocusableTree2Node1.getFocusableElement();
        const removedNodeElem =
          this.testFocusableTree1Node1.getFocusableElement();
        assert.includesClass(
          otherNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          otherNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with prev node recently removes focus from removed tree', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();
        document.getElementById('testFocusableTree2.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators. However, the new node
        // should still have active indication.
        const otherNodeElem =
          this.testFocusableTree2Node1.getFocusableElement();
        const removedNodeElem =
          this.testFocusableTree1Node1.getFocusableElement();
        assert.includesClass(
          otherNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          otherNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with prev node after unregistering removes active indicator', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();
        document.getElementById('testFocusableTree2.node1').focus();
        this.focusManager.unregisterTree(this.testFocusableTree1);

        document.getElementById('testFocusableTree1.node1').focus();

        // Attempting to focus a now removed tree should remove active.
        const otherNodeElem =
          this.testFocusableTree2Node1.getFocusableElement();
        const removedNodeElem =
          this.testFocusableTree1Node1.getFocusableElement();
        assert.notIncludesClass(
          otherNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          otherNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focus() multiple nodes in same tree with switches ensure passive focus has gone', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node2').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();
        document.getElementById('testFocusableTree2.node1').focus();

        document.getElementById('testFocusableTree1.node2').focus();

        // When switching back to the first tree, ensure the original passive node is no longer
        // passive now that the new node is active.
        const node1 = this.testFocusableTree1Node1.getFocusableElement();
        const node2 = this.testFocusableTree1Node2.getFocusableElement();
        assert.notIncludesClass(
          node1.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          node2.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focus()ed other tree node passively focused tree node now has active property', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').focus();
        document.getElementById('testFocusableTree2.node1').focus();

        document.getElementById('testFocusableTree1').focus();

        // Directly refocusing a tree's root should have functional parity with focusTree(). That
        // means the tree's previous node should now have active focus again and its root should
        // have no focus indication.
        const rootElem = this.testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        const nodeElem = this.testFocusableTree1Node1.getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focus on root, node in diff tree, then node in first tree; root should have focus gone', function () {
        this.focusManager.registerTree(this.testFocusableTree1);
        this.focusManager.registerTree(this.testFocusableTree2);
        document.getElementById('testFocusableTree1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1.node1').tabIndex = -1;
        document.getElementById('testFocusableTree1').focus();
        document.getElementById('testFocusableTree2.node1').focus();

        document.getElementById('testFocusableTree1.node1').focus();

        const nodeElem = this.testFocusableTree1Node1.getFocusableElement();
        const rootElem = this.testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree focus()ed with no prev root has active focus', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);
        document.getElementById('testFocusableNestedTree4').tabIndex = -1;

        document.getElementById('testFocusableNestedTree4').focus();

        const rootElem = this.testFocusableNestedTree4
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focus()ed with no prev focus node has active focus', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);
        document.getElementById('testFocusableNestedTree4.node1').tabIndex = -1;

        document.getElementById('testFocusableNestedTree4.node1').focus();

        const nodeElem =
          this.testFocusableNestedTree4Node1.getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focus()ed after parent focused prev has passive node has active', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableNestedTree4);
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableNestedTree4.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').focus();

        document.getElementById('testFocusableNestedTree4.node1').focus();

        const prevNodeElem = this.testFocusableTree2Node1.getFocusableElement();
        const currNodeElem =
          this.testFocusableNestedTree4Node1.getFocusableElement();
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          currNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });
    });
  });

  /* Focus tests for SVG trees. */

  suite('focus*() switching in SVG tree', function () {
    suite('getFocusedTree()', function () {
      test('registered tree focusTree()ed no prev focus returns tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);

        this.focusManager.focusTree(this.testFocusableGroup1);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup1,
        );
      });

      test('registered tree focusTree()ed prev node focused returns tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusTree(this.testFocusableGroup1);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup1,
        );
      });

      test('registered tree focusTree()ed diff tree prev focused returns new tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusTree(this.testFocusableGroup1);

        this.focusManager.focusTree(this.testFocusableGroup2);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup2,
        );
      });

      test('registered tree focusTree()ed diff tree node prev focused returns new tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusTree(this.testFocusableGroup2);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup2,
        );
      });

      test('registered root focusNode()ed no prev focus returns tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);

        this.focusManager.focusNode(
          this.testFocusableGroup1.getRootFocusableNode(),
        );

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup1,
        );
      });

      test("registered node focusNode()ed no prev focus returns node's tree", function () {
        this.focusManager.registerTree(this.testFocusableGroup1);

        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup1,
        );
      });

      test("registered subnode focusNode()ed no prev focus returns node's tree", function () {
        this.focusManager.registerTree(this.testFocusableGroup1);

        this.focusManager.focusNode(this.testFocusableGroup1Node1Child1);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup1,
        );
      });

      test('registered node focusNode()ed after prev node focus returns same tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusNode(this.testFocusableGroup1Node2);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup1,
        );
      });

      test("registered node focusNode()ed after prev node focus diff tree returns new node's tree", function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup2,
        );
      });

      test("registered tree root focusNode()ed after prev node focus diff tree returns new node's tree", function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusNode(
          this.testFocusableGroup2.getRootFocusableNode(),
        );

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup2,
        );
      });

      test('unregistered tree focusTree()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.focusTree(this.testFocusableGroup1);

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('unregistered tree focusNode()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('unregistered tree focusNode()ed with prev node prior focused returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('unregistered tree focusNode()ed with prev node recently focused returns new tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup2,
        );
      });

      test('nested tree focusTree()ed with no prev focus returns nested tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);

        this.focusManager.focusTree(this.testFocusableNestedGroup4);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableNestedGroup4,
        );
      });

      test('nested tree node focusNode()ed with no prev focus returns nested tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);

        this.focusManager.focusNode(this.testFocusableNestedGroup4Node1);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableNestedGroup4,
        );
      });

      test('nested tree node focusNode()ed after parent focused returns nested tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        this.focusManager.focusNode(this.testFocusableNestedGroup4Node1);

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableNestedGroup4,
        );
      });
    });
    suite('getFocusedNode()', function () {
      test('registered tree focusTree()ed no prev focus returns root node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);

        this.focusManager.focusTree(this.testFocusableGroup1);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup1.getRootFocusableNode(),
        );
      });

      test('registered tree focusTree()ed prev node focused returns original node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusTree(this.testFocusableGroup1);

        // The original node retains focus since the tree already holds focus (per focusTree's
        // contract).
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup1Node1,
        );
      });

      test('registered tree focusTree()ed diff tree prev focused returns new root node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusTree(this.testFocusableGroup1);

        this.focusManager.focusTree(this.testFocusableGroup2);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup2.getRootFocusableNode(),
        );
      });

      test('registered tree focusTree()ed diff tree node prev focused returns new root node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusTree(this.testFocusableGroup2);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup2.getRootFocusableNode(),
        );
      });

      test('registered root focusNode()ed no prev focus returns root node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);

        this.focusManager.focusNode(
          this.testFocusableGroup1.getRootFocusableNode(),
        );

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup1.getRootFocusableNode(),
        );
      });

      test('registered node focusNode()ed no prev focus returns node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);

        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup1Node1,
        );
      });

      test('registered subnode focusNode()ed no prev focus returns subnode', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);

        this.focusManager.focusNode(this.testFocusableGroup1Node1Child1);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup1Node1Child1,
        );
      });

      test('registered node focusNode()ed after prev node focus returns new node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusNode(this.testFocusableGroup1Node2);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup1Node2,
        );
      });

      test('registered node focusNode()ed after prev node focus diff tree returns new node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup2Node1,
        );
      });

      test('registered tree root focusNode()ed after prev node focus diff tree returns new root', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusNode(
          this.testFocusableGroup2.getRootFocusableNode(),
        );

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup2.getRootFocusableNode(),
        );
      });

      test('unregistered tree focusTree()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.focusTree(this.testFocusableGroup1);

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('unregistered tree focusNode()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('unregistered tree focusNode()ed with prev node prior focused returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('unregistered tree focusNode()ed with prev node recently focused returns new node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup2Node1,
        );
      });

      test('nested tree focusTree()ed with no prev focus returns nested root', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);

        this.focusManager.focusTree(this.testFocusableNestedGroup4);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableNestedGroup4.getRootFocusableNode(),
        );
      });

      test('nested tree node focusNode()ed with no prev focus returns focused node', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);

        this.focusManager.focusNode(this.testFocusableNestedGroup4Node1);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableNestedGroup4Node1,
        );
      });

      test('nested tree node focusNode()ed after parent focused returns focused node', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        this.focusManager.focusNode(this.testFocusableNestedGroup4Node1);

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableNestedGroup4Node1,
        );
      });
    });
    suite('CSS classes', function () {
      test('registered tree focusTree()ed no prev focus root elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);

        this.focusManager.focusTree(this.testFocusableGroup1);

        const rootElem = this.testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed prev node focused original elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusTree(this.testFocusableGroup1);

        // The original node retains active focus since the tree already holds focus (per
        // focusTree's contract).
        const nodeElem = this.testFocusableGroup1Node1.getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed diff tree prev focused new root elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusTree(this.testFocusableGroup1);

        this.focusManager.focusTree(this.testFocusableGroup2);

        const rootElem = this.testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed diff tree node prev focused new root elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusTree(this.testFocusableGroup2);

        const rootElem = this.testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered root focusNode()ed no prev focus returns root elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);

        this.focusManager.focusNode(
          this.testFocusableGroup1.getRootFocusableNode(),
        );

        const rootElem = this.testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed no prev focus node elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);

        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        const nodeElem = this.testFocusableGroup1Node1.getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus same tree old node elem has no focus property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusNode(this.testFocusableGroup1Node2);

        const prevNodeElem =
          this.testFocusableGroup1Node1.getFocusableElement();
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus same tree new node elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusNode(this.testFocusableGroup1Node2);

        const newNodeElem = this.testFocusableGroup1Node2.getFocusableElement();
        assert.includesClass(
          newNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          newNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus diff tree old node elem has passive property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        const prevNodeElem =
          this.testFocusableGroup1Node1.getFocusableElement();
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus diff tree new node elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        const newNodeElem = this.testFocusableGroup2Node1.getFocusableElement();
        assert.includesClass(
          newNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          newNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree root focusNode()ed after prev node focus diff tree new root has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.focusNode(
          this.testFocusableGroup2.getRootFocusableNode(),
        );

        const rootElem = this.testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusTree()ed with no prev focus removes focus', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.focusTree(this.testFocusableGroup1);

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators.
        const rootElem = this.testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusNode()ed with no prev focus removes focus', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators.
        const nodeElem = this.testFocusableGroup1Node1.getFocusableElement();
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusNode()ed with prev node prior removes focus from removed tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators. However, the old node
        // should still have passive indication.
        const otherNodeElem =
          this.testFocusableGroup2Node1.getFocusableElement();
        const removedNodeElem =
          this.testFocusableGroup1Node1.getFocusableElement();
        assert.includesClass(
          otherNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          otherNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusNode()ed with prev node recently removes focus from removed tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators. However, the new node
        // should still have active indication.
        const otherNodeElem =
          this.testFocusableGroup2Node1.getFocusableElement();
        const removedNodeElem =
          this.testFocusableGroup1Node1.getFocusableElement();
        assert.includesClass(
          otherNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          otherNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focusNode() multiple nodes in same tree with switches ensure passive focus has gone', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        this.focusManager.focusNode(this.testFocusableGroup1Node2);

        // When switching back to the first tree, ensure the original passive node is no longer
        // passive now that the new node is active.
        const node1 = this.testFocusableGroup1Node1.getFocusableElement();
        const node2 = this.testFocusableGroup1Node2.getFocusableElement();
        assert.notIncludesClass(
          node1.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          node2.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed other tree node passively focused tree node now has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        this.focusManager.focusTree(this.testFocusableGroup1);

        // The original node in the tree should be moved from passive to active focus per the
        // contract of focusTree). Also, the root of the tree should have no focus indication.
        const nodeElem = this.testFocusableGroup1Node1.getFocusableElement();
        const rootElem = this.testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focus on root, node in diff tree, then node in first tree; root should have focus gone', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusTree(this.testFocusableGroup1);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        const nodeElem = this.testFocusableGroup1Node1.getFocusableElement();
        const rootElem = this.testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree focusTree()ed with no prev root has active focus', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);

        this.focusManager.focusTree(this.testFocusableNestedGroup4);

        const rootElem = this.testFocusableNestedGroup4
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focusNode()ed with no prev focus node has active focus', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);

        this.focusManager.focusNode(this.testFocusableNestedGroup4Node1);

        const nodeElem =
          this.testFocusableNestedGroup4Node1.getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focusNode()ed after parent focused prev has passive node has active', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        this.focusManager.focusNode(this.testFocusableNestedGroup4Node1);

        const prevNodeElem =
          this.testFocusableGroup2Node1.getFocusableElement();
        const currNodeElem =
          this.testFocusableNestedGroup4Node1.getFocusableElement();
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          currNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });
    });
  });

  suite('DOM focus() switching in SVG tree', function () {
    suite('getFocusedTree()', function () {
      test('registered root focus()ed no prev focus returns tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1').tabIndex = -1;

        document.getElementById('testFocusableGroup1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup1,
        );
      });

      test("registered node focus()ed no prev focus returns node's tree", function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;

        document.getElementById('testFocusableGroup1.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup1,
        );
      });

      test("registered subnode focus()ed no prev focus returns node's tree", function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1.child1').tabIndex =
          -1;

        document.getElementById('testFocusableGroup1.node1.child1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup1,
        );
      });

      test('registered node focus()ed after prev node focus returns same tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node2').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document.getElementById('testFocusableGroup1.node2').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup1,
        );
      });

      test("registered node focus()ed after prev node focus diff tree returns new node's tree", function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document.getElementById('testFocusableGroup2.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup2,
        );
      });

      test("registered tree root focus()ed after prev node focus diff tree returns new node's tree", function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document.getElementById('testFocusableGroup2').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup2,
        );
      });

      test("non-registered node subelement focus()ed returns node's tree", function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById(
          'testFocusableGroup1.node2.unregisteredChild1',
        ).tabIndex = -1;

        document
          .getElementById('testFocusableGroup1.node2.unregisteredChild1')
          .focus();

        // The tree of the unregistered child element should take focus.
        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup1,
        );
      });

      test('non-registered tree focus()ed returns null', function () {
        document.getElementById('testUnregisteredFocusableGroup3').tabIndex =
          -1;

        document.getElementById('testUnregisteredFocusableGroup3').focus();

        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('non-registered tree node focus()ed returns null', function () {
        document.getElementById(
          'testUnregisteredFocusableGroup3.node1',
        ).tabIndex = -1;

        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          .focus();

        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('non-registered tree node focus()ed after registered node focused returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById(
          'testUnregisteredFocusableGroup3.node1',
        ).tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          .focus();

        // Attempting to focus a now removed tree should result in nothing being
        // focused since the removed tree can have DOM focus, but that focus is
        // ignored by FocusManager.
        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1').tabIndex = -1;
        document.getElementById('testFocusableGroup1').focus();

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('unregistered tree focus()ed with prev node prior focused returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').focus();
        document.getElementById('testFocusableGroup1.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('unregistered tree focus()ed with prev node recently focused returns new tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();
        document.getElementById('testFocusableGroup2.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup2,
        );
      });

      test('unregistered tree focus()ed with prev node after unregistering returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();
        document.getElementById('testFocusableGroup2.node1').focus();
        this.focusManager.unregisterTree(this.testFocusableGroup1);

        document.getElementById('testFocusableGroup1.node1').focus();

        // Attempting to focus a now removed tree should result in nothing being
        // focused since the removed tree can have DOM focus, but that focus is
        // ignored by FocusManager.
        assert.isNull(this.focusManager.getFocusedTree());
      });

      test('nested tree focusTree()ed with no prev focus returns nested tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);
        document.getElementById('testFocusableNestedGroup4').tabIndex = -1;

        document.getElementById('testFocusableNestedGroup4').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableNestedGroup4,
        );
      });

      test('nested tree node focusNode()ed with no prev focus returns nested tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);
        document.getElementById('testFocusableNestedGroup4.node1').tabIndex =
          -1;

        document.getElementById('testFocusableNestedGroup4.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableNestedGroup4,
        );
      });

      test('nested tree node focusNode()ed after parent focused returns nested tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableNestedGroup4.node1').tabIndex =
          -1;
        document.getElementById('testFocusableGroup2.node1').focus();

        document.getElementById('testFocusableNestedGroup4.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableNestedGroup4,
        );
      });
    });
    suite('getFocusedNode()', function () {
      test('registered root focus()ed no prev focus returns root node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1').tabIndex = -1;

        document.getElementById('testFocusableGroup1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup1.getRootFocusableNode(),
        );
      });

      test('registered node focus()ed no prev focus returns node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;

        document.getElementById('testFocusableGroup1.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup1Node1,
        );
      });

      test('registered subnode focus()ed no prev focus returns subnode', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1.child1').tabIndex =
          -1;

        document.getElementById('testFocusableGroup1.node1.child1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup1Node1Child1,
        );
      });

      test('registered node focus()ed after prev node focus returns new node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node2').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document.getElementById('testFocusableGroup1.node2').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup1Node2,
        );
      });

      test('registered node focus()ed after prev node focus diff tree returns new node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document.getElementById('testFocusableGroup2.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup2Node1,
        );
      });

      test('registered tree root focus()ed after prev node focus diff tree returns new root', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document.getElementById('testFocusableGroup2').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup2.getRootFocusableNode(),
        );
      });

      test('non-registered node subelement focus()ed returns nearest node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById(
          'testFocusableGroup1.node2.unregisteredChild1',
        ).tabIndex = -1;

        document
          .getElementById('testFocusableGroup1.node2.unregisteredChild1')
          .focus();

        // The nearest node of the unregistered child element should take focus.
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup1Node2,
        );
      });

      test('non-registered tree focus()ed returns null', function () {
        document.getElementById('testUnregisteredFocusableGroup3').tabIndex =
          -1;

        document.getElementById('testUnregisteredFocusableGroup3').focus();

        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('non-registered tree node focus()ed returns null', function () {
        document.getElementById(
          'testUnregisteredFocusableGroup3.node1',
        ).tabIndex = -1;

        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          .focus();

        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('non-registered tree node focus()ed after registered node focused returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById(
          'testUnregisteredFocusableGroup3.node1',
        ).tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          .focus();

        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('unfocusable element focus()ed after registered node focused returns original node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document.getElementById('testUnfocusableElement').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup1Node1,
        );
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1').tabIndex = -1;
        document.getElementById('testFocusableGroup1').focus();

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('unregistered tree focus()ed with prev node prior focused returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').focus();
        document.getElementById('testFocusableGroup1.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('unregistered tree focus()ed with prev node recently focused returns new node', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();
        document.getElementById('testFocusableGroup2.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup2Node1,
        );
      });

      test('unregistered tree focus()ed with prev node after unregistering returns null', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();
        document.getElementById('testFocusableGroup2.node1').focus();
        this.focusManager.unregisterTree(this.testFocusableGroup1);

        document.getElementById('testFocusableGroup1.node1').focus();

        // Attempting to focus a now removed tree should result in nothing being
        // focused since the removed tree can have DOM focus, but that focus is
        // ignored by FocusManager.
        assert.isNull(this.focusManager.getFocusedNode());
      });

      test('nested tree focus()ed with no prev focus returns nested root', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);
        document.getElementById('testFocusableNestedGroup4').tabIndex = -1;

        document.getElementById('testFocusableNestedGroup4').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableNestedGroup4.getRootFocusableNode(),
        );
      });

      test('nested tree node focus()ed with no prev focus returns focused node', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);
        document.getElementById('testFocusableNestedGroup4.node1').tabIndex =
          -1;

        document.getElementById('testFocusableNestedGroup4.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableNestedGroup4Node1,
        );
      });

      test('nested tree node focus()ed after parent focused returns focused node', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableNestedGroup4.node1').tabIndex =
          -1;
        document.getElementById('testFocusableGroup2.node1').focus();

        document.getElementById('testFocusableNestedGroup4.node1').focus();

        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableNestedGroup4Node1,
        );
      });

      test('after focus() after trying to focusNode() an unfocusable node updates returns focus()ed node', function () {
        this.testFocusableGroup1Node1.canBeFocused = () => false;
        document.getElementById('testFocusableGroup1.node2').tabIndex = -1;
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        document.getElementById('testFocusableGroup1.node2').focus();

        // focus()ing a new node should overwrite a failed attempt to focusNode() an unfocusable
        // node. This verifies that DOM focus syncing is properly reenabled by FocusManager.
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup1Node2,
        );
      });

      test('after focus() after trying to focusNode() the same node twice returns focus()ed node', function () {
        document.getElementById('testFocusableGroup1.node2').tabIndex = -1;
        this.focusManager.registerTree(this.testFocusableGroup1);
        // Intentionally try to focus the same node twice.
        this.focusManager.focusNode(this.testFocusableGroup1Node1);
        this.focusManager.focusNode(this.testFocusableGroup1Node1);

        document.getElementById('testFocusableGroup1.node2').focus();

        // focus()ing a new node should overwrite a failed attempt to focusNode() the same node
        // twice. This verifies that DOM focus syncing is properly reenabled by FocusManager.
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup1Node2,
        );
      });
    });
    suite('CSS classes', function () {
      test('registered root focus()ed no prev focus returns root elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1').tabIndex = -1;

        document.getElementById('testFocusableGroup1').focus();

        const rootElem = this.testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed no prev focus node elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;

        document.getElementById('testFocusableGroup1.node1').focus();

        const nodeElem = this.testFocusableGroup1Node1.getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus same tree old node elem has no focus property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node2').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document.getElementById('testFocusableGroup1.node2').focus();

        const prevNodeElem =
          this.testFocusableGroup1Node1.getFocusableElement();
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus same tree new node elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node2').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document.getElementById('testFocusableGroup1.node2').focus();

        const newNodeElem = this.testFocusableGroup1Node2.getFocusableElement();
        assert.includesClass(
          newNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          newNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus diff tree old node elem has passive property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document.getElementById('testFocusableGroup2.node1').focus();

        const prevNodeElem =
          this.testFocusableGroup1Node1.getFocusableElement();
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus diff tree new node elem has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document.getElementById('testFocusableGroup2.node1').focus();

        const newNodeElem = this.testFocusableGroup2Node1.getFocusableElement();
        assert.includesClass(
          newNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          newNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree root focus()ed after prev node focus diff tree new root has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document.getElementById('testFocusableGroup2').focus();

        const rootElem = this.testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('non-registered node subelement focus()ed nearest node has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById(
          'testFocusableGroup1.node2.unregisteredChild1',
        ).tabIndex = -1;

        document
          .getElementById('testFocusableGroup1.node2.unregisteredChild1')
          .focus();

        // The nearest node of the unregistered child element should be actively focused.
        const nodeElem = this.testFocusableGroup1Node2.getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('non-registered tree focus()ed has no focus', function () {
        document.getElementById('testUnregisteredFocusableGroup3').tabIndex =
          -1;

        document.getElementById('testUnregisteredFocusableGroup3').focus();

        assert.isNull(this.focusManager.getFocusedNode());
        const rootElem = document.getElementById(
          'testUnregisteredFocusableGroup3',
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('non-registered tree node focus()ed has no focus', function () {
        document.getElementById(
          'testUnregisteredFocusableGroup3.node1',
        ).tabIndex = -1;

        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          .focus();

        assert.isNull(this.focusManager.getFocusedNode());
        const nodeElem = document.getElementById(
          'testUnregisteredFocusableGroup3.node1',
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unfocusable element focus()ed after registered node focused original node has active focus', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        document.getElementById('testUnfocusableElement').focus();

        // The original node should be unchanged, and the unregistered node should not have any
        // focus indicators.
        const nodeElem = document.getElementById('testFocusableGroup1.node1');
        const attemptedNewNodeElem = document.getElementById(
          'testUnfocusableElement',
        );
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          attemptedNewNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          attemptedNewNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with no prev focus removes focus', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1').tabIndex = -1;
        document.getElementById('testFocusableGroup1').focus();

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators.
        const rootElem = this.testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with no prev focus removes focus', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators.
        const nodeElem = this.testFocusableGroup1Node1.getFocusableElement();
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with prev node prior removes focus from removed tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').focus();
        document.getElementById('testFocusableGroup1.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators. However, the old node
        // should still have passive indication.
        const otherNodeElem =
          this.testFocusableGroup2Node1.getFocusableElement();
        const removedNodeElem =
          this.testFocusableGroup1Node1.getFocusableElement();
        assert.includesClass(
          otherNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          otherNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with prev node recently removes focus from removed tree', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();
        document.getElementById('testFocusableGroup2.node1').focus();

        this.focusManager.unregisterTree(this.testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators. However, the new node
        // should still have active indication.
        const otherNodeElem =
          this.testFocusableGroup2Node1.getFocusableElement();
        const removedNodeElem =
          this.testFocusableGroup1Node1.getFocusableElement();
        assert.includesClass(
          otherNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          otherNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with prev node after unregistering removes active indicator', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();
        document.getElementById('testFocusableGroup2.node1').focus();
        this.focusManager.unregisterTree(this.testFocusableGroup1);

        document.getElementById('testFocusableGroup1.node1').focus();

        // Attempting to focus a now removed tree should remove active.
        const otherNodeElem =
          this.testFocusableGroup2Node1.getFocusableElement();
        const removedNodeElem =
          this.testFocusableGroup1Node1.getFocusableElement();
        assert.notIncludesClass(
          otherNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          otherNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          removedNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focus() multiple nodes in same tree with switches ensure passive focus has gone', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node2').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();
        document.getElementById('testFocusableGroup2.node1').focus();

        document.getElementById('testFocusableGroup1.node2').focus();

        // When switching back to the first tree, ensure the original passive node is no longer
        // passive now that the new node is active.
        const node1 = this.testFocusableGroup1Node1.getFocusableElement();
        const node2 = this.testFocusableGroup1Node2.getFocusableElement();
        assert.notIncludesClass(
          node1.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          node2.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focus()ed other tree node passively focused tree node now has active property', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').focus();
        document.getElementById('testFocusableGroup2.node1').focus();

        document.getElementById('testFocusableGroup1').focus();

        // Directly refocusing a tree's root should have functional parity with focusTree(). That
        // means the tree's previous node should now have active focus again and its root should
        // have no focus indication.
        const rootElem = this.testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        const nodeElem = this.testFocusableGroup1Node1.getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focus on root, node in diff tree, then node in first tree; root should have focus gone', function () {
        this.focusManager.registerTree(this.testFocusableGroup1);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup1').focus();
        document.getElementById('testFocusableGroup2.node1').focus();

        document.getElementById('testFocusableGroup1.node1').focus();

        const nodeElem = this.testFocusableGroup1Node1.getFocusableElement();
        const rootElem = this.testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree focus()ed with no prev root has active focus', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);
        document.getElementById('testFocusableNestedGroup4').tabIndex = -1;

        document.getElementById('testFocusableNestedGroup4').focus();

        const rootElem = this.testFocusableNestedGroup4
          .getRootFocusableNode()
          .getFocusableElement();
        assert.includesClass(
          rootElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          rootElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focus()ed with no prev focus node has active focus', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);
        document.getElementById('testFocusableNestedGroup4.node1').tabIndex =
          -1;

        document.getElementById('testFocusableNestedGroup4.node1').focus();

        const nodeElem =
          this.testFocusableNestedGroup4Node1.getFocusableElement();
        assert.includesClass(
          nodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          nodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focus()ed after parent focused prev has passive node has active', function () {
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.registerTree(this.testFocusableNestedGroup4);
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableNestedGroup4.node1').tabIndex =
          -1;
        document.getElementById('testFocusableGroup2.node1').focus();

        document.getElementById('testFocusableNestedGroup4.node1').focus();

        const prevNodeElem =
          this.testFocusableGroup2Node1.getFocusableElement();
        const currNodeElem =
          this.testFocusableNestedGroup4Node1.getFocusableElement();
        assert.notIncludesClass(
          prevNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          currNodeElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currNodeElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });
    });
  });

  /* High-level focus/defocusing tests. */
  suite('Defocusing and refocusing', function () {
    test('Defocusing actively focused root HTML tree switches to passive highlight', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.focusTree(this.testFocusableTree2);
      document.getElementById('testUnregisteredFocusableTree3').tabIndex = -1;

      document.getElementById('testUnregisteredFocusableTree3').focus();

      const rootNode = this.testFocusableTree2.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      assert.isNull(this.focusManager.getFocusedTree());
      assert.isNull(this.focusManager.getFocusedNode());
      assert.includesClass(
        rootElem.classList,
        FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assert.notIncludesClass(
        rootElem.classList,
        FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    });

    test('Defocusing actively focused HTML tree node switches to passive highlight', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.focusNode(this.testFocusableTree2Node1);
      document.getElementById('testUnregisteredFocusableTree3').tabIndex = -1;

      document.getElementById('testUnregisteredFocusableTree3').focus();

      const nodeElem = this.testFocusableTree2Node1.getFocusableElement();
      assert.isNull(this.focusManager.getFocusedTree());
      assert.isNull(this.focusManager.getFocusedNode());
      assert.includesClass(
        nodeElem.classList,
        FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assert.notIncludesClass(
        nodeElem.classList,
        FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    });

    test('Defocusing actively focused HTML subtree node switches to passive highlight', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableNestedTree4);
      this.focusManager.focusNode(this.testFocusableNestedTree4Node1);
      document.getElementById('testUnregisteredFocusableTree3').tabIndex = -1;

      document.getElementById('testUnregisteredFocusableTree3').focus();

      const nodeElem = this.testFocusableNestedTree4Node1.getFocusableElement();
      assert.isNull(this.focusManager.getFocusedTree());
      assert.isNull(this.focusManager.getFocusedNode());
      assert.includesClass(
        nodeElem.classList,
        FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assert.notIncludesClass(
        nodeElem.classList,
        FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    });

    test('Refocusing actively focused root HTML tree restores to active highlight', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.focusTree(this.testFocusableTree2);
      document.getElementById('testUnregisteredFocusableTree3').tabIndex = -1;
      document.getElementById('testFocusableTree2').tabIndex = -1;
      document.getElementById('testUnregisteredFocusableTree3').focus();

      document.getElementById('testFocusableTree2').focus();

      const rootNode = this.testFocusableTree2.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      assert.strictEqual(
        this.focusManager.getFocusedTree(),
        this.testFocusableTree2,
      );
      assert.strictEqual(this.focusManager.getFocusedNode(), rootNode);
      assert.notIncludesClass(
        rootElem.classList,
        FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assert.includesClass(
        rootElem.classList,
        FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    });

    test('Refocusing actively focused HTML tree node restores to active highlight', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.focusNode(this.testFocusableTree2Node1);
      document.getElementById('testUnregisteredFocusableTree3').tabIndex = -1;
      document.getElementById('testFocusableTree2.node1').tabIndex = -1;
      document.getElementById('testUnregisteredFocusableTree3').focus();

      document.getElementById('testFocusableTree2.node1').focus();

      const nodeElem = this.testFocusableTree2Node1.getFocusableElement();
      assert.strictEqual(
        this.focusManager.getFocusedTree(),
        this.testFocusableTree2,
      );
      assert.strictEqual(
        this.focusManager.getFocusedNode(),
        this.testFocusableTree2Node1,
      );
      assert.notIncludesClass(
        nodeElem.classList,
        FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assert.includesClass(
        nodeElem.classList,
        FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    });

    test('Refocusing actively focused HTML subtree node restores to active highlight', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableNestedTree4);
      this.focusManager.focusNode(this.testFocusableNestedTree4Node1);
      document.getElementById('testUnregisteredFocusableTree3').tabIndex = -1;
      document.getElementById('testFocusableNestedTree4.node1').tabIndex = -1;
      document.getElementById('testUnregisteredFocusableTree3').focus();

      document.getElementById('testFocusableNestedTree4.node1').focus();

      const nodeElem = this.testFocusableNestedTree4Node1.getFocusableElement();
      assert.strictEqual(
        this.focusManager.getFocusedTree(),
        this.testFocusableNestedTree4,
      );
      assert.strictEqual(
        this.focusManager.getFocusedNode(),
        this.testFocusableNestedTree4Node1,
      );
      assert.notIncludesClass(
        nodeElem.classList,
        FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assert.includesClass(
        nodeElem.classList,
        FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    });
  });

  /* Combined HTML/SVG tree focus tests. */

  suite('HTML/SVG focus tree switching', function () {
    suite('Focus HTML tree then SVG tree', function () {
      test('HTML focusTree()ed then SVG focusTree()ed correctly updates getFocusedTree() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusTree(this.testFocusableTree2);

        this.focusManager.focusTree(this.testFocusableGroup2);

        const prevElem = this.testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        const currElem = this.testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup2,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML focusTree()ed then SVG focusNode()ed correctly updates getFocusedNode() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusTree(this.testFocusableTree2);

        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        const prevElem = this.testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        const currElem = this.testFocusableGroup2Node1.getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML focusTree()ed then SVG DOM focus()ed correctly updates getFocusedNode() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusTree(this.testFocusableTree2);
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;

        document.getElementById('testFocusableGroup2.node1').focus();

        const prevElem = this.testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        const currElem = this.testFocusableGroup2Node1.getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML focusNode()ed then SVG focusTree()ed correctly updates getFocusedTree() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableTree2Node1);

        this.focusManager.focusTree(this.testFocusableGroup2);

        const prevElem = this.testFocusableTree2Node1.getFocusableElement();
        const currElem = this.testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup2,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML focusNode()ed then SVG focusNode()ed correctly updates getFocusedNode() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableTree2Node1);

        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        const prevElem = this.testFocusableTree2Node1.getFocusableElement();
        const currElem = this.testFocusableGroup2Node1.getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML focusNode()ed then SVG DOM focus()ed correctly updates getFocusedNode() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableTree2Node1);
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;

        document.getElementById('testFocusableGroup2.node1').focus();

        const prevElem = this.testFocusableTree2Node1.getFocusableElement();
        const currElem = this.testFocusableGroup2Node1.getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML DOM focus()ed then SVG focusTree()ed correctly updates getFocusedTree() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').focus();

        this.focusManager.focusTree(this.testFocusableGroup2);

        const prevElem = this.testFocusableTree2Node1.getFocusableElement();
        const currElem = this.testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableGroup2,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML DOM focus()ed then SVG focusNode()ed correctly updates getFocusedNode() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').focus();

        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        const prevElem = this.testFocusableTree2Node1.getFocusableElement();
        const currElem = this.testFocusableGroup2Node1.getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML DOM focus()ed then SVG DOM focus()ed correctly updates getFocusedNode() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').focus();

        document.getElementById('testFocusableGroup2.node1').focus();

        const prevElem = this.testFocusableTree2Node1.getFocusableElement();
        const currElem = this.testFocusableGroup2Node1.getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableGroup2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });
    });
    suite('Focus SVG tree then HTML tree', function () {
      test('SVG focusTree()ed then HTML focusTree()ed correctly updates getFocusedTree() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusTree(this.testFocusableGroup2);

        this.focusManager.focusTree(this.testFocusableTree2);

        const prevElem = this.testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        const currElem = this.testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree2,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG focusTree()ed then HTML focusNode()ed correctly updates getFocusedNode() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusTree(this.testFocusableGroup2);

        this.focusManager.focusNode(this.testFocusableTree2Node1);

        const prevElem = this.testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        const currElem = this.testFocusableTree2Node1.getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG focusTree()ed then HTML DOM focus()ed correctly updates getFocusedNode() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusTree(this.testFocusableGroup2);
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;

        document.getElementById('testFocusableTree2.node1').focus();

        const prevElem = this.testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        const currElem = this.testFocusableTree2Node1.getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG focusNode()ed then HTML focusTree()ed correctly updates getFocusedTree() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        this.focusManager.focusTree(this.testFocusableTree2);

        const prevElem = this.testFocusableGroup2Node1.getFocusableElement();
        const currElem = this.testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree2,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG focusNode()ed then HTML focusNode()ed correctly updates getFocusedNode() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);

        this.focusManager.focusNode(this.testFocusableTree2Node1);

        const prevElem = this.testFocusableGroup2Node1.getFocusableElement();
        const currElem = this.testFocusableTree2Node1.getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG focusNode()ed then HTML DOM focus()ed correctly updates getFocusedNode() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        this.focusManager.focusNode(this.testFocusableGroup2Node1);
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;

        document.getElementById('testFocusableTree2.node1').focus();

        const prevElem = this.testFocusableGroup2Node1.getFocusableElement();
        const currElem = this.testFocusableTree2Node1.getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG DOM focus()ed then HTML focusTree()ed correctly updates getFocusedTree() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').focus();

        this.focusManager.focusTree(this.testFocusableTree2);

        const prevElem = this.testFocusableGroup2Node1.getFocusableElement();
        const currElem = this.testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedTree(),
          this.testFocusableTree2,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG DOM focus()ed then HTML focusNode()ed correctly updates getFocusedNode() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').focus();

        this.focusManager.focusNode(this.testFocusableTree2Node1);

        const prevElem = this.testFocusableGroup2Node1.getFocusableElement();
        const currElem = this.testFocusableTree2Node1.getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG DOM focus()ed then HTML DOM focus()ed correctly updates getFocusedNode() and indicators', function () {
        this.focusManager.registerTree(this.testFocusableTree2);
        this.focusManager.registerTree(this.testFocusableGroup2);
        document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
        document.getElementById('testFocusableTree2.node1').tabIndex = -1;
        document.getElementById('testFocusableGroup2.node1').focus();

        document.getElementById('testFocusableTree2.node1').focus();

        const prevElem = this.testFocusableGroup2Node1.getFocusableElement();
        const currElem = this.testFocusableTree2Node1.getFocusableElement();
        assert.strictEqual(
          this.focusManager.getFocusedNode(),
          this.testFocusableTree2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assert.includesClass(
          currElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          currElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.notIncludesClass(
          prevElem.classList,
          FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assert.includesClass(
          prevElem.classList,
          FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });
    });
  });

  /* Ephemeral focus tests. */

  suite('takeEphemeralFocus()', function () {
    setup(function () {
      // Ensure ephemeral-specific elements are focusable.
      document.getElementById('nonTreeElementForEphemeralFocus').tabIndex = -1;
      document.getElementById('nonTreeGroupForEphemeralFocus').tabIndex = -1;
    });
    teardown(function () {
      // Ensure ephemeral-specific elements have their tab indexes reset for a clean state.
      document
        .getElementById('nonTreeElementForEphemeralFocus')
        .removeAttribute('tabindex');
      document
        .getElementById('nonTreeGroupForEphemeralFocus')
        .removeAttribute('tabindex');
    });

    test('with no focused node does not change states', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);

      const ephemeralElement = document.getElementById(
        'nonTreeElementForEphemeralFocus',
      );
      this.focusManager.takeEphemeralFocus(ephemeralElement);

      // Taking focus without an existing node having focus should change no focus indicators.
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      const passiveElems = Array.from(
        document.querySelectorAll(PASSIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.isEmpty(activeElems);
      assert.isEmpty(passiveElems);
    });

    test('with focused node changes focused node to passive', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);
      this.focusManager.focusNode(this.testFocusableTree2Node1);

      const ephemeralElement = document.getElementById(
        'nonTreeElementForEphemeralFocus',
      );
      this.focusManager.takeEphemeralFocus(ephemeralElement);

      // Taking focus without an existing node having focus should change no focus indicators.
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      const passiveElems = Array.from(
        document.querySelectorAll(PASSIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.isEmpty(activeElems);
      assert.strictEqual(passiveElems.length, 1);
      assert.includesClass(
        this.testFocusableTree2Node1.getFocusableElement().classList,
        FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    });

    test('focuses provided HTML element', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);

      const ephemeralElement = document.getElementById(
        'nonTreeElementForEphemeralFocus',
      );
      this.focusManager.takeEphemeralFocus(ephemeralElement);

      assert.strictEqual(document.activeElement, ephemeralElement);
    });

    test('focuses provided SVG element', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);

      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      this.focusManager.takeEphemeralFocus(ephemeralElement);

      assert.strictEqual(document.activeElement, ephemeralElement);
    });

    test('twice for without finishing previous throws error', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);
      const ephemeralGroupElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      const ephemeralDivElement = document.getElementById(
        'nonTreeElementForEphemeralFocus',
      );
      this.focusManager.takeEphemeralFocus(ephemeralGroupElement);

      const errorMsgRegex =
        /Attempted to take ephemeral focus when it's already held+?/;
      assert.throws(
        () => this.focusManager.takeEphemeralFocus(ephemeralDivElement),
        errorMsgRegex,
      );
    });

    test('then focusTree() changes getFocusedTree() but not active state', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);
      this.focusManager.focusTree(this.testFocusableTree2);
      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      this.focusManager.takeEphemeralFocus(ephemeralElement);

      this.focusManager.focusTree(this.testFocusableGroup2);

      assert.strictEqual(
        this.focusManager.getFocusedTree(),
        this.testFocusableGroup2,
      );
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.isEmpty(activeElems);
    });

    test('then focusNode() changes getFocusedNode() but not active state', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);
      this.focusManager.focusNode(this.testFocusableTree2Node1);
      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      this.focusManager.takeEphemeralFocus(ephemeralElement);

      this.focusManager.focusNode(this.testFocusableGroup2Node1);

      assert.strictEqual(
        this.focusManager.getFocusedNode(),
        this.testFocusableGroup2Node1,
      );
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.isEmpty(activeElems);
    });

    test('then DOM refocus changes getFocusedNode() but not active state', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);
      this.focusManager.focusNode(this.testFocusableTree2Node1);
      document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      this.focusManager.takeEphemeralFocus(ephemeralElement);

      // Force focus to change via the DOM.
      document.getElementById('testFocusableGroup2.node1').focus();

      // The focus() state change will affect getFocusedNode() but it will not cause the node to now
      // be active.
      assert.strictEqual(
        this.focusManager.getFocusedNode(),
        this.testFocusableGroup2Node1,
      );
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.isEmpty(activeElems);
    });

    test('then finish ephemeral callback with no node does not change indicators', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);
      const ephemeralElement = document.getElementById(
        'nonTreeElementForEphemeralFocus',
      );
      const finishFocusCallback =
        this.focusManager.takeEphemeralFocus(ephemeralElement);

      finishFocusCallback();

      // Finishing ephemeral focus without a previously focused node should not change indicators.
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      const passiveElems = Array.from(
        document.querySelectorAll(PASSIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.isEmpty(activeElems);
      assert.isEmpty(passiveElems);
    });

    test('again after finishing previous empheral focus should focus new element', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);
      const ephemeralGroupElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      const ephemeralDivElement = document.getElementById(
        'nonTreeElementForEphemeralFocus',
      );
      const finishFocusCallback = this.focusManager.takeEphemeralFocus(
        ephemeralGroupElement,
      );

      finishFocusCallback();
      this.focusManager.takeEphemeralFocus(ephemeralDivElement);

      // An exception should not be thrown and the new element should receive focus.
      assert.strictEqual(document.activeElement, ephemeralDivElement);
    });

    test('calling ephemeral callback twice throws error', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);
      const ephemeralElement = document.getElementById(
        'nonTreeElementForEphemeralFocus',
      );
      const finishFocusCallback =
        this.focusManager.takeEphemeralFocus(ephemeralElement);
      finishFocusCallback();

      const errorMsgRegex =
        /Attempted to finish ephemeral focus twice for element+?/;
      assert.throws(() => finishFocusCallback(), errorMsgRegex);
    });

    test('then finish ephemeral callback should restore focused node', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);
      this.focusManager.focusNode(this.testFocusableTree2Node1);
      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      const finishFocusCallback =
        this.focusManager.takeEphemeralFocus(ephemeralElement);

      finishFocusCallback();

      // The original focused node should be restored.
      const nodeElem = this.testFocusableTree2Node1.getFocusableElement();
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.strictEqual(
        this.focusManager.getFocusedNode(),
        this.testFocusableTree2Node1,
      );
      assert.strictEqual(activeElems.length, 1);
      assert.includesClass(
        nodeElem.classList,
        FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assert.strictEqual(document.activeElement, nodeElem);
    });

    test('then focusTree() and finish ephemeral callback correctly sets new active state', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);
      this.focusManager.focusTree(this.testFocusableTree2);
      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      const finishFocusCallback =
        this.focusManager.takeEphemeralFocus(ephemeralElement);

      this.focusManager.focusTree(this.testFocusableGroup2);
      finishFocusCallback();

      // The tree's root should now be the active element since focus changed between the start and
      // end of the ephemeral flow.
      const rootElem = this.testFocusableGroup2
        .getRootFocusableNode()
        .getFocusableElement();
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.strictEqual(
        this.focusManager.getFocusedTree(),
        this.testFocusableGroup2,
      );
      assert.strictEqual(activeElems.length, 1);
      assert.includesClass(
        rootElem.classList,
        FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assert.strictEqual(document.activeElement, rootElem);
    });

    test('then focusNode() and finish ephemeral callback correctly sets new active state', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);
      this.focusManager.focusNode(this.testFocusableTree2Node1);
      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      const finishFocusCallback =
        this.focusManager.takeEphemeralFocus(ephemeralElement);

      this.focusManager.focusNode(this.testFocusableGroup2Node1);
      finishFocusCallback();

      // The tree's root should now be the active element since focus changed between the start and
      // end of the ephemeral flow.
      const nodeElem = this.testFocusableGroup2Node1.getFocusableElement();
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.strictEqual(
        this.focusManager.getFocusedNode(),
        this.testFocusableGroup2Node1,
      );
      assert.strictEqual(activeElems.length, 1);
      assert.includesClass(
        nodeElem.classList,
        FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assert.strictEqual(document.activeElement, nodeElem);
    });

    test('then DOM focus change and finish ephemeral callback correctly sets new active state', function () {
      this.focusManager.registerTree(this.testFocusableTree2);
      this.focusManager.registerTree(this.testFocusableGroup2);
      this.focusManager.focusNode(this.testFocusableTree2Node1);
      document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      const finishFocusCallback =
        this.focusManager.takeEphemeralFocus(ephemeralElement);

      document.getElementById('testFocusableGroup2.node1').focus();
      finishFocusCallback();

      // The tree's root should now be the active element since focus changed between the start and
      // end of the ephemeral flow.
      const nodeElem = this.testFocusableGroup2Node1.getFocusableElement();
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.strictEqual(
        this.focusManager.getFocusedNode(),
        this.testFocusableGroup2Node1,
      );
      assert.strictEqual(activeElems.length, 1);
      assert.includesClass(
        nodeElem.classList,
        FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assert.strictEqual(document.activeElement, nodeElem);
    });
  });
});
