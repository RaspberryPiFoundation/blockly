/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from '../test_helpers/setup_teardown.js';

suite('Loops', function () {
  setup(function () {
    sharedTestSetup.call(this, {fireEventsNow: false});
    this.workspace = Blockly.inject('blocklyDiv', DEFAULT_INJECT_OPTIONS);
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('controls_flow_statements blocks', function () {
    test('break block is invalid outside of loop block', function () {
      const breakBlock = Blockly.serialization.blocks.append(
        {'type': 'controls_flow_statements'},
        this.workspace,
      );
      this.clock.runAll();
      assert.isFalse(
        breakBlock.isEnabled(),
        'Expected the break block to be disabled',
      );
    });

    test('break block is valid inside of loop block', function () {
      const loopBlock = Blockly.serialization.blocks.append(
        {'type': 'controls_repeat'},
        this.workspace,
      );
      const breakBlock = Blockly.serialization.blocks.append(
        {'type': 'controls_flow_statements'},
        this.workspace,
      );
      loopBlock
        .getInput('DO')
        .connection.connect(breakBlock.previousConnection);
      this.clock.runAll();
      assert.isTrue(
        breakBlock.isEnabled(),
        'Expected the break block to be enabled',
      );
    });
  });
});
