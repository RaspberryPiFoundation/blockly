/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {defineMutatorBlocks} from './test_helpers/block_definitions.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Bubble Open Event', function () {
  setup(function () {
    sharedTestSetup.call(this);
    defineMutatorBlocks();
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
    Blockly.Extensions.unregister('xml_mutator');
    Blockly.Extensions.unregister('jso_mutator');
  });

  suite('Serialization', function () {
    test('events round-trip through JSON', function () {
      const block = this.workspace.newBlock('jso_block', 'block_id');
      const origEvent = new Blockly.Events.BubbleOpen(
        block,
        true,
        Blockly.Events.BubbleType.MUTATOR,
      );

      const json = origEvent.toJson();
      const newEvent = new Blockly.Events.fromJson(json, this.workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
