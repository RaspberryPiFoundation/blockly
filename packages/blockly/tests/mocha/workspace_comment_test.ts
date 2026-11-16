/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Workspace comment', function () {
  let workspace: Blockly.Workspace;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    workspace = new Blockly.Workspace();
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  suite('getTopComments(ordered=true)', function () {
    test('No comments', function () {
      assert.equal(workspace.getTopComments(true).length, 0);
    });

    test('One comment', function () {
      const comment = new Blockly.comments.WorkspaceComment(
        workspace,
        'comment id',
      );
      assert.equal(workspace.getTopComments(true).length, 1);
      assert.equal(workspace.getCommentById('comment id'), comment);
    });

    test('After clear empty workspace', function () {
      workspace.clear();
      assert.equal(workspace.getTopComments(true).length, 0);
    });

    test('After clear non-empty workspace', function () {
      new Blockly.comments.WorkspaceComment(workspace, 'comment id');
      workspace.clear();
      assert.equal(workspace.getTopComments(true).length, 0);
      assert.isNull(workspace.getCommentById('comment id'));
    });

    test('After dispose', function () {
      const comment = new Blockly.comments.WorkspaceComment(
        workspace,
        'comment id',
      );
      comment.dispose();
      assert.equal(workspace.getTopComments(true).length, 0);
      assert.isNull(workspace.getCommentById('comment id'));
    });
  });

  suite('getTopComments(ordered=false)', function () {
    test('No comments', function () {
      assert.equal(workspace.getTopComments(false).length, 0);
    });

    test('One comment', function () {
      const comment = new Blockly.comments.WorkspaceComment(
        workspace,
        'comment id',
      );
      assert.equal(workspace.getTopComments(false).length, 1);
      assert.equal(workspace.getCommentById('comment id'), comment);
    });

    test('After clear empty workspace', function () {
      workspace.clear();
      assert.equal(workspace.getTopComments(false).length, 0);
    });

    test('After clear non-empty workspace', function () {
      new Blockly.comments.WorkspaceComment(workspace, 'comment id');
      workspace.clear();
      assert.equal(workspace.getTopComments(false).length, 0);
      assert.isNull(workspace.getCommentById('comment id'));
    });

    test('After dispose', function () {
      const comment = new Blockly.comments.WorkspaceComment(
        workspace,
        'comment id',
      );
      comment.dispose();
      assert.equal(workspace.getTopComments(false).length, 0);
      assert.isNull(workspace.getCommentById('comment id'));
    });
  });

  suite('getCommentById', function () {
    test('Trivial', function () {
      const comment = new Blockly.comments.WorkspaceComment(
        workspace,
        'comment id',
      );
      assert.equal(workspace.getCommentById(comment.id), comment);
    });

    test('Empty id', function () {
      assert.isNull(workspace.getCommentById(''));
    });

    test('Non-existent id', function () {
      assert.isNull(workspace.getCommentById('badId'));
    });

    test('After dispose', function () {
      const comment = new Blockly.comments.WorkspaceComment(
        workspace,
        'comment id',
      );
      comment.dispose();
      assert.isNull(workspace.getCommentById(comment.id));
    });
  });

  suite('Width and height', function () {
    let comment: Blockly.comments.WorkspaceComment;

    setup(function () {
      comment = new Blockly.comments.WorkspaceComment(workspace, 'comment id');
      comment.setSize(new Blockly.utils.Size(20, 10));
    });

    test('Initial values', function () {
      assert.equal(comment.getSize().width, 20, 'Width');
      assert.equal(comment.getSize().height, 10, 'Height');
    });

    test('setSize adjusts dimensions', function () {
      comment.setSize(new Blockly.utils.Size(100, 200));
      assert.equal(comment.getSize().width, 100, 'Width');
      assert.equal(comment.getSize().height, 200, 'Height');
    });
  });

  suite('XY position', function () {
    let comment: Blockly.comments.WorkspaceComment;
    setup(function () {
      comment = new Blockly.comments.WorkspaceComment(workspace, 'comment id');
    });

    test('Initial position', function () {
      const xy = comment.getRelativeToSurfaceXY();
      assert.equal(xy.x, 0, 'Initial X position');
      assert.equal(xy.y, 0, 'Initial Y position');
    });

    test('moveTo', function () {
      comment.moveTo(new Blockly.utils.Coordinate(10, 100));
      const xy = comment.getRelativeToSurfaceXY();
      assert.equal(xy.x, 10, 'New X position');
      assert.equal(xy.y, 100, 'New Y position');
    });
  });

  suite('Content', function () {
    let comment: Blockly.comments.WorkspaceComment;
    setup(function () {
      comment = new Blockly.comments.WorkspaceComment(workspace, 'comment id');
      comment.setText('comment text');
    });

    test('After creation', function () {
      assert.equal(comment.getText(), 'comment text');
      assert.equal(workspace.getUndoStack().length, 2, 'Workspace undo stack');
    });

    test('Set to same value', function () {
      comment.setText('comment text');
      assert.equal(comment.getText(), 'comment text');
      // Setting the text to the old value does not fire an event.
      assert.equal(workspace.getUndoStack().length, 2, 'Workspace undo stack');
    });

    test('Set to different value', function () {
      comment.setText('new comment text');
      assert.equal(comment.getText(), 'new comment text');
      assert.equal(workspace.getUndoStack().length, 3, 'Workspace undo stack');
    });
  });
});
