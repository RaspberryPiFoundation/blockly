/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  assertEventFired,
  createChangeListenerSpy,
} from './test_helpers/events.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Workspace comment', function () {
  setup(function () {
    this.clock = sharedTestSetup.call(this, {fireEventsNow: false}).clock;
    this.workspace = new Blockly.inject('blocklyDiv', {});
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Events', function () {
    test('create events are fired when a comment is constructed', function () {
      const spy = createChangeListenerSpy(this.workspace);

      this.renderedComment = new Blockly.comments.RenderedWorkspaceComment(
        this.workspace,
      );

      this.clock.runAll();

      assertEventFired(
        spy,
        Blockly.Events.CommentCreate,
        {commentId: this.renderedComment.id},
        this.workspace.id,
      );
    });

    test('delete events are fired when a comment is disposed', function () {
      this.renderedComment = new Blockly.comments.RenderedWorkspaceComment(
        this.workspace,
      );
      const spy = createChangeListenerSpy(this.workspace);

      this.renderedComment.dispose();

      this.clock.runAll();

      assertEventFired(
        spy,
        Blockly.Events.CommentDelete,
        {commentId: this.renderedComment.id},
        this.workspace.id,
      );
    });

    test('move events are fired when a comment is moved', function () {
      this.renderedComment = new Blockly.comments.RenderedWorkspaceComment(
        this.workspace,
      );
      const spy = createChangeListenerSpy(this.workspace);

      this.renderedComment.moveTo(new Blockly.utils.Coordinate(42, 42));

      this.clock.runAll();

      assertEventFired(
        spy,
        Blockly.Events.CommentMove,
        {
          commentId: this.renderedComment.id,
          oldCoordinate_: {x: 0, y: 0},
          newCoordinate_: {x: 42, y: 42},
        },
        this.workspace.id,
      );
    });

    test('resize events are fired when a comment is resized', function () {
      this.renderedComment = new Blockly.comments.RenderedWorkspaceComment(
        this.workspace,
      );
      const spy = createChangeListenerSpy(this.workspace);

      this.renderedComment.setSize(new Blockly.utils.Size(300, 200));

      this.clock.runAll();

      assertEventFired(
        spy,
        Blockly.Events.CommentResize,
        {
          commentId: this.renderedComment.id,
          oldSize: {width: 120, height: 100},
          newSize: {width: 300, height: 200},
        },
        this.workspace.id,
      );
    });

    test('change events are fired when a comments text is edited', function () {
      this.renderedComment = new Blockly.comments.RenderedWorkspaceComment(
        this.workspace,
      );
      const spy = createChangeListenerSpy(this.workspace);

      this.renderedComment.setText('test text');

      this.clock.runAll();

      assertEventFired(
        spy,
        Blockly.Events.CommentChange,
        {
          commentId: this.renderedComment.id,
          oldContents_: '',
          newContents_: 'test text',
        },
        this.workspace.id,
      );
    });

    test('collapse events are fired when a comment is collapsed', function () {
      this.renderedComment = new Blockly.comments.RenderedWorkspaceComment(
        this.workspace,
      );
      const spy = createChangeListenerSpy(this.workspace);

      this.renderedComment.setCollapsed(true);

      this.clock.runAll();

      assertEventFired(
        spy,
        Blockly.Events.CommentCollapse,
        {
          commentId: this.renderedComment.id,
          newCollapsed: true,
        },
        this.workspace.id,
      );
    });

    test('collapse events are fired when a comment is uncollapsed', function () {
      this.renderedComment = new Blockly.comments.RenderedWorkspaceComment(
        this.workspace,
      );
      this.renderedComment.setCollapsed(true);
      const spy = createChangeListenerSpy(this.workspace);

      this.renderedComment.setCollapsed(false);

      this.clock.runAll();

      assertEventFired(
        spy,
        Blockly.Events.CommentCollapse,
        {
          commentId: this.renderedComment.id,
          newCollapsed: false,
        },
        this.workspace.id,
      );
    });
  });

  suite('Focus', function () {
    test('moves to the workspace when deleted', function () {
      const comment = new Blockly.comments.RenderedWorkspaceComment(
        this.workspace,
      );
      Blockly.getFocusManager().focusNode(comment);
      assert.equal(Blockly.getFocusManager().getFocusedNode(), comment);
      comment.view.getCommentBarButtons()[1].performAction();
      assert.equal(Blockly.getFocusManager().getFocusedNode(), this.workspace);
    });

    test('does not change the layer', function () {
      const comment = new Blockly.comments.RenderedWorkspaceComment(
        this.workspace,
      );

      this.workspace.getLayerManager()?.moveToDragLayer(comment);
      Blockly.getFocusManager().focusNode(comment);
      assert.equal(
        comment.getSvgRoot().parentElement,
        this.workspace.getLayerManager()?.getDragLayer(),
      );
    });
  });
});
