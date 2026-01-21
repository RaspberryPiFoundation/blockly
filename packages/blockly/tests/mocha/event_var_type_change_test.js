/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Var Type Change Event', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Serialization', function () {
    test('variable type change events round-trip through JSON', function () {
      const varModel = new Blockly.VariableModel(
        this.workspace,
        'name',
        'foo',
        'id',
      );
      const origEvent = new Blockly.Events.VarTypeChange(
        varModel,
        'foo',
        'bar',
      );

      const json = origEvent.toJson();
      const newEvent = new Blockly.Events.fromJson(json, this.workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
