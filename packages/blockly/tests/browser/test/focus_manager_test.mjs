/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview FocusManager tests that depend on the browser's own focus
 * handling, and so cannot run in the headless JSDOM harness alongside the rest
 * of tests/mocha/focus_manager_test.js.
 *
 * Two behaviors jsdom does not reproduce are covered here:
 *
 * - Detaching the focused element. Browsers reset document.activeElement to
 *   <body> and fire the corresponding events; JSDOM leaves activeElement
 *   pointing at the removed element, so FocusManager still reports it as
 *   focused.
 * - Moving DOM focus re-entrantly from within a focusin handler. When a tree's
 *   root receives focus, FocusManager responds by focusing the tree's previously
 *   focused node instead (see focusTree()). JSDOM does not carry that nested
 *   focus() through, so the node never becomes active.
 */

import * as chai from 'chai';
import {FIXTURE_HTML} from '../../mocha/test_helpers/dom_fixtures.js';
import {focusableTreeImplFactory} from '../../mocha/test_helpers/focusable_tree.js';
import {testFileLocations, testSetup} from './test_setup.mjs';

/**
 * Installs the shared DOM fixtures, the shared FocusableTreeImpl, and the
 * createFocusableTree/createFocusableNode helpers.
 *
 * @param {!WebdriverIO.Browser} browser The active WebdriverIO Browser object.
 * @param {string} fixtureHtml The shared fixture markup to install.
 * @return {!Promise} A Promise that resolves once the page is prepared.
 */
async function installFocusTestHelpers(browser, fixtureHtml) {
  await browser.execute(
    `window.FocusableTreeImpl = (${focusableTreeImplFactory.toString()})();`,
  );

  await browser.execute((fixtureHtml) => {
    document.body.insertAdjacentHTML('beforeend', fixtureHtml);

    window.createFocusableTree = function (rootElementId, nestedTrees) {
      return new window.FocusableTreeImpl(
        document.getElementById(rootElementId),
        nestedTrees || [],
      );
    };
    window.createFocusableNode = function (tree, elementId) {
      return tree.addNode(document.getElementById(elementId));
    };
  }, fixtureHtml);
}

