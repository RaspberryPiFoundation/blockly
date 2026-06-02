/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Keyboard Navigation Controller', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = Blockly.inject('blocklyDiv');
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
});
