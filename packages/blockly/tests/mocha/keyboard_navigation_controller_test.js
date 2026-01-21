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
    Blockly.keyboardNavigationController.setIsActive(false);
  });

  teardown(function () {
    sharedTestTeardown.call(this);
    Blockly.keyboardNavigationController.setIsActive(false);
  });

  test('Setting active keyboard navigation adds css class', function () {
    Blockly.keyboardNavigationController.setIsActive(true);
    assert.isTrue(
      document.body.classList.contains('blocklyKeyboardNavigation'),
    );
  });

  test('Disabling active keyboard navigation removes css class', function () {
    Blockly.keyboardNavigationController.setIsActive(false);
    assert.isFalse(
      document.body.classList.contains('blocklyKeyboardNavigation'),
    );
  });
});
