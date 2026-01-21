/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Comment Move Event', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Serialization', function () {
    test('events round-trip through JSON', function () {
      const comment = new Blockly.comments.WorkspaceComment(this.workspace);
      comment.setText('test text');
      comment.moveTo(new Blockly.utils.Coordinate(10, 10));
      const origEvent = new Blockly.Events.CommentMove(comment);
      comment.moveTo(new Blockly.utils.Coordinate(20, 20));
      origEvent.recordNew();

      const json = origEvent.toJson();
      const newEvent = new Blockly.Events.fromJson(json, this.workspace);
      delete origEvent.comment_; // Ignore private properties.
      delete newEvent.comment_; // Ignore private properties.

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
