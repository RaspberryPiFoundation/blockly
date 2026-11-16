/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {defineRowBlock} from './test_helpers/block_definitions.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Block Move Event', function () {
  let workspace: Blockly.Workspace;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    defineRowBlock();
    workspace = new Blockly.Workspace();
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  suite('Serialization', function () {
    test('events round-trip through JSON', function () {
      const block1 = workspace.newBlock('row_block', 'block_id');
      const block2 = workspace.newBlock('row_block', 'block_id');
      const origEvent = new Blockly.Events.BlockMove(block1);
      assert.isNotNull(block2.outputConnection);
      block2.getInput('INPUT')?.connection?.connect(block2.outputConnection);
      origEvent.recordNew();

      const json = origEvent.toJson();
      const newEvent = Blockly.Events.fromJson(json, workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
