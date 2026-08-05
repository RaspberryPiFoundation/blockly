/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Render Management', function () {
  setup(function () {
    this.clock = sharedTestSetup.call(this).clock;
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('finish queued renders callback', function () {
    function createMockBlock() {
      return {
        hasRendered: false,
        renderEfficiently: function () {
          this.hasRendered = true;
        },

        // All of the APIs the render management system needs.
        getParent: () => null,
        getChildren: () => [],
        isDisposed: () => false,
        getRelativeToSurfaceXY: () => ({x: 0, y: 0}),
        updateComponentLocations: () => {},
        bumpNeighbours: () => {},
        initialized: true,
        workspace: {
          resizeContents: () => {},
          connectionDBList: [],
        },
      };
    }

    test('the queueRender promise is properly resolved after rendering', function () {
      const block = createMockBlock();
      const promise = Blockly.renderManagement.queueRender(block).then(() => {
        assert.isTrue(block.hasRendered, 'Expected block to be rendered');
      });
      this.clock.runAll();
      return promise;
    });

    test('the finish queued renders promise is properly resolved after rendering', function () {
      const block = createMockBlock();
      Blockly.renderManagement.queueRender(block);
      const promise = Blockly.renderManagement.finishQueuedRenders(() => {
        assert.isTrue(block.hasRendered, 'Expected block to be rendered');
      });
      this.clock.runAll();
      return promise;
    });
  });

  suite('triggering queued renders', function () {
    function createMockBlock(ws) {
      return {
        hasRendered: false,
        renderEfficiently: function () {
          this.hasRendered = true;
        },

        // All of the APIs the render management system needs.
        getParent: () => null,
        getChildren: () => [],
        isDisposed: () => false,
        getRelativeToSurfaceXY: () => ({x: 0, y: 0}),
        updateComponentLocations: () => {},
        bumpNeighbours: () => {},
        initialized: true,
        workspace: ws || createMockWorkspace(),
      };
    }

    function createMockWorkspace() {
      return {
        resizeContents: () => {},
        connectionDBList: [],
      };
    }

    test('triggering queued renders rerenders blocks', function () {
      const block = createMockBlock();
      Blockly.renderManagement.queueRender(block);

      Blockly.renderManagement.triggerQueuedRenders();

      assert.isTrue(block.hasRendered, 'Expected block to be rendered');
    });

    test('triggering queued renders rerenders blocks in all workspaces', function () {
      const workspace1 = createMockWorkspace();
      const workspace2 = createMockWorkspace();
      const block1 = createMockBlock(workspace1);
      const block2 = createMockBlock(workspace2);
      Blockly.renderManagement.queueRender(block1);
      Blockly.renderManagement.queueRender(block2);

      Blockly.renderManagement.triggerQueuedRenders();

      assert.isTrue(block1.hasRendered, 'Expected block1 to be rendered');
      assert.isTrue(block2.hasRendered, 'Expected block2 to be rendered');
    });

    test('triggering queued renders in one workspace does not rerender blocks in another workspace', function () {
      const workspace1 = createMockWorkspace();
      const workspace2 = createMockWorkspace();
      const block1 = createMockBlock(workspace1);
      const block2 = createMockBlock(workspace2);
      Blockly.renderManagement.queueRender(block1);
      Blockly.renderManagement.queueRender(block2);

      Blockly.renderManagement.triggerQueuedRenders(workspace1);

      assert.isTrue(block1.hasRendered, 'Expected block1 to be rendered');
      assert.isFalse(block2.hasRendered, 'Expected block2 to not be rendered');
    });
  });

  suite('Post-render bumpNeighbours', function () {
    setup(function () {
      this.workspace = Blockly.inject('blocklyDiv', {});

      // Create and init two identical overlapping blocks so that the first
      // render will need to bump one.
      this.block = this.workspace.newBlock('controls_if');
      this.block.initSvg();

      const block2 = this.workspace.newBlock('controls_if');
      block2.initSvg();
    });

    test('does not record undo event when the render was queued with recordUndo disabled', function () {
      Blockly.Events.setRecordUndo(false);
      Blockly.renderManagement.queueRender(this.block);
      Blockly.Events.setRecordUndo(true);

      Blockly.renderManagement.triggerQueuedRenders();

      assert.isFalse(
        this.workspace.getUndoStack().some((item) => {
          return (
            item.type === 'move' &&
            item.reason[0] === 'bump' &&
            item.blockId === this.block.id
          );
        }),
      );
    });

    test('records undo event when the render was queued with recordUndo enabled', function () {
      Blockly.Events.setRecordUndo(true);
      Blockly.renderManagement.queueRender(this.block);
      Blockly.Events.setRecordUndo(false);

      Blockly.renderManagement.triggerQueuedRenders();

      assert.isTrue(
        this.workspace.getUndoStack().some((item) => {
          return (
            item.type === 'move' &&
            item.reason[0] === 'bump' &&
            item.blockId === this.block.id
          );
        }),
      );
    });

    test('associates bump undo events with the event group from when the render was queued', function () {
      Blockly.Events.setRecordUndo(true);
      Blockly.Events.setGroup('test-group');
      Blockly.renderManagement.queueRender(this.block);
      Blockly.Events.setGroup(false);
      Blockly.Events.setRecordUndo(false);

      Blockly.renderManagement.triggerQueuedRenders();

      assert.isTrue(
        this.workspace.getUndoStack().some((item) => {
          return (
            item.type === 'move' &&
            item.reason[0] === 'bump' &&
            item.blockId === this.block.id &&
            item.group === 'test-group'
          );
        }),
      );
    });
  });
});
