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

suite('Var Create Event', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Serialization', function () {
    test('untyped variable events round-trip through JSON', function () {
      const varModel = new Blockly.VariableModel(
        this.workspace,
        'name',
        '',
        'id',
      );
      const origEvent = new Blockly.Events.VarCreate(varModel);

      const json = origEvent.toJson();
      const newEvent = new Blockly.Events.fromJson(json, this.workspace);

      assert.deepEqual(newEvent, origEvent);
    });

    test('typed variable events round-trip through JSON', function () {
      const varModel = new Blockly.VariableModel(
        this.workspace,
        'name',
        'type',
        'id',
      );
      const origEvent = new Blockly.Events.VarCreate(varModel);

      const json = origEvent.toJson();
      const newEvent = new Blockly.Events.fromJson(json, this.workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
