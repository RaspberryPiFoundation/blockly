/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import * as Blockly from 'blockly';
import {BlockStateIndicators} from '../src/index';
import {BlockStateIcon} from '../src/block_state_icon';
import {setBlockState} from '../src/block_state_change';

/**
 * Waits for queued events to be fired to listeners and the undo stack.
 * @returns {!Promise<void>} Resolves once events have fired.
 */
function flushEvents() {
  return new Promise((resolve) => setTimeout(resolve));
}

/**
 * Returns the number of glyphs a block's state icon shows, or 0 if it has no
 * icon. Each glyph is 16 units wide, with a 2 unit gap between them.
 * @param {!Blockly.Block} block The block to read.
 * @returns {number} The number of glyphs.
 */
function glyphCount(block) {
  const icon = block.getIcon(BlockStateIcon.TYPE);
  return icon ? (icon.getSize().width + 2) / 18 : 0;
}

// State set before the indicators are created uses core's setters, which don't
// update icons, so only the indicators' initial sweep can add them. State
// changed afterwards uses setBlockState, which is how the plugin keeps icons up
// to date.
suite('Block state indicators', function () {
  setup(function () {
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    this.workspace.dispose();
  });

  test('adds icons to existing restricted blocks', function () {
    const block = this.workspace.newBlock('math_number');
    block.setMovable(false);
    block.setDeletable(false);
    new BlockStateIndicators(this.workspace);
    assert.equal(glyphCount(block), 2);
  });

  test("doesn't add icons to blocks without restrictions", function () {
    const block = this.workspace.newBlock('math_number');
    new BlockStateIndicators(this.workspace);
    assert.isFalse(block.hasIcon(BlockStateIcon.TYPE));
  });

  test('starts turned off when asked', function () {
    const block = this.workspace.newBlock('math_number');
    block.setMovable(false);
    new BlockStateIndicators(this.workspace, {enabled: false});
    assert.isFalse(block.hasIcon(BlockStateIcon.TYPE));
  });

  test('removes icons when turned off', function () {
    const block = this.workspace.newBlock('math_number');
    block.setEditable(false);
    const indicators = new BlockStateIndicators(this.workspace);
    indicators.setEnabled(false);
    assert.isFalse(block.hasIcon(BlockStateIcon.TYPE));
  });

  test('loaded blocks get icons', async function () {
    new BlockStateIndicators(this.workspace);
    Blockly.serialization.workspaces.load(
      {
        blocks: {
          languageVersion: 0,
          blocks: [{type: 'math_number', id: 'loaded', deletable: false}],
        },
      },
      this.workspace,
    );
    await flushEvents();
    assert.equal(glyphCount(this.workspace.getBlockById('loaded')), 1);
  });

  test('shadow blocks only show the editable restriction', function () {
    const block = this.workspace.newBlock('math_number');
    block.setShadow(true);
    block.setMovable(false);
    block.setDeletable(false);
    new BlockStateIndicators(this.workspace);
    assert.isFalse(block.hasIcon(BlockStateIcon.TYPE));

    setBlockState(block, 'editable', false);
    assert.equal(glyphCount(block), 1);
  });

  suite('state changes', function () {
    setup(function () {
      this.block = this.workspace.newBlock('math_number');
      new BlockStateIndicators(this.workspace);
    });

    test('adding a restriction adds the icon', function () {
      setBlockState(this.block, 'movable', false);
      assert.equal(glyphCount(this.block), 1);
    });

    test('adding more restrictions widens the icon', function () {
      setBlockState(this.block, 'movable', false);
      setBlockState(this.block, 'editable', false);
      setBlockState(this.block, 'deletable', false);
      assert.equal(glyphCount(this.block), 3);
    });

    test('restrictions are shown in the tooltip', function () {
      setBlockState(this.block, 'movable', false);
      setBlockState(this.block, 'editable', false);
      setBlockState(this.block, 'deletable', false);
      assert.equal(
        this.block.getIcon(BlockStateIcon.TYPE).getTooltip(),
        "Can't delete\nCan't edit\nCan't move",
      );
    });

    test('removing the last restriction removes the icon', function () {
      setBlockState(this.block, 'movable', false);
      setBlockState(this.block, 'movable', true);
      assert.isFalse(this.block.hasIcon(BlockStateIcon.TYPE));
    });

    test('undo and redo update the icon', async function () {
      setBlockState(this.block, 'deletable', false);
      await flushEvents();

      this.workspace.undo(false);
      assert.isFalse(this.block.hasIcon(BlockStateIcon.TYPE));

      this.workspace.undo(true);
      assert.equal(glyphCount(this.block), 1);
    });
  });

  test('state changes are ignored while turned off', function () {
    const block = this.workspace.newBlock('math_number');
    new BlockStateIndicators(this.workspace, {enabled: false});
    setBlockState(block, 'movable', false);
    assert.isFalse(block.hasIcon(BlockStateIcon.TYPE));
  });
});
