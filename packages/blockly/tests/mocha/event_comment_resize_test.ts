/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Comment Resize Event', function () {
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
      comment.setSize(new Blockly.utils.Size(100, 100));
      const origEvent = new Blockly.Events.CommentResize(comment);
      comment.setSize(new Blockly.utils.Size(200, 200));
      origEvent.recordCurrentSizeAsNewSize();

      const json = origEvent.toJson();
      const newEvent = Blockly.Events.fromJson(json, workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
