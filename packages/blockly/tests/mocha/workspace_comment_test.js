/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Workspace comment', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('getTopComments(ordered=true)', function () {
    test('No comments', function () {
      assert.equal(this.workspace.getTopComments(true).length, 0);
    });

    test('One comment', function () {
      const comment = new Blockly.comments.WorkspaceComment(
        this.workspace,
        'comment id',
      );
      assert.equal(this.workspace.getTopComments(true).length, 1);
      assert.equal(this.workspace.getCommentById('comment id'), comment);
    });

    test('After clear empty workspace', function () {
      this.workspace.clear();
      assert.equal(this.workspace.getTopComments(true).length, 0);
    });

    test('After clear non-empty workspace', function () {
      new Blockly.comments.WorkspaceComment(this.workspace, 'comment id');
      this.workspace.clear();
      assert.equal(this.workspace.getTopComments(true).length, 0);
      assert.isNull(this.workspace.getCommentById('comment id'));
    });

    test('After dispose', function () {
      const comment = new Blockly.comments.WorkspaceComment(
        this.workspace,
        'comment id',
      );
      comment.dispose();
      assert.equal(this.workspace.getTopComments(true).length, 0);
      assert.isNull(this.workspace.getCommentById('comment id'));
    });
  });

  suite('getTopComments(ordered=false)', function () {
    test('No comments', function () {
      assert.equal(this.workspace.getTopComments(false).length, 0);
    });

    test('One comment', function () {
      const comment = new Blockly.comments.WorkspaceComment(
        this.workspace,
        'comment id',
      );
      assert.equal(this.workspace.getTopComments(false).length, 1);
      assert.equal(this.workspace.getCommentById('comment id'), comment);
    });

    test('After clear empty workspace', function () {
      this.workspace.clear();
      assert.equal(this.workspace.getTopComments(false).length, 0);
    });

    test('After clear non-empty workspace', function () {
      new Blockly.comments.WorkspaceComment(this.workspace, 'comment id');
      this.workspace.clear();
      assert.equal(this.workspace.getTopComments(false).length, 0);
      assert.isNull(this.workspace.getCommentById('comment id'));
    });

    test('After dispose', function () {
      const comment = new Blockly.comments.WorkspaceComment(
        this.workspace,
        'comment id',
      );
      comment.dispose();
      assert.equal(this.workspace.getTopComments(false).length, 0);
      assert.isNull(this.workspace.getCommentById('comment id'));
    });
  });

  suite('getCommentById', function () {
    test('Trivial', function () {
      const comment = new Blockly.comments.WorkspaceComment(
        this.workspace,
        'comment id',
      );
      assert.equal(this.workspace.getCommentById(comment.id), comment);
    });

    test('Null id', function () {
      assert.isNull(this.workspace.getCommentById(null));
    });

    test('Non-existent id', function () {
      assert.isNull(this.workspace.getCommentById('badId'));
    });

    test('After dispose', function () {
      const comment = new Blockly.comments.WorkspaceComment(
        this.workspace,
        'comment id',
      );
      comment.dispose();
      assert.isNull(this.workspace.getCommentById(comment.id));
    });
  });

  suite('Width and height', function () {
    setup(function () {
      this.comment = new Blockly.comments.WorkspaceComment(
        this.workspace,
        'comment id',
      );
      this.comment.setSize(new Blockly.utils.Size(20, 10));
    });

    test('Initial values', function () {
      assert.equal(this.comment.getSize().width, 20, 'Width');
      assert.equal(this.comment.getSize().height, 10, 'Height');
    });

    test('setSize adjusts dimensions', function () {
      this.comment.setSize(new Blockly.utils.Size(100, 200));
      assert.equal(this.comment.getSize().width, 100, 'Width');
      assert.equal(this.comment.getSize().height, 200, 'Height');
    });
  });

  suite('XY position', function () {
    setup(function () {
      this.comment = new Blockly.comments.WorkspaceComment(
        this.workspace,
        'comment id',
      );
    });

    test('Initial position', function () {
      const xy = this.comment.getRelativeToSurfaceXY();
      assert.equal(xy.x, 0, 'Initial X position');
      assert.equal(xy.y, 0, 'Initial Y position');
    });

    test('moveTo', function () {
      this.comment.moveTo(new Blockly.utils.Coordinate(10, 100));
      const xy = this.comment.getRelativeToSurfaceXY();
      assert.equal(xy.x, 10, 'New X position');
      assert.equal(xy.y, 100, 'New Y position');
    });
  });

  suite('Content', function () {
    setup(function () {
      this.comment = new Blockly.comments.WorkspaceComment(
        this.workspace,
        'comment id',
      );
      this.comment.setText('comment text');
    });

    teardown(function () {
      sinon.restore();
    });

    test('After creation', function () {
      assert.equal(this.comment.getText(), 'comment text');
      assert.equal(
        this.workspace.getUndoStack().length,
        2,
        'Workspace undo stack',
      );
    });

    test('Set to same value', function () {
      this.comment.setText('comment text');
      assert.equal(this.comment.getText(), 'comment text');
      // Setting the text to the old value does not fire an event.
      assert.equal(
        this.workspace.getUndoStack().length,
        2,
        'Workspace undo stack',
      );
    });

    test('Set to different value', function () {
      this.comment.setText('new comment text');
      assert.equal(this.comment.getText(), 'new comment text');
      assert.equal(
        this.workspace.getUndoStack().length,
        3,
        'Workspace undo stack',
      );
    });
  });
});
