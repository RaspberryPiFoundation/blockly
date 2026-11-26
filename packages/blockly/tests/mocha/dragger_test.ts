/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {Dragger} from '#core/dragging/dragger.js';
import {assert} from 'chai';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Dragger Event Grouping', function () {
  let workspace: Blockly.WorkspaceSvg;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    workspace = new Blockly.WorkspaceSvg(new Blockly.Options({}));
    workspace.createDom();
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  function createMockDraggable(workspace: Blockly.WorkspaceSvg) {
    let disposed = false;
    return {
      getRelativeToSurfaceXY: () => new Blockly.utils.Coordinate(0, 0),
      startDrag: function () {
        return this;
      },
      endDrag: () => {},
      revertDrag: () => {},
      dispose: () => {
        disposed = true;
      },
      isDisposed: () => disposed,
      workspace,
    };
  }

  test('keyboard drag end closes the event group', function () {
    const mockDraggable = createMockDraggable(workspace);
    const dragger = new Dragger(mockDraggable as any, workspace);

    const keyEvent = new KeyboardEvent('keydown', {key: 'Enter'});
    dragger.onDragStart(keyEvent);
    assert.isOk(
      Blockly.Events.getGroup(),
      'Event group should be open during drag',
    );

    dragger.onDragEnd(keyEvent);
    assert.isNotOk(
      Blockly.Events.getGroup(),
      'Event group should be closed after keyboard drag ends',
    );
  });

  test('drag end without event closes the event group', function () {
    const mockDraggable = createMockDraggable(workspace);
    const dragger = new Dragger(mockDraggable as any, workspace);

    dragger.onDragStart();
    assert.isOk(
      Blockly.Events.getGroup(),
      'Event group should be open during drag',
    );

    dragger.onDragEnd();
    assert.isNotOk(
      Blockly.Events.getGroup(),
      'Event group should be closed after drag ends',
    );
  });

  test('drag revert closes the event group', function () {
    const mockDraggable = createMockDraggable(workspace);
    const dragger = new Dragger(mockDraggable as any, workspace);

    const keyEvent = new KeyboardEvent('keydown', {key: 'Escape'});
    dragger.onDragStart(keyEvent);
    assert.isOk(
      Blockly.Events.getGroup(),
      'Event group should be open during drag',
    );

    dragger.onDragRevert(keyEvent);
    assert.isNotOk(
      Blockly.Events.getGroup(),
      'Event group should be closed after drag reverts',
    );
  });
});
