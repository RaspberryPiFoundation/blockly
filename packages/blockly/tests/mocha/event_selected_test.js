/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {defineRowBlock} from './test_helpers/block_definitions.js';
import {createChangeListenerSpy} from './test_helpers/events.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Selected Event', function () {
  setup(function () {
    sharedTestSetup.call(this, {fireEventsNow: false});
    defineRowBlock();
    this.workspace = new Blockly.inject('blocklyDiv', {});
    this.eventSpy = createChangeListenerSpy(this.workspace);
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Serialization', function () {
    test('events round-trip through JSON', function () {
      const block1 = this.workspace.newBlock('row_block', 'test_id1');
      const block2 = this.workspace.newBlock('row_block', 'test_id2');
      const origEvent = new Blockly.Events.Selected(
        block1.id,
        block2.id,
        this.workspace.id,
      );

      const json = origEvent.toJson();
      const newEvent = new Blockly.Events.fromJson(json, this.workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });

  test('Moving selection between two blocks fires one select event', function () {
    const block1 = this.workspace.newBlock('row_block', 'test_id1');
    const block2 = this.workspace.newBlock('row_block', 'test_id2');
    block1.initSvg();
    block2.initSvg();

    Blockly.getFocusManager().focusNode(block1);
    this.clock.runAll();
    this.eventSpy.resetHistory();

    // Selecting block2 results in block1 becoming unselected; that should not
    // trigger a select event from block1 to nothing. There should only be one
    // select event from block1 to block2.
    Blockly.getFocusManager().focusNode(block2);
    this.clock.runAll();

    const calls = this.eventSpy.getCalls();
    assert.lengthOf(calls, 1);
    const event = calls[0].firstArg;
    assert.equal(event.oldElementId, block1.id);
    assert.equal(event.newElementId, block2.id);
  });

  test('Refocusing the focused element post-DOM move does not fire a select event', function () {
    const block1 = this.workspace.newBlock('row_block', 'test_id1');
    const block2 = this.workspace.newBlock('row_block', 'test_id2');
    block1.initSvg();
    block2.initSvg();

    Blockly.getFocusManager().focusNode(block1);
    block2.bringToFront();
    this.clock.runAll();
    assert.equal(Blockly.getFocusManager().getFocusedNode(), block1);
    this.eventSpy.resetHistory();
    // `bringToFront` moves the block in the DOM, which ordinarily would cause
    // it to lose focus; however, the implementation re-focuses it post-move.
    // Since the block was selected before, this should not trigger a select
    // event to be fired, as the selection has not actually changed.
    block1.bringToFront();
    this.clock.runAll();
    const calls = this.eventSpy.getCalls();
    assert.lengthOf(calls, 0);
  });
});
