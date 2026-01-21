/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  createRenderedBlock,
  defineMutatorBlocks,
} from './test_helpers/block_definitions.js';
import {assertEventFired, assertEventNotFired} from './test_helpers/events.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Mutator', function () {
  setup(function () {
    sharedTestSetup.call(this);
  });

  suite('Firing change event', function () {
    setup(function () {
      this.workspace = Blockly.inject('blocklyDiv', {});
      defineMutatorBlocks();
    });

    teardown(function () {
      Blockly.Extensions.unregister('xml_mutator');
      Blockly.Extensions.unregister('jso_mutator');
      sharedTestTeardown.call(this);
    });

    test('No change', async function () {
      const block = createRenderedBlock(this.workspace, 'xml_block');
      const icon = block.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await icon.setBubbleVisible(true);
      const mutatorWorkspace = icon.getWorkspace();
      // Trigger mutator change listener.
      createRenderedBlock(mutatorWorkspace, 'checkbox_block');
      assertEventNotFired(this.eventsFireStub, Blockly.Events.BlockChange, {
        element: 'mutation',
      });
    });

    test('XML', async function () {
      const block = createRenderedBlock(this.workspace, 'xml_block');
      const icon = block.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await icon.setBubbleVisible(true);
      const mutatorWorkspace = icon.getWorkspace();
      mutatorWorkspace
        .getBlockById('check_block')
        .setFieldValue('TRUE', 'CHECK');
      assert.isTrue(
        this.eventsFireStub
          .getCalls()
          .some(
            ({args}) =>
              args[0].type === Blockly.Events.BLOCK_CHANGE &&
              args[0].element === 'mutation' &&
              /<mutation.*><\/mutation>/.test(args[0].newValue),
          ),
      );
    });

    test('JSO', async function () {
      const block = createRenderedBlock(this.workspace, 'jso_block');
      const icon = block.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await icon.setBubbleVisible(true);
      const mutatorWorkspace = icon.getWorkspace();
      mutatorWorkspace
        .getBlockById('check_block')
        .setFieldValue('TRUE', 'CHECK');
      assertEventFired(
        this.eventsFireStub,
        Blockly.Events.BlockChange,
        {
          element: 'mutation',
          newValue: '{"hasInput":true}',
        },
        this.workspace.id,
        block.id,
      );
    });
  });
});
