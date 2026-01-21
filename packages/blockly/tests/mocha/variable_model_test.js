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

suite('Variable Model', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  test('Trivial', function () {
    const variable = new Blockly.VariableModel(
      this.workspace,
      'test',
      'test_type',
      'test_id',
    );
    assert.equal(variable.getName(), 'test');
    assert.equal(variable.getType(), 'test_type');
    assert.equal(variable.getId(), 'test_id');
  });

  test('Null type', function () {
    const variable = new Blockly.VariableModel(
      this.workspace,
      'test',
      null,
      'test_id',
    );
    assert.equal(variable.getType(), '');
  });

  test('Undefined type', function () {
    const variable = new Blockly.VariableModel(
      this.workspace,
      'test',
      undefined,
      'test_id',
    );
    assert.equal(variable.getType(), '');
  });

  test('Null id', function () {
    const variable = new Blockly.VariableModel(
      this.workspace,
      'test',
      'test_type',
      null,
    );
    assert.equal(variable.getName(), 'test');
    assert.equal(variable.getType(), 'test_type');
    assert.exists(variable.getId());
  });

  test('Undefined id', function () {
    const variable = new Blockly.VariableModel(
      this.workspace,
      'test',
      'test_type',
      undefined,
    );
    assert.equal(variable.getName(), 'test');
    assert.equal(variable.getType(), 'test_type');
    assert.exists(variable.getId());
  });

  test('Only name provided', function () {
    const variable = new Blockly.VariableModel(this.workspace, 'test');
    assert.equal(variable.getName(), 'test');
    assert.equal(variable.getType(), '');
    assert.exists(variable.getId());
  });
});
