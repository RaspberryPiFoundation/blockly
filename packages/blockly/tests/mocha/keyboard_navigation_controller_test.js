/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';
import {createKeyDownEvent} from './test_helpers/user_input.js';

suite('Keyboard Navigation Controller', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = Blockly.inject('blocklyDiv', {
      ...DEFAULT_INJECT_OPTIONS,
      trashcan: true,
      zoom: {controls: true},
    });
    Blockly.keyboardNavigationController.setIsActive(false);
  });

  teardown(function () {
    sharedTestTeardown.call(this);
    Blockly.keyboardNavigationController.setIsActive(false);
  });

  test('Setting active keyboard navigation adds css class', function () {
    Blockly.keyboardNavigationController.setIsActive(true);
    assert.isTrue(
      Blockly.getMainWorkspace()
        .getInjectionDiv()
        .parentElement.classList.contains('blocklyKeyboardNavigation'),
    );
  });

  test('Disabling active keyboard navigation removes css class', function () {
    Blockly.keyboardNavigationController.setIsActive(false);
    assert.isFalse(
      Blockly.getMainWorkspace()
        .getInjectionDiv()
        .parentElement.classList.contains('blocklyKeyboardNavigation'),
    );
  });

  test('arrow key from a workspace control does not move focus onto blocks', function () {
    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'simple_test_block',
        'message0': 'simple test block',
        'output': null,
      },
    ]);
    const block = this.workspace.newBlock('simple_test_block');
    block.initSvg();
    block.render();

    const focusManager = Blockly.getFocusManager();
    const controls = [
      this.workspace.trashcan,
      this.workspace.zoomControls_.getFocusableControls()[0],
    ];

    for (const control of controls) {
      focusManager.focusNode(control);
      this.workspace
        .getInjectionDiv()
        .dispatchEvent(createKeyDownEvent(Blockly.utils.KeyCodes.DOWN));
      assert.strictEqual(focusManager.getFocusedNode(), control);
    }
  });
});
