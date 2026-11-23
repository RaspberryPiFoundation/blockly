/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import sinon from 'sinon';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

suite('Render Management', function () {
  let workspace: Blockly.WorkspaceSvg;
  let clock: sinon.SinonFakeTimers;

  setup(function (this: Mocha.Context) {
    ({clock} = sharedTestSetup.call(this));
    workspace = Blockly.inject('blocklyDiv', DEFAULT_INJECT_OPTIONS);
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  suite('finish queued renders callback', function () {
    test('the queueRender promise is properly resolved after rendering', function () {
      const block = workspace.newBlock('controls_if');
      block.initSvg();
      const renderSpy = sinon.spy(block, 'renderEfficiently');
      const promise = Blockly.renderManagement.queueRender(block).then(() => {
        sinon.assert.calledOnce(renderSpy);
      });
      clock.runAll();
      return promise;
    });

    test('the finish queued renders promise is properly resolved after rendering', function () {
      const block = workspace.newBlock('controls_if');
      block.initSvg();
      const renderSpy = sinon.spy(block, 'renderEfficiently');
      Blockly.renderManagement.queueRender(block);
      const promise = Blockly.renderManagement
        .finishQueuedRenders()
        .then(() => {
          sinon.assert.calledOnce(renderSpy);
        });
      clock.runAll();
      return promise;
    });
  });

  suite('triggering queued renders', function () {
    test('triggering queued renders rerenders blocks', function () {
      const block = workspace.newBlock('controls_if');
      block.initSvg();
      const renderSpy = sinon.spy(block, 'renderEfficiently');
      Blockly.renderManagement.queueRender(block);

      Blockly.renderManagement.triggerQueuedRenders();

      sinon.assert.calledOnce(renderSpy);
    });

    test('triggering queued renders rerenders blocks in all workspaces', function () {
      const div = document.createElement('div');
      document.body.appendChild(div);
      const workspace2 = Blockly.inject(div, DEFAULT_INJECT_OPTIONS);
      const block1 = workspace.newBlock('controls_if');
      block1.initSvg();
      const renderSpy1 = sinon.spy(block1, 'renderEfficiently');
      const block2 = workspace2.newBlock('controls_if');
      block2.initSvg();
      const renderSpy2 = sinon.spy(block2, 'renderEfficiently');

      Blockly.renderManagement.queueRender(block1);
      Blockly.renderManagement.queueRender(block2);

      Blockly.renderManagement.triggerQueuedRenders();

      sinon.assert.calledOnce(renderSpy1);
      sinon.assert.calledOnce(renderSpy2);

      workspace2.dispose();
    });

    test('triggering queued renders in one workspace does not rerender blocks in another workspace', function () {
      const div = document.createElement('div');
      document.body.appendChild(div);
      const workspace2 = Blockly.inject(div, DEFAULT_INJECT_OPTIONS);
      const block1 = workspace.newBlock('controls_if');
      block1.initSvg();
      const renderSpy1 = sinon.spy(block1, 'renderEfficiently');
      const block2 = workspace2.newBlock('controls_if');
      block2.initSvg();
      const renderSpy2 = sinon.spy(block2, 'renderEfficiently');

      Blockly.renderManagement.queueRender(block1);
      Blockly.renderManagement.queueRender(block2);

      Blockly.renderManagement.triggerQueuedRenders(workspace);

      sinon.assert.calledOnce(renderSpy1);
      sinon.assert.notCalled(renderSpy2);

      workspace2.dispose();
    });
  });

  suite('Post-render bumpNeighbours', function () {
    let block: Blockly.BlockSvg;

    setup(function () {
      block = workspace.newBlock('controls_if');
      block.initSvg();

      const block2 = workspace.newBlock('controls_if');
      block2.initSvg();
      Blockly.renderManagement.triggerQueuedRenders();

      // Align the blocks' next and previous connections without connecting them
      // so that they'll need to bump one another.
      assert.isNotNull(block2.nextConnection);
      assert.isNotNull(block.previousConnection);
      block.moveBy(
        block2.nextConnection.x - block.previousConnection.x,
        block2.nextConnection.y - block.previousConnection.y,
        ['test'],
      );
    });

    teardown(function (this: Mocha.Context) {
      workspaceTeardown.call(this, workspace);
    });

    test('does not record undo event when the render was queued with recordUndo disabled', function () {
      Blockly.Events.setRecordUndo(false);
      Blockly.renderManagement.queueRender(block);
      Blockly.Events.setRecordUndo(true);

      Blockly.renderManagement.triggerQueuedRenders();

      assert.isFalse(
        workspace.getUndoStack().some((item) => {
          return (
            item instanceof Blockly.Events.BlockMove &&
            item.reason?.[0] === 'bump' &&
            item.blockId === block.id
          );
        }),
      );
    });

    test('records undo event when the render was queued with recordUndo enabled', function () {
      Blockly.Events.setRecordUndo(true);
      Blockly.renderManagement.queueRender(block);
      Blockly.Events.setRecordUndo(false);

      Blockly.renderManagement.triggerQueuedRenders();

      assert.isTrue(
        workspace.getUndoStack().some((item) => {
          return (
            item instanceof Blockly.Events.BlockMove &&
            item.reason?.[0] === 'bump' &&
            item.blockId === block.id
          );
        }),
      );
    });

    test('associates bump undo events with the event group from when the render was queued', function () {
      Blockly.Events.setRecordUndo(true);
      Blockly.Events.setGroup('test-group');
      Blockly.renderManagement.queueRender(block);
      Blockly.Events.setGroup(false);
      Blockly.Events.setRecordUndo(false);

      Blockly.renderManagement.triggerQueuedRenders();

      assert.isTrue(
        workspace.getUndoStack().some((item) => {
          return (
            item instanceof Blockly.Events.BlockMove &&
            item.reason?.[0] === 'bump' &&
            item.blockId === block.id &&
            item.group === 'test-group'
          );
        }),
      );
    });
  });
});
