/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import sinon from 'sinon';
import {defineStackBlock} from './test_helpers/block_definitions.js';
import {navigationTestBlocks} from './test_helpers/navigation_test_blocks.ts';
import {p5blocks} from './test_helpers/p5_blocks.ts';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';
import {createKeyDownEvent} from './test_helpers/user_input.js';

/**
 * Dispatches a keydown event with the given keycode on the workspace injection
 * div.
 *
 * @param workspace The workspace to dispatch on.
 * @param keyCode The key code to dispatch.
 * @param modifiers Optional modifier key codes.
 */
function pressKey(
  workspace: Blockly.WorkspaceSvg,
  keyCode: number,
  modifiers?: number[],
) {
  const event = createKeyDownEvent(keyCode, modifiers);
  workspace.getInjectionDiv().dispatchEvent(event);
}

/**
 * Dispatches a keydown event with the given keycode multiple times.
 *
 * @param workspace The workspace to dispatch on.
 * @param keyCode The key code to dispatch.
 * @param times The number of times to press the key.
 * @param modifiers Optional modifier key codes.
 */
function pressKeyN(
  workspace: Blockly.WorkspaceSvg,
  keyCode: number,
  times: number,
  modifiers?: number[],
) {
  for (let i = 0; i < times; i++) {
    pressKey(workspace, keyCode, modifiers);
  }
}

/**
 * Focuses the block with the given ID on the given workspace.
 *
 * @param workspace The workspace containing the block.
 * @param blockId The ID of the block to focus.
 */
function focusBlock(workspace: Blockly.WorkspaceSvg, blockId: string) {
  const block = workspace.getBlockById(blockId);
  if (!block) throw new Error(`No block found with ID: ${blockId}`);
  Blockly.getFocusManager().focusNode(block);
}

/**
 * Focuses the named field on a block.
 *
 * @param workspace The workspace containing the block.
 * @param blockId The ID of the block.
 * @param fieldName The name of the field to focus.
 */
