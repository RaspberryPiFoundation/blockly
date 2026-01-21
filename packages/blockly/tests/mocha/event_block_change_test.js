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

suite('Block Change Event', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Undo and Redo', function () {
    suite('Mutation', function () {
      setup(function () {
        defineMutatorBlocks();
      });

      teardown(function () {
        Blockly.Extensions.unregister('xml_mutator');
        Blockly.Extensions.unregister('jso_mutator');
      });

      suite('XML', function () {
        test('Undo', function () {
          const block = this.workspace.newBlock('xml_block', 'block_id');
          block.domToMutation(
            Blockly.utils.xml.textToDom('<mutation hasInput="true"/>'),
          );
          const blockChange = new Blockly.Events.BlockChange(
            block,
            'mutation',
            null,
            '',
            '<mutation hasInput="true"/>',
          );
          blockChange.run(false);
          assert.isFalse(block.hasInput);
        });

        test('Redo', function () {
          const block = this.workspace.newBlock('xml_block', 'block_id');
          const blockChange = new Blockly.Events.BlockChange(
            block,
            'mutation',
            null,
            '',
            '<mutation hasInput="true"/>',
          );
          blockChange.run(true);
          assert.isTrue(block.hasInput);
        });
      });

      suite('JSO', function () {
        test('Undo', function () {
          const block = this.workspace.newBlock('jso_block', 'block_id');
          block.loadExtraState({hasInput: true});
          const blockChange = new Blockly.Events.BlockChange(
            block,
            'mutation',
            null,
            '',
            '{"hasInput":true}',
          );
          blockChange.run(false);
          assert.isFalse(block.hasInput);
        });

        test('Redo', function () {
          const block = this.workspace.newBlock('jso_block', 'block_id');
          const blockChange = new Blockly.Events.BlockChange(
            block,
            'mutation',
            null,
            '',
            '{"hasInput":true}',
          );
          blockChange.run(true);
          assert.isTrue(block.hasInput);
        });
      });
    });
  });

  suite('Serialization', function () {
    setup(function () {
      defineMutatorBlocks();
    });

    teardown(function () {
      Blockly.Extensions.unregister('xml_mutator');
      Blockly.Extensions.unregister('jso_mutator');
    });

    test('events round-trip through JSON', function () {
      const block = this.workspace.newBlock('xml_block', 'block_id');
      block.domToMutation(
        Blockly.utils.xml.textToDom('<mutation hasInput="true"/>'),
      );
      const origEvent = new Blockly.Events.BlockChange(
        block,
        'mutation',
        null,
        '',
        '<mutation hasInput="true"/>',
      );

      const json = origEvent.toJson();
      const newEvent = new Blockly.Events.fromJson(json, this.workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
