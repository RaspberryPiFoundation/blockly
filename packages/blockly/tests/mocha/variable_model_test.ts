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

suite('Variable Model', function () {
  let workspace: Blockly.Workspace;
  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    workspace = new Blockly.Workspace();
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  test('Trivial', function () {
    const variable = new Blockly.VariableModel(
      workspace,
      'test',
      'test_type',
      'test_id',
    );
    assert.equal(variable.getName(), 'test');
    assert.equal(variable.getType(), 'test_type');
    assert.equal(variable.getId(), 'test_id');
  });

  test('Undefined type', function () {
    const variable = new Blockly.VariableModel(
      workspace,
      'test',
      undefined,
      'test_id',
    );
    assert.equal(variable.getType(), '');
  });

  test('Undefined id', function () {
    const variable = new Blockly.VariableModel(
      workspace,
      'test',
      'test_type',
      undefined,
    );
    assert.equal(variable.getName(), 'test');
    assert.equal(variable.getType(), 'test_type');
    assert.exists(variable.getId());
  });

  test('Only name provided', function () {
    const variable = new Blockly.VariableModel(workspace, 'test');
    assert.equal(variable.getName(), 'test');
    assert.equal(variable.getType(), '');
    assert.exists(variable.getId());
  });
});
