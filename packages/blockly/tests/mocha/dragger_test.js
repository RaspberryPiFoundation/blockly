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
    const screenCoords = Blockly.utils.svgMath.wsToScreenCoordinates(
      block.workspace,
      block.getRelativeToSurfaceXY(),
    );
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
   * Simulates pressing on the block center and dragging to a viewport point.
   *
   * @param {!Blockly.BlockSvg} block The block to drag.
   * @param {{x: number, y: number}} pointerEnd The viewport point to drag to.
   * @returns {{dragger: !Blockly.dragging.Dragger, dragEvent: !PointerEvent}}
   *     The dragger and final pointer event from the simulated drag.
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

    return {dragger, dragEvent};
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

  [
    {name: 'trashcan', rectKey: 'trashRect'},
    {name: 'toolbox', rectKey: 'toolboxRect'},
  ].forEach(({name, rectKey}) => {
    test(`applies delete styling and deletes when dragged to ${name}`, function () {
      const deleteRect = this[rectKey];
      const {dragger, dragEvent} = dragBlock(
        this.block,
        rectCenterClient(deleteRect),
      );

      assert.isTrue(
        deleteRect.contains(dragEvent.clientX, dragEvent.clientY),
        `Expected cursor to be inside ${name} delete area`,
      );
      assert.isTrue(hasDeleteStyle(this.block));

      dragger.onDragEnd(dragEvent);
      assert.isTrue(this.block.isDeadOrDying());
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
    const {dragger, dragEvent} = dragBlock(this.block, {
      x: start.x + desiredOrigin.x - originBefore.x,
      y: start.y + desiredOrigin.y - originBefore.y,
    });

    const originAfter = blockOriginClient(this.block);
    assert.isTrue(
      deleteAreaRect.contains(originAfter.x, originAfter.y),
      'Expected block origin to overlap delete area',
    );
    assert.isFalse(
      deleteAreaRect.contains(dragEvent.clientX, dragEvent.clientY),
      'Expected cursor to be outside delete area',
    );
    assert.isFalse(hasDeleteStyle(this.block));

    dragger.onDragEnd(dragEvent);
    assert.isFalse(this.block.isDeadOrDying());
  });
});
