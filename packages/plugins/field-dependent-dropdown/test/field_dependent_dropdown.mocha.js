/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const chai = require('chai');
const sinon = require('sinon');
const Blockly = require('blockly');
require('./field_dependent_dropdown_test_block');

const assert = chai.assert;

suite('fieldDependentDropdown', function () {
  setup(function () {
    this.workspace = new Blockly.Workspace();
    this.clock = sinon.useFakeTimers();
  });

  teardown(function () {
    this.workspace.dispose();
    // Finish any remaining queued events then dispose the sinon environment.
    this.clock.runAll();
    this.clock.restore();
  });

  test('Changing a parent value changes the child options', function () {
    const block = this.workspace.newBlock('dependent_dropdown_test');
    const parentDropdown = block.getField('PARENT_FIELD');
    const childDropdown = block.getField('CHILD_FIELD');
    assert.deepEqual(childDropdown.getOptions(true), [
      ['A1', 'a1'],
      ['A2', 'a2'],
      ['Shared', 'shared'],
    ]);
    parentDropdown.setValue('b');
    assert.deepEqual(childDropdown.getOptions(true), [
      ['B1', 'b1'],
      ['B2', 'b2'],
      ['Shared', 'shared'],
    ]);
  });

  test('Changing a parent value changes the child value', function () {
    const block = this.workspace.newBlock('dependent_dropdown_test');
    const parentDropdown = block.getField('PARENT_FIELD');
    const childDropdown = block.getField('CHILD_FIELD');
    assert.equal(childDropdown.getValue(), 'a1');
    parentDropdown.setValue('b');
    assert.equal(childDropdown.getValue(), 'b1');
  });

  test('Changing a parent value preserves shared child value', function () {
    const block = this.workspace.newBlock('dependent_dropdown_test');
    const parentDropdown = block.getField('PARENT_FIELD');
    const childDropdown = block.getField('CHILD_FIELD');
    childDropdown.setValue('shared');
    parentDropdown.setValue('b');
    assert.equal(childDropdown.getValue(), 'shared');
  });

  test('Changing a parent value changes the grandchild options', function () {
    const block = this.workspace.newBlock('dependent_dropdown_test');
    const parentDropdown = block.getField('PARENT_FIELD');
    const grandchildDropdown = block.getField('GRANDCHILD_FIELD');
    assert.deepEqual(grandchildDropdown.getOptions(true), [
      ['A11', 'a11'],
      ['A12', 'a12'],
    ]);
    parentDropdown.setValue('b');
    assert.deepEqual(grandchildDropdown.getOptions(true), [
      ['B11', 'b11'],
      ['B12', 'b12'],
    ]);
  });

  test('Changing a parent value changes the grandchild value', function () {
    const block = this.workspace.newBlock('dependent_dropdown_test');
    const parentDropdown = block.getField('PARENT_FIELD');
    const grandchildDropdown = block.getField('GRANDCHILD_FIELD');
    assert.equal(grandchildDropdown.getValue(), 'a11');
    parentDropdown.setValue('b');
    assert.equal(grandchildDropdown.getValue(), 'b11');
  });

  test('Uses default options if parent field not in mapping', function () {
    const block = this.workspace.newBlock(
      'dependent_dropdown_default_options_test',
    );
    const parentTextInput = block.getField('PARENT_FIELD');
    const childDropdown = block.getField('CHILD_FIELD');
    assert.deepEqual(childDropdown.getOptions(true), [
      ['Default Option', 'defaultOption'],
    ]);
    parentTextInput.setValue('a');
    assert.deepEqual(childDropdown.getOptions(true), [
      ['A1', 'a1'],
      ['A2', 'a2'],
    ]);
    parentTextInput.setValue('b');
    assert.deepEqual(childDropdown.getOptions(true), [
      ['Default Option', 'defaultOption'],
    ]);
  });

  test('Parent field user validator composes with new validator', function () {
    const block = this.workspace.newBlock('dependent_dropdown_validation_test');
    const parentDropdown = block.getField('PARENT_FIELD');
    const childDropdown = block.getField('CHILD_FIELD');
    assert.equal(parentDropdown.getValue(), 'initial');
    assert.equal(childDropdown.getValue(), 'initial1');
    parentDropdown.setValue('invalid');
    assert.equal(parentDropdown.getValue(), 'valid');
    assert.equal(childDropdown.getValue(), 'valid1');
  });

  test('undoing parent change undoes child and grandchild options', function () {
    const block = this.workspace.newBlock('dependent_dropdown_test');
    const parentDropdown = block.getField('PARENT_FIELD');
    const childDropdown = block.getField('CHILD_FIELD');
    const grandchildDropdown = block.getField('GRANDCHILD_FIELD');
    parentDropdown.setValue('b');
    assert.deepEqual(childDropdown.getOptions(true), [
      ['B1', 'b1'],
      ['B2', 'b2'],
      ['Shared', 'shared'],
    ]);
    assert.deepEqual(grandchildDropdown.getOptions(true), [
      ['B11', 'b11'],
      ['B12', 'b12'],
    ]);
    // Wait for the change events to get fired and recorded in history.
    this.clock.runAll();
    this.workspace.undo(false);
    assert.deepEqual(childDropdown.getOptions(true), [
      ['A1', 'a1'],
      ['A2', 'a2'],
      ['Shared', 'shared'],
    ]);
    assert.deepEqual(grandchildDropdown.getOptions(true), [
      ['A11', 'a11'],
      ['A12', 'a12'],
    ]);
  });

  test('undoing parent change undoes child and grandchild values', function () {
    const block = this.workspace.newBlock('dependent_dropdown_test');
    const parentDropdown = block.getField('PARENT_FIELD');
    const childDropdown = block.getField('CHILD_FIELD');
    const grandchildDropdown = block.getField('GRANDCHILD_FIELD');
    parentDropdown.setValue('b');
    assert.equal(childDropdown.getValue(), 'b1');
    assert.equal(grandchildDropdown.getValue(), 'b11');
    // Wait for the change events to get fired and recorded in history.
    this.clock.runAll();
    this.workspace.undo(false);
    assert.equal(childDropdown.getValue(), 'a1');
    assert.equal(grandchildDropdown.getValue(), 'a11');
  });

  test('redoing parent change redoes child options', function () {
    const block = this.workspace.newBlock('dependent_dropdown_test');
    const parentDropdown = block.getField('PARENT_FIELD');
    const childDropdown = block.getField('CHILD_FIELD');
    parentDropdown.setValue('b');
    // Wait for the change events to get fired and recorded in history.
    this.clock.runAll();
    this.workspace.undo(false);
    assert.deepEqual(childDropdown.getOptions(true), [
      ['A1', 'a1'],
      ['A2', 'a2'],
      ['Shared', 'shared'],
    ]);
    this.workspace.undo(true);
    assert.deepEqual(childDropdown.getOptions(true), [
      ['B1', 'b1'],
      ['B2', 'b2'],
      ['Shared', 'shared'],
    ]);
  });

  test('redoing parent change redoes child values', function () {
    const block = this.workspace.newBlock('dependent_dropdown_test');
    const parentDropdown = block.getField('PARENT_FIELD');
    const childDropdown = block.getField('CHILD_FIELD');
    parentDropdown.setValue('b');
    // Wait for the change events to get fired and recorded in history.
    this.clock.runAll();
    this.workspace.undo(false);
    assert.equal(childDropdown.getValue(), 'a1');
    this.workspace.undo(true);
    assert.equal(childDropdown.getValue(), 'b1');
  });

  test('deserialized values affect available options', function () {
    const serializedWorkspace = {
      blocks: {
        blocks: [
          {
            type: 'dependent_dropdown_test',
            fields: {
              PARENT_FIELD: 'b',
              CHILD_FIELD: 'b2',
              GRANDCHILD_FIELD: 'b21',
            },
          },
        ],
      },
    };
    Blockly.serialization.workspaces.load(serializedWorkspace, this.workspace);
    const block = this.workspace.getBlocksByType(
      'dependent_dropdown_test',
      false,
    )[0];
    const childDropdown = block.getField('CHILD_FIELD');
    const grandchildDropdown = block.getField('GRANDCHILD_FIELD');
    assert.deepEqual(childDropdown.getOptions(true), [
      ['B1', 'b1'],
      ['B2', 'b2'],
      ['Shared', 'shared'],
    ]);
    assert.deepEqual(grandchildDropdown.getOptions(true), [
      ['B21', 'b21'],
      ['B22', 'b22'],
    ]);
  });

  test('deserializing preserves values not in default options', function () {
    const serializedWorkspace = {
      blocks: {
        blocks: [
          {
            type: 'dependent_dropdown_test',
            fields: {
              PARENT_FIELD: 'b',
              CHILD_FIELD: 'b2',
              GRANDCHILD_FIELD: 'b21',
            },
          },
        ],
      },
    };
    Blockly.serialization.workspaces.load(serializedWorkspace, this.workspace);
    const block = this.workspace.getBlocksByType(
      'dependent_dropdown_test',
      false,
    )[0];
    const parentDropdown = block.getField('PARENT_FIELD');
    const childDropdown = block.getField('CHILD_FIELD');
    const grandchildDropdown = block.getField('GRANDCHILD_FIELD');
    assert.equal(parentDropdown.getValue(), 'b');
    assert.equal(childDropdown.getValue(), 'b2');
    assert.equal(grandchildDropdown.getValue(), 'b21');
  });

  test('deserializing invalid value replaces with valid value', function () {
    const serializedWorkspace = {
      blocks: {
        blocks: [
          {
            type: 'dependent_dropdown_test',
            fields: {
              PARENT_FIELD: 'b',
              CHILD_FIELD: 'a2',
              GRANDCHILD_FIELD: 'b21',
            },
          },
        ],
      },
    };
    Blockly.serialization.workspaces.load(serializedWorkspace, this.workspace);
    const block = this.workspace.getBlocksByType(
      'dependent_dropdown_test',
      false,
    )[0];
    const childDropdown = block.getField('CHILD_FIELD');
    const grandchildDropdown = block.getField('GRANDCHILD_FIELD');
    assert.equal(childDropdown.getValue(), 'b1');
    assert.equal(grandchildDropdown.getValue(), 'b11');
  });

  test('round trip serialization/deserialization preserves values', function () {
    let block = this.workspace.newBlock('dependent_dropdown_test');
    let parentDropdown = block.getField('PARENT_FIELD');
    let childDropdown = block.getField('CHILD_FIELD');
    let grandchildDropdown = block.getField('GRANDCHILD_FIELD');
    parentDropdown.setValue('b');
    childDropdown.setValue('b2');
    grandchildDropdown.setValue('b21');
    const serializedWorkspace = Blockly.serialization.workspaces.save(
      this.workspace,
    );
    Blockly.serialization.workspaces.load(serializedWorkspace, this.workspace);
    block = this.workspace.getBlocksByType('dependent_dropdown_test', false)[0];
    parentDropdown = block.getField('PARENT_FIELD');
    childDropdown = block.getField('CHILD_FIELD');
    grandchildDropdown = block.getField('GRANDCHILD_FIELD');
    assert.equal(parentDropdown.getValue(), 'b');
    assert.equal(childDropdown.getValue(), 'b2');
    assert.equal(grandchildDropdown.getValue(), 'b21');
  });
});
