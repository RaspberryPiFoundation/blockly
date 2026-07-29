/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import {testFileLocations, testSetup} from './test_setup.mjs';

suite('Dragging into a delete area', function () {
  suiteSetup(async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);

    await this.browser.execute(() => {
      /**
       * @param {!Blockly.BlockSvg} block The block to measure.
       * @returns {{x: number, y: number}} Viewport coordinates at the block center.
       */
      window.blockCenterClient = function (block) {
        const boundingRect = block.getSvgRoot().getBoundingClientRect();
        return {
          x: (boundingRect.left + boundingRect.right) / 2,
          y: (boundingRect.top + boundingRect.bottom) / 2,
        };
      };

      /**
       * @param {!Blockly.BlockSvg} block The block to measure.
       * @returns {{x: number, y: number}} Viewport coordinates at the block origin.
       */
      window.blockOriginClient = function (block) {
        const ws = block.workspace;
        let point = block.getRelativeToSurfaceXY();
        if (ws.isMutator) {
          point = point.scale(ws.options.parentWorkspace.scale);
        }
        const screenCoords = Blockly.utils.svgMath.wsToScreenCoordinates(
          ws,
          point,
        );
        return {x: screenCoords.x, y: screenCoords.y};
      };

      /**
       * Simulates pressing on the block center and dragging to a viewport point.
       *
       * @param {!Blockly.BlockSvg} block The block to drag.
       * @param {{x: number, y: number}} pointerEnd The viewport point to drag to.
       * @returns {{dragger: !Blockly.dragging.Dragger, dragEvent: !PointerEvent, block: !Blockly.BlockSvg}}
       *     The dragger, final pointer event, and block being dragged.
       */
      window.dragBlock = function (block, pointerEnd) {
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
      };

      window.hasDeleteStyle = function (block) {
        return block.getSvgRoot().classList.contains('blocklyDraggingDelete');
      };

      /**
       * @param {number} clientX The viewport x coordinate.
       * @param {number} clientY The viewport y coordinate.
       * @param {string=} type The pointer event type.
       * @returns {!PointerEvent} A synthetic pointer event at the given location.
       */
      window.pointerAt = function (clientX, clientY, type = 'pointermove') {
        return new PointerEvent(type, {clientX, clientY});
      };

      /**
       * Opens a mutator on a controls_if block and returns the mutator workspace.
       *
       * @param {!Blockly.WorkspaceSvg} workspace The main workspace.
       * @returns {!Promise<!Blockly.WorkspaceSvg>} The mutator workspace.
       */
      window.openMutator = async function (workspace) {
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
      };

      /**
       * @param {!Blockly.utils.Rect} rect The rectangle to measure.
       * @returns {{x: number, y: number}} Viewport coordinates at the rect center.
       */
      window.rectCenterClient = function (rect) {
        return {
          x: (rect.left + rect.right) / 2,
          y: (rect.top + rect.bottom) / 2,
        };
      };

      /**
       * @param {!Blockly.WorkspaceSvg} workspace The workspace with a trashcan.
       * @returns {boolean} Whether the trashcan lid open style is applied.
       */
      window.hasTrashLidOpen = function (workspace) {
        return workspace.trashcan?.svgGroup.classList.contains(
          'blocklyTrashOpen',
        );
      };

      /**
       * @param {!Blockly.WorkspaceSvg} workspace The workspace to zoom.
       * @param {number} scale The target zoom factor.
       */
      window.setWorkspaceScale = function (workspace, scale) {
        workspace.setScale(scale);
      };

      window.getAssertionState = function (block, dragDelta, deleteAreaRect) {
        const {
          dragger,
          dragEvent,
          block: draggedBlock,
        } = dragBlock(block, dragDelta);

        const originAfter = blockOriginClient(draggedBlock);
        const deleteAreaContainsBlockOrigin = deleteAreaRect.contains(
          originAfter.x,
          originAfter.y,
        );
        const deleteAreaContainsCursor = deleteAreaRect.contains(
          dragEvent.clientX,
          dragEvent.clientY,
        );
        const blockHasDeleteStyle = hasDeleteStyle(draggedBlock);

        const trashLidOpen = hasTrashLidOpen(draggedBlock.workspace);

        dragger.onDragEnd(dragEvent);

        const blockIsDeadOrDying = draggedBlock.isDeadOrDying();

        return {
          deleteAreaContainsBlockOrigin,
          deleteAreaContainsCursor,
          blockHasDeleteStyle,
          blockIsDeadOrDying,
          trashLidOpen,
        };
      };
    });
  });

  suiteTeardown(async function () {
    await this.browser.execute(() => {
      delete window.blockCenterClient;
      delete window.blockOriginClient;
      delete window.dragBlock;
      delete window.hasDeleteStyle;
      delete window.pointerAt;
      delete window.openMutator;
      delete window.rectCenterClient;
      delete window.hasTrashLidOpen;
      delete window.setWorkspaceScale;
      delete window.getAssertionState;
    });
  });

  test('does not apply delete styling when only block origin overlaps delete area', async function () {
    const {
      deleteAreaContainsBlockOrigin,
      deleteAreaContainsCursor,
      blockHasDeleteStyle,
      blockIsDeadOrDying,
    } = await this.browser.execute(() => {
      const block = Blockly.getMainWorkspace().newBlock('controls_if');
      block.initSvg();
      block.render();

      const start = blockCenterClient(block);
      const originBefore = blockOriginClient(block);
      const deleteAreaRect = Blockly.getMainWorkspace().toolbox.getClientRect();
      const desiredOrigin = {
        x: deleteAreaRect.right - 5,
        y: originBefore.y,
      };
      const dragDelta = {
        x: start.x + desiredOrigin.x - originBefore.x,
        y: start.y + desiredOrigin.y - originBefore.y,
      };

      return getAssertionState(block, dragDelta, deleteAreaRect);
    });

    chai.assert.isTrue(
      deleteAreaContainsBlockOrigin,
      'Expected block origin to overlap delete area',
    );
    chai.assert.isFalse(
      deleteAreaContainsCursor,
      'Expected cursor to be outside delete area',
    );
    chai.assert.isFalse(blockHasDeleteStyle);
    chai.assert.isFalse(blockIsDeadOrDying);
  });

  test('does not apply delete styling when only block origin overlaps flyout delete area at zoomed scale', async function () {
    const {
      flyoutRect,
      deleteAreaContainsBlockOrigin,
      deleteAreaContainsCursor,
      blockHasDeleteStyle,
      blockIsDeadOrDying,
    } = await this.browser.execute(async () => {
      const workspace = Blockly.getMainWorkspace();

      for (let i = 0; i < 3; i++) {
        workspace.zoomCenter(1);
      }

      const mutatorWorkspace = await openMutator(workspace);
      mutatorWorkspace.recordDragTargets();

      const flyout = mutatorWorkspace.getFlyout();
      const flyoutRect = flyout.getClientRect();

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
      const dragDelta = {
        x: start.x + desiredOrigin.x - originBefore.x,
        y: start.y + desiredOrigin.y - originBefore.y,
      };

      return getAssertionState(workspaceBlock, dragDelta, flyoutRect);
    });

    // chai.assert.isNotNull(flyoutRect);
    chai.assert.isTrue(
      deleteAreaContainsBlockOrigin,
      'Expected block origin to overlap flyout delete area',
    );
    chai.assert.isFalse(
      deleteAreaContainsCursor,
      'Expected cursor to be outside flyout delete area',
    );
    chai.assert.isFalse(blockHasDeleteStyle);
    chai.assert.isFalse(blockIsDeadOrDying);
  });

  test('deletes flyout block when pointer is over flyout delete area at zoomed scale', async function () {
    const {
      flyoutRect,
      deleteAreaContainsCursor,
      blockHasDeleteStyle,
      blockIsDeadOrDying,
    } = await this.browser.execute(async () => {
      const workspace = Blockly.getMainWorkspace();

      for (let i = 0; i < 3; i++) {
        workspace.zoomCenter(1);
      }

      const mutatorWorkspace = await openMutator(workspace);
      mutatorWorkspace.recordDragTargets();

      const flyout = mutatorWorkspace.getFlyout();
      const flyoutRect = flyout.getClientRect();

      const flyoutBlock = flyout
        .getWorkspace()
        .getBlocksByType('controls_if_elseif')[0];
      flyoutBlock.initSvg();
      flyoutBlock.render();

      return getAssertionState(
        flyoutBlock,
        rectCenterClient(flyoutRect),
        flyoutRect,
      );
    });

    chai.assert.isTrue(
      deleteAreaContainsCursor,
      'Expected cursor to be inside flyout delete area',
    );
    chai.assert.isTrue(blockHasDeleteStyle);
    chai.assert.isTrue(blockIsDeadOrDying);
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
      test(`applies delete styling and deletes when dragged to ${name} at ${zoomName}`, async function () {
        const {
          deleteAreaContainsCursor,
          trashLidOpen,
          blockHasDeleteStyle,
          blockIsDeadOrDying,
        } = await this.browser.execute(
          (scale, rectKey) => {
            const workspace = Blockly.getMainWorkspace();

            const block = workspace.newBlock('controls_if');
            block.initSvg();
            block.render();

            if (scale !== null) {
              setWorkspaceScale(workspace, scale);
              this.trashRect = workspace.trashcan.getClientRect();
              this.toolboxRect = workspace.toolbox.getClientRect();
            }

            const deleteRect =
              rectKey === 'trashRect'
                ? workspace.trashcan.getClientRect()
                : workspace.toolbox.getClientRect();

            return getAssertionState(
              block,
              rectCenterClient(deleteRect),
              deleteRect,
            );
          },
          scale,
          rectKey,
        );

        chai.assert.isTrue(
          deleteAreaContainsCursor,
          `Expected cursor to be inside ${name} delete area`,
        );
        chai.assert.isTrue(blockHasDeleteStyle);
        if (checkLid) {
          chai.assert.isTrue(trashLidOpen, 'Expected trashcan lid to be open');
        }
        chai.assert.isTrue(blockIsDeadOrDying);
      });
    });
  });
});
