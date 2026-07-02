/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  defineBasicBlockWithField,
  defineStackBlock,
} from './test_helpers/block_definitions.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Dragger', function () {
  /**
   * @param {!Blockly.BlockSvg} block The block to measure.
   * @returns {{x: number, y: number}} Viewport coordinates at the block center.
   */
  function blockCenterClient(block) {
    const boundingRect = block.getSvgRoot().getBoundingClientRect();
    return {
      x: (boundingRect.left + boundingRect.right) / 2,
      y: (boundingRect.top + boundingRect.bottom) / 2,
    };
  }

  /**
   * @param {!Blockly.BlockSvg} block The block to measure.
   * @returns {{x: number, y: number}} Viewport coordinates at the block origin.
   */
  function blockOriginClient(block) {
    const ws = block.workspace;
    let point = block.getRelativeToSurfaceXY();
    if (ws.isMutator) {
      point = point.scale(ws.options.parentWorkspace.scale);
    }
    const screenCoords = Blockly.utils.svgMath.wsToScreenCoordinates(ws, point);
    return {x: screenCoords.x, y: screenCoords.y};
  }

  /**
   * @param {!Blockly.utils.Rect} rect The rectangle to measure.
   * @returns {{x: number, y: number}} Viewport coordinates at the rect center.
   */
  function rectCenterClient(rect) {
    return {
      x: (rect.left + rect.right) / 2,
      y: (rect.top + rect.bottom) / 2,
    };
  }

  /**
   * @param {number} clientX The viewport x coordinate.
   * @param {number} clientY The viewport y coordinate.
   * @param {string=} type The pointer event type.
   * @returns {!PointerEvent} A synthetic pointer event at the given location.
   */
  function pointerAt(clientX, clientY, type = 'pointermove') {
    return new PointerEvent(type, {clientX, clientY});
  }

  function hasDeleteStyle(block) {
    return block.getSvgRoot().classList.contains('blocklyDraggingDelete');
  }

  /**
   * @param {!Blockly.WorkspaceSvg} workspace The workspace with a trashcan.
   * @returns {boolean} Whether the trashcan lid open style is applied.
   */
  function hasTrashLidOpen(workspace) {
    return workspace.trashcan.svgGroup.classList.contains('blocklyTrashOpen');
  }

  /**
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to zoom.
   * @param {number} scale The target zoom factor.
   */
  function setWorkspaceScale(workspace, scale) {
    workspace.setScale(scale);
  }

  /**
   * Simulates pressing on the block center and dragging to a viewport point.
   *
   * @param {!Blockly.BlockSvg} block The block to drag.
   * @param {{x: number, y: number}} pointerEnd The viewport point to drag to.
   * @returns {{dragger: !Blockly.dragging.Dragger, dragEvent: !PointerEvent, block: !Blockly.BlockSvg}}
   *     The dragger, final pointer event, and block being dragged.
   */
  function dragBlock(block, pointerEnd) {
    const start = blockCenterClient(block);
    const totalDelta = new Blockly.utils.Coordinate(
      pointerEnd.x - start.x,
      pointerEnd.y - start.y,
    );

    const dragger = new Blockly.dragging.Dragger(block);
    const dragStartEvent = pointerAt(start.x, start.y, 'pointerdown');
    const dragEvent = pointerAt(pointerEnd.x, pointerEnd.y);

    dragger.onDragStart(dragStartEvent);
    dragger.onDrag(dragEvent, totalDelta);

    return {dragger, dragEvent, block: dragger.draggable};
  }

  setup(function () {
    sharedTestSetup.call(this);
    defineBasicBlockWithField();
    defineStackBlock();
    const toolbox = document.getElementById('toolbox-categories');
    this.workspace = Blockly.inject('blocklyDiv', {toolbox, trashcan: true});
    this.workspace.recordDragTargets();
    this.trashRect = this.workspace.trashcan.getClientRect();
    this.toolboxRect = this.workspace.toolbox.getClientRect();
    assert.isNotNull(this.trashRect);
    assert.isNotNull(this.toolboxRect);

    this.block = this.workspace.newBlock('stack_block');
    this.block.initSvg();
    this.block.render();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  const zoomLevels = [
    {name: 'default scale', scale: null},
    {name: 'zoomed in', scale: 1.5},
    {name: 'zoomed out', scale: 0.7},
  ];

  zoomLevels.forEach(({name: zoomName, scale}) => {
    [
      {name: 'trashcan', rectKey: 'trashRect', checkLid: true},
      {name: 'toolbox', rectKey: 'toolboxRect', checkLid: false},
    ].forEach(({name, rectKey, checkLid}) => {
      test(`applies delete styling and deletes when dragged to ${name} at ${zoomName}`, function () {
        if (scale !== null) {
          setWorkspaceScale(this.workspace, scale);
          this.trashRect = this.workspace.trashcan.getClientRect();
          this.toolboxRect = this.workspace.toolbox.getClientRect();
        }

        const deleteRect = this[rectKey];
        const {dragger, dragEvent, block} = dragBlock(
          this.block,
          rectCenterClient(deleteRect),
        );

        assert.isTrue(
          deleteRect.contains(dragEvent.clientX, dragEvent.clientY),
          `Expected cursor to be inside ${name} delete area`,
        );
        assert.isTrue(hasDeleteStyle(block));
        if (checkLid) {
          assert.isTrue(
            hasTrashLidOpen(this.workspace),
            'Expected trashcan lid to be open',
          );
        }

        dragger.onDragEnd(dragEvent);
        assert.isTrue(block.isDeadOrDying());
      });
    });
  });

  test('does not apply delete styling when only block origin overlaps delete area', function () {
    const start = blockCenterClient(this.block);
    const originBefore = blockOriginClient(this.block);
    const deleteAreaRect = this.toolboxRect;
    const desiredOrigin = {
      x: deleteAreaRect.right - 5,
      y: originBefore.y,
    };
    const {dragger, dragEvent, block} = dragBlock(this.block, {
      x: start.x + desiredOrigin.x - originBefore.x,
      y: start.y + desiredOrigin.y - originBefore.y,
    });

    const originAfter = blockOriginClient(block);
    assert.isTrue(
      deleteAreaRect.contains(originAfter.x, originAfter.y),
      'Expected block origin to overlap delete area',
    );
    assert.isFalse(
      deleteAreaRect.contains(dragEvent.clientX, dragEvent.clientY),
      'Expected cursor to be outside delete area',
    );
    assert.isFalse(hasDeleteStyle(block));

    dragger.onDragEnd(dragEvent);
    assert.isFalse(block.isDeadOrDying());
  });

  suite('Mutator', function () {
    /**
     * Opens a mutator on a controls_if block and returns the mutator workspace.
     *
     * @param {!Blockly.WorkspaceSvg} workspace The main workspace.
     * @returns {!Promise<!Blockly.WorkspaceSvg>} The mutator workspace.
     */
    async function openMutator(workspace) {
      const block = Blockly.serialization.blocks.append(
        {
          'type': 'controls_if',
          'extraState': {
            'elseIfCount': 0,
          },
        },
        workspace,
      );
      block.initSvg();
      block.render();
      const icon = block.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await icon.setBubbleVisible(true);
      return icon.getWorkspace();
    }

    test('deletes flyout block when pointer is over flyout delete area at zoomed scale', async function () {
      for (let i = 0; i < 3; i++) {
        this.workspace.zoomCenter(1);
      }

      const mutatorWorkspace = await openMutator(this.workspace);
      this.clock.runAll();
      mutatorWorkspace.recordDragTargets();

      const flyout = mutatorWorkspace.getFlyout();
      const flyoutRect = flyout.getClientRect();
      assert.isNotNull(flyoutRect);

      const flyoutBlock = flyout
        .getWorkspace()
        .getBlocksByType('controls_if_elseif')[0];
      flyoutBlock.initSvg();
      flyoutBlock.render();

      const {dragger, dragEvent, block} = dragBlock(
        flyoutBlock,
        rectCenterClient(flyoutRect),
      );

      assert.isTrue(
        flyoutRect.contains(dragEvent.clientX, dragEvent.clientY),
        'Expected cursor to be inside flyout delete area',
      );
      assert.isTrue(hasDeleteStyle(block));

      dragger.onDragEnd(dragEvent);
      assert.isTrue(block.isDeadOrDying());
    });

    test('does not apply delete styling when only block origin overlaps flyout delete area at zoomed scale', async function () {
      for (let i = 0; i < 3; i++) {
        this.workspace.zoomCenter(1);
      }

      const mutatorWorkspace = await openMutator(this.workspace);
      this.clock.runAll();
      mutatorWorkspace.recordDragTargets();

      const flyout = mutatorWorkspace.getFlyout();
      const flyoutRect = flyout.getClientRect();
      assert.isNotNull(flyoutRect);

      const workspaceBlock = mutatorWorkspace.newBlock('controls_if_elseif');
      workspaceBlock.initSvg();
      workspaceBlock.render();
      workspaceBlock.moveBy(200, 50);

      const start = blockCenterClient(workspaceBlock);
      const originBefore = blockOriginClient(workspaceBlock);
      const desiredOrigin = {
        x: flyoutRect.right - 5,
        y: originBefore.y,
      };
      const {dragger, dragEvent, block} = dragBlock(workspaceBlock, {
        x: start.x + desiredOrigin.x - originBefore.x,
        y: start.y + desiredOrigin.y - originBefore.y,
      });

      const originAfter = blockOriginClient(block);
      assert.isTrue(
        flyoutRect.contains(originAfter.x, originAfter.y),
        'Expected block origin to overlap flyout delete area',
      );
      assert.isFalse(
        flyoutRect.contains(dragEvent.clientX, dragEvent.clientY),
        'Expected cursor to be outside flyout delete area',
      );
      assert.isFalse(hasDeleteStyle(block));

      dragger.onDragEnd(dragEvent);
      assert.isFalse(block.isDeadOrDying());
    });
  });
});
