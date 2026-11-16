/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Comment Move Event', function () {
  let workspace: Blockly.Workspace;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    workspace = new Blockly.Workspace();
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  suite('Serialization', function () {
    test('events round-trip through JSON', function () {
      const comment = new Blockly.comments.WorkspaceComment(workspace);
      comment.setText('test text');
      comment.moveTo(new Blockly.utils.Coordinate(10, 10));
      const origEvent = new Blockly.Events.CommentMove(comment);
      comment.moveTo(new Blockly.utils.Coordinate(20, 20));
      origEvent.recordNew();

      const json = origEvent.toJson();
      const newEvent = Blockly.Events.fromJson(json, workspace);
      delete (origEvent as any).comment_; // Ignore private properties.
      delete (newEvent as any).comment_; // Ignore private properties.

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
