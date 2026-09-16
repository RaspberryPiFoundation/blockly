/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Field Intermediate Change Event', function () {
  let workspace: Blockly.Workspace;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    workspace = new Blockly.Workspace();
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  suite('Serialization', function () {
    test('events round-trip through JSON', function () {
      const block = workspace.newBlock('text', 'block_id');
      const origEvent = new Blockly.Events.BlockFieldIntermediateChange(
        block,
        'TEXT',
        'old value',
        'new value',
      );

      const json = origEvent.toJson();
      const newEvent = Blockly.Events.fromJson(json, workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });

  suite('Change Value', function () {
    test("running forward changes the block's value to new value", function () {
      const block = workspace.newBlock('text', 'block_id');
      const origEvent = new Blockly.Events.BlockFieldIntermediateChange(
        block,
        'TEXT',
        'old value',
        'new value',
      );
      origEvent.run(true);

      assert.isDefined(origEvent.name);
      assert.deepEqual(block.getField(origEvent.name)?.getValue(), 'new value');
    });

    test("running backward changes the block's value to old value", function () {
      const block = workspace.newBlock('text', 'block_id');
      const origEvent = new Blockly.Events.BlockFieldIntermediateChange(
        block,
        'TEXT',
        'old value',
        'new value',
      );
      origEvent.run(false);

      assert.isDefined(origEvent.name);
      assert.deepEqual(block.getField(origEvent.name)?.getValue(), 'old value');
    });
  });
});
