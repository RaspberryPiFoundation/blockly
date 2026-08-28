/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import sinon from 'sinon';
import {defineRowBlock} from './test_helpers/block_definitions.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Block Delete Event', function () {
  let clock: sinon.SinonFakeTimers;
  let workspace: Blockly.Workspace;

  setup(function (this: Mocha.Context) {
    ({clock} = sharedTestSetup.call(this, {fireEventsNow: false}));
    defineRowBlock();
    workspace = new Blockly.Workspace();
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  suite('Receiving', function () {
    test('blocks do not receive their own delete events', function () {
      Blockly.Blocks['test'] = {
        onchange: function (_e: Blockly.Events.Abstract) {},
      };
      // Need to stub the definition, because the property on the definition is
      // what gets registered as an event listener.
      const spy = sinon.spy(Blockly.Blocks['test'], 'onchange');
      const testBlock = workspace.newBlock('test');

      testBlock.dispose();
      clock.runAll();

      assert.isFalse(spy.called);
    });
  });

  suite('Serialization', function () {
    test('events round-trip through JSON', function () {
      const block = workspace.newBlock('row_block', 'block_id');
      const origEvent = new Blockly.Events.BlockDelete(block);

      const json = origEvent.toJson();
      const newEvent = Blockly.Events.fromJson(json, workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
