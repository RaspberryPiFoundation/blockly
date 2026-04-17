/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import {assert} from '../../node_modules/chai/index.js';
import {navigationTestBlocks} from './test_helpers/navigation_test_blocks.js';
import {p5blocks} from './test_helpers/p5_blocks.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';
import {createKeyDownEvent} from './test_helpers/user_input.js';

/**
 * Dispatches a keydown event with the given keycode on the workspace injection
 * div.
 *
 * @param {!Blockly.WorkspaceSvg} workspace The workspace to dispatch on.
 * @param {number} keyCode The key code to dispatch.
 * @param {!Array<number>=} modifiers Optional modifier key codes.
 */
function pressKey(workspace, keyCode, modifiers) {
  const event = createKeyDownEvent(keyCode, modifiers);
  workspace.getInjectionDiv().dispatchEvent(event);
}

/**
 * Dispatches a keydown event with the given keycode multiple times.
 *
 * @param {!Blockly.WorkspaceSvg} workspace The workspace to dispatch on.
 * @param {number} keyCode The key code to dispatch.
 * @param {number} times The number of times to press the key.
 * @param {!Array<number>=} modifiers Optional modifier key codes.
 */
function pressKeyN(workspace, keyCode, times, modifiers) {
  for (let i = 0; i < times; i++) {
    pressKey(workspace, keyCode, modifiers);
  }
}

/**
 * Focuses the block with the given ID on the given workspace.
 *
 * @param {!Blockly.WorkspaceSvg} workspace The workspace containing the block.
 * @param {string} blockId The ID of the block to focus.
 */
function focusBlock(workspace, blockId) {
  const block = workspace.getBlockById(blockId);
  if (!block) throw new Error(`No block found with ID: ${blockId}`);
  Blockly.getFocusManager().focusNode(block);
}

/**
 * Focuses the named field on a block.
 *
 * @param {!Blockly.WorkspaceSvg} workspace The workspace containing the block.
 * @param {string} blockId The ID of the block.
 * @param {string} fieldName The name of the field to focus.
 */
function focusBlockField(workspace, blockId, fieldName) {
  const block = workspace.getBlockById(blockId);
  if (!block) throw new Error(`No block found with ID: ${blockId}`);
  const field = block.getField(fieldName);
  if (!field) {
    throw new Error(`No field found: ${fieldName} (block ${blockId})`);
  }
  Blockly.getFocusManager().focusNode(field);
}

/**
 * Returns the block ID of the currently focused node, or undefined if the
 * focused node is not a block.
 *
 * @returns {string|undefined} ID of the focused block, if any.
 */
function getFocusedBlockId() {
  const node = Blockly.getFocusManager().getFocusedNode();
  if (node instanceof Blockly.BlockSvg) return node.id;
  return undefined;
}

/**
 * Returns the DOM element ID of the currently focused node's focusable element.
 *
 * @returns {string|undefined} ID of the focused node, if any.
 */
function getFocusNodeId() {
  return Blockly.getFocusManager().getFocusedNode()?.getFocusableElement()?.id;
}

/**
 * Returns the name of the currently focused field, or undefined if the focused
 * node is not a field.
 *
 * @returns {string|undefined} Name of the focused field, if any.
 */
function getFocusedFieldName() {
  return Blockly.getFocusManager().getFocusedNode()?.name;
}

/**
 * Returns the block type of the currently focused node, or undefined if the
 * focused node is not a block.
 *
 * @returns {string|undefined} Type of the focused block, if any.
 */
function getFocusedBlockType() {
  const node = Blockly.getFocusManager().getFocusedNode();
  if (node instanceof Blockly.BlockSvg) return node.type;
  return undefined;
}

/**
 * Focuses the workspace comment with the given ID.
 *
 * @param {!Blockly.WorkspaceSvg} workspace The workspace containing the comment.
 * @param {string} commentId The ID of the workspace comment to focus.
 */
function focusWorkspaceComment(workspace, commentId) {
  const comment = workspace.getCommentById(commentId);
  if (!comment) {
    throw new Error(`No workspace comment found with ID: ${commentId}`);
  }
  Blockly.getFocusManager().focusNode(comment);
}

