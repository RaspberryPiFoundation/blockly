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
  suite('ARIA', function () {
    setup(async function () {
      this.workspace = Blockly.inject('blocklyDiv', {});
      const block = createRenderedBlock(this.workspace, 'controls_if');
      this.icon = block.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await this.icon.setBubbleVisible(true);
      this.bubble = this.icon.getBubble();
    });

    function getFocusableAriaLabel(iFocusable) {
      return iFocusable.getFocusableElement().getAttribute('aria-label');
    }

    teardown(function () {
      sharedTestTeardown.call(this);
    });

    test('Bubble has working ARIA label provider', function () {
      const label = getFocusableAriaLabel(this.bubble);
      assert.equal(label, 'Block editor workspace');
    });
    test('Bubble has ARIA role of group', function () {
      assert.equal(
        this.bubble.getFocusableElement().getAttribute('role'),
        'group',
      );
    });
    test('Bubble uses function provider ARIA label when provided', function () {
      this.bubble.setAriaLabelProvider(() => 'Custom mutator label');
      const label = getFocusableAriaLabel(this.bubble);
      assert.equal(label, 'Custom mutator label');
    });
    test('Bubble uses string provider ARIA label when provided', function () {
      this.bubble.setAriaLabelProvider('Custom mutator label');
      const label = getFocusableAriaLabel(this.bubble);
      assert.equal(label, 'Custom mutator label');
    });
    test('Mutator icon label changes when bubble is opened', async function () {
      const openLabel = getFocusableAriaLabel(this.icon);
      assert.equal(openLabel, 'Close block editor');
      await this.icon.setBubbleVisible(false);

      const closedLabel = getFocusableAriaLabel(this.icon);
      assert.equal(closedLabel, 'Edit this block');
    });
    test('Bubble uses default ARIA label when no provider is set', function () {
      this.bubble.setAriaLabelProvider(null);
      const label = getFocusableAriaLabel(this.bubble);
      assert.equal(label, 'Bubble');
    });
  });
});
