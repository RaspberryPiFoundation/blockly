/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Keyboard Navigation Controller', function () {
  let workspace: Blockly.WorkspaceSvg;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    workspace = Blockly.inject('blocklyDiv', DEFAULT_INJECT_OPTIONS);
    Blockly.keyboardNavigationController.setIsActive(false);
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
    Blockly.keyboardNavigationController.setIsActive(false);
  });

  test('Setting active keyboard navigation adds css class', function () {
    Blockly.keyboardNavigationController.setIsActive(true);
    assert.isTrue(
      workspace
        .getInjectionDiv()
        .parentElement?.classList.contains('blocklyKeyboardNavigation'),
    );
  });

  test('Disabling active keyboard navigation removes css class', function () {
    Blockly.keyboardNavigationController.setIsActive(false);
    assert.isFalse(
      workspace
        .getInjectionDiv()
        .parentElement?.classList.contains('blocklyKeyboardNavigation'),
    );
  });
});