suite('FocusManager', function () {
  this.timeout(0);

  suiteSetup(async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);
    await installFocusTestHelpers(this.browser, FIXTURE_HTML);
  });

  suite('focus*() switching in HTML tree', function () {
    suite('getFocusedNode()', function () {
      test('deletion after focusNode() returns null', async function () {
        const result = await this.browser.execute(() => {
          const focusManager = Blockly.getFocusManager();

          const rootElem = document.createElement('div');
          const nodeElem = document.createElement('div');
          rootElem.setAttribute('id', 'focusRoot');
          rootElem.setAttribute('tabindex', '-1');
          nodeElem.setAttribute('id', 'focusNode');
          nodeElem.setAttribute('tabindex', '-1');
          nodeElem.textContent = 'Focusable node';
          rootElem.appendChild(nodeElem);
          document.body.appendChild(rootElem);
          const root = createFocusableTree('focusRoot');
          const node = createFocusableNode(root, 'focusNode');
          focusManager.registerTree(root);
          focusManager.focusNode(node);
          const focusedBeforeDeletion = focusManager.getFocusedNode() === node;

          node.getFocusableElement().remove();

          const focusedAfterDeletion = focusManager.getFocusedNode() === node;
          focusManager.unregisterTree(root);
          rootElem.remove(); // Cleanup.
          return {focusedBeforeDeletion, focusedAfterDeletion};
        });

        chai.assert.isTrue(
          result.focusedBeforeDeletion,
          'Expected focusNode() to have focused the node',
        );
        chai.assert.isFalse(
          result.focusedAfterDeletion,
          'Expected the deleted node to no longer be focused',
        );
      });
    });
  });

  suite('DOM focus() switching in HTML tree', function () {
    suite('getFocusedNode()', function () {
      test('deletion after focus() returns null', async function () {
        const result = await this.browser.execute(() => {
          const focusManager = Blockly.getFocusManager();

          const rootElem = document.createElement('div');
          const nodeElem = document.createElement('div');
          rootElem.setAttribute('id', 'focusRoot');
          rootElem.setAttribute('tabindex', '-1');
          nodeElem.setAttribute('id', 'focusNode');
          nodeElem.setAttribute('tabindex', '-1');
          nodeElem.textContent = 'Focusable node';
          rootElem.appendChild(nodeElem);
          document.body.appendChild(rootElem);
          const root = createFocusableTree('focusRoot');
          const node = createFocusableNode(root, 'focusNode');
          focusManager.registerTree(root);
          document.getElementById('focusNode').tabIndex = -1;
          document.getElementById('focusNode').focus();
          const focusedBeforeDeletion = focusManager.getFocusedNode() === node;

          node.getFocusableElement().remove();

          const focusedAfterDeletion = focusManager.getFocusedNode() === node;
          focusManager.unregisterTree(root);
          rootElem.remove(); // Cleanup.
          return {focusedBeforeDeletion, focusedAfterDeletion};
        });

        chai.assert.isTrue(
          result.focusedBeforeDeletion,
          'Expected focus() to have focused the node',
        );
        chai.assert.isFalse(
          result.focusedAfterDeletion,
          'Expected the deleted node to no longer be focused',
        );
      });
    });

    suite('CSS classes', function () {
      test('registered tree focus()ed other tree node passively focused tree node now has active property', async function () {
        const focusClasses = await this.browser.execute(() => {
          const focusManager = Blockly.getFocusManager();
          const testFocusableTree1 = createFocusableTree('testFocusableTree1');
          const testFocusableTree1Node1 = createFocusableNode(
            testFocusableTree1,
            'testFocusableTree1.node1',
          );
          const testFocusableTree2 = createFocusableTree('testFocusableTree2');
          createFocusableNode(testFocusableTree2, 'testFocusableTree2.node1');

          focusManager.registerTree(testFocusableTree1);
          focusManager.registerTree(testFocusableTree2);
          document.getElementById('testFocusableTree1.node1').tabIndex = -1;
          document.getElementById('testFocusableTree2.node1').tabIndex = -1;
          document.getElementById('testFocusableTree1').tabIndex = -1;
          document.getElementById('testFocusableTree1.node1').focus();
          document.getElementById('testFocusableTree2.node1').focus();

          document.getElementById('testFocusableTree1').focus();

          // Directly refocusing a tree's root should have functional parity with focusTree(). That
          // means the tree's previous node should now have active focus again and its root should
          // have no focus indication.
          const rootElem = testFocusableTree1
            .getRootFocusableNode()
            .getFocusableElement();
          const nodeElem = testFocusableTree1Node1.getFocusableElement();
          const {
            ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
            PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
          } = Blockly.FocusManager;
          const focusClasses = {
            nodeActive: nodeElem.classList.contains(
              ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
            ),
            nodePassive: nodeElem.classList.contains(
              PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
            ),
            rootActive: rootElem.classList.contains(
              ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
            ),
            rootPassive: rootElem.classList.contains(
              PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
            ),
          };

          focusManager.unregisterTree(testFocusableTree1);
          focusManager.unregisterTree(testFocusableTree2);
          return focusClasses;
        });

        chai.assert.isTrue(
          focusClasses.nodeActive,
          "Expected the tree's node to have active focus",
        );
        chai.assert.isFalse(
          focusClasses.nodePassive,
          "Expected the tree's node to not have passive focus",
        );
        chai.assert.isFalse(
          focusClasses.rootActive,
          "Expected the tree's root to not have active focus",
        );
        chai.assert.isFalse(
          focusClasses.rootPassive,
          "Expected the tree's root to not have passive focus",
        );
      });
    });
  });

  suite('DOM focus() switching in SVG tree', function () {
    suite('CSS classes', function () {
      test('registered tree focus()ed other tree node passively focused tree node now has active property', async function () {
        const focusClasses = await this.browser.execute(() => {
          const focusManager = Blockly.getFocusManager();
          const testFocusableGroup1 = createFocusableTree(
            'testFocusableGroup1',
          );
          const testFocusableGroup1Node1 = createFocusableNode(
            testFocusableGroup1,
            'testFocusableGroup1.node1',
          );
          const testFocusableGroup2 = createFocusableTree(
            'testFocusableGroup2',
          );
          createFocusableNode(testFocusableGroup2, 'testFocusableGroup2.node1');

          focusManager.registerTree(testFocusableGroup1);
          focusManager.registerTree(testFocusableGroup2);
          document.getElementById('testFocusableGroup1.node1').tabIndex = -1;
          document.getElementById('testFocusableGroup2.node1').tabIndex = -1;
          document.getElementById('testFocusableGroup1').tabIndex = -1;
          document.getElementById('testFocusableGroup1.node1').focus();
          document.getElementById('testFocusableGroup2.node1').focus();

          document.getElementById('testFocusableGroup1').focus();

          // Directly refocusing a tree's root should have functional parity with focusTree(). That
          // means the tree's previous node should now have active focus again and its root should
          // have no focus indication.
          const rootElem = testFocusableGroup1
            .getRootFocusableNode()
            .getFocusableElement();
          const nodeElem = testFocusableGroup1Node1.getFocusableElement();
          const {
            ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
            PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
          } = Blockly.FocusManager;
          const focusClasses = {
            nodeActive: nodeElem.classList.contains(
              ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
            ),
            nodePassive: nodeElem.classList.contains(
              PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
            ),
            rootActive: rootElem.classList.contains(
              ACTIVE_FOCUS_NODE_CSS_CLASS_NAME,
            ),
            rootPassive: rootElem.classList.contains(
              PASSIVE_FOCUS_NODE_CSS_CLASS_NAME,
            ),
          };

          focusManager.unregisterTree(testFocusableGroup1);
          focusManager.unregisterTree(testFocusableGroup2);
          return focusClasses;
        });

        chai.assert.isTrue(
          focusClasses.nodeActive,
          "Expected the tree's node to have active focus",
        );
        chai.assert.isFalse(
          focusClasses.nodePassive,
          "Expected the tree's node to not have passive focus",
        );
        chai.assert.isFalse(
          focusClasses.rootActive,
          "Expected the tree's root to not have active focus",
        );
        chai.assert.isFalse(
          focusClasses.rootPassive,
          "Expected the tree's root to not have passive focus",
        );
      });
    });
  });
});
