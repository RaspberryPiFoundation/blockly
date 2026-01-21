/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {defineRowBlock} from './test_helpers/block_definitions.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Block Delete Event', function () {
  setup(function () {
    this.clock = sharedTestSetup.call(this, {fireEventsNow: false}).clock;
    defineRowBlock();
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Receiving', function () {
    test('blocks do not receive their own delete events', function () {
      Blockly.Blocks['test'] = {
        onchange: function (e) {},
      };
      // Need to stub the definition, because the property on the definition is
      // what gets registered as an event listener.
      const spy = sinon.spy(Blockly.Blocks['test'], 'onchange');
      const testBlock = this.workspace.newBlock('test');

      testBlock.dispose();
      this.clock.runAll();

      assert.isFalse(spy.called);
    });
  });

  suite('Serialization', function () {
    test('events round-trip through JSON', function () {
      const block = this.workspace.newBlock('row_block', 'block_id');
      const origEvent = new Blockly.Events.BlockDelete(block);

      const json = origEvent.toJson();
      const newEvent = new Blockly.Events.fromJson(json, this.workspace);
      delete origEvent.oldXml; // xml fails deep equals for some reason.
      delete newEvent.oldXml; // xml fails deep equals for some reason.

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
