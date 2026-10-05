/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';
import {createKeyDownEvent} from './test_helpers/user_input.js';

suite('Field focus indicators', function () {
  let workspace: Blockly.WorkspaceSvg;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    Blockly.defineBlocksWithJsonArray([
      {
        type: 'focus_reporter',
        message0: '%1',
        args0: [{type: 'field_input', name: 'TEXT', text: 'value'}],
        output: null,
      },
    ]);
    workspace = Blockly.inject('blocklyDiv', {
      ...DEFAULT_INJECT_OPTIONS,
      renderer: 'zelos',
      toolbox: {
        kind: 'categoryToolbox',
        contents: [
          {
            kind: 'category',
            name: 'Fields',
            contents: [{kind: 'block', type: 'focus_reporter'}],
          },
        ],
      },
    });
    Blockly.keyboardNavigationController.setIsActive(true);
  });

  teardown(function (this: Mocha.Context) {
    Blockly.keyboardNavigationController.setIsActive(false);
    sharedTestTeardown.call(this, workspace);
    delete Blockly.Blocks['focus_reporter'];
  });

  test('full-block fields show a passive outline when focus moves to the toolbox', function () {
    const block = workspace.newBlock('focus_reporter');
    block.initSvg();
    block.render();
    Blockly.getFocusManager().focusNode(block);

    workspace
      .getInjectionDiv()
      .dispatchEvent(createKeyDownEvent(Blockly.utils.KeyCodes.T));

    const dashArray = getComputedStyle(
      block.pathObject.svgPath,
    ).strokeDasharray;
    assert.isNotEmpty(dashArray);
    assert.notEqual(dashArray, 'none');
  });
});
