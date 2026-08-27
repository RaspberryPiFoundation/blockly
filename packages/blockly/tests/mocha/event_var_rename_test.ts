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

suite('Var Rename Event', function () {
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
      const varModel = new Blockly.VariableModel(
        workspace,
        'old name',
        'type',
        'id',
      );
      const origEvent = new Blockly.Events.VarRename(varModel, 'new name');

      const json = origEvent.toJson();
      const newEvent = Blockly.Events.fromJson(json, workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
