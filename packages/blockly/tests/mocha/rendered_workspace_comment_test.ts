/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {
  assertEventFired,
  createChangeListenerSpy,
} from './test_helpers/events.js';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Workspace comment', function () {
  let clock: sinon.SinonFakeTimers;
  let workspace: Blockly.WorkspaceSvg;

  setup(function (this: Mocha.Context) {
    ({clock} = sharedTestSetup.call(this, {fireEventsNow: false}));
    workspace = Blockly.inject('blocklyDiv', DEFAULT_INJECT_OPTIONS);
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  suite('Events', function () {
    let renderedComment: Blockly.comments.RenderedWorkspaceComment;
    let spy: sinon.SinonSpy;

    setup(function () {
      renderedComment = new Blockly.comments.RenderedWorkspaceComment(
        workspace,
      );
      spy = createChangeListenerSpy(workspace);
    });

    test('create events are fired when a comment is constructed', function () {
      clock.runAll();

      assertEventFired(
        spy,
        Blockly.Events.CommentCreate,
        {commentId: renderedComment.id},
        workspace.id,
      );
    });

    test('delete events are fired when a comment is disposed', function () {
      renderedComment.dispose();
      clock.runAll();

      assertEventFired(
        spy,
        Blockly.Events.CommentDelete,
        {commentId: renderedComment.id},
        workspace.id,
      );
    });

    test('move events are fired when a comment is moved', function () {
      renderedComment.moveTo(new Blockly.utils.Coordinate(42, 42));
      clock.runAll();

      assertEventFired(
        spy,
        Blockly.Events.CommentMove,
        {
          commentId: renderedComment.id,
          oldCoordinate_: {x: 0, y: 0},
          newCoordinate_: {x: 42, y: 42},
        },
        workspace.id,
      );
    });

    test('resize events are fired when a comment is resized', function () {
      renderedComment.setSize(new Blockly.utils.Size(300, 200));
      clock.runAll();

      assertEventFired(
        spy,
        Blockly.Events.CommentResize,
        {
          commentId: renderedComment.id,
          oldSize: {width: 120, height: 100},
          newSize: {width: 300, height: 200},
        },
        workspace.id,
      );
    });

    test('change events are fired when a comments text is edited', function () {
      renderedComment.setText('test text');
      clock.runAll();

      assertEventFired(
        spy,
        Blockly.Events.CommentChange,
        {
          commentId: renderedComment.id,
          oldContents_: '',
          newContents_: 'test text',
        },
        workspace.id,
      );
    });

    test('collapse events are fired when a comment is collapsed', function () {
      renderedComment.setCollapsed(true);
      clock.runAll();

      assertEventFired(
        spy,
        Blockly.Events.CommentCollapse,
        {
          commentId: renderedComment.id,
          newCollapsed: true,
        },
        workspace.id,
      );
    });

    test('collapse events are fired when a comment is uncollapsed', function () {
      renderedComment.setCollapsed(true);
      renderedComment.setCollapsed(false);
      clock.runAll();

      assertEventFired(
        spy,
        Blockly.Events.CommentCollapse,
        {
          commentId: renderedComment.id,
          newCollapsed: false,
        },
        workspace.id,
      );
    });
  });

  suite('Focus', function () {
    test('moves to the workspace when deleted', function () {
      const comment = new Blockly.comments.RenderedWorkspaceComment(workspace);
      Blockly.getFocusManager().focusNode(comment);
      assert.equal(Blockly.getFocusManager().getFocusedNode(), comment);
      comment.view.getCommentBarButtons()[1].performAction();
      assert.equal(Blockly.getFocusManager().getFocusedNode(), workspace);
    });

    test('does not change the layer', function () {
      const comment = new Blockly.comments.RenderedWorkspaceComment(workspace);

      workspace.getLayerManager()?.moveToDragLayer(comment);
      Blockly.getFocusManager().focusNode(comment);
      assert.equal(
        comment.getSvgRoot().parentElement,
        workspace.getLayerManager()?.getDragLayer() as Element,
      );
    });
  });
});
