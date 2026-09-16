/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {defineMutatorBlocks} from './test_helpers/block_definitions.js';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Bubble Open Event', function () {
  let workspace: Blockly.WorkspaceSvg;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    defineMutatorBlocks();
    workspace = Blockly.inject('blocklyDiv', DEFAULT_INJECT_OPTIONS);
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
    Blockly.Extensions.unregister('xml_mutator');
    Blockly.Extensions.unregister('jso_mutator');
  });

  suite('Serialization', function () {
    test('events round-trip through JSON', function () {
      const block = workspace.newBlock('jso_block', 'block_id');
      const origEvent = new Blockly.Events.BubbleOpen(
        block,
        true,
        Blockly.Events.BubbleType.MUTATOR,
      );

      const json = origEvent.toJson();
      const newEvent = Blockly.Events.fromJson(json, workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
