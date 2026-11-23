/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import sinon from 'sinon';
import {FocusableTreeImpl} from './test_helpers/focusable_tree.ts';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('FocusManager', function () {
  const ACTIVE_FOCUS_NODE_CSS_SELECTOR = `.${Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME}`;
  const PASSIVE_FOCUS_NODE_CSS_SELECTOR = `.${Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME}`;

  let focusManager: Blockly.FocusManager;
  let allFocusableTrees: FocusableTreeImpl[];
  let allFocusableNodes: Blockly.IFocusableNode[];

  function createFocusableTree(
    rootElementId: string,
    nestedTrees?: FocusableTreeImpl[],
  ): InstanceType<typeof FocusableTreeImpl> {
    const node = document.getElementById(rootElementId);
    assert.exists(node);
    const tree = new FocusableTreeImpl(node, nestedTrees || []);
    allFocusableTrees.push(tree);
    return tree;
  }

  function createFocusableNode(tree: FocusableTreeImpl, elementId: string) {
    const element = document.getElementById(elementId);
    assert.exists(element);
    const node = tree.addNode(element);
    allFocusableNodes.push(node);
    return node;
  }

  let testFocusableTree1: FocusableTreeImpl;
  let testFocusableTree1Node1: Blockly.IFocusableNode;
  let testFocusableTree1Node1Child1: Blockly.IFocusableNode;
  let testFocusableTree1Node2: Blockly.IFocusableNode;

  let testFocusableNestedTree4: FocusableTreeImpl;
  let testFocusableNestedTree4Node1: Blockly.IFocusableNode;
  let testFocusableNestedTree5: FocusableTreeImpl;

  let testFocusableTree2: FocusableTreeImpl;
  let testFocusableTree2Node1: Blockly.IFocusableNode;

  let testFocusableGroup1: FocusableTreeImpl;
  let testFocusableGroup1Node1: Blockly.IFocusableNode;
  let testFocusableGroup1Node1Child1: Blockly.IFocusableNode;
  let testFocusableGroup1Node2: Blockly.IFocusableNode;
  let testFocusableNestedGroup4: FocusableTreeImpl;
  let testFocusableNestedGroup4Node1: Blockly.IFocusableNode;
  let testFocusableGroup2: FocusableTreeImpl;
  let testFocusableGroup2Node1: Blockly.IFocusableNode;
  let globalDocumentEventListeners: {type: string; listener: () => void}[];

  setup(function (this: Mocha.Context) {
    ({globalDocumentEventListeners} = sharedTestSetup.call(this));
    focusManager = Blockly.getFocusManager();

    allFocusableTrees = [];
    allFocusableNodes = [];
    testFocusableTree1 = createFocusableTree('testFocusableTree1');
    testFocusableTree1Node1 = createFocusableNode(
      testFocusableTree1,
      'testFocusableTree1.node1',
    );
    testFocusableTree1Node1Child1 = createFocusableNode(
      testFocusableTree1,
      'testFocusableTree1.node1.child1',
    );
    testFocusableTree1Node2 = createFocusableNode(
      testFocusableTree1,
      'testFocusableTree1.node2',
    );
    testFocusableNestedTree4 = createFocusableTree('testFocusableNestedTree4');
    testFocusableNestedTree4Node1 = createFocusableNode(
      testFocusableNestedTree4,
      'testFocusableNestedTree4.node1',
    );
    testFocusableNestedTree5 = createFocusableTree('testFocusableNestedTree5');
    testFocusableTree2 = createFocusableTree('testFocusableTree2', [
      testFocusableNestedTree4,
      testFocusableNestedTree5,
    ]);
    testFocusableTree2Node1 = createFocusableNode(
      testFocusableTree2,
      'testFocusableTree2.node1',
    );

    testFocusableGroup1 = createFocusableTree('testFocusableGroup1');
    testFocusableGroup1Node1 = createFocusableNode(
      testFocusableGroup1,
      'testFocusableGroup1.node1',
    );
    testFocusableGroup1Node1Child1 = createFocusableNode(
      testFocusableGroup1,
      'testFocusableGroup1.node1.child1',
    );
    testFocusableGroup1Node2 = createFocusableNode(
      testFocusableGroup1,
      'testFocusableGroup1.node2',
    );
    testFocusableNestedGroup4 = createFocusableTree(
      'testFocusableNestedGroup4',
    );
    testFocusableNestedGroup4Node1 = createFocusableNode(
      testFocusableNestedGroup4,
      'testFocusableNestedGroup4.node1',
    );
    testFocusableGroup2 = createFocusableTree('testFocusableGroup2', [
      testFocusableNestedGroup4,
    ]);
    testFocusableGroup2Node1 = createFocusableNode(
      testFocusableGroup2,
      'testFocusableGroup2.node1',
    );
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this);

    // Ensure all node CSS styles are reset so that state isn't leaked between tests.
    const activeElems = document.querySelectorAll(
      ACTIVE_FOCUS_NODE_CSS_SELECTOR,
    );
    const passiveElems = document.querySelectorAll(
      PASSIVE_FOCUS_NODE_CSS_SELECTOR,
    );
    for (const elem of activeElems) {
      elem.classList.remove(
        Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    }
    for (const elem of passiveElems) {
      elem.classList.remove(
        Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    }

    // Ensure any set tab indexes are properly reset between tests.
    for (const tree of allFocusableTrees) {
      tree
        .getRootFocusableNode()
        .getFocusableElement()
        .removeAttribute('tabindex');
    }
    for (const node of allFocusableNodes) {
      node.getFocusableElement().removeAttribute('tabindex');
    }
    allFocusableTrees = [];
    allFocusableNodes = [];

    // Reset the current active element.
    document.body.focus();
  });

  function assertIncludesClass(classList: DOMTokenList, className: string) {
    assert.isTrue(
      classList.contains(className),
      'Expected class list to include: ' + className,
    );
  }

  function assertNotIncludesClass(classList: DOMTokenList, className: string) {
    assert.isFalse(
      classList.contains(className),
      'Expected class list to not include: ' + className,
    );
  }

  /* Basic lifecycle tests. */

  suite('registerTree()', function () {
    test('once does not throw', function () {
      focusManager.registerTree(testFocusableTree1);

      // The test should pass due to no exception being thrown.
    });

    test('twice for same tree throws error', function () {
      focusManager.registerTree(testFocusableTree1);

      const errorMsgRegex =
        /Attempted to re-register already registered tree.+?/;
      assert.throws(
        () => focusManager.registerTree(testFocusableTree1),
        errorMsgRegex,
      );
    });

    test('twice with different trees does not throw', function () {
      focusManager.registerTree(testFocusableTree1);
      focusManager.registerTree(testFocusableGroup1);

      // The test shouldn't throw since two different trees were registered.
    });

    test('register after an unregister does not throw', function () {
      focusManager.registerTree(testFocusableTree1);
      focusManager.unregisterTree(testFocusableTree1);

      focusManager.registerTree(testFocusableTree1);

      // The second register should not fail since the tree was previously unregistered.
    });

    test('for tree with missing ID throws error', function () {
      const rootNode = testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      const oldId = rootElem.id;
      rootElem.removeAttribute('id');

      const errorMsgRegex =
        /Attempting to register a tree with a root element that has an invalid ID.+?/;
      assert.throws(
        () => focusManager.registerTree(testFocusableTree1),
        errorMsgRegex,
      );
      // Restore the ID for other tests.
      rootElem.id = oldId;
    });

    test('for tree with null ID throws error', function () {
      const rootNode = testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      const oldId = rootElem.id;
      rootElem.removeAttribute('id');

      const errorMsgRegex =
        /Attempting to register a tree with a root element that has an invalid ID.+?/;
      assert.throws(
        () => focusManager.registerTree(testFocusableTree1),
        errorMsgRegex,
      );
      // Restore the ID for other tests.
      rootElem.id = oldId;
    });

    test('for tree with empty throws error', function () {
      const rootNode = testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      const oldId = rootElem.id;
      rootElem.setAttribute('id', '');

      const errorMsgRegex =
        /Attempting to register a tree with a root element that has an invalid ID.+?/;
      assert.throws(
        () => focusManager.registerTree(testFocusableTree1),
        errorMsgRegex,
      );
      // Restore the ID for other tests.
      rootElem.id = oldId;
    });

    test('for unmanaged tree does not overwrite tab index', function () {
      focusManager.registerTree(testFocusableTree1, false);

      const rootNode = testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      assert.isNull(rootElem.getAttribute('tabindex'));
    });

    test('for unmanaged tree with custom tab index does not overwrite tab index', function () {
      const rootNode = testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      rootElem?.setAttribute('tabindex', '-1');

      focusManager.registerTree(testFocusableTree1, false);

      // The custom tab index shouldn't be overwritten for an unmanaged tree.
      assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
    });

    test('for managed tree overwrites root tab index to be tab navigable', function () {
      focusManager.registerTree(testFocusableTree1, true);

      const rootNode = testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      assert.strictEqual(rootElem.getAttribute('tabindex'), '0');
    });

    test('for managed tree with custom tab index overwrites root tab index to be tab navigable', function () {
      const rootNode = testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      rootElem?.setAttribute('tabindex', '-1');

      focusManager.registerTree(testFocusableTree1, true);

      // A custom tab index should be overwritten for a managed tree.
      assert.strictEqual(rootElem.getAttribute('tabindex'), '0');
    });
  });

  suite('unregisterTree()', function () {
    test('for not yet registered tree throws', function () {
      const errorMsgRegex = /Attempted to unregister not registered tree.+?/;
      assert.throws(
        () => focusManager.unregisterTree(testFocusableTree1),
        errorMsgRegex,
      );
    });

    test('for registered tree does not throw', function () {
      focusManager.registerTree(testFocusableTree1);

      focusManager.unregisterTree(testFocusableTree1);

      // Unregistering a registered tree should not fail.
    });

    test('twice for registered tree throws', function () {
      focusManager.registerTree(testFocusableTree1);
      focusManager.unregisterTree(testFocusableTree1);

      const errorMsgRegex = /Attempted to unregister not registered tree.+?/;
      assert.throws(
        () => focusManager.unregisterTree(testFocusableTree1),
        errorMsgRegex,
      );
    });

    test('for unmanaged tree with custom tab index does not change tab index', function () {
      focusManager.registerTree(testFocusableTree1, false);
      const rootNode = testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      rootElem?.setAttribute('tabindex', '-1');

      focusManager.unregisterTree(testFocusableTree1);

      // Unregistering an unmanaged tree shouldn't change its tab index.
      assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
    });

    test('for managed tree removes tab index', function () {
      focusManager.registerTree(testFocusableTree1, true);

      focusManager.unregisterTree(testFocusableTree1);

      // Unregistering a managed tree should remove its tab index.
      const rootNode = testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      assert.isNull(rootElem.getAttribute('tabindex'));
    });

    test('for managed tree with custom tab index removes tab index', function () {
      focusManager.registerTree(testFocusableTree1, true);
      const rootNode = testFocusableTree1.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      rootElem?.setAttribute('tabindex', '-1');

      focusManager.unregisterTree(testFocusableTree1);

      // Unregistering a managed tree should remove its tab index.
      assert.isNull(rootElem.getAttribute('tabindex'));
    });
  });

  suite('isRegistered()', function () {
    test('for not registered tree returns false', function () {
      const isRegistered = focusManager.isRegistered(testFocusableTree1);

      assert.isFalse(isRegistered);
    });

    test('for registered tree returns true', function () {
      focusManager.registerTree(testFocusableTree1);

      const isRegistered = focusManager.isRegistered(testFocusableTree1);

      assert.isTrue(isRegistered);
    });

    test('for unregistered tree returns false', function () {
      focusManager.registerTree(testFocusableTree1);
      focusManager.unregisterTree(testFocusableTree1);

      const isRegistered = focusManager.isRegistered(testFocusableTree1);

      assert.isFalse(isRegistered);
    });

    test('for re-registered tree returns true', function () {
      focusManager.registerTree(testFocusableTree1);
      focusManager.unregisterTree(testFocusableTree1);
      focusManager.registerTree(testFocusableTree1);

      const isRegistered = focusManager.isRegistered(testFocusableTree1);

      assert.isTrue(isRegistered);
    });

    test('for unregistered tree with other registered tree returns false', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableTree1);
      focusManager.unregisterTree(testFocusableTree1);

      const isRegistered = focusManager.isRegistered(testFocusableTree1);

      assert.isFalse(isRegistered);
    });
  });

  suite('getFocusedTree()', function () {
    test('by default returns null', function () {
      const focusedTree = focusManager.getFocusedTree();

      assert.isNull(focusedTree);
    });
  });

  suite('getFocusedNode()', function () {
    test('by default returns null', function () {
      const focusedNode = focusManager.getFocusedNode();

      assert.isNull(focusedNode);
    });

    test('after focusing unfocusable node returns null', function () {
      testFocusableTree1Node1.canBeFocused = () => false;
      focusManager.registerTree(testFocusableTree1);
      focusManager.focusNode(testFocusableTree1Node1);

      const focusedNode = focusManager.getFocusedNode();

      // Unfocusable nodes should not be focused.
      assert.isNull(focusedNode);
    });
  });

  suite('getPreviouslyFocusedNode()', function () {
    test('by default returns null', function () {
      assert.isNull(focusManager.getPreviouslyFocusedNode());
    });

    test('after losing focus to untracked element returns prior node', function () {
      focusManager.registerTree(testFocusableTree1);
      focusManager.focusNode(testFocusableTree1Node1);

      document.body.focus();

      assert.isNull(focusManager.getFocusedNode());
      assert.strictEqual(
        focusManager.getPreviouslyFocusedNode(),
        testFocusableTree1Node1,
      );
    });
  });

  suite('focusTree()', function () {
    test('for not registered tree throws', function () {
      const errorMsgRegex = /Attempted to focus unregistered tree.+?/;
      assert.throws(
        () => focusManager.focusTree(testFocusableTree1),
        errorMsgRegex,
      );
    });

    test('for unregistered tree throws', function () {
      focusManager.registerTree(testFocusableTree1);
      focusManager.unregisterTree(testFocusableTree1);

      const errorMsgRegex = /Attempted to focus unregistered tree.+?/;
      assert.throws(
        () => focusManager.focusTree(testFocusableTree1),
        errorMsgRegex,
      );
    });
  });

  test('unfocused node does not have a tab index by default', function () {
    const elem = testFocusableTree1Node1.getFocusableElement();

    // This is slightly testing the test setup, but it acts as a precondition sanity test for the
    // other tab index tests below. Important: 'getAttribute' is used here since direct access to
    // 'tabIndex' can default the value returned even when the tab index isn't set.
    assert.isNull(elem.getAttribute('tabindex'));
  });

  suite('focusNode()', function () {
    test('for not registered node throws', function () {
      const errorMsgRegex = /Attempted to focus unregistered node.+?/;
      assert.throws(
        () => focusManager.focusNode(testFocusableTree1Node1),
        errorMsgRegex,
      );
    });

    test('for unregistered node throws', function () {
      focusManager.registerTree(testFocusableTree1);
      focusManager.unregisterTree(testFocusableTree1);

      const errorMsgRegex = /Attempted to focus unregistered node.+?/;
      assert.throws(
        () => focusManager.focusNode(testFocusableTree1Node1),
        errorMsgRegex,
      );
    });

    test('focuses element', function () {
      focusManager.registerTree(testFocusableTree1);

      focusManager.focusNode(testFocusableTree1Node1);

      const nodeElem = testFocusableTree1Node1.getFocusableElement();
      assert.strictEqual(document.activeElement, nodeElem);
    });

    test('fires focusin event', function () {
      let focusCount = 0;
      const focusListener = () => focusCount++;
      document.addEventListener('focusin', focusListener);
      focusManager.registerTree(testFocusableTree1);

      focusManager.focusNode(testFocusableTree1Node1);
      document.removeEventListener('focusin', focusListener);

      // There should be exactly 1 focus event fired from focusNode().
      assert.strictEqual(focusCount, 1);
    });

    test('for orphaned node returns tree root by default', function () {
      focusManager.registerTree(testFocusableTree1);
      testFocusableTree1.removeNode(testFocusableTree1Node1);

      focusManager.focusNode(testFocusableTree1Node1);

      // Focusing an invalid node should fall back to the tree root when it has no restoration
      // fallback node.
      const currentNode = focusManager.getFocusedNode();
      const treeRoot = testFocusableTree1.getRootFocusableNode();
      assert.strictEqual(currentNode, treeRoot);
    });

    test('for orphaned node returns specified fallback node', function () {
      focusManager.registerTree(testFocusableTree1);
      testFocusableTree1.fallbackNode = testFocusableTree1Node2;
      testFocusableTree1.removeNode(testFocusableTree1Node1);

      focusManager.focusNode(testFocusableTree1Node1);

      // Focusing an invalid node should fall back to the restored fallback.
      const currentNode = focusManager.getFocusedNode();
      assert.strictEqual(currentNode, testFocusableTree1Node2);
    });

    test('restores focus when element quietly loses focus', function () {
      focusManager.registerTree(testFocusableTree1);
      focusManager.focusNode(testFocusableTree1Node1);
      // Remove the FocusManager's listeners to simulate not receiving a focus
      // event when focus is lost. This can happen in Firefox and Safari when an
      // element is removed and then re-added to the DOM. This is a contrived
      // setup to achieve the same outcome on all browsers. For context, see:
      // https://github.com/google/blockly-keyboard-experimentation/issues/87.
      for (const registeredListener of globalDocumentEventListeners) {
        const eventType = registeredListener.type;
        const eventListener = registeredListener.listener;
        document.removeEventListener(eventType, eventListener);
      }
      document.body.focus();

      focusManager.focusNode(testFocusableTree1Node1);

      const currentNode = focusManager.getFocusedNode();
      const currentElem = currentNode?.getFocusableElement();
      assert.strictEqual(currentNode, testFocusableTree1Node1);
      assert.strictEqual(document.activeElement, currentElem);
    });

    test('restores focus when element and new node focused', function () {
      focusManager.registerTree(testFocusableTree1);
      focusManager.focusNode(testFocusableTree1Node1);
      // Remove the FocusManager's listeners to simulate not receiving a focus
      // event when focus is lost. This can happen in Firefox and Safari when an
      // element is removed and then re-added to the DOM. This is a contrived
      // setup to achieve the same outcome on all browsers. For context, see:
      // https://github.com/google/blockly-keyboard-experimentation/issues/87.
      for (const registeredListener of globalDocumentEventListeners) {
        const eventType = registeredListener.type;
        const eventListener = registeredListener.listener;
        document.removeEventListener(eventType, eventListener);
      }
      document.body.focus();

      focusManager.focusNode(testFocusableTree1Node2);

      const currentNode = focusManager.getFocusedNode();
      const currentElem = currentNode?.getFocusableElement();
      assert.strictEqual(currentNode, testFocusableTree1Node2);
      assert.strictEqual(document.activeElement, currentElem);
    });

    test('for unfocused node calls onNodeFocus once', function () {
      const focusSpy = sinon.spy(testFocusableTree1Node1, 'onNodeFocus');
      focusManager.registerTree(testFocusableTree1);

      focusManager.focusNode(testFocusableTree1Node1);

      assert.strictEqual(focusSpy.callCount, 1);
    });

    test('for previously focused node calls onNodeBlur once', function () {
      const blurSpy = sinon.spy(testFocusableTree1Node1, 'onNodeBlur');
      focusManager.registerTree(testFocusableTree1);
      focusManager.focusNode(testFocusableTree1Node1);

      focusManager.focusNode(testFocusableTree1Node2);

      assert.strictEqual(blurSpy.callCount, 1);
    });

    test('for unfocused tree calls onTreeFocus once', function () {
      const treeFocusSpy = sinon.spy(testFocusableTree1, 'onTreeFocus');
      focusManager.registerTree(testFocusableTree1);

      focusManager.focusNode(testFocusableTree1Node1);

      assert.strictEqual(treeFocusSpy.callCount, 1);
    });

    test('for previously focused tree calls onTreeBlur once', function () {
      const treeBlurSpy = sinon.spy(testFocusableTree1, 'onTreeBlur');
      focusManager.registerTree(testFocusableTree1);
      focusManager.registerTree(testFocusableTree2);
      focusManager.focusNode(testFocusableTree1Node1);

      focusManager.focusNode(testFocusableTree2Node1);

      assert.strictEqual(treeBlurSpy.callCount, 1);
    });

    test('for same node twice calls onNodeFocus once', function () {
      const nodeFocusSpy = sinon.spy(testFocusableTree1Node1, 'onNodeFocus');
      focusManager.registerTree(testFocusableTree1);
      focusManager.focusNode(testFocusableTree1Node1);

      // Call focus for the same node a second time.
      focusManager.focusNode(testFocusableTree1Node1);

      // Despite two calls to focus the node should only focus once.
      assert.strictEqual(nodeFocusSpy.callCount, 1);
    });

    test('for unfocusable node does not call onNodeFocus', function () {
      const nodeFocusSpy = sinon.spy(testFocusableTree1Node1, 'onNodeFocus');
      testFocusableTree1Node1.canBeFocused = () => false;
      focusManager.registerTree(testFocusableTree1);

      focusManager.focusNode(testFocusableTree1Node1);

      // Unfocusable nodes should not be focused, nor have their callbacks called.
      assert.strictEqual(nodeFocusSpy.callCount, 0);
    });

    test('for unfocused node overwrites tab index', function () {
      focusManager.registerTree(testFocusableTree1);

      focusManager.focusNode(testFocusableTree1Node1);

      // Focusing an element should overwrite its tab index.
      const elem = testFocusableTree1Node1.getFocusableElement();
      assert.strictEqual(elem.getAttribute('tabindex'), '-1');
    });

    test('for previously focused node keeps new tab index', function () {
      focusManager.registerTree(testFocusableTree1);
      focusManager.focusNode(testFocusableTree1Node1);

      focusManager.focusNode(testFocusableTree1Node2);

      // The previously focused element should retain its tab index.
      const elem = testFocusableTree1Node1.getFocusableElement();
      assert.strictEqual(elem.getAttribute('tabindex'), '-1');
    });

    test('for node with custom tab index does not change tab index', function () {
      focusManager.registerTree(testFocusableTree1);
      const elem = testFocusableTree1Node1.getFocusableElement();
      elem.tabIndex = 0;

      focusManager.focusNode(testFocusableTree1Node1);

      // If the node already has a tab index set then it should retain that index.
      assert.strictEqual(elem.getAttribute('tabindex'), '0');
    });

    suite('for unmanaged tree', function () {
      test('focused root overwrites tab index', function () {
        focusManager.registerTree(testFocusableTree1, false);
        const rootNode = testFocusableTree1.getRootFocusableNode();

        focusManager.focusNode(rootNode);

        // Focusing an unmanaged tree's root should overwrite its tab index.
        const rootElem = rootNode.getFocusableElement();
        assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
      });

      test('focused root with custom tab index does not change tab index', function () {
        focusManager.registerTree(testFocusableTree1, false);
        const rootNode = testFocusableTree1.getRootFocusableNode();
        const rootElem = rootNode.getFocusableElement();
        rootElem.tabIndex = 0;

        focusManager.focusNode(rootNode);

        // If the node already has a tab index set then it should retain that index.
        assert.strictEqual(rootElem.getAttribute('tabindex'), '0');
      });

      test('focused node in a tree after unmanaged was focused should keep previous root unchanged', function () {
        focusManager.registerTree(testFocusableTree1, false);
        focusManager.registerTree(testFocusableTree2, false);
        const rootNode = testFocusableTree1.getRootFocusableNode();
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusNode(testFocusableTree2Node1);

        // Focusing a different tree shouldn't change the root of the previous tree if it's unmanaged.
        const rootElem = rootNode.getFocusableElement();
        assert.isNull(rootElem.getAttribute('tabindex'));
      });

      test('focused node in a tree after unmanaged was root focused should make previous root tab navigable', function () {
        focusManager.registerTree(testFocusableTree1, false);
        focusManager.registerTree(testFocusableTree2, false);
        const rootNode = testFocusableTree1.getRootFocusableNode();
        focusManager.focusTree(testFocusableTree1);

        focusManager.focusNode(testFocusableTree2Node1);

        // The previous tree's root should be kept unchanged (since it was managed).
        const rootElem = rootNode.getFocusableElement();
        assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
      });
    });

    suite('for managed tree', function () {
      test('for unfocused node in managed tree overwrites tab index', function () {
        focusManager.registerTree(testFocusableTree1, true);

        focusManager.focusNode(testFocusableTree1Node1);

        // Focusing an element should overwrite its tab index.
        const elem = testFocusableTree1Node1.getFocusableElement();
        assert.strictEqual(elem.getAttribute('tabindex'), '-1');
      });

      test('for previously focused node in managed tree keeps new tab index', function () {
        focusManager.registerTree(testFocusableTree1, true);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusNode(testFocusableTree1Node2);

        // The previously focused element should retain its tab index.
        const elem = testFocusableTree1Node1.getFocusableElement();
        assert.strictEqual(elem.getAttribute('tabindex'), '-1');
      });

      test('focused root makes root non-tab navigable', function () {
        focusManager.registerTree(testFocusableTree1, true);
        const rootNode = testFocusableTree1.getRootFocusableNode();

        focusManager.focusNode(rootNode);

        // Focusing the root in a managed tree should make it non-tab navigable.
        const rootElem = rootNode.getFocusableElement();
        assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
      });

      test('focused root with custom tab index should overwrite tab index', function () {
        focusManager.registerTree(testFocusableTree1, true);
        const rootNode = testFocusableTree1.getRootFocusableNode();
        const rootElem = rootNode.getFocusableElement();
        rootElem.tabIndex = 0;

        focusManager.focusNode(rootNode);

        // Custom tab indexes are overwritten for the root in a managed tree.
        assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
      });

      test('focused node tree root makes root non-tab navigable', function () {
        focusManager.registerTree(testFocusableTree1, true);
        const rootNode = testFocusableTree1.getRootFocusableNode();

        focusManager.focusNode(testFocusableTree1Node1);

        // Focusing a node of a managed tree should make the root non-tab navigable.
        const rootElem = rootNode.getFocusableElement();
        assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
      });

      test('focused node root with custom tab index should overwrite tab index', function () {
        focusManager.registerTree(testFocusableTree1, true);
        const rootNode = testFocusableTree1.getRootFocusableNode();
        const rootElem = rootNode.getFocusableElement();
        rootElem.tabIndex = 0;

        focusManager.focusNode(testFocusableTree1Node1);

        // Custom tab indexes are overwritten for the root in a managed tree even when a tree's node
        // is focused.
        assert.strictEqual(rootElem.getAttribute('tabindex'), '-1');
      });

      test('focused node in a tree after managed was focused should make previous root tab navigable', function () {
        focusManager.registerTree(testFocusableTree1, true);
        focusManager.registerTree(testFocusableTree2, false);
        const rootNode = testFocusableTree1.getRootFocusableNode();
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusNode(testFocusableTree2Node1);

        // Focusing a different tree shouldn't after a managed tree should make the managed tree tab
        // navigable.
        const rootElem = rootNode.getFocusableElement();
        assert.strictEqual(rootElem.getAttribute('tabindex'), '0');
      });

      test('focused node in a tree after managed was root focused should make previous root tab navigable', function () {
        focusManager.registerTree(testFocusableTree1, true);
        focusManager.registerTree(testFocusableTree2, false);
        const rootNode = testFocusableTree1.getRootFocusableNode();
        focusManager.focusTree(testFocusableTree1);

        focusManager.focusNode(testFocusableTree2Node1);

        // Focusing a different tree shouldn't after a managed tree should make the managed tree tab
        // navigable.
        const rootElem = rootNode.getFocusableElement();
        assert.strictEqual(rootElem.getAttribute('tabindex'), '0');
      });
    });
  });

  suite('getFocusManager()', function () {
    test('returns non-null manager', function () {
      const manager = Blockly.getFocusManager();

      assert.isNotNull(manager);
    });

    test('returns the exact same instance in subsequent calls', function () {
      const manager1 = Blockly.getFocusManager();
      const manager2 = Blockly.getFocusManager();

      assert.strictEqual(manager2, manager1);
    });
  });

  /* Focus tests for HTML trees. */

  suite('focus*() switching in HTML tree', function () {
    suite('getFocusedTree()', function () {
      test('registered tree focusTree()ed no prev focus returns tree', function () {
        focusManager.registerTree(testFocusableTree1);

        focusManager.focusTree(testFocusableTree1);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree1);
      });

      test('registered tree focusTree()ed prev node focused returns tree', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusTree(testFocusableTree1);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree1);
      });

      test('registered tree focusTree()ed diff tree prev focused returns new tree', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusTree(testFocusableTree1);

        focusManager.focusTree(testFocusableTree2);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree2);
      });

      test('registered tree focusTree()ed diff tree node prev focused returns new tree', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusTree(testFocusableTree2);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree2);
      });

      test('registered root focusNode()ed no prev focus returns tree', function () {
        focusManager.registerTree(testFocusableTree1);

        focusManager.focusNode(testFocusableTree1.getRootFocusableNode());

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree1);
      });

      test("registered node focusNode()ed no prev focus returns node's tree", function () {
        focusManager.registerTree(testFocusableTree1);

        focusManager.focusNode(testFocusableTree1Node1);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree1);
      });

      test("registered subnode focusNode()ed no prev focus returns node's tree", function () {
        focusManager.registerTree(testFocusableTree1);

        focusManager.focusNode(testFocusableTree1Node1Child1);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree1);
      });

      test('registered node focusNode()ed after prev node focus returns same tree', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusNode(testFocusableTree1Node2);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree1);
      });

      test("registered node focusNode()ed after prev node focus diff tree returns new node's tree", function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusNode(testFocusableTree2Node1);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree2);
      });

      test("registered tree root focusNode()ed after prev node focus diff tree returns new node's tree", function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusNode(testFocusableTree2.getRootFocusableNode());

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree2);
      });

      test('unregistered tree focusTree()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.focusTree(testFocusableTree1);

        focusManager.unregisterTree(testFocusableTree1);

        assert.isNull(focusManager.getFocusedTree());
      });

      test('unregistered tree focusNode()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.unregisterTree(testFocusableTree1);

        assert.isNull(focusManager.getFocusedTree());
      });

      test('unregistered tree focusNode()ed with prev node prior focused returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree2Node1);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.unregisterTree(testFocusableTree1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(focusManager.getFocusedTree());
      });

      test('unregistered tree focusNode()ed with prev node recently focused returns new tree', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);
        focusManager.focusNode(testFocusableTree2Node1);

        focusManager.unregisterTree(testFocusableTree1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree2);
      });

      test('nested tree focusTree()ed with no prev focus returns nested tree', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);

        focusManager.focusTree(testFocusableNestedTree4);

        assert.strictEqual(
          focusManager.getFocusedTree(),
          testFocusableNestedTree4,
        );
      });

      test('nested tree node focusNode()ed with no prev focus returns nested tree', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);

        focusManager.focusNode(testFocusableNestedTree4Node1);

        assert.strictEqual(
          focusManager.getFocusedTree(),
          testFocusableNestedTree4,
        );
      });

      test('nested tree node focusNode()ed after parent focused returns nested tree', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);
        focusManager.focusNode(testFocusableTree2Node1);

        focusManager.focusNode(testFocusableNestedTree4Node1);

        assert.strictEqual(
          focusManager.getFocusedTree(),
          testFocusableNestedTree4,
        );
      });
    });
    suite('getFocusedNode()', function () {
      test('registered tree focusTree()ed no prev focus returns root node', function () {
        focusManager.registerTree(testFocusableTree1);

        focusManager.focusTree(testFocusableTree1);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree1.getRootFocusableNode(),
        );
      });

      test('registered tree focusTree()ed prev node focused returns original node', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusTree(testFocusableTree1);

        // The original node retains focus since the tree already holds focus (per focusTree's
        // contract).
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree1Node1,
        );
      });

      test('registered tree focusTree()ed diff tree prev focused returns new root node', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusTree(testFocusableTree1);

        focusManager.focusTree(testFocusableTree2);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree2.getRootFocusableNode(),
        );
      });

      test('registered tree focusTree()ed diff tree node prev focused returns new root node', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusTree(testFocusableTree2);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree2.getRootFocusableNode(),
        );
      });

      test('registered root focusNode()ed no prev focus returns root node', function () {
        focusManager.registerTree(testFocusableTree1);

        focusManager.focusNode(testFocusableTree1.getRootFocusableNode());

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree1.getRootFocusableNode(),
        );
      });

      test('registered node focusNode()ed no prev focus returns node', function () {
        focusManager.registerTree(testFocusableTree1);

        focusManager.focusNode(testFocusableTree1Node1);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree1Node1,
        );
      });

      test('registered subnode focusNode()ed no prev focus returns subnode', function () {
        focusManager.registerTree(testFocusableTree1);

        focusManager.focusNode(testFocusableTree1Node1Child1);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree1Node1Child1,
        );
      });

      test('registered node focusNode()ed after prev node focus returns new node', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusNode(testFocusableTree1Node2);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree1Node2,
        );
      });

      test('registered node focusNode()ed after prev node focus diff tree returns new node', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusNode(testFocusableTree2Node1);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree2Node1,
        );
      });

      test('registered tree root focusNode()ed after prev node focus diff tree returns new root', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusNode(testFocusableTree2.getRootFocusableNode());

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree2.getRootFocusableNode(),
        );
      });

      test('unregistered tree focusTree()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.focusTree(testFocusableTree1);

        focusManager.unregisterTree(testFocusableTree1);

        assert.isNull(focusManager.getFocusedNode());
      });

      test('unregistered tree focusNode()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.unregisterTree(testFocusableTree1);

        assert.isNull(focusManager.getFocusedNode());
      });

      test('unregistered tree focusNode()ed with prev node prior focused returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree2Node1);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.unregisterTree(testFocusableTree1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(focusManager.getFocusedNode());
      });

      test('unregistered tree focusNode()ed with prev node recently focused returns new node', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);
        focusManager.focusNode(testFocusableTree2Node1);

        focusManager.unregisterTree(testFocusableTree1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree2Node1,
        );
      });

      test('nested tree focusTree()ed with no prev focus returns nested root', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);

        focusManager.focusTree(testFocusableNestedTree4);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableNestedTree4.getRootFocusableNode(),
        );
      });

      test('nested tree node focusNode()ed with no prev focus returns focused node', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);

        focusManager.focusNode(testFocusableNestedTree4Node1);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableNestedTree4Node1,
        );
      });

      test('nested tree node focusNode()ed after parent focused returns focused node', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);
        focusManager.focusNode(testFocusableTree2Node1);

        focusManager.focusNode(testFocusableNestedTree4Node1);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableNestedTree4Node1,
        );
      });
    });
    suite('CSS classes', function () {
      test('registered tree focusTree()ed no prev focus root elem has active property', function () {
        focusManager.registerTree(testFocusableTree1);

        focusManager.focusTree(testFocusableTree1);

        const rootElem = testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed prev node focused original elem has active property', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusTree(testFocusableTree1);

        // The original node retains active focus since the tree already holds focus (per
        // focusTree's contract).
        const nodeElem = testFocusableTree1Node1.getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed diff tree prev focused new root elem has active property', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusTree(testFocusableTree1);

        focusManager.focusTree(testFocusableTree2);

        const rootElem = testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed diff tree node prev focused new root elem has active property', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusTree(testFocusableTree2);

        const rootElem = testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered root focusNode()ed no prev focus returns root elem has active property', function () {
        focusManager.registerTree(testFocusableTree1);

        focusManager.focusNode(testFocusableTree1.getRootFocusableNode());

        const rootElem = testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed no prev focus node elem has active property', function () {
        focusManager.registerTree(testFocusableTree1);

        focusManager.focusNode(testFocusableTree1Node1);

        const nodeElem = testFocusableTree1Node1.getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus same tree old node elem has no focus property', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusNode(testFocusableTree1Node2);

        const prevNodeElem = testFocusableTree1Node1.getFocusableElement();
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus same tree new node elem has active property', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusNode(testFocusableTree1Node2);

        const newNodeElem = testFocusableTree1Node2.getFocusableElement();
        assertIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus diff tree old node elem has passive property', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusNode(testFocusableTree2Node1);

        const prevNodeElem = testFocusableTree1Node1.getFocusableElement();
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus diff tree new node elem has active property', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusNode(testFocusableTree2Node1);

        const newNodeElem = testFocusableTree2Node1.getFocusableElement();
        assertIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree root focusNode()ed after prev node focus diff tree new root has active property', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.focusNode(testFocusableTree2.getRootFocusableNode());

        const rootElem = testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusTree()ed with no prev focus removes focus', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.focusTree(testFocusableTree1);

        focusManager.unregisterTree(testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators.
        const rootElem = testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusNode()ed with no prev focus removes focus', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.unregisterTree(testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators.
        const nodeElem = testFocusableTree1Node1.getFocusableElement();
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusNode()ed with prev node prior removes focus from removed tree', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree2Node1);
        focusManager.focusNode(testFocusableTree1Node1);

        focusManager.unregisterTree(testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators. However, the old node
        // should still have passive indication.
        const otherNodeElem = testFocusableTree2Node1.getFocusableElement();
        const removedNodeElem = testFocusableTree1Node1.getFocusableElement();
        assertIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusNode()ed with prev node recently removes focus from removed tree', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);
        focusManager.focusNode(testFocusableTree2Node1);

        focusManager.unregisterTree(testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators. However, the new node
        // should still have active indication.
        const otherNodeElem = testFocusableTree2Node1.getFocusableElement();
        const removedNodeElem = testFocusableTree1Node1.getFocusableElement();
        assertIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focusNode() multiple nodes in same tree with switches ensure passive focus has gone', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);
        focusManager.focusNode(testFocusableTree2Node1);

        focusManager.focusNode(testFocusableTree1Node2);

        // When switching back to the first tree, ensure the original passive node is no longer
        // passive now that the new node is active.
        const node1 = testFocusableTree1Node1.getFocusableElement();
        const node2 = testFocusableTree1Node2.getFocusableElement();
        assertNotIncludesClass(
          node1.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          node2.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed other tree node passively focused tree node now has active property', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusNode(testFocusableTree1Node1);
        focusManager.focusNode(testFocusableTree2Node1);

        focusManager.focusTree(testFocusableTree1);

        // The original node in the tree should be moved from passive to active focus per the
        // contract of focusTree). Also, the root of the tree should have no focus indication.
        const nodeElem = testFocusableTree1Node1.getFocusableElement();
        const rootElem = testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focus on root, node in diff tree, then node in first tree; root should have focus gone', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        focusManager.focusTree(testFocusableTree1);
        focusManager.focusNode(testFocusableTree2Node1);

        focusManager.focusNode(testFocusableTree1Node1);

        const nodeElem = testFocusableTree1Node1.getFocusableElement();
        const rootElem = testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree focusTree()ed with no prev root has active focus', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);

        focusManager.focusTree(testFocusableNestedTree4);

        const rootElem = testFocusableNestedTree4
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focusNode()ed with no prev focus node has active focus', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);

        focusManager.focusNode(testFocusableNestedTree4Node1);

        const nodeElem = testFocusableNestedTree4Node1.getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focusNode()ed after parent focused prev has passive node has active', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);
        focusManager.focusNode(testFocusableTree2Node1);

        focusManager.focusNode(testFocusableNestedTree4Node1);

        const prevNodeElem = testFocusableTree2Node1.getFocusableElement();
        const currNodeElem =
          testFocusableNestedTree4Node1.getFocusableElement();
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          currNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });
    });
  });

  suite('DOM focus() switching in HTML tree', function () {
    suite('getFocusedTree()', function () {
      test('registered root focus()ed no prev focus returns tree', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableTree1')?.focus();

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree1);
      });

      test("registered node focus()ed no prev focus returns node's tree", function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableTree1.node1')?.focus();

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree1);
      });

      test("registered subnode focus()ed no prev focus returns node's tree", function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1.child1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableTree1.node1.child1')?.focus();

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree1);
      });

      test('registered node focus()ed after prev node focus returns same tree', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree1.node2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document.getElementById('testFocusableTree1.node2')?.focus();

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree1);
      });

      test("registered node focus()ed after prev node focus diff tree returns new node's tree", function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document.getElementById('testFocusableTree2.node1')?.focus();

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree2);
      });

      test("registered tree root focus()ed after prev node focus diff tree returns new node's tree", function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document.getElementById('testFocusableTree2')?.focus();

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree2);
      });

      test("non-registered node subelement focus()ed returns node's tree", function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node2.unregisteredChild1')
          ?.setAttribute('tabindex', '-1');

        document
          .getElementById('testFocusableTree1.node2.unregisteredChild1')
          ?.focus();

        // The tree of the unregistered child element should take focus.
        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree1);
      });

      test('non-registered tree focus()ed returns null', function () {
        document
          .getElementById('testUnregisteredFocusableTree3')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testUnregisteredFocusableTree3')?.focus();

        assert.isNull(focusManager.getFocusedTree());
      });

      test('non-registered tree node focus()ed returns null', function () {
        document
          .getElementById('testUnregisteredFocusableTree3.node1')
          ?.setAttribute('tabindex', '-1');

        document
          .getElementById('testUnregisteredFocusableTree3.node1')
          ?.focus();

        assert.isNull(focusManager.getFocusedTree());
      });

      test('non-registered tree node focus()ed after registered node focused returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testUnregisteredFocusableTree3.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document
          .getElementById('testUnregisteredFocusableTree3.node1')
          ?.focus();

        assert.isNull(focusManager.getFocusedTree());
      });

      test('unfocusable element focus()ed after registered node focused returns original tree', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document.getElementById('testUnfocusableElement')?.focus();

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree1);
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1')?.focus();

        focusManager.unregisterTree(testFocusableTree1);

        assert.isNull(focusManager.getFocusedTree());
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        focusManager.unregisterTree(testFocusableTree1);

        assert.isNull(focusManager.getFocusedTree());
      });

      test('unregistered tree focus()ed with prev node prior focused returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree2.node1')?.focus();
        document.getElementById('testFocusableTree1.node1')?.focus();

        focusManager.unregisterTree(testFocusableTree1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(focusManager.getFocusedTree());
      });

      test('unregistered tree focus()ed with prev node recently focused returns new tree', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();
        document.getElementById('testFocusableTree2.node1')?.focus();

        focusManager.unregisterTree(testFocusableTree1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree2);
      });

      test('unregistered tree focus()ed with prev node after unregistering returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();
        document.getElementById('testFocusableTree2.node1')?.focus();
        focusManager.unregisterTree(testFocusableTree1);

        document.getElementById('testFocusableTree1.node1')?.focus();

        // Attempting to focus a now removed tree should result in nothing being
        // focused since the removed tree can have DOM focus, but that focus is
        // ignored by FocusManager.
        assert.isNull(focusManager.getFocusedTree());
      });

      test('nested tree focusTree()ed with no prev focus returns nested tree', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);
        document
          .getElementById('testFocusableNestedTree4')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableNestedTree4')?.focus();

        assert.strictEqual(
          focusManager.getFocusedTree(),
          testFocusableNestedTree4,
        );
      });

      test('nested tree node focusNode()ed with no prev focus returns nested tree', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);
        document
          .getElementById('testFocusableNestedTree4.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableNestedTree4.node1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedTree(),
          testFocusableNestedTree4,
        );
      });

      test('nested tree node focusNode()ed after parent focused returns nested tree', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableNestedTree4.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree2.node1')?.focus();

        document.getElementById('testFocusableNestedTree4.node1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedTree(),
          testFocusableNestedTree4,
        );
      });
    });
    suite('getFocusedNode()', function () {
      test('registered root focus()ed no prev focus returns root node', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableTree1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree1.getRootFocusableNode(),
        );
      });

      test('registered node focus()ed no prev focus returns node', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableTree1.node1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree1Node1,
        );
      });

      test('registered subnode focus()ed no prev focus returns subnode', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1.child1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableTree1.node1.child1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree1Node1Child1,
        );
      });

      test('registered node focus()ed after prev node focus returns new node', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree1.node2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document.getElementById('testFocusableTree1.node2')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree1Node2,
        );
      });

      test('registered node focus()ed after prev node focus diff tree returns new node', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document.getElementById('testFocusableTree2.node1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree2Node1,
        );
      });

      test('registered tree root focus()ed after prev node focus diff tree returns new root', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document.getElementById('testFocusableTree2')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree2.getRootFocusableNode(),
        );
      });

      test('non-registered node subelement focus()ed returns nearest node', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node2.unregisteredChild1')
          ?.setAttribute('tabindex', '-1');

        document
          .getElementById('testFocusableTree1.node2.unregisteredChild1')
          ?.focus();

        // The nearest node of the unregistered child element should take focus.
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree1Node2,
        );
      });

      test('non-registered tree focus()ed returns null', function () {
        document
          .getElementById('testUnregisteredFocusableTree3')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testUnregisteredFocusableTree3')?.focus();

        assert.isNull(focusManager.getFocusedNode());
      });

      test('non-registered tree node focus()ed returns null', function () {
        document
          .getElementById('testUnregisteredFocusableTree3.node1')
          ?.setAttribute('tabindex', '-1');

        document
          .getElementById('testUnregisteredFocusableTree3.node1')
          ?.focus();

        assert.isNull(focusManager.getFocusedNode());
      });

      test('non-registered tree node focus()ed after registered node focused returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testUnregisteredFocusableTree3.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document
          .getElementById('testUnregisteredFocusableTree3.node1')
          ?.focus();

        assert.isNull(focusManager.getFocusedNode());
      });

      test('unfocusable element focus()ed after registered node focused returns original node', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document.getElementById('testUnfocusableElement')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree1Node1,
        );
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1')?.focus();

        focusManager.unregisterTree(testFocusableTree1);

        assert.isNull(focusManager.getFocusedNode());
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        focusManager.unregisterTree(testFocusableTree1);

        assert.isNull(focusManager.getFocusedNode());
      });

      test('unregistered tree focus()ed with prev node prior focused returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree2.node1')?.focus();
        document.getElementById('testFocusableTree1.node1')?.focus();

        focusManager.unregisterTree(testFocusableTree1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(focusManager.getFocusedNode());
      });

      test('unregistered tree focus()ed with prev node recently focused returns new node', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();
        document.getElementById('testFocusableTree2.node1')?.focus();

        focusManager.unregisterTree(testFocusableTree1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree2Node1,
        );
      });

      test('unregistered tree focus()ed with prev node after unregistering returns null', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();
        document.getElementById('testFocusableTree2.node1')?.focus();
        focusManager.unregisterTree(testFocusableTree1);

        document.getElementById('testFocusableTree1.node1')?.focus();

        // Attempting to focus a now removed tree should result in nothing being
        // focused since the removed tree can have DOM focus, but that focus is
        // ignored by FocusManager.
        assert.isNull(focusManager.getFocusedNode());
      });

      test('nested tree focus()ed with no prev focus returns nested root', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);
        document
          .getElementById('testFocusableNestedTree4')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableNestedTree4')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableNestedTree4.getRootFocusableNode(),
        );
      });

      test('nested tree node focus()ed with no prev focus returns focused node', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);
        document
          .getElementById('testFocusableNestedTree4.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableNestedTree4.node1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableNestedTree4Node1,
        );
      });

      test('nested tree node focus()ed after parent focused returns focused node', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableNestedTree4.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree2.node1')?.focus();

        document.getElementById('testFocusableNestedTree4.node1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableNestedTree4Node1,
        );
      });

      test('after focus() after trying to focusNode() an unfocusable node updates returns focus()ed node', function () {
        testFocusableTree1Node1.canBeFocused = () => false;
        document
          .getElementById('testFocusableTree1.node2')
          ?.setAttribute('tabindex', '-1');
        focusManager.registerTree(testFocusableTree1);
        focusManager.focusNode(testFocusableTree1Node1);

        document.getElementById('testFocusableTree1.node2')?.focus();

        // focus()ing a new node should overwrite a failed attempt to focusNode() an unfocusable
        // node. This verifies that DOM focus syncing is properly reenabled by FocusManager.
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree1Node2,
        );
      });

      test('after focus() after trying to focusNode() the same node twice returns focus()ed node', function () {
        document
          .getElementById('testFocusableTree1.node2')
          ?.setAttribute('tabindex', '-1');
        focusManager.registerTree(testFocusableTree1);
        // Intentionally try to focus the same node twice.
        focusManager.focusNode(testFocusableTree1Node1);
        focusManager.focusNode(testFocusableTree1Node1);

        document.getElementById('testFocusableTree1.node2')?.focus();

        // focus()ing a new node should overwrite a failed attempt to focusNode() the same node
        // twice. This verifies that DOM focus syncing is properly reenabled by FocusManager.
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree1Node2,
        );
      });
    });
    suite('CSS classes', function () {
      test('registered root focus()ed no prev focus returns root elem has active property', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableTree1')?.focus();

        const rootElem = testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed no prev focus node elem has active property', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableTree1.node1')?.focus();

        const nodeElem = testFocusableTree1Node1.getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus same tree old node elem has no focus property', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree1.node2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document.getElementById('testFocusableTree1.node2')?.focus();

        const prevNodeElem = testFocusableTree1Node1.getFocusableElement();
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus same tree new node elem has active property', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree1.node2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document.getElementById('testFocusableTree1.node2')?.focus();

        const newNodeElem = testFocusableTree1Node2.getFocusableElement();
        assertIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus diff tree old node elem has passive property', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document.getElementById('testFocusableTree2.node1')?.focus();

        const prevNodeElem = testFocusableTree1Node1.getFocusableElement();
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus diff tree new node elem has active property', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document.getElementById('testFocusableTree2.node1')?.focus();

        const newNodeElem = testFocusableTree2Node1.getFocusableElement();
        assertIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree root focus()ed after prev node focus diff tree new root has active property', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document.getElementById('testFocusableTree2')?.focus();

        const rootElem = testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('non-registered node subelement focus()ed nearest node has active property', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node2.unregisteredChild1')
          ?.setAttribute('tabindex', '-1');

        document
          .getElementById('testFocusableTree1.node2.unregisteredChild1')
          ?.focus();

        // The nearest node of the unregistered child element should be actively focused.
        const nodeElem = testFocusableTree1Node2.getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('non-registered tree focus()ed has no focus', function () {
        document
          .getElementById('testUnregisteredFocusableTree3')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testUnregisteredFocusableTree3')?.focus();

        assert.isNull(focusManager.getFocusedNode());
        const rootElem = document.getElementById(
          'testUnregisteredFocusableTree3',
        );
        assert.exists(rootElem);
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('non-registered tree node focus()ed has no focus', function () {
        document
          .getElementById('testUnregisteredFocusableTree3.node1')
          ?.setAttribute('tabindex', '-1');

        document
          .getElementById('testUnregisteredFocusableTree3.node1')
          ?.focus();

        assert.isNull(focusManager.getFocusedNode());
        const nodeElem = document.getElementById(
          'testUnregisteredFocusableTree3.node1',
        );
        assert.exists(nodeElem);
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unfocsable element focus()ed after registered node focused original node has active focus', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        document.getElementById('testUnfocusableElement')?.focus();

        // The original node should be unchanged, and the unregistered node should not have any
        // focus indicators.
        const nodeElem = document.getElementById('testFocusableTree1.node1');
        const attemptedNewNodeElem = document.getElementById(
          'testUnfocusableElement',
        );
        assert.exists(nodeElem);
        assert.exists(attemptedNewNodeElem);
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          attemptedNewNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          attemptedNewNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with no prev focus removes focus', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1')?.focus();

        focusManager.unregisterTree(testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators.
        const rootElem = testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with no prev focus removes focus', function () {
        focusManager.registerTree(testFocusableTree1);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();

        focusManager.unregisterTree(testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators.
        const nodeElem = testFocusableTree1Node1.getFocusableElement();
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with prev node prior removes focus from removed tree', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree2.node1')?.focus();
        document.getElementById('testFocusableTree1.node1')?.focus();

        focusManager.unregisterTree(testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators. However, the old node
        // should still have passive indication.
        const otherNodeElem = testFocusableTree2Node1.getFocusableElement();
        const removedNodeElem = testFocusableTree1Node1.getFocusableElement();
        assertIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with prev node recently removes focus from removed tree', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();
        document.getElementById('testFocusableTree2.node1')?.focus();

        focusManager.unregisterTree(testFocusableTree1);

        // Since the tree was unregistered it no longer has focus indicators. However, the new node
        // should still have active indication.
        const otherNodeElem = testFocusableTree2Node1.getFocusableElement();
        const removedNodeElem = testFocusableTree1Node1.getFocusableElement();
        assertIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with prev node after unregistering removes active indicator', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();
        document.getElementById('testFocusableTree2.node1')?.focus();
        focusManager.unregisterTree(testFocusableTree1);

        document.getElementById('testFocusableTree1.node1')?.focus();

        // Attempting to focus a now removed tree should remove active.
        const otherNodeElem = testFocusableTree2Node1.getFocusableElement();
        const removedNodeElem = testFocusableTree1Node1.getFocusableElement();
        assertNotIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focus() multiple nodes in same tree with switches ensure passive focus has gone', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree1.node2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1.node1')?.focus();
        document.getElementById('testFocusableTree2.node1')?.focus();

        document.getElementById('testFocusableTree1.node2')?.focus();

        // When switching back to the first tree, ensure the original passive node is no longer
        // passive now that the new node is active.
        const node1 = testFocusableTree1Node1.getFocusableElement();
        const node2 = testFocusableTree1Node2.getFocusableElement();
        assertNotIncludesClass(
          node1.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          node2.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focus on root, node in diff tree, then node in first tree; root should have focus gone', function () {
        focusManager.registerTree(testFocusableTree1);
        focusManager.registerTree(testFocusableTree2);
        document
          .getElementById('testFocusableTree1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree1')?.focus();
        document.getElementById('testFocusableTree2.node1')?.focus();

        document.getElementById('testFocusableTree1.node1')?.focus();

        const nodeElem = testFocusableTree1Node1.getFocusableElement();
        const rootElem = testFocusableTree1
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree focus()ed with no prev root has active focus', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);
        document
          .getElementById('testFocusableNestedTree4')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableNestedTree4')?.focus();

        const rootElem = testFocusableNestedTree4
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focus()ed with no prev focus node has active focus', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);
        document
          .getElementById('testFocusableNestedTree4.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableNestedTree4.node1')?.focus();

        const nodeElem = testFocusableNestedTree4Node1.getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focus()ed after parent focused prev has passive node has active', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableNestedTree4);
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableNestedTree4.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree2.node1')?.focus();

        document.getElementById('testFocusableNestedTree4.node1')?.focus();

        const prevNodeElem = testFocusableTree2Node1.getFocusableElement();
        const currNodeElem =
          testFocusableNestedTree4Node1.getFocusableElement();
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          currNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });
    });
  });

  /* Focus tests for SVG trees. */

  suite('focus*() switching in SVG tree', function () {
    suite('getFocusedTree()', function () {
      test('registered tree focusTree()ed no prev focus returns tree', function () {
        focusManager.registerTree(testFocusableGroup1);

        focusManager.focusTree(testFocusableGroup1);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup1);
      });

      test('registered tree focusTree()ed prev node focused returns tree', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusTree(testFocusableGroup1);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup1);
      });

      test('registered tree focusTree()ed diff tree prev focused returns new tree', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusTree(testFocusableGroup1);

        focusManager.focusTree(testFocusableGroup2);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup2);
      });

      test('registered tree focusTree()ed diff tree node prev focused returns new tree', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusTree(testFocusableGroup2);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup2);
      });

      test('registered root focusNode()ed no prev focus returns tree', function () {
        focusManager.registerTree(testFocusableGroup1);

        focusManager.focusNode(testFocusableGroup1.getRootFocusableNode());

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup1);
      });

      test("registered node focusNode()ed no prev focus returns node's tree", function () {
        focusManager.registerTree(testFocusableGroup1);

        focusManager.focusNode(testFocusableGroup1Node1);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup1);
      });

      test("registered subnode focusNode()ed no prev focus returns node's tree", function () {
        focusManager.registerTree(testFocusableGroup1);

        focusManager.focusNode(testFocusableGroup1Node1Child1);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup1);
      });

      test('registered node focusNode()ed after prev node focus returns same tree', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusNode(testFocusableGroup1Node2);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup1);
      });

      test("registered node focusNode()ed after prev node focus diff tree returns new node's tree", function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusNode(testFocusableGroup2Node1);

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup2);
      });

      test("registered tree root focusNode()ed after prev node focus diff tree returns new node's tree", function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusNode(testFocusableGroup2.getRootFocusableNode());

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup2);
      });

      test('unregistered tree focusTree()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.focusTree(testFocusableGroup1);

        focusManager.unregisterTree(testFocusableGroup1);

        assert.isNull(focusManager.getFocusedTree());
      });

      test('unregistered tree focusNode()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.unregisterTree(testFocusableGroup1);

        assert.isNull(focusManager.getFocusedTree());
      });

      test('unregistered tree focusNode()ed with prev node prior focused returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup2Node1);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(focusManager.getFocusedTree());
      });

      test('unregistered tree focusNode()ed with prev node recently focused returns new tree', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);
        focusManager.focusNode(testFocusableGroup2Node1);

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup2);
      });

      test('nested tree focusTree()ed with no prev focus returns nested tree', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);

        focusManager.focusTree(testFocusableNestedGroup4);

        assert.strictEqual(
          focusManager.getFocusedTree(),
          testFocusableNestedGroup4,
        );
      });

      test('nested tree node focusNode()ed with no prev focus returns nested tree', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);

        focusManager.focusNode(testFocusableNestedGroup4Node1);

        assert.strictEqual(
          focusManager.getFocusedTree(),
          testFocusableNestedGroup4,
        );
      });

      test('nested tree node focusNode()ed after parent focused returns nested tree', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);
        focusManager.focusNode(testFocusableGroup2Node1);

        focusManager.focusNode(testFocusableNestedGroup4Node1);

        assert.strictEqual(
          focusManager.getFocusedTree(),
          testFocusableNestedGroup4,
        );
      });
    });
    suite('getFocusedNode()', function () {
      test('registered tree focusTree()ed no prev focus returns root node', function () {
        focusManager.registerTree(testFocusableGroup1);

        focusManager.focusTree(testFocusableGroup1);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup1.getRootFocusableNode(),
        );
      });

      test('registered tree focusTree()ed prev node focused returns original node', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusTree(testFocusableGroup1);

        // The original node retains focus since the tree already holds focus (per focusTree's
        // contract).
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup1Node1,
        );
      });

      test('registered tree focusTree()ed diff tree prev focused returns new root node', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusTree(testFocusableGroup1);

        focusManager.focusTree(testFocusableGroup2);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup2.getRootFocusableNode(),
        );
      });

      test('registered tree focusTree()ed diff tree node prev focused returns new root node', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusTree(testFocusableGroup2);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup2.getRootFocusableNode(),
        );
      });

      test('registered root focusNode()ed no prev focus returns root node', function () {
        focusManager.registerTree(testFocusableGroup1);

        focusManager.focusNode(testFocusableGroup1.getRootFocusableNode());

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup1.getRootFocusableNode(),
        );
      });

      test('registered node focusNode()ed no prev focus returns node', function () {
        focusManager.registerTree(testFocusableGroup1);

        focusManager.focusNode(testFocusableGroup1Node1);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup1Node1,
        );
      });

      test('registered subnode focusNode()ed no prev focus returns subnode', function () {
        focusManager.registerTree(testFocusableGroup1);

        focusManager.focusNode(testFocusableGroup1Node1Child1);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup1Node1Child1,
        );
      });

      test('registered node focusNode()ed after prev node focus returns new node', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusNode(testFocusableGroup1Node2);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup1Node2,
        );
      });

      test('registered node focusNode()ed after prev node focus diff tree returns new node', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusNode(testFocusableGroup2Node1);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup2Node1,
        );
      });

      test('registered tree root focusNode()ed after prev node focus diff tree returns new root', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusNode(testFocusableGroup2.getRootFocusableNode());

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup2.getRootFocusableNode(),
        );
      });

      test('unregistered tree focusTree()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.focusTree(testFocusableGroup1);

        focusManager.unregisterTree(testFocusableGroup1);

        assert.isNull(focusManager.getFocusedNode());
      });

      test('unregistered tree focusNode()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.unregisterTree(testFocusableGroup1);

        assert.isNull(focusManager.getFocusedNode());
      });

      test('unregistered tree focusNode()ed with prev node prior focused returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup2Node1);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(focusManager.getFocusedNode());
      });

      test('unregistered tree focusNode()ed with prev node recently focused returns new node', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);
        focusManager.focusNode(testFocusableGroup2Node1);

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup2Node1,
        );
      });

      test('nested tree focusTree()ed with no prev focus returns nested root', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);

        focusManager.focusTree(testFocusableNestedGroup4);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableNestedGroup4.getRootFocusableNode(),
        );
      });

      test('nested tree node focusNode()ed with no prev focus returns focused node', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);

        focusManager.focusNode(testFocusableNestedGroup4Node1);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableNestedGroup4Node1,
        );
      });

      test('nested tree node focusNode()ed after parent focused returns focused node', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);
        focusManager.focusNode(testFocusableGroup2Node1);

        focusManager.focusNode(testFocusableNestedGroup4Node1);

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableNestedGroup4Node1,
        );
      });
    });
    suite('CSS classes', function () {
      test('registered tree focusTree()ed no prev focus root elem has active property', function () {
        focusManager.registerTree(testFocusableGroup1);

        focusManager.focusTree(testFocusableGroup1);

        const rootElem = testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed prev node focused original elem has active property', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusTree(testFocusableGroup1);

        // The original node retains active focus since the tree already holds focus (per
        // focusTree's contract).
        const nodeElem = testFocusableGroup1Node1.getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed diff tree prev focused new root elem has active property', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusTree(testFocusableGroup1);

        focusManager.focusTree(testFocusableGroup2);

        const rootElem = testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed diff tree node prev focused new root elem has active property', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusTree(testFocusableGroup2);

        const rootElem = testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered root focusNode()ed no prev focus returns root elem has active property', function () {
        focusManager.registerTree(testFocusableGroup1);

        focusManager.focusNode(testFocusableGroup1.getRootFocusableNode());

        const rootElem = testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed no prev focus node elem has active property', function () {
        focusManager.registerTree(testFocusableGroup1);

        focusManager.focusNode(testFocusableGroup1Node1);

        const nodeElem = testFocusableGroup1Node1.getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus same tree old node elem has no focus property', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusNode(testFocusableGroup1Node2);

        const prevNodeElem = testFocusableGroup1Node1.getFocusableElement();
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus same tree new node elem has active property', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusNode(testFocusableGroup1Node2);

        const newNodeElem = testFocusableGroup1Node2.getFocusableElement();
        assertIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus diff tree old node elem has passive property', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusNode(testFocusableGroup2Node1);

        const prevNodeElem = testFocusableGroup1Node1.getFocusableElement();
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focusNode()ed after prev node focus diff tree new node elem has active property', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusNode(testFocusableGroup2Node1);

        const newNodeElem = testFocusableGroup2Node1.getFocusableElement();
        assertIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree root focusNode()ed after prev node focus diff tree new root has active property', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.focusNode(testFocusableGroup2.getRootFocusableNode());

        const rootElem = testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusTree()ed with no prev focus removes focus', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.focusTree(testFocusableGroup1);

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators.
        const rootElem = testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusNode()ed with no prev focus removes focus', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators.
        const nodeElem = testFocusableGroup1Node1.getFocusableElement();
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusNode()ed with prev node prior removes focus from removed tree', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup2Node1);
        focusManager.focusNode(testFocusableGroup1Node1);

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators. However, the old node
        // should still have passive indication.
        const otherNodeElem = testFocusableGroup2Node1.getFocusableElement();
        const removedNodeElem = testFocusableGroup1Node1.getFocusableElement();
        assertIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focusNode()ed with prev node recently removes focus from removed tree', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);
        focusManager.focusNode(testFocusableGroup2Node1);

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators. However, the new node
        // should still have active indication.
        const otherNodeElem = testFocusableGroup2Node1.getFocusableElement();
        const removedNodeElem = testFocusableGroup1Node1.getFocusableElement();
        assertIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focusNode() multiple nodes in same tree with switches ensure passive focus has gone', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);
        focusManager.focusNode(testFocusableGroup2Node1);

        focusManager.focusNode(testFocusableGroup1Node2);

        // When switching back to the first tree, ensure the original passive node is no longer
        // passive now that the new node is active.
        const node1 = testFocusableGroup1Node1.getFocusableElement();
        const node2 = testFocusableGroup1Node2.getFocusableElement();
        assertNotIncludesClass(
          node1.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          node2.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree focusTree()ed other tree node passively focused tree node now has active property', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup1Node1);
        focusManager.focusNode(testFocusableGroup2Node1);

        focusManager.focusTree(testFocusableGroup1);

        // The original node in the tree should be moved from passive to active focus per the
        // contract of focusTree). Also, the root of the tree should have no focus indication.
        const nodeElem = testFocusableGroup1Node1.getFocusableElement();
        const rootElem = testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focus on root, node in diff tree, then node in first tree; root should have focus gone', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusTree(testFocusableGroup1);
        focusManager.focusNode(testFocusableGroup2Node1);

        focusManager.focusNode(testFocusableGroup1Node1);

        const nodeElem = testFocusableGroup1Node1.getFocusableElement();
        const rootElem = testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree focusTree()ed with no prev root has active focus', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);

        focusManager.focusTree(testFocusableNestedGroup4);

        const rootElem = testFocusableNestedGroup4
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focusNode()ed with no prev focus node has active focus', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);

        focusManager.focusNode(testFocusableNestedGroup4Node1);

        const nodeElem = testFocusableNestedGroup4Node1.getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focusNode()ed after parent focused prev has passive node has active', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);
        focusManager.focusNode(testFocusableGroup2Node1);

        focusManager.focusNode(testFocusableNestedGroup4Node1);

        const prevNodeElem = testFocusableGroup2Node1.getFocusableElement();
        const currNodeElem =
          testFocusableNestedGroup4Node1.getFocusableElement();
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          currNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });
    });
  });

  suite('DOM focus() switching in SVG tree', function () {
    suite('getFocusedTree()', function () {
      test('registered root focus()ed no prev focus returns tree', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableGroup1')?.focus();

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup1);
      });

      test("registered node focus()ed no prev focus returns node's tree", function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableGroup1.node1')?.focus();

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup1);
      });

      test("registered subnode focus()ed no prev focus returns node's tree", function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1.child1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableGroup1.node1.child1')?.focus();

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup1);
      });

      test('registered node focus()ed after prev node focus returns same tree', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup1.node2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document.getElementById('testFocusableGroup1.node2')?.focus();

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup1);
      });

      test("registered node focus()ed after prev node focus diff tree returns new node's tree", function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document.getElementById('testFocusableGroup2.node1')?.focus();

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup2);
      });

      test("registered tree root focus()ed after prev node focus diff tree returns new node's tree", function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document.getElementById('testFocusableGroup2')?.focus();

        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup2);
      });

      test("non-registered node subelement focus()ed returns node's tree", function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node2.unregisteredChild1')
          ?.setAttribute('tabindex', '-1');

        document
          .getElementById('testFocusableGroup1.node2.unregisteredChild1')
          ?.focus();

        // The tree of the unregistered child element should take focus.
        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup1);
      });

      test('non-registered tree focus()ed returns null', function () {
        document
          .getElementById('testUnregisteredFocusableGroup3')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testUnregisteredFocusableGroup3')?.focus();

        assert.isNull(focusManager.getFocusedTree());
      });

      test('non-registered tree node focus()ed returns null', function () {
        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          ?.setAttribute('tabindex', '-1');

        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          ?.focus();

        assert.isNull(focusManager.getFocusedTree());
      });

      test('non-registered tree node focus()ed after registered node focused returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          ?.focus();

        // Attempting to focus a now removed tree should result in nothing being
        // focused since the removed tree can have DOM focus, but that focus is
        // ignored by FocusManager.
        assert.isNull(focusManager.getFocusedTree());
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1')?.focus();

        focusManager.unregisterTree(testFocusableGroup1);

        assert.isNull(focusManager.getFocusedTree());
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        focusManager.unregisterTree(testFocusableGroup1);

        assert.isNull(focusManager.getFocusedTree());
      });

      test('unregistered tree focus()ed with prev node prior focused returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup2.node1')?.focus();
        document.getElementById('testFocusableGroup1.node1')?.focus();

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(focusManager.getFocusedTree());
      });

      test('unregistered tree focus()ed with prev node recently focused returns new tree', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();
        document.getElementById('testFocusableGroup2.node1')?.focus();

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup2);
      });

      test('unregistered tree focus()ed with prev node after unregistering returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();
        document.getElementById('testFocusableGroup2.node1')?.focus();
        focusManager.unregisterTree(testFocusableGroup1);

        document.getElementById('testFocusableGroup1.node1')?.focus();

        // Attempting to focus a now removed tree should result in nothing being
        // focused since the removed tree can have DOM focus, but that focus is
        // ignored by FocusManager.
        assert.isNull(focusManager.getFocusedTree());
      });

      test('nested tree focusTree()ed with no prev focus returns nested tree', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);
        document
          .getElementById('testFocusableNestedGroup4')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableNestedGroup4')?.focus();

        assert.strictEqual(
          focusManager.getFocusedTree(),
          testFocusableNestedGroup4,
        );
      });

      test('nested tree node focusNode()ed with no prev focus returns nested tree', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);
        document
          .getElementById('testFocusableNestedGroup4.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableNestedGroup4.node1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedTree(),
          testFocusableNestedGroup4,
        );
      });

      test('nested tree node focusNode()ed after parent focused returns nested tree', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableNestedGroup4.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup2.node1')?.focus();

        document.getElementById('testFocusableNestedGroup4.node1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedTree(),
          testFocusableNestedGroup4,
        );
      });
    });
    suite('getFocusedNode()', function () {
      test('registered root focus()ed no prev focus returns root node', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableGroup1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup1.getRootFocusableNode(),
        );
      });

      test('registered node focus()ed no prev focus returns node', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableGroup1.node1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup1Node1,
        );
      });

      test('registered subnode focus()ed no prev focus returns subnode', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1.child1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableGroup1.node1.child1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup1Node1Child1,
        );
      });

      test('registered node focus()ed after prev node focus returns new node', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup1.node2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document.getElementById('testFocusableGroup1.node2')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup1Node2,
        );
      });

      test('registered node focus()ed after prev node focus diff tree returns new node', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document.getElementById('testFocusableGroup2.node1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup2Node1,
        );
      });

      test('registered tree root focus()ed after prev node focus diff tree returns new root', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document.getElementById('testFocusableGroup2')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup2.getRootFocusableNode(),
        );
      });

      test('non-registered node subelement focus()ed returns nearest node', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node2.unregisteredChild1')
          ?.setAttribute('tabindex', '-1');

        document
          .getElementById('testFocusableGroup1.node2.unregisteredChild1')
          ?.focus();

        // The nearest node of the unregistered child element should take focus.
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup1Node2,
        );
      });

      test('non-registered tree focus()ed returns null', function () {
        document
          .getElementById('testUnregisteredFocusableGroup3')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testUnregisteredFocusableGroup3')?.focus();

        assert.isNull(focusManager.getFocusedNode());
      });

      test('non-registered tree node focus()ed returns null', function () {
        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          ?.setAttribute('tabindex', '-1');

        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          ?.focus();

        assert.isNull(focusManager.getFocusedNode());
      });

      test('non-registered tree node focus()ed after registered node focused returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          ?.focus();

        assert.isNull(focusManager.getFocusedNode());
      });

      test('unfocusable element focus()ed after registered node focused returns original node', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document.getElementById('testUnfocusableElement')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup1Node1,
        );
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1')?.focus();

        focusManager.unregisterTree(testFocusableGroup1);

        assert.isNull(focusManager.getFocusedNode());
      });

      test('unregistered tree focus()ed with no prev focus returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        focusManager.unregisterTree(testFocusableGroup1);

        assert.isNull(focusManager.getFocusedNode());
      });

      test('unregistered tree focus()ed with prev node prior focused returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup2.node1')?.focus();
        document.getElementById('testFocusableGroup1.node1')?.focus();

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the more recent tree was removed, there's no tree currently focused.
        assert.isNull(focusManager.getFocusedNode());
      });

      test('unregistered tree focus()ed with prev node recently focused returns new node', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();
        document.getElementById('testFocusableGroup2.node1')?.focus();

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the most recent tree still exists, it still has focus.
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup2Node1,
        );
      });

      test('unregistered tree focus()ed with prev node after unregistering returns null', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();
        document.getElementById('testFocusableGroup2.node1')?.focus();
        focusManager.unregisterTree(testFocusableGroup1);

        document.getElementById('testFocusableGroup1.node1')?.focus();

        // Attempting to focus a now removed tree should result in nothing being
        // focused since the removed tree can have DOM focus, but that focus is
        // ignored by FocusManager.
        assert.isNull(focusManager.getFocusedNode());
      });

      test('nested tree focus()ed with no prev focus returns nested root', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);
        document
          .getElementById('testFocusableNestedGroup4')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableNestedGroup4')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableNestedGroup4.getRootFocusableNode(),
        );
      });

      test('nested tree node focus()ed with no prev focus returns focused node', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);
        document
          .getElementById('testFocusableNestedGroup4.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableNestedGroup4.node1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableNestedGroup4Node1,
        );
      });

      test('nested tree node focus()ed after parent focused returns focused node', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableNestedGroup4.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup2.node1')?.focus();

        document.getElementById('testFocusableNestedGroup4.node1')?.focus();

        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableNestedGroup4Node1,
        );
      });

      test('after focus() after trying to focusNode() an unfocusable node updates returns focus()ed node', function () {
        testFocusableGroup1Node1.canBeFocused = () => false;
        document
          .getElementById('testFocusableGroup1.node2')
          ?.setAttribute('tabindex', '-1');
        focusManager.registerTree(testFocusableGroup1);
        focusManager.focusNode(testFocusableGroup1Node1);

        document.getElementById('testFocusableGroup1.node2')?.focus();

        // focus()ing a new node should overwrite a failed attempt to focusNode() an unfocusable
        // node. This verifies that DOM focus syncing is properly reenabled by FocusManager.
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup1Node2,
        );
      });

      test('after focus() after trying to focusNode() the same node twice returns focus()ed node', function () {
        document
          .getElementById('testFocusableGroup1.node2')
          ?.setAttribute('tabindex', '-1');
        focusManager.registerTree(testFocusableGroup1);
        // Intentionally try to focus the same node twice.
        focusManager.focusNode(testFocusableGroup1Node1);
        focusManager.focusNode(testFocusableGroup1Node1);

        document.getElementById('testFocusableGroup1.node2')?.focus();

        // focus()ing a new node should overwrite a failed attempt to focusNode() the same node
        // twice. This verifies that DOM focus syncing is properly reenabled by FocusManager.
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup1Node2,
        );
      });
    });
    suite('CSS classes', function () {
      test('registered root focus()ed no prev focus returns root elem has active property', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableGroup1')?.focus();

        const rootElem = testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed no prev focus node elem has active property', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableGroup1.node1')?.focus();

        const nodeElem = testFocusableGroup1Node1.getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus same tree old node elem has no focus property', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup1.node2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document.getElementById('testFocusableGroup1.node2')?.focus();

        const prevNodeElem = testFocusableGroup1Node1.getFocusableElement();
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus same tree new node elem has active property', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup1.node2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document.getElementById('testFocusableGroup1.node2')?.focus();

        const newNodeElem = testFocusableGroup1Node2.getFocusableElement();
        assertIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus diff tree old node elem has passive property', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document.getElementById('testFocusableGroup2.node1')?.focus();

        const prevNodeElem = testFocusableGroup1Node1.getFocusableElement();
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered node focus()ed after prev node focus diff tree new node elem has active property', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document.getElementById('testFocusableGroup2.node1')?.focus();

        const newNodeElem = testFocusableGroup2Node1.getFocusableElement();
        assertIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          newNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('registered tree root focus()ed after prev node focus diff tree new root has active property', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document.getElementById('testFocusableGroup2')?.focus();

        const rootElem = testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('non-registered node subelement focus()ed nearest node has active property', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node2.unregisteredChild1')
          ?.setAttribute('tabindex', '-1');

        document
          .getElementById('testFocusableGroup1.node2.unregisteredChild1')
          ?.focus();

        // The nearest node of the unregistered child element should be actively focused.
        const nodeElem = testFocusableGroup1Node2.getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('non-registered tree focus()ed has no focus', function () {
        document
          .getElementById('testUnregisteredFocusableGroup3')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testUnregisteredFocusableGroup3')?.focus();

        assert.isNull(focusManager.getFocusedNode());
        const rootElem = document.getElementById(
          'testUnregisteredFocusableGroup3',
        );
        assert.exists(rootElem);
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('non-registered tree node focus()ed has no focus', function () {
        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          ?.setAttribute('tabindex', '-1');

        document
          .getElementById('testUnregisteredFocusableGroup3.node1')
          ?.focus();

        assert.isNull(focusManager.getFocusedNode());
        const nodeElem = document.getElementById(
          'testUnregisteredFocusableGroup3.node1',
        );
        assert.exists(nodeElem);
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unfocusable element focus()ed after registered node focused original node has active focus', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        document.getElementById('testUnfocusableElement')?.focus();

        // The original node should be unchanged, and the unregistered node should not have any
        // focus indicators.
        const nodeElem = document.getElementById('testFocusableGroup1.node1');
        const attemptedNewNodeElem = document.getElementById(
          'testUnfocusableElement',
        );
        assert.exists(nodeElem);
        assert.exists(attemptedNewNodeElem);
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          attemptedNewNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          attemptedNewNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with no prev focus removes focus', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1')?.focus();

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators.
        const rootElem = testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with no prev focus removes focus', function () {
        focusManager.registerTree(testFocusableGroup1);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators.
        const nodeElem = testFocusableGroup1Node1.getFocusableElement();
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with prev node prior removes focus from removed tree', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup2.node1')?.focus();
        document.getElementById('testFocusableGroup1.node1')?.focus();

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators. However, the old node
        // should still have passive indication.
        const otherNodeElem = testFocusableGroup2Node1.getFocusableElement();
        const removedNodeElem = testFocusableGroup1Node1.getFocusableElement();
        assertIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with prev node recently removes focus from removed tree', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();
        document.getElementById('testFocusableGroup2.node1')?.focus();

        focusManager.unregisterTree(testFocusableGroup1);

        // Since the tree was unregistered it no longer has focus indicators. However, the new node
        // should still have active indication.
        const otherNodeElem = testFocusableGroup2Node1.getFocusableElement();
        const removedNodeElem = testFocusableGroup1Node1.getFocusableElement();
        assertIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('unregistered tree focus()ed with prev node after unregistering removes active indicator', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();
        document.getElementById('testFocusableGroup2.node1')?.focus();
        focusManager.unregisterTree(testFocusableGroup1);

        document.getElementById('testFocusableGroup1.node1')?.focus();

        // Attempting to focus a now removed tree should remove active.
        const otherNodeElem = testFocusableGroup2Node1.getFocusableElement();
        const removedNodeElem = testFocusableGroup1Node1.getFocusableElement();
        assertNotIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          otherNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          removedNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focus() multiple nodes in same tree with switches ensure passive focus has gone', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup1.node2')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1.node1')?.focus();
        document.getElementById('testFocusableGroup2.node1')?.focus();

        document.getElementById('testFocusableGroup1.node2')?.focus();

        // When switching back to the first tree, ensure the original passive node is no longer
        // passive now that the new node is active.
        const node1 = testFocusableGroup1Node1.getFocusableElement();
        const node2 = testFocusableGroup1Node2.getFocusableElement();
        assertNotIncludesClass(
          node1.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          node2.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('focus on root, node in diff tree, then node in first tree; root should have focus gone', function () {
        focusManager.registerTree(testFocusableGroup1);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup1.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup1')?.focus();
        document.getElementById('testFocusableGroup2.node1')?.focus();

        document.getElementById('testFocusableGroup1.node1')?.focus();

        const nodeElem = testFocusableGroup1Node1.getFocusableElement();
        const rootElem = testFocusableGroup1
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree focus()ed with no prev root has active focus', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);
        document
          .getElementById('testFocusableNestedGroup4')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableNestedGroup4')?.focus();

        const rootElem = testFocusableNestedGroup4
          .getRootFocusableNode()
          .getFocusableElement();
        assertIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          rootElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focus()ed with no prev focus node has active focus', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);
        document
          .getElementById('testFocusableNestedGroup4.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableNestedGroup4.node1')?.focus();

        const nodeElem = testFocusableNestedGroup4Node1.getFocusableElement();
        assertIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          nodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('nested tree node focus()ed after parent focused prev has passive node has active', function () {
        focusManager.registerTree(testFocusableGroup2);
        focusManager.registerTree(testFocusableNestedGroup4);
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableNestedGroup4.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup2.node1')?.focus();

        document.getElementById('testFocusableNestedGroup4.node1')?.focus();

        const prevNodeElem = testFocusableGroup2Node1.getFocusableElement();
        const currNodeElem =
          testFocusableNestedGroup4Node1.getFocusableElement();
        assertNotIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          currNodeElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currNodeElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });
    });
  });

  /* High-level focus/defocusing tests. */
  suite('Defocusing and refocusing', function () {
    test('Defocusing actively focused root HTML tree switches to passive highlight', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.focusTree(testFocusableTree2);
      document
        .getElementById('testUnregisteredFocusableTree3')
        ?.setAttribute('tabindex', '-1');

      document.getElementById('testUnregisteredFocusableTree3')?.focus();

      const rootNode = testFocusableTree2.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      assert.isNull(focusManager.getFocusedTree());
      assert.isNull(focusManager.getFocusedNode());
      assertIncludesClass(
        rootElem.classList,
        Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assertNotIncludesClass(
        rootElem.classList,
        Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    });

    test('Defocusing actively focused HTML tree node switches to passive highlight', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.focusNode(testFocusableTree2Node1);
      document
        .getElementById('testUnregisteredFocusableTree3')
        ?.setAttribute('tabindex', '-1');

      document.getElementById('testUnregisteredFocusableTree3')?.focus();

      const nodeElem = testFocusableTree2Node1.getFocusableElement();
      assert.isNull(focusManager.getFocusedTree());
      assert.isNull(focusManager.getFocusedNode());
      assertIncludesClass(
        nodeElem.classList,
        Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assertNotIncludesClass(
        nodeElem.classList,
        Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    });

    test('Defocusing actively focused HTML subtree node switches to passive highlight', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableNestedTree4);
      focusManager.focusNode(testFocusableNestedTree4Node1);
      document
        .getElementById('testUnregisteredFocusableTree3')
        ?.setAttribute('tabindex', '-1');

      document.getElementById('testUnregisteredFocusableTree3')?.focus();

      const nodeElem = testFocusableNestedTree4Node1.getFocusableElement();
      assert.isNull(focusManager.getFocusedTree());
      assert.isNull(focusManager.getFocusedNode());
      assertIncludesClass(
        nodeElem.classList,
        Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assertNotIncludesClass(
        nodeElem.classList,
        Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    });

    test('Refocusing actively focused root HTML tree restores to active highlight', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.focusTree(testFocusableTree2);
      document
        .getElementById('testUnregisteredFocusableTree3')
        ?.setAttribute('tabindex', '-1');
      document
        .getElementById('testFocusableTree2')
        ?.setAttribute('tabindex', '-1');
      document.getElementById('testUnregisteredFocusableTree3')?.focus();

      document.getElementById('testFocusableTree2')?.focus();

      const rootNode = testFocusableTree2.getRootFocusableNode();
      const rootElem = rootNode.getFocusableElement();
      assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree2);
      assert.strictEqual(focusManager.getFocusedNode(), rootNode);
      assertNotIncludesClass(
        rootElem.classList,
        Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assertIncludesClass(
        rootElem.classList,
        Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    });

    test('Refocusing actively focused HTML tree node restores to active highlight', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.focusNode(testFocusableTree2Node1);
      document
        .getElementById('testUnregisteredFocusableTree3')
        ?.setAttribute('tabindex', '-1');
      document
        .getElementById('testFocusableTree2.node1')
        ?.setAttribute('tabindex', '-1');
      document.getElementById('testUnregisteredFocusableTree3')?.focus();

      document.getElementById('testFocusableTree2.node1')?.focus();

      const nodeElem = testFocusableTree2Node1.getFocusableElement();
      assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree2);
      assert.strictEqual(
        focusManager.getFocusedNode(),
        testFocusableTree2Node1,
      );
      assertNotIncludesClass(
        nodeElem.classList,
        Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assertIncludesClass(
        nodeElem.classList,
        Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    });

    test('Refocusing actively focused HTML subtree node restores to active highlight', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableNestedTree4);
      focusManager.focusNode(testFocusableNestedTree4Node1);
      document
        .getElementById('testUnregisteredFocusableTree3')
        ?.setAttribute('tabindex', '-1');
      document
        .getElementById('testFocusableNestedTree4.node1')
        ?.setAttribute('tabindex', '-1');
      document.getElementById('testUnregisteredFocusableTree3')?.focus();

      document.getElementById('testFocusableNestedTree4.node1')?.focus();

      const nodeElem = testFocusableNestedTree4Node1.getFocusableElement();
      assert.strictEqual(
        focusManager.getFocusedTree(),
        testFocusableNestedTree4,
      );
      assert.strictEqual(
        focusManager.getFocusedNode(),
        testFocusableNestedTree4Node1,
      );
      assertNotIncludesClass(
        nodeElem.classList,
        Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assertIncludesClass(
        nodeElem.classList,
        Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    });
  });

  /* Combined HTML/SVG tree focus tests. */

  suite('HTML/SVG focus tree switching', function () {
    suite('Focus HTML tree then SVG tree', function () {
      test('HTML focusTree()ed then SVG focusTree()ed correctly updates getFocusedTree() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusTree(testFocusableTree2);

        focusManager.focusTree(testFocusableGroup2);

        const prevElem = testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        const currElem = testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup2);
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML focusTree()ed then SVG focusNode()ed correctly updates getFocusedNode() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusTree(testFocusableTree2);

        focusManager.focusNode(testFocusableGroup2Node1);

        const prevElem = testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        const currElem = testFocusableGroup2Node1.getFocusableElement();
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML focusTree()ed then SVG DOM focus()ed correctly updates getFocusedNode() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusTree(testFocusableTree2);
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableGroup2.node1')?.focus();

        const prevElem = testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        const currElem = testFocusableGroup2Node1.getFocusableElement();
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML focusNode()ed then SVG focusTree()ed correctly updates getFocusedTree() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableTree2Node1);

        focusManager.focusTree(testFocusableGroup2);

        const prevElem = testFocusableTree2Node1.getFocusableElement();
        const currElem = testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup2);
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML focusNode()ed then SVG focusNode()ed correctly updates getFocusedNode() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableTree2Node1);

        focusManager.focusNode(testFocusableGroup2Node1);

        const prevElem = testFocusableTree2Node1.getFocusableElement();
        const currElem = testFocusableGroup2Node1.getFocusableElement();
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML focusNode()ed then SVG DOM focus()ed correctly updates getFocusedNode() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableTree2Node1);
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableGroup2.node1')?.focus();

        const prevElem = testFocusableTree2Node1.getFocusableElement();
        const currElem = testFocusableGroup2Node1.getFocusableElement();
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML DOM focus()ed then SVG focusTree()ed correctly updates getFocusedTree() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree2.node1')?.focus();

        focusManager.focusTree(testFocusableGroup2);

        const prevElem = testFocusableTree2Node1.getFocusableElement();
        const currElem = testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup2);
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML DOM focus()ed then SVG focusNode()ed correctly updates getFocusedNode() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree2.node1')?.focus();

        focusManager.focusNode(testFocusableGroup2Node1);

        const prevElem = testFocusableTree2Node1.getFocusableElement();
        const currElem = testFocusableGroup2Node1.getFocusableElement();
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('HTML DOM focus()ed then SVG DOM focus()ed correctly updates getFocusedNode() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableTree2.node1')?.focus();

        document.getElementById('testFocusableGroup2.node1')?.focus();

        const prevElem = testFocusableTree2Node1.getFocusableElement();
        const currElem = testFocusableGroup2Node1.getFocusableElement();
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableGroup2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });
    });
    suite('Focus SVG tree then HTML tree', function () {
      test('SVG focusTree()ed then HTML focusTree()ed correctly updates getFocusedTree() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusTree(testFocusableGroup2);

        focusManager.focusTree(testFocusableTree2);

        const prevElem = testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        const currElem = testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree2);
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG focusTree()ed then HTML focusNode()ed correctly updates getFocusedNode() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusTree(testFocusableGroup2);

        focusManager.focusNode(testFocusableTree2Node1);

        const prevElem = testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        const currElem = testFocusableTree2Node1.getFocusableElement();
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG focusTree()ed then HTML DOM focus()ed correctly updates getFocusedNode() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusTree(testFocusableGroup2);
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableTree2.node1')?.focus();

        const prevElem = testFocusableGroup2
          .getRootFocusableNode()
          .getFocusableElement();
        const currElem = testFocusableTree2Node1.getFocusableElement();
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG focusNode()ed then HTML focusTree()ed correctly updates getFocusedTree() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup2Node1);

        focusManager.focusTree(testFocusableTree2);

        const prevElem = testFocusableGroup2Node1.getFocusableElement();
        const currElem = testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree2);
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG focusNode()ed then HTML focusNode()ed correctly updates getFocusedNode() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup2Node1);

        focusManager.focusNode(testFocusableTree2Node1);

        const prevElem = testFocusableGroup2Node1.getFocusableElement();
        const currElem = testFocusableTree2Node1.getFocusableElement();
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG focusNode()ed then HTML DOM focus()ed correctly updates getFocusedNode() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        focusManager.focusNode(testFocusableGroup2Node1);
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');

        document.getElementById('testFocusableTree2.node1')?.focus();

        const prevElem = testFocusableGroup2Node1.getFocusableElement();
        const currElem = testFocusableTree2Node1.getFocusableElement();
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG DOM focus()ed then HTML focusTree()ed correctly updates getFocusedTree() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup2.node1')?.focus();

        focusManager.focusTree(testFocusableTree2);

        const prevElem = testFocusableGroup2Node1.getFocusableElement();
        const currElem = testFocusableTree2
          .getRootFocusableNode()
          .getFocusableElement();
        assert.strictEqual(focusManager.getFocusedTree(), testFocusableTree2);
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG DOM focus()ed then HTML focusNode()ed correctly updates getFocusedNode() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup2.node1')?.focus();

        focusManager.focusNode(testFocusableTree2Node1);

        const prevElem = testFocusableGroup2Node1.getFocusableElement();
        const currElem = testFocusableTree2Node1.getFocusableElement();
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });

      test('SVG DOM focus()ed then HTML DOM focus()ed correctly updates getFocusedNode() and indicators', function () {
        focusManager.registerTree(testFocusableTree2);
        focusManager.registerTree(testFocusableGroup2);
        document
          .getElementById('testFocusableGroup2.node1')
          ?.setAttribute('tabindex', '-1');
        document
          .getElementById('testFocusableTree2.node1')
          ?.setAttribute('tabindex', '-1');
        document.getElementById('testFocusableGroup2.node1')?.focus();

        document.getElementById('testFocusableTree2.node1')?.focus();

        const prevElem = testFocusableGroup2Node1.getFocusableElement();
        const currElem = testFocusableTree2Node1.getFocusableElement();
        assert.strictEqual(
          focusManager.getFocusedNode(),
          testFocusableTree2Node1,
        );
        assert.strictEqual(document.activeElement, currElem);
        assertIncludesClass(
          currElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          currElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertNotIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
        assertIncludesClass(
          prevElem.classList,
          Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
        );
      });
    });
  });

  /* Ephemeral focus tests. */

  suite('takeEphemeralFocus()', function () {
    setup(function () {
      // Ensure ephemeral-specific elements are focusable.
      document
        .getElementById('nonTreeElementForEphemeralFocus')
        ?.setAttribute('tabindex', '-1');
      document
        .getElementById('nonTreeGroupForEphemeralFocus')
        ?.setAttribute('tabindex', '-1');
    });
    teardown(function () {
      // Ensure ephemeral-specific elements have their tab indexes reset for a clean state.
      document
        .getElementById('nonTreeElementForEphemeralFocus')
        ?.removeAttribute('tabindex');
      document
        .getElementById('nonTreeGroupForEphemeralFocus')
        ?.removeAttribute('tabindex');
    });

    test('with no focused node does not change states', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);

      const ephemeralElement = document.getElementById(
        'nonTreeElementForEphemeralFocus',
      );
      assert.exists(ephemeralElement);
      focusManager.takeEphemeralFocus(ephemeralElement);

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
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);
      focusManager.focusNode(testFocusableTree2Node1);

      const ephemeralElement = document.getElementById(
        'nonTreeElementForEphemeralFocus',
      );
      assert.exists(ephemeralElement);
      focusManager.takeEphemeralFocus(ephemeralElement);

      // Taking focus without an existing node having focus should change no focus indicators.
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      const passiveElems = Array.from(
        document.querySelectorAll(PASSIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.isEmpty(activeElems);
      assert.strictEqual(passiveElems.length, 1);
      assertIncludesClass(
        testFocusableTree2Node1.getFocusableElement().classList,
        Blockly.FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
    });

    test('focuses provided HTML element', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);

      const ephemeralElement = document.getElementById(
        'nonTreeElementForEphemeralFocus',
      );
      assert.exists(ephemeralElement);
      focusManager.takeEphemeralFocus(ephemeralElement);

      assert.strictEqual(document.activeElement, ephemeralElement);
    });

    test('focuses provided SVG element', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);

      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      assert.exists(ephemeralElement);
      focusManager.takeEphemeralFocus(ephemeralElement);

      assert.strictEqual(document.activeElement, ephemeralElement);
    });

    test('twice for without finishing previous throws error', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);
      const ephemeralGroupElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      const ephemeralDivElement = document.getElementById(
        'nonTreeElementForEphemeralFocus',
      );
      assert.exists(ephemeralGroupElement);
      focusManager.takeEphemeralFocus(ephemeralGroupElement);

      assert.exists(ephemeralDivElement);
      const errorMsgRegex =
        /Attempted to take ephemeral focus when it's already held+?/;
      assert.throws(
        () => focusManager.takeEphemeralFocus(ephemeralDivElement),
        errorMsgRegex,
      );
    });

    test('then focusTree() changes getFocusedTree() but not active state', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);
      focusManager.focusTree(testFocusableTree2);
      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      assert.exists(ephemeralElement);
      focusManager.takeEphemeralFocus(ephemeralElement);

      focusManager.focusTree(testFocusableGroup2);

      assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup2);
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.isEmpty(activeElems);
    });

    test('then focusNode() changes getFocusedNode() but not active state', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);
      focusManager.focusNode(testFocusableTree2Node1);
      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      assert.exists(ephemeralElement);
      focusManager.takeEphemeralFocus(ephemeralElement);

      focusManager.focusNode(testFocusableGroup2Node1);

      assert.strictEqual(
        focusManager.getFocusedNode(),
        testFocusableGroup2Node1,
      );
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.isEmpty(activeElems);
    });

    test('then DOM refocus changes getFocusedNode() but not active state', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);
      focusManager.focusNode(testFocusableTree2Node1);
      document
        .getElementById('testFocusableGroup2.node1')
        ?.setAttribute('tabindex', '-1');
      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      assert.exists(ephemeralElement);
      focusManager.takeEphemeralFocus(ephemeralElement);

      // Force focus to change via the DOM.
      document.getElementById('testFocusableGroup2.node1')?.focus();

      // The focus() state change will affect getFocusedNode() but it will not cause the node to now
      // be active.
      assert.strictEqual(
        focusManager.getFocusedNode(),
        testFocusableGroup2Node1,
      );
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.isEmpty(activeElems);
    });

    test('then finish ephemeral callback with no node does not change indicators', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);
      const ephemeralElement = document.getElementById(
        'nonTreeElementForEphemeralFocus',
      );
      assert.exists(ephemeralElement);
      const finishFocusCallback =
        focusManager.takeEphemeralFocus(ephemeralElement);

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
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);
      const ephemeralGroupElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      const ephemeralDivElement = document.getElementById(
        'nonTreeElementForEphemeralFocus',
      );
      assert.exists(ephemeralGroupElement);
      const finishFocusCallback = focusManager.takeEphemeralFocus(
        ephemeralGroupElement,
      );

      finishFocusCallback();
      assert.exists(ephemeralDivElement);
      focusManager.takeEphemeralFocus(ephemeralDivElement);

      // An exception should not be thrown and the new element should receive focus.
      assert.strictEqual(document.activeElement, ephemeralDivElement);
    });

    test('calling ephemeral callback twice throws error', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);
      const ephemeralElement = document.getElementById(
        'nonTreeElementForEphemeralFocus',
      );
      assert.exists(ephemeralElement);
      const finishFocusCallback =
        focusManager.takeEphemeralFocus(ephemeralElement);
      finishFocusCallback();

      const errorMsgRegex =
        /Attempted to finish ephemeral focus twice for element+?/;
      assert.throws(() => finishFocusCallback(), errorMsgRegex);
    });

    test('then finish ephemeral callback should restore focused node', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);
      focusManager.focusNode(testFocusableTree2Node1);
      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      assert.exists(ephemeralElement);
      const finishFocusCallback =
        focusManager.takeEphemeralFocus(ephemeralElement);

      finishFocusCallback();

      // The original focused node should be restored.
      const nodeElem = testFocusableTree2Node1.getFocusableElement();
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.strictEqual(
        focusManager.getFocusedNode(),
        testFocusableTree2Node1,
      );
      assert.strictEqual(activeElems.length, 1);
      assertIncludesClass(
        nodeElem.classList,
        Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assert.strictEqual(document.activeElement, nodeElem);
    });

    test('then focusTree() and finish ephemeral callback correctly sets new active state', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);
      focusManager.focusTree(testFocusableTree2);
      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      assert.exists(ephemeralElement);
      const finishFocusCallback =
        focusManager.takeEphemeralFocus(ephemeralElement);

      focusManager.focusTree(testFocusableGroup2);
      finishFocusCallback();

      // The tree's root should now be the active element since focus changed between the start and
      // end of the ephemeral flow.
      const rootElem = testFocusableGroup2
        .getRootFocusableNode()
        .getFocusableElement();
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.strictEqual(focusManager.getFocusedTree(), testFocusableGroup2);
      assert.strictEqual(activeElems.length, 1);
      assertIncludesClass(
        rootElem.classList,
        Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assert.strictEqual(document.activeElement, rootElem);
    });

    test('then focusNode() and finish ephemeral callback correctly sets new active state', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);
      focusManager.focusNode(testFocusableTree2Node1);
      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      assert.exists(ephemeralElement);
      const finishFocusCallback =
        focusManager.takeEphemeralFocus(ephemeralElement);

      focusManager.focusNode(testFocusableGroup2Node1);
      finishFocusCallback();

      // The tree's root should now be the active element since focus changed between the start and
      // end of the ephemeral flow.
      const nodeElem = testFocusableGroup2Node1.getFocusableElement();
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.strictEqual(
        focusManager.getFocusedNode(),
        testFocusableGroup2Node1,
      );
      assert.strictEqual(activeElems.length, 1);
      assertIncludesClass(
        nodeElem.classList,
        Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assert.strictEqual(document.activeElement, nodeElem);
    });

    test('then DOM focus change and finish ephemeral callback correctly sets new active state', function () {
      focusManager.registerTree(testFocusableTree2);
      focusManager.registerTree(testFocusableGroup2);
      focusManager.focusNode(testFocusableTree2Node1);
      document
        .getElementById('testFocusableGroup2.node1')
        ?.setAttribute('tabindex', '-1');
      const ephemeralElement = document.getElementById(
        'nonTreeGroupForEphemeralFocus',
      );
      assert.exists(ephemeralElement);
      const finishFocusCallback =
        focusManager.takeEphemeralFocus(ephemeralElement);

      document.getElementById('testFocusableGroup2.node1')?.focus();
      finishFocusCallback();

      // The tree's root should now be the active element since focus changed between the start and
      // end of the ephemeral flow.
      const nodeElem = testFocusableGroup2Node1.getFocusableElement();
      const activeElems = Array.from(
        document.querySelectorAll(ACTIVE_FOCUS_NODE_CSS_SELECTOR),
      );
      assert.strictEqual(
        focusManager.getFocusedNode(),
        testFocusableGroup2Node1,
      );
      assert.strictEqual(activeElems.length, 1);
      assertIncludesClass(
        nodeElem.classList,
        Blockly.FocusManager.ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
      );
      assert.strictEqual(document.activeElement, nodeElem);
    });
  });
});