function focusBlockField(
  workspace: Blockly.WorkspaceSvg,
  blockId: string,
  fieldName: string,
) {
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
 * @returns ID of the focused block, if any.
 */
function getFocusedBlockId() {
  const node = Blockly.getFocusManager().getFocusedNode();
  if (node instanceof Blockly.BlockSvg) return node.id;
  return undefined;
}

/**
 * Returns the DOM element ID of the currently focused node's focusable element.
 *
 * @returns ID of the focused node, if any.
 */
function getFocusNodeId() {
  return Blockly.getFocusManager().getFocusedNode()?.getFocusableElement()?.id;
}

/**
 * Returns the name of the currently focused field, or undefined if the focused
 * node is not a field.
 *
 * @returns Name of the focused field, if any.
 */
function getFocusedFieldName() {
  const focusedNode = Blockly.getFocusManager().getFocusedNode();
  if (focusedNode instanceof Blockly.Field) {
    return focusedNode.name;
  }
  return undefined;
}

/**
 * Returns the block type of the currently focused node, or undefined if the
 * focused node is not a block.
 *
 * @returns Type of the focused block, if any.
 */
function getFocusedBlockType() {
  const node = Blockly.getFocusManager().getFocusedNode();
  if (node instanceof Blockly.BlockSvg) return node.type;
  return undefined;
}

/**
 * Focuses the workspace comment with the given ID.
 *
 * @param workspace The workspace containing the comment.
 * @param commentId The ID of the workspace comment to focus.
 */
function focusWorkspaceComment(
  workspace: Blockly.WorkspaceSvg,
  commentId: string,
) {
  const comment = workspace.getCommentById(commentId);
  if (!comment) {
    throw new Error(`No workspace comment found with ID: ${commentId}`);
  }
  Blockly.getFocusManager().focusNode(comment);
}

suite('Keyboard navigation on Blocks', function () {
  let workspace: Blockly.WorkspaceSvg;
  let clock: sinon.SinonFakeTimers;

  setup(async function (this: Mocha.Context) {
    ({clock} = sharedTestSetup.call(this));
    const toolbox = document.getElementById('toolbox-simple');
    assert.isNotNull(toolbox);
    workspace = Blockly.inject('blocklyDiv', {
      ...DEFAULT_INJECT_OPTIONS,
      toolbox: toolbox,
      renderer: 'zelos',
    });
    Blockly.common.defineBlocks(p5blocks);
    Blockly.serialization.workspaces.load(navigationTestBlocks, workspace);
    for (const block of workspace.getAllBlocks()) {
      block.initSvg();
      block.render();
    }
  });

  teardown(function (this: Mocha.Context) {
    for (const block of Object.keys(p5blocks)) {
      delete Blockly.Blocks[block];
    }
    sharedTestTeardown.call(this, workspace);
  });

  test('Default workspace', function () {
    const blockCount = workspace.getAllBlocks(false).length;
    assert.equal(blockCount, 16);
  });

  test('Selected block', function () {
    // first block in workspace
    focusBlock(workspace, 'p5_setup_1');
    pressKeyN(workspace, Blockly.utils.KeyCodes.DOWN, 13);
    assert.equal(getFocusedBlockId(), 'controls_repeat_ext_1');
  });

  test('Down from statement block selects next block across stacks', function () {
    focusBlock(workspace, 'p5_canvas_1');
    // The first down moves to the next connection on the selected block.
    pressKeyN(workspace, Blockly.utils.KeyCodes.DOWN, 2);
    assert.equal(getFocusedBlockId(), 'p5_draw_1');
  });

  test('Up from statement block selects previous block', function () {
    focusBlock(workspace, 'simple_circle_1');
    pressKey(workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(getFocusedBlockId(), 'draw_emoji_1');
  });

  test('Down from parent block selects first child block', function () {
    focusBlock(workspace, 'p5_setup_1');
    pressKey(workspace, Blockly.utils.KeyCodes.DOWN);
    assert.equal(getFocusedBlockId(), 'p5_canvas_1');
  });

  test('Up from child block selects parent block', function () {
    focusBlock(workspace, 'p5_canvas_1');
    pressKey(workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(getFocusedBlockId(), 'p5_setup_1');
  });

  test('Right from block selects first icon', function () {
    workspace.getBlockById('p5_canvas_1')?.setCommentText('hello');
    focusBlock(workspace, 'p5_canvas_1');
    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(
      Blockly.getFocusManager().getFocusedNode(),
      workspace
        .getBlockById('p5_canvas_1')
        ?.getIcon(Blockly.icons.IconType.COMMENT),
    );
  });

  test('Right from icon selects next icon', function () {
    const block = workspace.getBlockById('p5_canvas_1');
    assert.isNotNull(block);
    block.setCommentText('hello');
    block.setWarningText('danger!');
    const commentIcon = block.getIcon(Blockly.icons.IconType.COMMENT);
    const warningIcon = block.getIcon(Blockly.icons.IconType.WARNING);
    assert.isDefined(warningIcon);
    Blockly.getFocusManager().focusNode(warningIcon);
    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(Blockly.getFocusManager().getFocusedNode(), commentIcon);
  });

  test('Right from icon selects bubble', async function () {
    const block = workspace.getBlockById('p5_canvas_1');
    assert.isNotNull(block);
    block.setCommentText('hello');
    const commentIcon = block.getIcon(Blockly.icons.IconType.COMMENT);
    assert.isDefined(commentIcon);
    await commentIcon.setBubbleVisible(true);

    Blockly.getFocusManager().focusNode(commentIcon);
    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(
      Blockly.getFocusManager().getFocusedNode(),
      commentIcon.getBubble(),
    );
  });

  test('Right from last icon selects field', function () {
    workspace.getBlockById('p5_canvas_1')?.setCommentText('hello');
    const icon = workspace
      .getBlockById('p5_canvas_1')
      ?.getIcon(Blockly.icons.IconType.COMMENT);
    assert.isDefined(icon);
    Blockly.getFocusManager().focusNode(icon);
    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.include(getFocusNodeId(), 'p5_canvas_1_field_');
    assert.equal(getFocusedFieldName(), 'WIDTH');
  });

  test('Right from block selects first field', function () {
    focusBlock(workspace, 'p5_canvas_1');
    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.include(getFocusNodeId(), 'p5_canvas_1_field_');
    assert.equal(getFocusedFieldName(), 'WIDTH');
  });

  test('Right from block selects first inline input', function () {
    focusBlock(workspace, 'simple_circle_1');
    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(getFocusedBlockId(), 'colour_picker_1');
  });

  test('Up from inline input selects statement block', function () {
    focusBlock(workspace, 'math_number_2');
    pressKey(workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(
      Blockly.getFocusManager().getFocusedNode(),
      workspace.getBlockById('simple_circle_1')?.nextConnection,
    );
  });

  test('Left from first inline input selects block', function () {
    focusBlock(workspace, 'math_number_2');
    pressKey(workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(getFocusedBlockId(), 'math_modulo_1');
  });

  test('Right from first inline input selects second inline input', function () {
    focusBlock(workspace, 'math_number_2');
    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(getFocusedBlockId(), 'math_number_3');
  });

  test('Left from second inline input selects first inline input', function () {
    focusBlock(workspace, 'math_number_3');
    pressKey(workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(getFocusedBlockId(), 'math_number_2');
  });

  test('Left from icon selects block', function () {
    const block = workspace.getBlockById('p5_canvas_1');
    assert.isNotNull(block);
    block.setCommentText('hello');
    const icon = block.getIcon(Blockly.icons.IconType.COMMENT);
    assert.isDefined(icon);
    Blockly.getFocusManager().focusNode(icon);
    pressKey(workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(Blockly.getFocusManager().getFocusedNode(), block);
  });

  test('Left from icon selects previous icon', function () {
    const block = workspace.getBlockById('p5_canvas_1');
    assert.isNotNull(block);
    block.setCommentText('hello');
    block.setWarningText('danger!');
    const commentIcon = block.getIcon(Blockly.icons.IconType.COMMENT);
    const warningIcon = block.getIcon(Blockly.icons.IconType.WARNING);
    assert.isDefined(commentIcon);
    Blockly.getFocusManager().focusNode(commentIcon);
    pressKey(workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(Blockly.getFocusManager().getFocusedNode(), warningIcon);
  });

  test('Left from icon selects bubble', async function () {
    const block = workspace.getBlockById('p5_canvas_1');
    assert.isNotNull(block);
    block.setCommentText('hello');
    block.setWarningText('danger!');
    const commentIcon = block.getIcon(Blockly.icons.IconType.COMMENT);
    const warningIcon = block.getIcon(Blockly.icons.IconType.WARNING);
    assert.isDefined(commentIcon);
    assert.isDefined(warningIcon);
    const bubbleVisible = warningIcon.setBubbleVisible(true);
    clock.runAll();
    await bubbleVisible;

    Blockly.getFocusManager().focusNode(commentIcon);
    pressKey(workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(
      Blockly.getFocusManager().getFocusedNode(),
      warningIcon.getBubble(),
    );
  });

  test('Left from field selects icon', function () {
    workspace.getBlockById('p5_canvas_1')?.setCommentText('hello');
    const commentIcon = workspace
      .getBlockById('p5_canvas_1')
      ?.getIcon(Blockly.icons.IconType.COMMENT);
    focusBlockField(workspace, 'p5_canvas_1', 'WIDTH');
    pressKey(workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(Blockly.getFocusManager().getFocusedNode(), commentIcon);
  });

  test('Left from field selects bubble', async function () {
    workspace.getBlockById('p5_canvas_1')?.setCommentText('hello');
    const commentIcon = workspace
      .getBlockById('p5_canvas_1')
      ?.getIcon(Blockly.icons.IconType.COMMENT);
    await commentIcon?.setBubbleVisible(true);
    focusBlockField(workspace, 'p5_canvas_1', 'WIDTH');
    pressKey(workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(
      Blockly.getFocusManager().getFocusedNode(),
      commentIcon?.getBubble(),
    );
  });

  test('Right from last inline input block selects next child field', function () {
    focusBlock(workspace, 'colour_picker_1');
    // Go right twice; should not wrap to next row.
    pressKeyN(workspace, Blockly.utils.KeyCodes.RIGHT, 2);
    assert.equal(
      Blockly.getFocusManager().getFocusedNode(),
      workspace.getBlockById('colour_picker_1')?.getField('TEXT'),
    );
  });

  test('Down from inline input selects next block', function () {
    focusBlock(workspace, 'colour_picker_1');
    // Go down twice; first one selects the next connection on the colour
    // picker's parent block.
    pressKeyN(workspace, Blockly.utils.KeyCodes.DOWN, 2);
    assert.equal(getFocusedBlockId(), 'controls_repeat_ext_1');
  });

  test("Down from inline input selects block's child block", function () {
    focusBlock(workspace, 'logic_boolean_1');
    pressKey(workspace, Blockly.utils.KeyCodes.DOWN);
    assert.equal(getFocusedBlockId(), 'text_print_1');
  });

  test('Right from text block selects shadow block then field', function () {
    focusBlock(workspace, 'text_print_1');
    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(getFocusedBlockId(), 'text_1');

    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.include(getFocusNodeId(), 'text_1_field_');
  });

  test('Is inhibited when widgetdiv is visible', function () {
    focusBlock(workspace, 'text_print_1');
    workspace
      .getBlockById('text_print_1')
      ?.showContextMenu(new MouseEvent('click'));
    assert.isTrue(Blockly.WidgetDiv.isVisible());
    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(getFocusedBlockId(), 'text_print_1');
    pressKey(workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(getFocusedBlockId(), 'text_print_1');
    pressKey(workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(getFocusedBlockId(), 'text_print_1');
    pressKey(workspace, Blockly.utils.KeyCodes.DOWN);
    assert.equal(getFocusedBlockId(), 'text_print_1');
  });

  test('Is inhibited when dropdowndiv is visible', function () {
    focusBlock(workspace, 'logic_boolean_1');
    workspace.getBlockById('logic_boolean_1')?.getField('BOOL')?.showEditor();
    assert.isTrue(Blockly.DropDownDiv.isVisible());
    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(getFocusedBlockId(), 'logic_boolean_1');
    pressKey(workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(getFocusedBlockId(), 'logic_boolean_1');
    pressKey(workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(getFocusedBlockId(), 'logic_boolean_1');
    pressKey(workspace, Blockly.utils.KeyCodes.DOWN);
    assert.equal(getFocusedBlockId(), 'logic_boolean_1');
  });
});

suite('Keyboard navigation on Fields', function () {
  let workspace: Blockly.WorkspaceSvg;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    const toolbox = document.getElementById('toolbox-simple');
    assert.isNotNull(toolbox);
    workspace = Blockly.inject('blocklyDiv', {
      ...DEFAULT_INJECT_OPTIONS,
      toolbox: toolbox,
      renderer: 'zelos',
    });
    Blockly.common.defineBlocks(p5blocks);
    Blockly.serialization.workspaces.load(navigationTestBlocks, workspace);
  });

  teardown(function (this: Mocha.Context) {
    for (const block of Object.keys(p5blocks)) {
      delete Blockly.Blocks[block];
    }
    sharedTestTeardown.call(this, workspace);
  });

  test('Up from first field selects previous block', function () {
    focusBlockField(workspace, 'p5_canvas_1', 'WIDTH');
    pressKey(workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(getFocusedBlockId(), 'p5_setup_1');
  });

  test('Left from first field selects block', function () {
    focusBlockField(workspace, 'p5_canvas_1', 'WIDTH');
    pressKey(workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(getFocusedBlockId(), 'p5_canvas_1');
  });

  test('Right from first field selects second field', function () {
    focusBlockField(workspace, 'p5_canvas_1', 'WIDTH');
    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.include(getFocusNodeId(), 'p5_canvas_1_field_');
    assert.equal(getFocusedFieldName(), 'HEIGHT');
  });

  test('Left from second field selects first field', function () {
    focusBlockField(workspace, 'p5_canvas_1', 'HEIGHT');
    pressKey(workspace, Blockly.utils.KeyCodes.LEFT);
    assert.include(getFocusNodeId(), 'p5_canvas_1_field_');
    assert.equal(getFocusedFieldName(), 'WIDTH');
  });

  test('Right from second field selects does not change focus', function () {
    focusBlockField(workspace, 'p5_canvas_1', 'HEIGHT');
    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(
      Blockly.getFocusManager().getFocusedNode(),
      workspace.getBlockById('p5_canvas_1')?.getField('HEIGHT'),
    );
  });

  test('Down from field selects next block', function () {
    focusBlockField(workspace, 'p5_canvas_1', 'WIDTH');
    // Go down twice; first one selects the next connection on the create
    // canvas block.
    pressKeyN(workspace, Blockly.utils.KeyCodes.DOWN, 2);
    assert.equal(getFocusedBlockId(), 'p5_draw_1');
  });

  test("Down from field selects block's child block", function () {
    focusBlockField(workspace, 'controls_repeat_1', 'TIMES');
    pressKey(workspace, Blockly.utils.KeyCodes.DOWN);
    assert.equal(getFocusedBlockId(), 'draw_emoji_1');
  });
});

suite('Workspace comment navigation', function () {
  let workspace: Blockly.WorkspaceSvg;
  let commentId1: string;
  let commentId2: string;

  setup(async function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    const toolbox = document.getElementById('toolbox-simple');
    assert.isNotNull(toolbox);
    workspace = Blockly.inject('blocklyDiv', {
      ...DEFAULT_INJECT_OPTIONS,
      toolbox: toolbox,
      renderer: 'zelos',
    });
    Blockly.common.defineBlocks(p5blocks);
    Blockly.serialization.workspaces.load(navigationTestBlocks, workspace);
    workspace.getTopBlocks(false).forEach((b) => b.queueRender());
    Blockly.renderManagement.triggerQueuedRenders(workspace);

    const comment1 = Blockly.serialization.workspaceComments.append(
      {text: 'Comment one', x: 200, y: 200},
      workspace,
    );
    const comment2 = Blockly.serialization.workspaceComments.append(
      {text: 'Comment two', x: 300, y: 300},
      workspace,
    );
    commentId1 = comment1.id;
    commentId2 = comment2.id;
  });

  teardown(function (this: Mocha.Context) {
    for (const block of Object.keys(p5blocks)) {
      delete Blockly.Blocks[block];
    }
    sharedTestTeardown.call(this, workspace);
  });

  test('Navigate forward from block to workspace comment', function () {
    focusBlock(workspace, 'p5_canvas_1');
    pressKeyN(workspace, Blockly.utils.KeyCodes.DOWN, 2);
    assert.equal(getFocusNodeId(), commentId1);
  });

  test('Navigate forward from workspace comment to block', function () {
    focusWorkspaceComment(workspace, commentId2);
    pressKey(workspace, Blockly.utils.KeyCodes.DOWN);
    assert.equal(getFocusedBlockType(), 'p5_draw');
  });

  test('Navigate backward from block to workspace comment', function () {
    focusBlock(workspace, 'p5_draw_1');
    pressKey(workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(getFocusNodeId(), commentId2);
  });

  test('Navigate backward from workspace comment to block', function () {
    focusWorkspaceComment(workspace, commentId1);
    pressKeyN(workspace, Blockly.utils.KeyCodes.UP, 2);
    assert.equal(getFocusedBlockType(), 'p5_canvas');
  });

  test('Navigate forward from workspace comment to workspace comment', function () {
    focusWorkspaceComment(workspace, commentId1);
    pressKey(workspace, Blockly.utils.KeyCodes.DOWN);
    assert.equal(getFocusNodeId(), commentId2);
  });

  test('Navigate backward from workspace comment to workspace comment', function () {
    focusWorkspaceComment(workspace, commentId2);
    pressKey(workspace, Blockly.utils.KeyCodes.UP);
    assert.equal(getFocusNodeId(), commentId1);
  });

  test('Navigate forward from workspace comment to workspace comment button', function () {
    focusWorkspaceComment(workspace, commentId1);
    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    assert.equal(getFocusNodeId(), `${commentId1}_collapse_bar_button`);
  });

  test('Navigate backward from workspace comment button to workspace comment', function () {
    focusWorkspaceComment(workspace, commentId1);
    pressKey(workspace, Blockly.utils.KeyCodes.RIGHT);
    pressKey(workspace, Blockly.utils.KeyCodes.LEFT);
    assert.equal(getFocusNodeId(), commentId1);
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
      let workspace: Blockly.WorkspaceSvg;
      let keys: (typeof TOOLBOX_FLYOUT_LAYOUTS)[0];
      let firstToolboxItem: Blockly.IToolboxItem;
      let lastToolboxItem: Blockly.IToolboxItem;

      setup(function (this: Mocha.Context) {
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
        assert.isNotNull(toolbox);
        workspace = Blockly.inject('blocklyDiv', {
          ...DEFAULT_INJECT_OPTIONS,
          toolbox,
          rtl: layout.rtl,
          horizontalLayout: layout.horizontalLayout,
          toolboxPosition: layout.toolboxPosition,
          renderer: 'zelos',
        });
        keys = layout;
        const firstToolboxItem_ = workspace.getToolbox()?.getToolboxItems()[0];
        assert.isDefined(firstToolboxItem_);
        firstToolboxItem = firstToolboxItem_;
        const lastToolboxItem_ = workspace.getToolbox()?.getToolboxItems()[1];
        assert.isDefined(lastToolboxItem_);
        lastToolboxItem = lastToolboxItem_;
      });

      teardown(function (this: Mocha.Context) {
        sharedTestTeardown.call(this, workspace);
      });

      test('Previous toolbox item from first is no-op', function () {
        workspace.getToolbox()?.getNavigator().setNavigationLoops(false);
        Blockly.getFocusManager().focusNode(firstToolboxItem);
        pressKey(workspace, keys.previousItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          firstToolboxItem,
        );
      });

      test('Previous toolbox item from first loops to last', function () {
        workspace.getToolbox()?.getNavigator().setNavigationLoops(true);
        Blockly.getFocusManager().focusNode(firstToolboxItem);
        pressKey(workspace, keys.previousItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          lastToolboxItem,
        );
      });

      test('Previous toolbox item', function () {
        Blockly.getFocusManager().focusNode(lastToolboxItem);
        pressKey(workspace, keys.previousItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          firstToolboxItem,
        );
      });

      test('Next toolbox item from last is no-op', function () {
        workspace.getToolbox()?.getNavigator().setNavigationLoops(false);
        Blockly.getFocusManager().focusNode(lastToolboxItem);
        pressKey(workspace, keys.nextItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          lastToolboxItem,
        );
      });

      test('Next toolbox item from last loops', function () {
        workspace.getToolbox()?.getNavigator().setNavigationLoops(true);
        Blockly.getFocusManager().focusNode(lastToolboxItem);
        pressKey(workspace, keys.nextItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          firstToolboxItem,
        );
      });

      test('Next toolbox item', function () {
        Blockly.getFocusManager().focusNode(firstToolboxItem);
        pressKey(workspace, keys.nextItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          lastToolboxItem,
        );
      });

      test('Out from toolbox item is no-op', function () {
        Blockly.getFocusManager().focusNode(firstToolboxItem);
        pressKey(workspace, keys.out);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          firstToolboxItem,
        );
      });

      test('In from toolbox item focuses first flyout item', function () {
        Blockly.getFocusManager().focusNode(firstToolboxItem);
        pressKey(workspace, keys.in);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          workspace.getFlyout()?.getWorkspace().getTopBlocks()[0],
        );
      });

      test('Previous flyout item from first is no-op', function () {
        workspace
          .getFlyout()
          ?.getWorkspace()
          .getNavigator()
          .setNavigationLoops(false);
        pressKey(workspace, Blockly.utils.KeyCodes.T);
        const target = workspace.getFlyout()?.getWorkspace().getTopBlocks()[0];
        assert.isDefined(target);
        Blockly.getFocusManager().focusNode(target);
        pressKey(workspace, keys.previousItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          workspace.getFlyout()?.getWorkspace().getTopBlocks()[0],
        );
      });

      test('Previous flyout item from first loops', function () {
        workspace
          .getFlyout()
          ?.getWorkspace()
          .getNavigator()
          .setNavigationLoops(true);
        pressKey(workspace, Blockly.utils.KeyCodes.T);
        const target = workspace.getFlyout()?.getWorkspace().getTopBlocks()[0];
        assert.isDefined(target);
        Blockly.getFocusManager().focusNode(target);
        pressKey(workspace, keys.previousItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          workspace.getFlyout()?.getWorkspace().getTopBlocks()[1],
        );
      });

      test('Previous flyout item', function () {
        pressKey(workspace, Blockly.utils.KeyCodes.T);
        const target = workspace.getFlyout()?.getWorkspace().getTopBlocks()[1];
        assert.isDefined(target);
        Blockly.getFocusManager().focusNode(target);
        pressKey(workspace, keys.previousItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          workspace.getFlyout()?.getWorkspace().getTopBlocks()[0],
        );
      });

      test('Next flyout item from last is no-op', function () {
        workspace
          .getFlyout()
          ?.getWorkspace()
          .getNavigator()
          .setNavigationLoops(false);
        pressKey(workspace, Blockly.utils.KeyCodes.T);
        const target = workspace.getFlyout()?.getWorkspace().getTopBlocks()[1];
        assert.isDefined(target);
        Blockly.getFocusManager().focusNode(target);
        pressKey(workspace, keys.nextItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          workspace.getFlyout()?.getWorkspace().getTopBlocks()[1],
        );
      });

      test('Next flyout item from last loops', function () {
        workspace
          .getFlyout()
          ?.getWorkspace()
          .getNavigator()
          .setNavigationLoops(true);
        pressKey(workspace, Blockly.utils.KeyCodes.T);
        const target = workspace.getFlyout()?.getWorkspace().getTopBlocks()[1];
        assert.isDefined(target);
        Blockly.getFocusManager().focusNode(target);
        pressKey(workspace, keys.nextItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          workspace.getFlyout()?.getWorkspace().getTopBlocks()[0],
        );
      });

      test('Next flyout item', function () {
        pressKey(workspace, Blockly.utils.KeyCodes.T);
        const target = workspace.getFlyout()?.getWorkspace().getTopBlocks()[0];
        assert.isDefined(target);
        Blockly.getFocusManager().focusNode(target);
        pressKey(workspace, keys.nextItem);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          workspace.getFlyout()?.getWorkspace().getTopBlocks()[1],
        );
      });

      test('Out from flyout item focuses toolbox item', function () {
        pressKey(workspace, Blockly.utils.KeyCodes.T);
        const target = workspace.getFlyout()?.getWorkspace().getTopBlocks()[0];
        assert.isDefined(target);
        Blockly.getFocusManager().focusNode(target);
        pressKey(workspace, keys.out);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          firstToolboxItem,
        );
      });

      test('In from flyout item is no-op', function () {
        pressKey(workspace, Blockly.utils.KeyCodes.T);
        const target = workspace.getFlyout()?.getWorkspace().getTopBlocks()[0];
        assert.isDefined(target);
        Blockly.getFocusManager().focusNode(target);
        pressKey(workspace, keys.in);
        assert.equal(
          Blockly.getFocusManager().getFocusedNode(),
          workspace.getFlyout()?.getWorkspace().getTopBlocks()[0],
        );
      });
    });
  }
});

suite('Flyout heading navigation (H / Shift+H)', function () {
  let workspace: Blockly.WorkspaceSvg;

  setup(function (this: Mocha.Context) {
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
    // Build a flyout toolbox that mixes blocks and headings (labels) so we
    // can verify that the H shortcut jumps over non-heading items.
    workspace = Blockly.inject('blocklyDiv', {
      ...DEFAULT_INJECT_OPTIONS,
      toolbox: {
        kind: 'flyoutToolbox',
        contents: [
          {kind: 'label', text: 'First heading'},
          {kind: 'block', type: 'basic_block'},
          {kind: 'block', type: 'basic_block'},
          {kind: 'label', text: 'Second heading'},
          {kind: 'block', type: 'basic_block'},
          {kind: 'label', text: 'Third heading'},
          {kind: 'block', type: 'basic_block'},
        ],
      },
    });
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  /**
   * Returns all FlyoutButton labels (headings) currently in the flyout.
   *
   * @param workspace The main workspace owning the flyout.
   * @returns The labels in flyout order.
   */
  function getHeadings(workspace: Blockly.WorkspaceSvg) {
    return (
      workspace
        .getFlyout()
        ?.getContents()
        .map((item) => item.getElement())
        .filter(
          (element) =>
            element instanceof Blockly.FlyoutButton && element.isLabel(),
        ) ?? []
    );
  }

  test('Shortcut is a no-op when focus is on the main workspace', function () {
    Blockly.getFocusManager().focusTree(workspace);
    const before = Blockly.getFocusManager().getFocusedNode();
    pressKey(workspace, Blockly.utils.KeyCodes.H);
    assert.equal(Blockly.getFocusManager().getFocusedNode(), before);
  });

  test('Shortcut is a no-op when focus is on a workspace block', function () {
    const block = workspace.newBlock('basic_block');
    block.initSvg();
    block.render();
    Blockly.getFocusManager().focusNode(block);
    pressKey(workspace, Blockly.utils.KeyCodes.H);
    assert.equal(Blockly.getFocusManager().getFocusedNode(), block);
  });

  test('H from flyout workspace focuses the first heading', function () {
    const flyoutWorkspace = workspace.getFlyout()?.getWorkspace();
    assert.isDefined(flyoutWorkspace);
    Blockly.getFocusManager().focusNode(flyoutWorkspace);
    pressKey(workspace, Blockly.utils.KeyCodes.H);
    const headings = getHeadings(workspace);
    assert.equal(Blockly.getFocusManager().getFocusedNode(), headings[0]);
  });

  test('H from a block in the flyout focuses the next heading', function () {
    const target = workspace.getFlyout()?.getWorkspace().getTopBlocks()[0];
    assert.isDefined(target);
    Blockly.getFocusManager().focusNode(target);
    pressKey(workspace, Blockly.utils.KeyCodes.H);
    const headings = getHeadings(workspace);
    assert.equal(Blockly.getFocusManager().getFocusedNode(), headings[1]);
  });

  test('H from a heading focuses the next heading', function () {
    const headings = getHeadings(workspace);
    Blockly.getFocusManager().focusNode(headings[0]);
    pressKey(workspace, Blockly.utils.KeyCodes.H);
    assert.equal(Blockly.getFocusManager().getFocusedNode(), headings[1]);
  });

  test('H from the last heading does nothing', function () {
    const headings = getHeadings(workspace);
    Blockly.getFocusManager().focusNode(headings[headings.length - 1]);
    pressKey(workspace, Blockly.utils.KeyCodes.H);
    assert.equal(
      Blockly.getFocusManager().getFocusedNode(),
      headings[headings.length - 1],
    );
  });

  test('Shift+H from flyout workspace focuses the last heading', function () {
    const flyoutWorkspace = workspace.getFlyout()?.getWorkspace();
    assert.isDefined(flyoutWorkspace);
    Blockly.getFocusManager().focusNode(flyoutWorkspace);
    pressKey(workspace, Blockly.utils.KeyCodes.H, [
      Blockly.utils.KeyCodes.SHIFT,
    ]);
    const headings = getHeadings(workspace);
    assert.equal(
      Blockly.getFocusManager().getFocusedNode(),
      headings[headings.length - 1],
    );
  });

  test('Shift+H from a heading focuses the previous heading', function () {
    const headings = getHeadings(workspace);
    Blockly.getFocusManager().focusNode(headings[2]);
    pressKey(workspace, Blockly.utils.KeyCodes.H, [
      Blockly.utils.KeyCodes.SHIFT,
    ]);
    assert.equal(Blockly.getFocusManager().getFocusedNode(), headings[1]);
  });

  test('Shift+H from a block focuses the previous heading', function () {
    const target = workspace.getFlyout()?.getWorkspace().getTopBlocks()[2];
    assert.isDefined(target);
    Blockly.getFocusManager().focusNode(target);
    pressKey(workspace, Blockly.utils.KeyCodes.H, [
      Blockly.utils.KeyCodes.SHIFT,
    ]);
    const headings = getHeadings(workspace);
    assert.equal(Blockly.getFocusManager().getFocusedNode(), headings[1]);
  });

  test('Shift+H from the first heading does nothing', function () {
    const headings = getHeadings(workspace);
    Blockly.getFocusManager().focusNode(headings[0]);
    pressKey(workspace, Blockly.utils.KeyCodes.H, [
      Blockly.utils.KeyCodes.SHIFT,
    ]);
    assert.equal(Blockly.getFocusManager().getFocusedNode(), headings[0]);
  });
});

suite('Flyout heading navigation with no headings', function () {
  let workspace: Blockly.WorkspaceSvg;

  setup(function (this: Mocha.Context) {
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
    workspace = Blockly.inject('blocklyDiv', {
      ...DEFAULT_INJECT_OPTIONS,
      toolbox: {
        kind: 'flyoutToolbox',
        contents: [
          {kind: 'block', type: 'basic_block'},
          {kind: 'block', type: 'basic_block'},
        ],
      },
    });
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  test('H does nothing when the flyout has no headings', function () {
    const firstBlock = workspace.getFlyout()?.getWorkspace().getTopBlocks()[0];
    assert.isDefined(firstBlock);
    Blockly.getFocusManager().focusNode(firstBlock);
    pressKey(workspace, Blockly.utils.KeyCodes.H);
    assert.equal(Blockly.getFocusManager().getFocusedNode(), firstBlock);
  });

  test('Shift+H does nothing when the flyout has no headings', function () {
    const firstBlock = workspace.getFlyout()?.getWorkspace().getTopBlocks()[0];
    assert.isDefined(firstBlock);
    Blockly.getFocusManager().focusNode(firstBlock);
    pressKey(workspace, Blockly.utils.KeyCodes.H, [
      Blockly.utils.KeyCodes.SHIFT,
    ]);
    assert.equal(Blockly.getFocusManager().getFocusedNode(), firstBlock);
  });
});

suite('Toolbox and flyout jump shortcuts (Ctrl/Cmd + Home / End)', function () {
  suiteSetup(function () {
    Blockly.ShortcutItems.registerNavigationShortcuts();
  });

  suiteTeardown(function () {
    for (const shortcut of [
      'jump_to_top_of_stack',
      'jump_to_bottom_of_stack',
      'jump_to_block_start',
      'jump_to_block_end',
      'jump_to_first_block',
      'jump_to_last_block',
      'jump_to_previous_page',
      'jump_to_next_page',
      'scroll_left',
      'scroll_right',
      'scroll_up',
      'scroll_down',
    ]) {
      Blockly.ShortcutRegistry.registry.unregister(shortcut);
    }
  });

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    Blockly.defineBlocksWithJsonArray([
      {
        type: 'basic_block',
        message0: '%1',
        args0: [{type: 'field_input', name: 'TEXT', text: 'default'}],
      },
    ]);
    defineStackBlock();
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this);
  });

  /**
   * Presses Home or End with the platform's control key held down.
   *
   * @param workspace The workspace to dispatch on.
   * @param keyCode Either KeyCodes.HOME or KeyCodes.END.
   */
  function pressCtrlKey(workspace: Blockly.WorkspaceSvg, keyCode: number) {
    pressKey(workspace, keyCode, [Blockly.utils.KeyCodes.CTRL_CMD]);
  }

  suite('in the toolbox', function () {
    let toolbox: Blockly.IToolbox;
    let firstItem: Blockly.IToolboxItem;
    let lastItem: Blockly.IToolboxItem;
    let workspace: Blockly.WorkspaceSvg;

    setup(function () {
      const toolboxElement = document.getElementById('toolbox-test');
      assert.isNotNull(toolboxElement);
      workspace = Blockly.inject('blocklyDiv', {
        toolbox: toolboxElement,
      });
      const toolbox_ = workspace.getToolbox();
      assert.isNotNull(toolbox_);
      toolbox = toolbox_;
      // toolbox-test starts and ends with a category, with a non-focusable
      // separator in between.
      const allItems = toolbox.getToolboxItems();
      firstItem = allItems[0];
      lastItem = allItems[allItems.length - 1];
    });

    teardown(function (this: Mocha.Context) {
      workspaceTeardown.call(this, workspace);
    });

    test('Navigable items exclude the separator', function () {
      const navigable = toolbox
        .getNavigator()
        .getNavigableItems(toolbox.getRootFocusableNode());
      assert.isAbove(toolbox.getToolboxItems().length, navigable.length);
      assert.isFalse(
        navigable.some((item) => item instanceof Blockly.ToolboxSeparator),
      );
    });

    test('CtrlHome focuses the first toolbox item', function () {
      Blockly.getFocusManager().focusNode(lastItem);
      pressCtrlKey(workspace, Blockly.utils.KeyCodes.HOME);
      assert.equal(Blockly.getFocusManager().getFocusedNode(), firstItem);
    });

    test('CtrlEnd focuses the last toolbox item', function () {
      Blockly.getFocusManager().focusNode(firstItem);
      pressCtrlKey(workspace, Blockly.utils.KeyCodes.END);
      assert.equal(Blockly.getFocusManager().getFocusedNode(), lastItem);
    });

    test('CtrlHome does not move focus out of the toolbox', function () {
      const block = workspace.newBlock('basic_block');
      block.initSvg();
      block.render();
      Blockly.getFocusManager().focusNode(lastItem);
      pressCtrlKey(workspace, Blockly.utils.KeyCodes.HOME);
      assert.notEqual(Blockly.getFocusManager().getFocusedNode(), block);
    });

    test('CtrlHome still focuses the first block when the workspace has focus', function () {
      const block = workspace.newBlock('basic_block');
      block.initSvg();
      block.render();
      Blockly.getFocusManager().focusNode(block);
      pressCtrlKey(workspace, Blockly.utils.KeyCodes.HOME);
      assert.equal(Blockly.getFocusManager().getFocusedNode(), block);
    });
  });

  suite('in the flyout', function () {
    let workspace: Blockly.WorkspaceSvg;
    let flyoutWorkspace: Blockly.WorkspaceSvg;
    let labels: Blockly.FlyoutButton[];

    setup(function () {
      workspace = Blockly.inject('blocklyDiv', {
        toolbox: {
          kind: 'flyoutToolbox',
          contents: [
            {kind: 'label', text: 'First heading'},
            {kind: 'block', type: 'basic_block'},
            {kind: 'block', type: 'basic_block'},
            {kind: 'label', text: 'Last heading'},
          ],
        },
      });
      const flyoutWorkspace_ = workspace.getFlyout()?.getWorkspace();
      assert.isDefined(flyoutWorkspace_);
      flyoutWorkspace = flyoutWorkspace_;
      // The flyout opens and closes with a label, so the first and last
      // navigable items are not blocks. A trailing separator is appended to
      // the contents but cannot be focused.
      labels =
        workspace
          .getFlyout()
          ?.getContents()
          .map((item) => item.getElement())
          .filter(
            (element): element is Blockly.FlyoutButton =>
              element instanceof Blockly.FlyoutButton && element.isLabel(),
          ) ?? [];
    });

    teardown(function (this: Mocha.Context) {
      workspaceTeardown.call(this, workspace);
    });

    test('CtrlHome focuses the first item, which is a label rather than a block', function () {
      Blockly.getFocusManager().focusNode(flyoutWorkspace.getTopBlocks()[1]);
      pressCtrlKey(workspace, Blockly.utils.KeyCodes.HOME);
      const focused = Blockly.getFocusManager().getFocusedNode();
      assert.equal(focused, labels[0]);
      assert.notEqual(focused, flyoutWorkspace.getTopBlocks()[0]);
    });

    test('CtrlEnd focuses the last item, which is a label rather than a block', function () {
      Blockly.getFocusManager().focusNode(flyoutWorkspace.getTopBlocks()[0]);
      pressCtrlKey(workspace, Blockly.utils.KeyCodes.END);
      const focused = Blockly.getFocusManager().getFocusedNode();
      assert.equal(focused, labels[labels.length - 1]);
      assert.notEqual(focused, flyoutWorkspace.getTopBlocks().slice(-1)[0]);
    });
  });
});

suite('Toolbox and flyout paging shortcuts (Page Up / Page Down)', function () {
  suiteSetup(function () {
    Blockly.ShortcutItems.registerNavigationShortcuts();
  });

  suiteTeardown(function () {
    for (const shortcut of [
      'jump_to_top_of_stack',
      'jump_to_bottom_of_stack',
      'jump_to_block_start',
      'jump_to_block_end',
      'jump_to_first_block',
      'jump_to_last_block',
      'jump_to_previous_page',
      'jump_to_next_page',
      'scroll_left',
      'scroll_right',
      'scroll_up',
      'scroll_down',
    ]) {
      Blockly.ShortcutRegistry.registry.unregister(shortcut);
    }
  });

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    Blockly.defineBlocksWithJsonArray([
      {
        type: 'basic_block',
        message0: '%1',
        args0: [{type: 'field_input', name: 'TEXT', text: 'default'}],
      },
    ]);
    defineStackBlock();
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this);
  });

  // Items are laid out 30 long with a 10 gap, so item i spans [i * 40, i * 40
  // + 30]. A 100-long viewport therefore holds three of them.
  const ITEM_PITCH = 40;
  const ITEM_LENGTH = 30;
  const VIEWPORT_LENGTH = 100;

  suite('in the flyout', function () {
    let blocks: Blockly.BlockSvg[];
    let workspace: Blockly.WorkspaceSvg;
    let flyoutWorkspace: Blockly.WorkspaceSvg;

    /**
     * Lays the flyout's blocks out at a known pitch and puts the viewport at
     * the given offset, so that paging can be asserted exactly.
     *
     * @param viewportTop Offset of the top of the viewport.
     */
    function layOutFlyout(viewportTop: number) {
      blocks.forEach((block, i) => {
        sinon
          .stub(block, 'getBoundingRectangle')
          .returns(
            new Blockly.utils.Rect(
              i * ITEM_PITCH,
              i * ITEM_PITCH + ITEM_LENGTH,
              0,
              50,
            ),
          );
      });
      sinon
        .stub(flyoutWorkspace.getMetricsManager(), 'getViewMetrics')
        .returns({
          top: viewportTop,
          left: 0,
          width: 50,
          height: VIEWPORT_LENGTH,
        });
    }

    setup(function () {
      workspace = Blockly.inject('blocklyDiv', {
        toolbox: {
          kind: 'flyoutToolbox',
          contents: new Array(6).fill({kind: 'block', type: 'basic_block'}),
        },
      });
      const flyoutWorkspace_ = workspace.getFlyout()?.getWorkspace();
      assert.isDefined(flyoutWorkspace_);
      flyoutWorkspace = flyoutWorkspace_;
      blocks = flyoutWorkspace.getTopBlocks(true);
      // Focusing a block scrolls it into view; stub that out so the layout set
      // up below stays valid for the whole test.
      sinon.stub(flyoutWorkspace, 'scroll');
      sinon.stub(flyoutWorkspace, 'getScale').returns(1);
    });

    teardown(function (this: Mocha.Context) {
      workspaceTeardown.call(this, workspace);
    });

    test('PageDown focuses the last visible block', function () {
      layOutFlyout(0);
      Blockly.getFocusManager().focusNode(blocks[0]);
      pressKey(workspace, Blockly.utils.KeyCodes.PAGE_DOWN);
      assert.equal(Blockly.getFocusManager().getFocusedNode(), blocks[2]);
    });

    test('A second PageDown advances by another page', function () {
      layOutFlyout(0);
      Blockly.getFocusManager().focusNode(blocks[0]);
      pressKey(workspace, Blockly.utils.KeyCodes.PAGE_DOWN);
      pressKey(workspace, Blockly.utils.KeyCodes.PAGE_DOWN);
      assert.equal(Blockly.getFocusManager().getFocusedNode(), blocks[4]);
    });

    test('PageUp focuses the first visible block', function () {
      // Viewport spans [150, 250], holding blocks 4 and 5 plus the tail of 3.
      layOutFlyout(150);
      Blockly.getFocusManager().focusNode(blocks[5]);
      pressKey(workspace, Blockly.utils.KeyCodes.PAGE_UP);
      assert.equal(Blockly.getFocusManager().getFocusedNode(), blocks[3]);
    });

    test('PageDown from the last block does nothing', function () {
      layOutFlyout(200);
      const last = blocks[blocks.length - 1];
      Blockly.getFocusManager().focusNode(last);
      pressKey(workspace, Blockly.utils.KeyCodes.PAGE_DOWN);
      assert.equal(Blockly.getFocusManager().getFocusedNode(), last);
    });

    test('PageUp from the first block does nothing', function () {
      layOutFlyout(0);
      Blockly.getFocusManager().focusNode(blocks[0]);
      pressKey(workspace, Blockly.utils.KeyCodes.PAGE_UP);
      assert.equal(Blockly.getFocusManager().getFocusedNode(), blocks[0]);
    });
  });

  suite('in the toolbox', function () {
    let items: Blockly.IFocusableNode[];
    let workspace: Blockly.WorkspaceSvg;
    let toolbox: Blockly.IToolbox;

    setup(function () {
      const toolboxElement = document.getElementById('toolbox-test');
      assert.isNotNull(toolboxElement);
      workspace = Blockly.inject('blocklyDiv', {
        toolbox: toolboxElement,
      });
      const toolbox_ = workspace.getToolbox();
      assert.isNotNull(toolbox_);
      toolbox = toolbox_;
      items = toolbox
        .getNavigator()
        .getNavigableItems(toolbox.getRootFocusableNode());

      const container = toolbox.getRootFocusableNode().getFocusableElement();
      sinon.stub(container, 'getBoundingClientRect').returns({
        top: 0,
        bottom: VIEWPORT_LENGTH,
        left: 0,
        right: 200,
      } as DOMRect);
      items.forEach((item, i) => {
        sinon
          .stub(item.getFocusableElement(), 'getBoundingClientRect')
          .returns({
            top: i * ITEM_PITCH,
            bottom: i * ITEM_PITCH + ITEM_LENGTH,
            left: 0,
            right: 200,
          } as DOMRect);
      });
    });

    teardown(function (this: Mocha.Context) {
      workspaceTeardown.call(this, workspace);
    });

    test('PageDown focuses the last visible category', function () {
      Blockly.getFocusManager().focusNode(items[0]);
      pressKey(workspace, Blockly.utils.KeyCodes.PAGE_DOWN);
      assert.equal(Blockly.getFocusManager().getFocusedNode(), items[2]);
    });

    test('PageDown scrolls the newly focused category into view', function () {
      Blockly.getFocusManager().focusNode(items[0]);
      const scrollIntoView = sinon.spy(
        items[2].getFocusableElement(),
        'scrollIntoView',
      );
      pressKey(workspace, Blockly.utils.KeyCodes.PAGE_DOWN);
      sinon.assert.calledWith(scrollIntoView, {
        block: 'nearest',
        inline: 'nearest',
      });
    });

    test('PageUp focuses the first visible category', function () {
      Blockly.getFocusManager().focusNode(items[2]);
      pressKey(workspace, Blockly.utils.KeyCodes.PAGE_UP);
      assert.equal(Blockly.getFocusManager().getFocusedNode(), items[0]);
    });
  });
});
