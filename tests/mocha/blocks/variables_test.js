/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {nameUsedWithConflictingParam} from '../../../build/src/core/variables.js';
import {assert} from '../../../node_modules/chai/index.js';
import {
  MockParameterModelWithVar,
  MockProcedureModel,
} from '../test_helpers/procedures.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from '../test_helpers/setup_teardown.js';

suite('Variables', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'get_var_block',
        'message0': '%1',
        'args0': [
          {
            'type': 'field_variable',
            'name': 'VAR',
            'variableTypes': ['', 'type1', 'type2'],
          },
        ],
      },
    ]);
    this.variableMap = this.workspace.getVariableMap();
    this.variableMap.createVariable('foo', 'type1', '1');
    this.variableMap.createVariable('bar', 'type1', '2');
    this.variableMap.createVariable('baz', 'type1', '3');
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  /**
   * Create a test get_var_block.
   * Will fail if get_var_block isn't defined.
   * @param {!Blockly.Workspace} workspace The workspace on which to create the
   *     block.
   * @param {!string} variableId The id of the variable to reference.
   * @return {!Blockly.Block} The created block.
   */
  function createTestVarBlock(workspace, variableId) {
    // Turn off events to avoid testing XML at the same time.
    Blockly.Events.disable();
    const block = new Blockly.Block(workspace, 'get_var_block');
    block.inputList[0].fieldRow[0].setValue(variableId);
    Blockly.Events.enable();
    return block;
  }

  suite('allUsedVarModels', function () {
    test('All used', function () {
      createTestVarBlock(this.workspace, '1');
      createTestVarBlock(this.workspace, '2');
      createTestVarBlock(this.workspace, '3');

      const result = Blockly.Variables.allUsedVarModels(this.workspace);
      assert.equal(
        result.length,
        3,
        'Expected three variables in the list of used variables',
      );
    });

    test('Some unused', function () {
      createTestVarBlock(this.workspace, '2');

      const result = Blockly.Variables.allUsedVarModels(this.workspace);
      assert.equal(
        result.length,
        1,
        'Expected one variable in the list of used variables',
      );
      assert.equal(
        result[0].getId(),
        '2',
        'Expected variable with ID 2 in the list of used variables',
      );
    });

    test('Var used twice', function () {
      createTestVarBlock(this.workspace, '2');
      createTestVarBlock(this.workspace, '2');

      const result = Blockly.Variables.allUsedVarModels(this.workspace);
      // Using the same variable multiple times should not change the number of
      // elements in the list.
      assert.equal(
        result.length,
        1,
        'Expected one variable in the list of used variables',
      );
      assert.equal(
        result[0].getId(),
        '2',
        'Expected variable with ID 2 in the list of used variables',
      );
    });

    test('All unused', function () {
      const result = Blockly.Variables.allUsedVarModels(this.workspace);
      assert.equal(
        result.length,
        0,
        'Expected no variables in the list of used variables',
      );
    });
  });
  suite('getVariable', function () {
    test('By ID', function () {
      const var1 = this.variableMap.createVariable('name1', 'type1', 'id1');
      const var2 = this.variableMap.createVariable('name2', 'type1', 'id2');
      const var3 = this.variableMap.createVariable('name3', 'type2', 'id3');
      const result1 = Blockly.Variables.getVariable(this.workspace, 'id1');
      const result2 = Blockly.Variables.getVariable(this.workspace, 'id2');
      const result3 = Blockly.Variables.getVariable(this.workspace, 'id3');

      assert.equal(var1, result1);
      assert.equal(var2, result2);
      assert.equal(var3, result3);
    });

    test('By name and type', function () {
      const var1 = this.variableMap.createVariable('name1', 'type1', 'id1');
      const var2 = this.variableMap.createVariable('name2', 'type1', 'id2');
      const var3 = this.variableMap.createVariable('name3', 'type2', 'id3');
      const result1 = Blockly.Variables.getVariable(
        this.workspace,
        null,
        'name1',
        'type1',
      );
      const result2 = Blockly.Variables.getVariable(
        this.workspace,
        null,
        'name2',
        'type1',
      );
      const result3 = Blockly.Variables.getVariable(
        this.workspace,
        null,
        'name3',
        'type2',
      );

      // Searching by name + type is correct.
      assert.equal(var1, result1);
      assert.equal(var2, result2);
      assert.equal(var3, result3);
    });

    test('Bad ID with name and type fallback', function () {
      const var1 = this.variableMap.createVariable('name1', 'type1', 'id1');
      const var2 = this.variableMap.createVariable('name2', 'type1', 'id2');
      const var3 = this.variableMap.createVariable('name3', 'type2', 'id3');
      const result1 = Blockly.Variables.getVariable(
        this.workspace,
        'badId',
        'name1',
        'type1',
      );
      const result2 = Blockly.Variables.getVariable(
        this.workspace,
        'badId',
        'name2',
        'type1',
      );
      const result3 = Blockly.Variables.getVariable(
        this.workspace,
        'badId',
        'name3',
        'type2',
      );

      // Searching by ID failed, but falling back onto name + type is correct.
      assert.equal(var1, result1);
      assert.equal(var2, result2);
      assert.equal(var3, result3);
    });
  });

  suite('renaming variables creating conflicts', function () {
    suite('renaming variables creating parameter conflicts', function () {
      test('conflicts within legacy procedure blocks return the procedure name', function () {
        Blockly.serialization.blocks.append(
          {
            'type': 'procedures_defnoreturn',
            'extraState': {
              'params': [
                {
                  'name': 'x',
                  'id': '6l3P%Y!9EgA(Nh{E`Tl,',
                },
                {
                  'name': 'y',
                  'id': 'l1EtlJe%z_M[O-@uPAQ8',
                },
              ],
            },
            'fields': {
              'NAME': 'test name',
            },
          },
          this.workspace,
        );

        assert.equal(
          'test name',
          nameUsedWithConflictingParam('x', 'y', this.workspace),
          'Expected the name of the procedure with the conflicting ' +
            'param to be returned',
        );
      });

      test(
        'if no legacy block has the old var name, no procedure ' +
          'name is returned',
        function () {
          Blockly.serialization.blocks.append(
            {
              'type': 'procedures_defnoreturn',
              'extraState': {
                'params': [
                  {
                    'name': 'definitely not x',
                    'id': '6l3P%Y!9EgA(Nh{E`Tl,',
                  },
                  {
                    'name': 'y',
                    'id': 'l1EtlJe%z_M[O-@uPAQ8',
                  },
                ],
              },
              'fields': {
                'NAME': 'test name',
              },
            },
            this.workspace,
          );

          assert.isNull(
            nameUsedWithConflictingParam('x', 'y', this.workspace),
            'Expected there to be no conflict',
          );
        },
      );

      test('conflicts within procedure models return the procedure name', function () {
        this.workspace
          .getProcedureMap()
          .add(
            new MockProcedureModel('test name')
              .insertParameter(
                new MockParameterModelWithVar('x', this.workspace),
                0,
              )
              .insertParameter(
                new MockParameterModelWithVar('y', this.workspace),
                0,
              ),
          );

        assert.equal(
          'test name',
          nameUsedWithConflictingParam('x', 'y', this.workspace),
          'Expected the name of the procedure with the conflicting ' +
            'param to be returned',
        );
      });

      test(
        'if no procedure model has the old var, no procedure ' +
          'name is returned',
        function () {
          this.workspace
            .getProcedureMap()
            .add(
              new MockProcedureModel('test name')
                .insertParameter(
                  new MockParameterModelWithVar(
                    'definitely not x',
                    this.workspace,
                  ),
                  0,
                )
                .insertParameter(
                  new MockParameterModelWithVar('y', this.workspace),
                  0,
                ),
            );

          assert.isNull(
            nameUsedWithConflictingParam('x', 'y', this.workspace),
            'Expected there to be no conflict',
          );
        },
      );
    });
  });
});
