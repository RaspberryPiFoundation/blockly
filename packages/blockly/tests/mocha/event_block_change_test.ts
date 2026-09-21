/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {defineMutatorBlocks} from './test_helpers/block_definitions.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Block Change Event', function () {
  let workspace: Blockly.Workspace;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    workspace = new Blockly.Workspace();
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
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
          const block = workspace.newBlock('xml_block', 'block_id');
          block.domToMutation?.(
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
          assert.isFalse((block as any).hasInput);
        });

        test('Redo', function () {
          const block = workspace.newBlock('xml_block', 'block_id');
          const blockChange = new Blockly.Events.BlockChange(
            block,
            'mutation',
            null,
            '',
            '<mutation hasInput="true"/>',
          );
          blockChange.run(true);
          assert.isTrue((block as any).hasInput);
        });
      });

      suite('JSO', function () {
        test('Undo', function () {
          const block = workspace.newBlock('jso_block', 'block_id');
          block.loadExtraState?.({hasInput: true});
          const blockChange = new Blockly.Events.BlockChange(
            block,
            'mutation',
            null,
            '',
            '{"hasInput":true}',
          );
          blockChange.run(false);
          assert.isFalse((block as any).hasInput);
        });

        test('Redo', function () {
          const block = workspace.newBlock('jso_block', 'block_id');
          const blockChange = new Blockly.Events.BlockChange(
            block,
            'mutation',
            null,
            '',
            '{"hasInput":true}',
          );
          blockChange.run(true);
          assert.isTrue((block as any).hasInput);
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
      const block = workspace.newBlock('xml_block', 'block_id');
      block.domToMutation?.(
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
      const newEvent = Blockly.Events.fromJson(json, workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
