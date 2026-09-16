/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import type sinon from 'sinon';
import {defineRowBlock} from './test_helpers/block_definitions.js';
import {assertEventFired} from './test_helpers/events.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Block Create Event', function () {
  let workspace: Blockly.Workspace;
  let eventsFireStub: sinon.SinonStub;

  setup(function (this: Mocha.Context) {
    ({eventsFireStub} = sharedTestSetup.call(this));
    defineRowBlock();
    workspace = new Blockly.Workspace();
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  test('Create shadow on disconnect', function () {
    Blockly.Events.disable();
    const block = Blockly.serialization.blocks.append(
      {
        'type': 'row_block',
        'inputs': {
          'INPUT': {
            'shadow': {
              'type': 'row_block',
              'id': 'shadowId',
            },
            'block': {
              'type': 'row_block',
            },
          },
        },
      },
      workspace,
    );
    Blockly.Events.enable();
    block.getInput('INPUT')?.connection?.disconnect();
    assertEventFired(
      eventsFireStub,
      Blockly.Events.BlockCreate,
      {'recordUndo': false, 'type': Blockly.Events.BLOCK_CREATE},
      workspace.id,
      'shadowId',
    );
  });

  test('Does not create extra shadow blocks', function () {
    const shadowId = 'shadow_block';
    const blockJson = {
      'type': 'math_arithmetic',
      'id': 'parent_with_shadow',
      'fields': {'OP': 'ADD'},
      'inputs': {
        'A': {
          'shadow': {
            'type': 'math_number',
            'id': shadowId,
            'fields': {'NUM': 1},
          },
        },
      },
    };

    // If there is a shadow block on the workspace and then we get
    // a block create event with the same ID as the shadow block,
    // this represents a block that had been covering a shadow block
    // being removed.
    Blockly.serialization.blocks.append(blockJson, workspace);
    const shadowBlock = workspace.getBlockById(shadowId);
    const blocksBefore = workspace.getAllBlocks();
    assert.isNotNull(shadowBlock);
    const event = new Blockly.Events.BlockCreate(shadowBlock);
    event.run(true);

    const blocksAfter = workspace.getAllBlocks();
    assert.deepEqual(
      blocksAfter,
      blocksBefore,
      'No new blocks should be created from an event that only creates shadow blocks',
    );
  });

  suite('Serialization', function () {
    test('events round-trip through JSON', function () {
      const block = workspace.newBlock('row_block', 'block_id');
      const origEvent = new Blockly.Events.BlockCreate(block);

      const json = origEvent.toJson();
      const newEvent = Blockly.Events.fromJson(json, workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
