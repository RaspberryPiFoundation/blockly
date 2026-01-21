/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite.skip('Workspace comment', function () {
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
      const comment = new Blockly.WorkspaceComment(
        this.workspace,
        'comment text',
        0,
        0,
        'comment id',
      );
      assert.equal(this.workspace.getTopComments(true).length, 1);
      assert.equal(this.workspace.commentDB.get('comment id'), comment);
    });

    test('After clear empty workspace', function () {
      this.workspace.clear();
      assert.equal(this.workspace.getTopComments(true).length, 0);
    });

    test('After clear non-empty workspace', function () {
      new Blockly.WorkspaceComment(
        this.workspace,
        'comment text',
        0,
        0,
        'comment id',
      );
      this.workspace.clear();
      assert.equal(this.workspace.getTopComments(true).length, 0);
      assert.isFalse(this.workspace.commentDB.has('comment id'));
    });

    test('After dispose', function () {
      const comment = new Blockly.WorkspaceComment(
        this.workspace,
        'comment text',
        0,
        0,
        'comment id',
      );
      comment.dispose();
      assert.equal(this.workspace.getTopComments(true).length, 0);
      assert.isFalse(this.workspace.commentDB.has('comment id'));
    });
  });

  suite('getTopComments(ordered=false)', function () {
    test('No comments', function () {
      assert.equal(this.workspace.getTopComments(false).length, 0);
    });

    test('One comment', function () {
      const comment = new Blockly.WorkspaceComment(
        this.workspace,
        'comment text',
        0,
        0,
        'comment id',
      );
      assert.equal(this.workspace.getTopComments(false).length, 1);
      assert.equal(this.workspace.commentDB.get('comment id'), comment);
    });

    test('After clear empty workspace', function () {
      this.workspace.clear();
      assert.equal(this.workspace.getTopComments(false).length, 0);
    });

    test('After clear non-empty workspace', function () {
      new Blockly.WorkspaceComment(
        this.workspace,
        'comment text',
        0,
        0,
        'comment id',
      );
      this.workspace.clear();
      assert.equal(this.workspace.getTopComments(false).length, 0);
      assert.isFalse(this.workspace.commentDB.has('comment id'));
    });

    test('After dispose', function () {
      const comment = new Blockly.WorkspaceComment(
        this.workspace,
        'comment text',
        0,
        0,
        'comment id',
      );
      comment.dispose();
      assert.equal(this.workspace.getTopComments(false).length, 0);
      assert.isFalse(this.workspace.commentDB.has('comment id'));
    });
  });

  suite('getCommentById', function () {
    test('Trivial', function () {
      const comment = new Blockly.WorkspaceComment(
        this.workspace,
        'comment text',
        0,
        0,
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
      const comment = new Blockly.WorkspaceComment(
        this.workspace,
        'comment text',
        0,
        0,
        'comment id',
      );
      comment.dispose();
      assert.isNull(this.workspace.getCommentById(comment.id));
    });
  });

  suite('dispose', function () {
    test('Called twice', function () {
      const comment = new Blockly.WorkspaceComment(
        this.workspace,
        'comment text',
        0,
        0,
        'comment id',
      );
      comment.dispose();
      // Nothing should go wrong the second time dispose is called.
      comment.dispose();
    });
  });

  suite('Width and height', function () {
    setup(function () {
      this.comment = new Blockly.WorkspaceComment(
        this.workspace,
        'comment text',
        10,
        20,
        'comment id',
      );
    });

    test('Initial values', function () {
      assert.equal(this.comment.getWidth(), 20, 'Width');
      assert.equal(this.comment.getHeight(), 10, 'Height');
    });

    test('setWidth does not affect height', function () {
      this.comment.setWidth(30);
      assert.equal(this.comment.getWidth(), 30, 'Width');
      assert.equal(this.comment.getHeight(), 10, 'Height');
    });

    test('setHeight does not affect width', function () {
      this.comment.setHeight(30);
      assert.equal(this.comment.getWidth(), 20, 'Width');
      assert.equal(this.comment.getHeight(), 30, 'Height');
    });
  });

  suite('XY position', function () {
    setup(function () {
      this.comment = new Blockly.WorkspaceComment(
        this.workspace,
        'comment text',
        10,
        20,
        'comment id',
      );
    });

    test('Initial position', function () {
      const xy = this.comment.getRelativeToSurfaceXY();
      assert.equal(xy.x, 0, 'Initial X position');
      assert.equal(xy.y, 0, 'Initial Y position');
    });

    test('moveBy', function () {
      this.comment.moveBy(10, 100);
      const xy = this.comment.getRelativeToSurfaceXY();
      assert.equal(xy.x, 10, 'New X position');
      assert.equal(xy.y, 100, 'New Y position');
    });
  });

  suite('Content', function () {
    setup(function () {
      this.comment = new Blockly.WorkspaceComment(
        this.workspace,
        'comment text',
        0,
        0,
        'comment id',
      );
    });

    teardown(function () {
      sinon.restore();
    });

    test('After creation', function () {
      assert.equal(this.comment.getContent(), 'comment text');
      assert.equal(this.workspace.undoStack_.length, 1, 'Workspace undo stack');
    });

    test('Set to same value', function () {
      this.comment.setContent('comment text');
      assert.equal(this.comment.getContent(), 'comment text');
      // Setting the text to the old value does not fire an event.
      assert.equal(this.workspace.undoStack_.length, 1, 'Workspace undo stack');
    });

    test('Set to different value', function () {
      this.comment.setContent('new comment text');
      assert.equal(this.comment.getContent(), 'new comment text');
      assert.equal(this.workspace.undoStack_.length, 2, 'Workspace undo stack');
    });
  });
});
