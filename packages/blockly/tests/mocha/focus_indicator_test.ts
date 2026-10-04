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
      {
        type: 'focus_statement',
        message0: 'value %1',
        args0: [{type: 'field_input', name: 'TEXT', text: 'value'}],
        previousStatement: null,
        nextStatement: null,
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
    delete Blockly.Blocks['focus_statement'];
  });

  for (const fullBlock of [true, false]) {
    test(`${fullBlock ? 'full-block' : 'regular'} fields retain a passive indicator in the toolbox`, function () {
      const block = workspace.newBlock(
        fullBlock ? 'focus_reporter' : 'focus_statement',
      );
      block.initSvg();
      block.render();
      const field = block.getField('TEXT');
      assert.isNotNull(field);
      Blockly.getFocusManager().focusNode(fullBlock ? block : field);

      workspace
        .getInjectionDiv()
        .dispatchEvent(createKeyDownEvent(Blockly.utils.KeyCodes.T));

      const indicator = fullBlock
        ? block.pathObject.svgPath
        : field.getFocusableElement().querySelector('.blocklyFieldRect');
      assert.isNotNull(indicator);
      assert.match(getComputedStyle(indicator).strokeDasharray, /^5px,? 3px$/);

      Blockly.getFocusManager().focusNode(fullBlock ? block : field);
      assert.notMatch(
        getComputedStyle(indicator).strokeDasharray,
        /^5px,? 3px$/,
      );

      workspace
        .getInjectionDiv()
        .dispatchEvent(createKeyDownEvent(Blockly.utils.KeyCodes.T));
      Blockly.keyboardNavigationController.setIsActive(false);
      assert.notMatch(
        getComputedStyle(indicator).strokeDasharray,
        /^5px,? 3px$/,
      );
    });
  }
});