suite('Keyboard navigation on Blocks', function () {
  setup(async function () {
    sharedTestSetup.call(this);
    const toolbox = document.getElementById('toolbox-simple');
    this.workspace = Blockly.inject('blocklyDiv', {
      toolbox: toolbox,
      renderer: 'zelos',
    });
    Blockly.common.defineBlocks(p5blocks);
    Blockly.serialization.workspaces.load(navigationTestBlocks, this.workspace);
    for (const block of this.workspace.getAllBlocks()) {
      block.initSvg();
      block.render();
    }
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  test('Default workspace', function () {
    const blockCount = this.workspace.getAllBlocks(false).length;
    assert.equal(blockCount, 16);
  });

  test('Selected block', function () {
    Blockly.getFocusManager().focusTree(this.workspace);
    pressKeyN(this.workspace, Blockly.utils.KeyCodes.DOWN, 13);
    assert.equal(getFocusedBlockId(), 'controls_repeat_ext_1');
  });

  test('Down from statement block selects next block across stacks', function () {
    focusBlock(this.workspace, 'p5_canvas_1');
    // The first down moves to the next connection on the selected block.
    pressKeyN(this.workspace, Blockly.utils.KeyCodes.DOWN, 2);
    assert.equal(getFocusedBlockId(), 'p5_draw_1');
  });

  test('Up from statement block selects previous block', function () {
    focusBlock(this.workspace, 'simple_circle_1');
    pressKey(this.workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(getFocusedBlockId(), 'draw_emoji_1');
  });

  test('Down from parent block selects first child block', function () {
    focusBlock(this.workspace, 'p5_setup_1');
    pressKey(this.workspace, Blockly.utils.KeyCodes.DOWN);
    assert.equal(getFocusedBlockId(), 'p5_canvas_1');
  });

  test('Up from child block selects parent block', function () {
    focusBlock(this.workspace, 'p5_canvas_1');
    pressKey(this.workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(getFocusedBlockId(), 'p5_setup_1');
  });

  test('Right from block selects first field', function () {
    focusBlock(this.workspace, 'p5_canvas_1');
    pressKey(this.workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.include(getFocusNodeId(), 'p5_canvas_1_field_');
    assert.equal(getFocusedFieldName(), 'WIDTH');
  });

  test('Right from block selects first inline input', function () {
    focusBlock(this.workspace, 'simple_circle_1');
    pressKey(this.workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(getFocusedBlockId(), 'colour_picker_1');
  });

  test('Up from inline input selects statement block', function () {
    focusBlock(this.workspace, 'math_number_2');
    pressKey(this.workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(
      Blockly.getFocusManager().getFocusedNode(),
      this.workspace.getBlockById('simple_circle_1').nextConnection,
    );
  });

  test('Left from first inline input selects block', function () {
    focusBlock(this.workspace, 'math_number_2');
    pressKey(this.workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(getFocusedBlockId(), 'math_modulo_1');
  });

  test('Right from first inline input selects second inline input', function () {
    focusBlock(this.workspace, 'math_number_2');
    pressKey(this.workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(getFocusedBlockId(), 'math_number_3');
  });

  test('Left from second inline input selects first inline input', function () {
    focusBlock(this.workspace, 'math_number_3');
    pressKey(this.workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(getFocusedBlockId(), 'math_number_2');
  });

  test('Right from last inline input block selects next child field', function () {
    focusBlock(this.workspace, 'colour_picker_1');
    // Go right twice; should not wrap to next row.
    pressKeyN(this.workspace, Blockly.utils.KeyCodes.RIGHT, 2);
    assert.equal(
      Blockly.getFocusManager().getFocusedNode(),
      this.workspace.getBlockById('colour_picker_1').getField('TEXT'),
    );
  });

  test('Down from inline input selects next block', function () {
    focusBlock(this.workspace, 'colour_picker_1');
    // Go down twice; first one selects the next connection on the colour
    // picker's parent block.
    pressKeyN(this.workspace, Blockly.utils.KeyCodes.DOWN, 2);
    assert.equal(getFocusedBlockId(), 'controls_repeat_ext_1');
  });

  test("Down from inline input selects block's child block", function () {
    focusBlock(this.workspace, 'logic_boolean_1');
    pressKey(this.workspace, Blockly.utils.KeyCodes.DOWN);
    assert.equal(getFocusedBlockId(), 'text_print_1');
  });

  test('Right from text block selects shadow block then field', function () {
    focusBlock(this.workspace, 'text_print_1');
    pressKey(this.workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(getFocusedBlockId(), 'text_1');

    pressKey(this.workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.include(getFocusNodeId(), 'text_1_field_');
  });

  test('Is inhibited when widgetdiv is visible', function () {
    focusBlock(this.workspace, 'text_print_1');
    this.workspace.getBlockById('text_print_1').showContextMenu();
    assert.isTrue(Blockly.WidgetDiv.isVisible());
    pressKey(this.workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(getFocusedBlockId(), 'text_print_1');
    pressKey(this.workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(getFocusedBlockId(), 'text_print_1');
    pressKey(this.workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(getFocusedBlockId(), 'text_print_1');
    pressKey(this.workspace, Blockly.utils.KeyCodes.DOWN);
    assert.equal(getFocusedBlockId(), 'text_print_1');
  });

  test('Is inhibited when dropdowndiv is visible', function () {
    focusBlock(this.workspace, 'logic_boolean_1');
    this.workspace
      .getBlockById('logic_boolean_1')
      .getField('BOOL')
      .showEditor();
    assert.isTrue(Blockly.DropDownDiv.isVisible());
    pressKey(this.workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(getFocusedBlockId(), 'logic_boolean_1');
    pressKey(this.workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(getFocusedBlockId(), 'logic_boolean_1');
    pressKey(this.workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(getFocusedBlockId(), 'logic_boolean_1');
    pressKey(this.workspace, Blockly.utils.KeyCodes.DOWN);
    assert.equal(getFocusedBlockId(), 'logic_boolean_1');
  });
});

suite('Keyboard navigation on Fields', function () {
  setup(function () {
    sharedTestSetup.call(this);
    const toolbox = document.getElementById('toolbox-simple');
    this.workspace = Blockly.inject('blocklyDiv', {
      toolbox: toolbox,
      renderer: 'zelos',
    });
    Blockly.common.defineBlocks(p5blocks);
    Blockly.serialization.workspaces.load(navigationTestBlocks, this.workspace);
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  test('Up from first field selects previous block', function () {
    focusBlockField(this.workspace, 'p5_canvas_1', 'WIDTH');
    pressKey(this.workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(getFocusedBlockId(), 'p5_setup_1');
  });

  test('Left from first field selects block', function () {
    focusBlockField(this.workspace, 'p5_canvas_1', 'WIDTH');
    pressKey(this.workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(getFocusedBlockId(), 'p5_canvas_1');
  });

  test('Right from first field selects second field', function () {
    focusBlockField(this.workspace, 'p5_canvas_1', 'WIDTH');
    pressKey(this.workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.include(getFocusNodeId(), 'p5_canvas_1_field_');
    assert.equal(getFocusedFieldName(), 'HEIGHT');
  });

  test('Left from second field selects first field', function () {
    focusBlockField(this.workspace, 'p5_canvas_1', 'HEIGHT');
    pressKey(this.workspace, Blockly.utils.KeyCodes.LEFT);
    assert.include(getFocusNodeId(), 'p5_canvas_1_field_');
    assert.equal(getFocusedFieldName(), 'WIDTH');
  });

  test('Right from second field selects does not change focus', function () {
    focusBlockField(this.workspace, 'p5_canvas_1', 'HEIGHT');
    pressKey(this.workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(
      Blockly.getFocusManager().getFocusedNode(),
      this.workspace.getBlockById('p5_canvas_1').getField('HEIGHT'),
    );
  });

  test('Down from field selects next block', function () {
    focusBlockField(this.workspace, 'p5_canvas_1', 'WIDTH');
    // Go down twice; first one selects the next connection on the create
    // canvas block.
    pressKeyN(this.workspace, Blockly.utils.KeyCodes.DOWN, 2);
    assert.equal(getFocusedBlockId(), 'p5_draw_1');
  });

  test("Down from field selects block's child block", function () {
    focusBlockField(this.workspace, 'controls_repeat_1', 'TIMES');
    pressKey(this.workspace, Blockly.utils.KeyCodes.DOWN);
    assert.equal(getFocusedBlockId(), 'draw_emoji_1');
  });
});

suite('Workspace comment navigation', function () {
  setup(async function () {
    sharedTestSetup.call(this);
    const toolbox = document.getElementById('toolbox-simple');
    this.workspace = Blockly.inject('blocklyDiv', {
      toolbox: toolbox,
      renderer: 'zelos',
    });
    Blockly.common.defineBlocks(p5blocks);
    Blockly.serialization.workspaces.load(navigationTestBlocks, this.workspace);
    this.workspace.getTopBlocks(false).forEach((b) => b.queueRender());
    Blockly.renderManagement.triggerQueuedRenders(this.workspace);

    const comment1 = Blockly.serialization.workspaceComments.append(
      {text: 'Comment one', x: 200, y: 200},
      this.workspace,
    );
    const comment2 = Blockly.serialization.workspaceComments.append(
      {text: 'Comment two', x: 300, y: 300},
      this.workspace,
    );
    this.commentId1 = comment1.id;
    this.commentId2 = comment2.id;
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  test('Navigate forward from block to workspace comment', function () {
    focusBlock(this.workspace, 'p5_canvas_1');
    pressKeyN(this.workspace, Blockly.utils.KeyCodes.DOWN, 2);
    assert.equal(getFocusNodeId(), this.commentId1);
  });

  test('Navigate forward from workspace comment to block', function () {
    focusWorkspaceComment(this.workspace, this.commentId2);
    pressKey(this.workspace, Blockly.utils.KeyCodes.DOWN);
    assert.equal(getFocusedBlockType(), 'p5_draw');
  });

  test('Navigate backward from block to workspace comment', function () {
    focusBlock(this.workspace, 'p5_draw_1');
    pressKey(this.workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(getFocusNodeId(), this.commentId2);
  });

  test('Navigate backward from workspace comment to block', function () {
    focusWorkspaceComment(this.workspace, this.commentId1);
    pressKeyN(this.workspace, Blockly.utils.KeyCodes.UP, 2);
    assert.equal(getFocusedBlockType(), 'p5_canvas');
  });

  test('Navigate forward from workspace comment to workspace comment', function () {
    focusWorkspaceComment(this.workspace, this.commentId1);
    pressKey(this.workspace, Blockly.utils.KeyCodes.DOWN);
    assert.equal(getFocusNodeId(), this.commentId2);
  });

  test('Navigate backward from workspace comment to workspace comment', function () {
    focusWorkspaceComment(this.workspace, this.commentId2);
    pressKey(this.workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(getFocusNodeId(), this.commentId1);
  });

  test('Navigate forward from workspace comment to workspace comment button', function () {
    focusWorkspaceComment(this.workspace, this.commentId1);
    pressKey(this.workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(getFocusNodeId(), `${this.commentId1}_collapse_bar_button`);
  });

  test('Navigate backward from workspace comment button to workspace comment', function () {
    focusWorkspaceComment(this.workspace, this.commentId1);
    pressKey(this.workspace, Blockly.utils.KeyCodes.RIGHT);
    pressKey(this.workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(getFocusNodeId(), this.commentId1);
  });
});

const leftColumnNav = {
  in: Blockly.utils.KeyCodes.RIGHT,
  out: Blockly.utils.KeyCodes.LEFT,
  nextItem: Blockly.utils.KeyCodes.DOWN,
  previousItem: Blockly.utils.KeyCodes.UP,
};

const rightColumnNav = {
  in: Blockly.utils.KeyCodes.LEFT,
  out: Blockly.utils.KeyCodes.RIGHT,
  nextItem: Blockly.utils.KeyCodes.DOWN,
  previousItem: Blockly.utils.KeyCodes.UP,
};

/**
 * All possible combinations of horizontal/vertical layout, LTR/RTL, and start/
 * end toolbox/flyout positioning, along with the keycodes that should navigate
 * in, out, and to the previous/next item in that layout configuration.
 */
const TOOLBOX_FLYOUT_LAYOUTS = [
  {
    id: 'Vertical Start LTR',
    rtl: false,
    horizontalLayout: false,
    toolboxPosition: 'start',
    ...leftColumnNav,
  },
  {
    id: 'Vertical Start RTL',
    rtl: true,
    horizontalLayout: false,
    toolboxPosition: 'start',
    ...rightColumnNav,
  },
  {
    id: 'Vertical End LTR',
    rtl: false,
    horizontalLayout: false,
    toolboxPosition: 'end',
    ...rightColumnNav,
  },
  {
    id: 'Vertical End RTL',
    rtl: true,
    horizontalLayout: false,
    toolboxPosition: 'end',
    ...leftColumnNav,
  },
  {
    id: 'Horizontal Start LTR',
    rtl: false,
    horizontalLayout: true,
    toolboxPosition: 'start',
    in: Blockly.utils.KeyCodes.DOWN,
    out: Blockly.utils.KeyCodes.UP,
    nextItem: Blockly.utils.KeyCodes.RIGHT,
    previousItem: Blockly.utils.KeyCodes.LEFT,
  },
  {
    id: 'Horizontal Start RTL',
    rtl: true,
    horizontalLayout: true,
    toolboxPosition: 'start',
    in: Blockly.utils.KeyCodes.DOWN,
    out: Blockly.utils.KeyCodes.UP,
    nextItem: Blockly.utils.KeyCodes.LEFT,
    previousItem: Blockly.utils.KeyCodes.RIGHT,
  },
  {
    id: 'Horizontal End LTR',
    rtl: false,
    horizontalLayout: true,
    toolboxPosition: 'end',
    in: Blockly.utils.KeyCodes.UP,
    out: Blockly.utils.KeyCodes.DOWN,
    nextItem: Blockly.utils.KeyCodes.RIGHT,
    previousItem: Blockly.utils.KeyCodes.LEFT,
  },
  {
    id: 'Horizontal End RTL',
    rtl: true,
    horizontalLayout: true,
    toolboxPosition: 'end',
    in: Blockly.utils.KeyCodes.UP,
    out: Blockly.utils.KeyCodes.DOWN,
    nextItem: Blockly.utils.KeyCodes.LEFT,
    previousItem: Blockly.utils.KeyCodes.RIGHT,
  },
];

suite('Toolbox and flyout arrow navigation by layout', function () {
  for (const layout of TOOLBOX_FLYOUT_LAYOUTS) {
    suite(layout.id, function () {
      setup(function () {
        sharedTestSetup.call(this);
        Blockly.defineBlocksWithJsonArray([
          {
            type: 'basic_block',
            message0: '%1',
            args0: [
              {
                type: 'field_input',
                name: 'TEXT',
                text: 'default',
              },
            ],
          },
        ]);
        const toolbox = document.getElementById('toolbox-categories');
        this.workspace = Blockly.inject('blocklyDiv', {
          toolbox,
          rtl: layout.rtl,
          horizontalLayout: layout.horizontalLayout,
          toolboxPosition: layout.toolboxPosition,
          renderer: 'zelos',
        });
        this.keys = layout;
        this.firstToolboxItem = this.workspace
          .getToolbox()
          .getToolboxItems()[0];
        this.lastToolboxItem = this.workspace.getToolbox().getToolboxItems()[1];
      });

      teardown(function () {
        sharedTestTeardown.call(this);
      });

      test('Previous toolbox item from first is no-op', function () {
        this.workspace.getToolbox().getNavigator().setNavigationLoops(false);
        Blockly.getFocusManager().focusNode(this.firstToolboxItem);
        pressKey(this.workspace, this.keys.previousItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.firstToolboxItem,
        );
      });

      test('Previous toolbox item from first loops to last', function () {
        this.workspace.getToolbox().getNavigator().setNavigationLoops(true);
        Blockly.getFocusManager().focusNode(this.firstToolboxItem);
        pressKey(this.workspace, this.keys.previousItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.lastToolboxItem,
        );
      });

      test('Previous toolbox item', function () {
        Blockly.getFocusManager().focusNode(this.lastToolboxItem);
        pressKey(this.workspace, this.keys.previousItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.firstToolboxItem,
        );
      });

      test('Next toolbox item from last is no-op', function () {
        this.workspace.getToolbox().getNavigator().setNavigationLoops(false);
        Blockly.getFocusManager().focusNode(this.lastToolboxItem);
        pressKey(this.workspace, this.keys.nextItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.lastToolboxItem,
        );
      });

      test('Next toolbox item from last loops', function () {
        this.workspace.getToolbox().getNavigator().setNavigationLoops(true);
        Blockly.getFocusManager().focusNode(this.lastToolboxItem);
        pressKey(this.workspace, this.keys.nextItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.firstToolboxItem,
        );
      });

      test('Next toolbox item', function () {
        Blockly.getFocusManager().focusNode(this.firstToolboxItem);
        pressKey(this.workspace, this.keys.nextItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.lastToolboxItem,
        );
      });

      test('Out from toolbox item is no-op', function () {
        Blockly.getFocusManager().focusNode(this.firstToolboxItem);
        pressKey(this.workspace, this.keys.out);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.firstToolboxItem,
        );
      });

      test('In from toolbox item focuses first flyout item', function () {
        Blockly.getFocusManager().focusNode(this.firstToolboxItem);
        pressKey(this.workspace, this.keys.in);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[0],
        );
      });

      test('Previous flyout item from first is no-op', function () {
        this.workspace
          .getFlyout()
          .getWorkspace()
          .getNavigator()
          .setNavigationLoops(false);
        pressKey(this.workspace, Blockly.utils.KeyCodes.T);
        Blockly.getFocusManager().focusNode(
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[0],
        );
        pressKey(this.workspace, this.keys.previousItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[0],
        );
      });

      test('Previous flyout item from first loops', function () {
        this.workspace
          .getFlyout()
          .getWorkspace()
          .getNavigator()
          .setNavigationLoops(true);
        pressKey(this.workspace, Blockly.utils.KeyCodes.T);
        Blockly.getFocusManager().focusNode(
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[0],
        );
        pressKey(this.workspace, this.keys.previousItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[1],
        );
      });

      test('Previous flyout item', function () {
        pressKey(this.workspace, Blockly.utils.KeyCodes.T);
        Blockly.getFocusManager().focusNode(
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[1],
        );
        pressKey(this.workspace, this.keys.previousItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[0],
        );
      });

      test('Next flyout item from last is no-op', function () {
        this.workspace
          .getFlyout()
          .getWorkspace()
          .getNavigator()
          .setNavigationLoops(false);
        pressKey(this.workspace, Blockly.utils.KeyCodes.T);
        Blockly.getFocusManager().focusNode(
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[1],
        );
        pressKey(this.workspace, this.keys.nextItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[1],
        );
      });

      test('Next flyout item from last loops', function () {
        this.workspace
          .getFlyout()
          .getWorkspace()
          .getNavigator()
          .setNavigationLoops(true);
        pressKey(this.workspace, Blockly.utils.KeyCodes.T);
        Blockly.getFocusManager().focusNode(
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[1],
        );
        pressKey(this.workspace, this.keys.nextItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[0],
        );
      });

      test('Next flyout item', function () {
        pressKey(this.workspace, Blockly.utils.KeyCodes.T);
        Blockly.getFocusManager().focusNode(
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[0],
        );
        pressKey(this.workspace, this.keys.nextItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[1],
        );
      });

      test('Out from flyout item focuses toolbox item', function () {
        pressKey(this.workspace, Blockly.utils.KeyCodes.T);
        Blockly.getFocusManager().focusNode(
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[0],
        );
        pressKey(this.workspace, this.keys.out);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.firstToolboxItem,
        );
      });

      test('In from flyout item is no-op', function () {
        pressKey(this.workspace, Blockly.utils.KeyCodes.T);
        Blockly.getFocusManager().focusNode(
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[0],
        );
        pressKey(this.workspace, this.keys.in);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          this.workspace.getFlyout().getWorkspace().getTopBlocks()[0],
        );
      });
    });
  }
});
