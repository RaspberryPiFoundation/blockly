/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  assertEventFired,
  createChangeListenerSpy,
} from './test_helpers/events.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Clipboard', function () {
  setup(function () {
    this.clock = sharedTestSetup.call(this, {fireEventsNow: false}).clock;
    this.workspace = Blockly.inject('blocklyDiv');
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  test('a paster registered with a given type is called when pasting that type', function () {
    const paster = {
      paste: sinon.stub().returns(null),
    };
    Blockly.clipboard.registry.register('test-paster', paster);

    Blockly.clipboard.paste({paster: 'test-paster'}, this.workspace);
    assert.isTrue(paster.paste.calledOnce);

    Blockly.clipboard.registry.unregister('test-paster');
  });

  suite('pasting blocks', function () {
    test('pasting blocks fires a create event', function () {
      const eventSpy = createChangeListenerSpy(this.workspace);
      const block = Blockly.serialization.blocks.append(
        {
          'type': 'controls_if',
          'id': 'blockId',
        },
        this.workspace,
      );
      const data = block.toCopyData();
      this.clock.runAll();
      eventSpy.resetHistory();

      Blockly.clipboard.paste(data, this.workspace);
      this.clock.runAll();

      assertEventFired(
        eventSpy,
        Blockly.Events.BlockCreate,
        {'recordUndo': true, 'type': Blockly.Events.BLOCK_CREATE},
        this.workspace.id,
      );
    });

    test('pasting blocks includes next blocks if requested', function () {
      const block = Blockly.serialization.blocks.append(
        {
          'type': 'controls_if',
          'id': 'blockId',
          'next': {
            'block': {
              'type': 'controls_if',
              'id': 'blockId2',
            },
          },
        },
        this.workspace,
      );
      assert.equal(this.workspace.getBlocksByType('controls_if').length, 2);
      // Both blocks should be copied
      const data = block.toCopyData(true);
      this.clock.runAll();

      Blockly.clipboard.paste(data, this.workspace);
      this.clock.runAll();
      // After pasting, we should have gone from 2 to 4 blocks.
      assert.equal(this.workspace.getBlocksByType('controls_if').length, 4);
    });

    test('copied from a mutator pastes them into the mutator', async function () {
      const block = Blockly.serialization.blocks.append(
        {
          'type': 'controls_if',
          'id': 'blockId',
          'extraState': {
            'elseIfCount': 1,
          },
        },
        this.workspace,
      );
      const mutatorIcon = block.getIcon(Blockly.icons.IconType.MUTATOR);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const elseIf = mutatorWorkspace.getBlocksByType('controls_if_elseif')[0];
      assert.isDefined(elseIf);
      assert.lengthOf(mutatorWorkspace.getAllBlocks(), 2);
      assert.lengthOf(this.workspace.getAllBlocks(), 1);
      const data = elseIf.toCopyData();
      Blockly.clipboard.paste(data, mutatorWorkspace);
      assert.lengthOf(mutatorWorkspace.getAllBlocks(), 3);
      assert.lengthOf(this.workspace.getAllBlocks(), 1);
    });

    test('pasting into a mutator flyout pastes into the mutator workspace', async function () {
      const block = Blockly.serialization.blocks.append(
        {
          'type': 'controls_if',
          'id': 'blockId',
          'extraState': {
            'elseIfCount': 1,
          },
        },
        this.workspace,
      );
      const mutatorIcon = block.getIcon(Blockly.icons.IconType.MUTATOR);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const mutatorFlyoutWorkspace = mutatorWorkspace
        .getFlyout()
        .getWorkspace();
      const elseIf =
        mutatorFlyoutWorkspace.getBlocksByType('controls_if_elseif')[0];
      assert.isDefined(elseIf);
      assert.lengthOf(mutatorWorkspace.getAllBlocks(), 2);
      assert.lengthOf(this.workspace.getAllBlocks(), 1);
      const data = elseIf.toCopyData();
      Blockly.clipboard.paste(data, mutatorFlyoutWorkspace);
      assert.lengthOf(mutatorWorkspace.getAllBlocks(), 3);
      assert.lengthOf(this.workspace.getAllBlocks(), 1);
    });

    suite('pasted blocks are placed in unambiguous locations', function () {
      test('pasted blocks are bumped to not overlap', function () {
        const block = Blockly.serialization.blocks.append(
          {
            'type': 'controls_if',
            'x': 38,
            'y': 13,
          },
          this.workspace,
        );
        const data = block.toCopyData();

        const newBlock = Blockly.clipboard.paste(data, this.workspace);
        assert.deepEqual(
          newBlock.getRelativeToSurfaceXY(),
          new Blockly.utils.Coordinate(66, 69),
        );
      });

      test('pasted blocks are bumped to not overlap in RTL', function () {
        this.workspace.dispose();
        this.workspace = Blockly.inject('blocklyDiv', {rtl: true});
        const block = Blockly.serialization.blocks.append(
          {
            'type': 'controls_if',
            'x': 38,
            'y': 13,
          },
          this.workspace,
        );
        const data = block.toCopyData();

        const newBlock = Blockly.clipboard.paste(data, this.workspace);
        const oldBlockXY = block.getRelativeToSurfaceXY();
        assert.deepEqual(
          newBlock.getRelativeToSurfaceXY(),
          new Blockly.utils.Coordinate(
            oldBlockXY.x - Blockly.config.snapRadius,
            oldBlockXY.y + Blockly.config.snapRadius * 2,
          ),
        );

        // Restore an LTR workspace.
        this.workspace.dispose();
        this.workspace = Blockly.inject('blocklyDiv');
      });

      test('pasted blocks are bumped to be outside the connection snap radius', function () {
        Blockly.serialization.workspaces.load(
          {
            'blocks': {
              'languageVersion': 0,
              'blocks': [
                {
                  'type': 'controls_if',
                  'id': 'sourceBlockId',
                  'x': 38,
                  'y': 13,
                },
                {
                  'type': 'logic_compare',
                  'x': 113,
                  'y': 63,
                },
              ],
            },
          },
          this.workspace,
        );
        this.clock.runAll(); // Update the connection DB.
        const data = this.workspace.getBlockById('sourceBlockId').toCopyData();

        const newBlock = Blockly.clipboard.paste(data, this.workspace);
        assert.deepEqual(
          newBlock.getRelativeToSurfaceXY(),
          new Blockly.utils.Coordinate(94, 125),
        );
      });
    });
  });

  suite('pasting comments', function () {
    test('pasted comments are bumped to not overlap', function () {
      Blockly.Xml.domToWorkspace(
        Blockly.utils.xml.textToDom(
          '<xml><comment id="test" x=10 y=10/></xml>',
        ),
        this.workspace,
      );
      const comment = this.workspace.getTopComments(false)[0];
      const data = comment.toCopyData();

      const newComment = Blockly.clipboard.paste(data, this.workspace);
      assert.deepEqual(
        newComment.getRelativeToSurfaceXY(),
        new Blockly.utils.Coordinate(40, 40),
      );
    });

    test('pasted comments are bumped to not overlap in RTL', function () {
      this.workspace.dispose();
      this.workspace = Blockly.inject('blocklyDiv', {rtl: true});
      Blockly.Xml.domToWorkspace(
        Blockly.utils.xml.textToDom(
          '<xml><comment id="test" x=10 y=10/></xml>',
        ),
        this.workspace,
      );
      const comment = this.workspace.getTopComments(false)[0];
      const data = comment.toCopyData();

      const newComment = Blockly.clipboard.paste(data, this.workspace);
      const oldCommentXY = comment.getRelativeToSurfaceXY();
      assert.deepEqual(
        newComment.getRelativeToSurfaceXY(),
        new Blockly.utils.Coordinate(oldCommentXY.x - 30, oldCommentXY.y + 30),
      );
      // Restore an LTR workspace.
      this.workspace.dispose();
      this.workspace = Blockly.inject('blocklyDiv');
    });
  });
});
