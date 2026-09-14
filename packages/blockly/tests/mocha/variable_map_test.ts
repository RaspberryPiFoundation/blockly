/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import type sinon from 'sinon';
import {
  assertEventFired,
  assertEventNotFired,
  createChangeListenerSpy,
} from './test_helpers/events.js';
import {
  createGenUidStubWithReturns,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';
import {assertVariableValues} from './test_helpers/variables.ts';

suite('Variable Map', function () {
  let workspace: Blockly.Workspace;
  let variableMap: Blockly.IVariableMap<
    Blockly.IVariableModel<Blockly.IVariableState>
  >;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    workspace = new Blockly.Workspace();
    variableMap = workspace.getVariableMap();
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  suite('createVariable', function () {
    test('Trivial', function () {
      variableMap.createVariable('name1', 'type1', 'id1');
      assertVariableValues(variableMap, 'name1', 'type1', 'id1');
    });

    test('Already exists', function () {
      // Expect that when the variable already exists, the variableMap is unchanged.
      variableMap.createVariable('name1', 'type1', 'id1');

      // Assert there is only one variable in the variableMap.
      let keys = variableMap.getTypes();
      assert.equal(keys.length, 1);
      let varMapLength = workspace
        .getVariableMap()
        .getVariablesOfType(keys[0]).length;
      assert.equal(varMapLength, 1);

      variableMap.createVariable('name1', 'type1');
      assertVariableValues(variableMap, 'name1', 'type1', 'id1');
      // Check that the size of the variableMap did not change.
      keys = variableMap.getTypes();
      assert.equal(keys.length, 1);
      varMapLength = workspace
        .getVariableMap()
        .getVariablesOfType(keys[0]).length;
      assert.equal(varMapLength, 1);
    });

    test('Name already exists', function () {
      // Expect that when a variable with the same name but a different type already
      // exists, the new variable is created.
      variableMap.createVariable('name1', 'type1', 'id1');

      // Assert there is only one variable in the variableMap.
      let keys = variableMap.getTypes();
      assert.equal(keys.length, 1);
      const varMapLength = workspace
        .getVariableMap()
        .getVariablesOfType(keys[0]).length;
      assert.equal(varMapLength, 1);

      variableMap.createVariable('name1', 'type2', 'id2');
      assertVariableValues(variableMap, 'name1', 'type1', 'id1');
      assertVariableValues(variableMap, 'name1', 'type2', 'id2');
      // Check that the size of the variableMap did change.
      keys = variableMap.getTypes();
      assert.equal(keys.length, 2);
    });

    test('Undefined type', function () {
      variableMap.createVariable('name2', undefined, 'id2');
      assertVariableValues(variableMap, 'name2', '', 'id2');
    });

    test('Undefined id', function () {
      createGenUidStubWithReturns('1');
      variableMap.createVariable('name1', 'type1', undefined);
      assertVariableValues(variableMap, 'name1', 'type1', '1');
    });

    test('Two variables same type', function () {
      variableMap.createVariable('name1', 'type1', 'id1');
      variableMap.createVariable('name2', 'type1', 'id2');

      assertVariableValues(variableMap, 'name1', 'type1', 'id1');
      assertVariableValues(variableMap, 'name2', 'type1', 'id2');
    });

    test('Two variables same name', function () {
      variableMap.createVariable('name1', 'type1', 'id1');
      variableMap.createVariable('name1', 'type2', 'id2');

      assertVariableValues(variableMap, 'name1', 'type1', 'id1');
      assertVariableValues(variableMap, 'name1', 'type2', 'id2');
    });

    suite('Error cases', function () {
      test('Id already exists', function () {
        variableMap.createVariable('name1', 'type1', 'id1');
        assert.throws(function () {
          variableMap.createVariable('name2', 'type2', 'id1');
        }, /"id1".*in use/);
        assertVariableValues(variableMap, 'name1', 'type1', 'id1');
      });

      test('Mismatched id', function () {
        variableMap.createVariable('name1', 'type1', 'id1');
        assert.throws(function () {
          variableMap.createVariable('name1', 'type1', 'id2');
        }, /"name1".*in use/);
        assertVariableValues(variableMap, 'name1', 'type1', 'id1');
      });

      test('Mismatched type', function () {
        variableMap.createVariable('name1', 'type1', 'id1');
        assert.throws(function () {
          variableMap.createVariable('name1', 'type2', 'id1');
        });
        assertVariableValues(variableMap, 'name1', 'type1', 'id1');
        assert.isNull(variableMap.getVariableById('id2'));
      });
    });
  });

  suite('getVariable', function () {
    test('By name and type', function () {
      const var1 = workspace
        .getVariableMap()
        .createVariable('name1', 'type1', 'id1');
      const var2 = workspace
        .getVariableMap()
        .createVariable('name2', 'type1', 'id2');
      const var3 = workspace
        .getVariableMap()
        .createVariable('name3', 'type2', 'id3');
      const result1 = variableMap.getVariable('name1', 'type1');
      const result2 = variableMap.getVariable('name2', 'type1');
      const result3 = variableMap.getVariable('name3', 'type2');

      // Searching by name + type is correct.
      assert.equal(result1, var1);
      assert.equal(result2, var2);
      assert.equal(result3, var3);

      // Searching only by name defaults to the '' type.
      assert.isNull(variableMap.getVariable('name1'));
      assert.isNull(variableMap.getVariable('name2'));
      assert.isNull(variableMap.getVariable('name3'));
    });

    test('Not found', function () {
      const result = variableMap.getVariable('name1');
      assert.isNull(result);
    });
  });

  suite('getVariableById', function () {
    test('Trivial', function () {
      const var1 = workspace
        .getVariableMap()
        .createVariable('name1', 'type1', 'id1');
      const var2 = workspace
        .getVariableMap()
        .createVariable('name2', 'type1', 'id2');
      const var3 = workspace
        .getVariableMap()
        .createVariable('name3', 'type2', 'id3');
      const result1 = variableMap.getVariableById('id1');
      const result2 = variableMap.getVariableById('id2');
      const result3 = variableMap.getVariableById('id3');

      assert.equal(result1, var1);
      assert.equal(result2, var2);
      assert.equal(result3, var3);
    });

    test('Not found', function () {
      const result = variableMap.getVariableById('id1');
      assert.isNull(result);
    });
  });

  suite('getVariablesOfType', function () {
    test('Trivial', function () {
      const var1 = workspace
        .getVariableMap()
        .createVariable('name1', 'type1', 'id1');
      const var2 = workspace
        .getVariableMap()
        .createVariable('name2', 'type1', 'id2');
      variableMap.createVariable('name3', 'type2', 'id3');
      variableMap.createVariable('name4', 'type3', 'id4');
      const resultArray1 = workspace
        .getVariableMap()
        .getVariablesOfType('type1');
      const resultArray2 = workspace
        .getVariableMap()
        .getVariablesOfType('type5');
      assert.deepEqual(resultArray1, [var1, var2]);
      assert.deepEqual(resultArray2, []);
    });

    test('Empty string', function () {
      const var1 = workspace
        .getVariableMap()
        .createVariable('name1', '', 'id1');
      const var2 = workspace
        .getVariableMap()
        .createVariable('name2', '', 'id2');
      const var3 = workspace
        .getVariableMap()
        .createVariable('name3', '', 'id3');
      variableMap.createVariable('name4', 'type1', 'id4');
      const resultArray = variableMap.getVariablesOfType('');
      assert.deepEqual(resultArray, [var1, var2, var3]);
    });

    test('Undefined', function () {
      const var1 = workspace
        .getVariableMap()
        .createVariable('name1', undefined, 'id1');
      const var2 = workspace
        .getVariableMap()
        .createVariable('name2', undefined, 'id2');
      const resultArray = variableMap.getVariablesOfType('');
      assert.deepEqual(resultArray, [var1, var2]);
    });

    test('Deleted', function () {
      const variable = workspace
        .getVariableMap()
        .createVariable('name1', undefined, 'id1');
      variableMap.deleteVariable(variable);
      const resultArray = variableMap.getVariablesOfType('');
      assert.deepEqual(resultArray, []);
    });

    test('Does not exist', function () {
      const resultArray = workspace
        .getVariableMap()
        .getVariablesOfType('type1');
      assert.deepEqual(resultArray, []);
    });
  });

  suite(
    'Using changeVariableType to change the type of a variable',
    function () {
      test('updates it to a new non-empty value', function () {
        const variable = workspace
          .getVariableMap()
          .createVariable('name1', 'type1', 'id1');
        variableMap.changeVariableType(variable, 'type2');
        const oldTypeVariables = workspace
          .getVariableMap()
          .getVariablesOfType('type1');
        const newTypeVariables = workspace
          .getVariableMap()
          .getVariablesOfType('type2');
        assert.deepEqual(oldTypeVariables, []);
        assert.deepEqual(newTypeVariables, [variable]);
        assert.equal(variable.getType(), 'type2');
      });

      test('updates it to a new empty value', function () {
        const variable = workspace
          .getVariableMap()
          .createVariable('name1', 'type1', 'id1');
        variableMap.changeVariableType(variable, '');
        const oldTypeVariables = workspace
          .getVariableMap()
          .getVariablesOfType('type1');
        const newTypeVariables = workspace
          .getVariableMap()
          .getVariablesOfType('');
        assert.deepEqual(oldTypeVariables, []);
        assert.deepEqual(newTypeVariables, [variable]);
        assert.equal(variable.getType(), '');
      });

      test('removes the type from the map when the last instance is changed', function () {
        const var1 = workspace
          .getVariableMap()
          .createVariable('name1', 'type1');
        workspace.getVariableMap().createVariable('name2', 'type2');
        variableMap.changeVariableType(var1, 'type2');
        assert.deepEqual(variableMap.getTypes(), ['type2']);
      });
    },
  );

  suite('addVariable', function () {
    test('normally', function () {
      const variable = new Blockly.VariableModel(workspace, 'foo', 'int');
      assert.isNull(variableMap.getVariableById(variable.getId()));
      variableMap.addVariable(variable);
      assert.equal(variableMap.getVariableById(variable.getId()), variable);
    });
  });

  suite('getTypes', function () {
    test('when map is empty', function () {
      const types = variableMap.getTypes();
      assert.deepEqual(types, []);
    });

    test('with various types', function () {
      variableMap.createVariable('name1', 'type1', 'id1');
      variableMap.createVariable('name2', '', 'id2');
      const types = variableMap.getTypes();
      assert.deepEqual(types, ['type1', '']);
    });
  });

  suite('getAllVariables', function () {
    test('Trivial', function () {
      const var1 = workspace
        .getVariableMap()
        .createVariable('name1', 'type1', 'id1');
      const var2 = workspace
        .getVariableMap()
        .createVariable('name2', 'type1', 'id2');
      const var3 = workspace
        .getVariableMap()
        .createVariable('name3', 'type2', 'id3');
      const resultArray = variableMap.getAllVariables();
      assert.deepEqual(resultArray, [var1, var2, var3]);
    });

    test('None', function () {
      const resultArray = variableMap.getAllVariables();
      assert.deepEqual(resultArray, []);
    });
  });

  suite('event firing', function () {
    let eventSpy: sinon.SinonSpy;
    setup(function () {
      eventSpy = createChangeListenerSpy(workspace);
    });

    teardown(function () {
      workspace.removeChangeListener(eventSpy);
    });

    suite('variable create events', function () {
      test('create events are fired when a variable is created', function () {
        workspace
          .getVariableMap()
          .createVariable('test name', 'test type', 'test id');

        assertEventFired(
          eventSpy,
          Blockly.Events.VarCreate,
          {
            varType: 'test type',
            varName: 'test name',
            varId: 'test id',
          },
          workspace.id,
        );
      });

      test('create events are not fired if a variable is already exists', function () {
        workspace
          .getVariableMap()
          .createVariable('test name', 'test type', 'test id');

        eventSpy.resetHistory();
        workspace
          .getVariableMap()
          .createVariable('test name', 'test type', 'test id');

        assertEventNotFired(
          eventSpy,
          Blockly.Events.VarCreate,
          {},
          workspace.id,
        );
      });
    });

    suite('variable delete events', function () {
      suite('deleting with a variable', function () {
        test('delete events are fired when a variable is deleted', function () {
          const variable = workspace
            .getVariableMap()
            .createVariable('test name', 'test type', 'test id');
          variableMap.deleteVariable(variable);

          assertEventFired(
            eventSpy,
            Blockly.Events.VarDelete,
            {
              varType: 'test type',
              varName: 'test name',
              varId: 'test id',
            },
            workspace.id,
          );
        });

        test('delete events are not fired when a variable does not exist', function () {
          const variable = new Blockly.VariableModel(
            workspace,
            'test name',
            'test type',
            'test id',
          );
          variableMap.deleteVariable(variable);

          assertEventNotFired(
            eventSpy,
            Blockly.Events.VarDelete,
            {},
            workspace.id,
          );
        });
      });
    });

    suite('variable rename events', function () {
      suite('renaming with variable', function () {
        test('rename events are fired when a variable is renamed', function () {
          const variable = workspace
            .getVariableMap()
            .createVariable('test name', 'test type', 'test id');
          variableMap.renameVariable(variable, 'new test name');

          assertEventFired(
            eventSpy,
            Blockly.Events.VarRename,
            {
              oldName: 'test name',
              newName: 'new test name',
              varId: 'test id',
            },
            workspace.id,
          );
        });

        test('rename events are not fired if the variable name already matches', function () {
          const variable = workspace
            .getVariableMap()
            .createVariable('test name', 'test type', 'test id');
          variableMap.renameVariable(variable, 'test name');

          assertEventNotFired(
            eventSpy,
            Blockly.Events.VarRename,
            {},
            workspace.id,
          );
        });

        test('rename events are not fired if the variable does not exist', function () {
          const variable = new Blockly.VariableModel(
            workspace,
            'test name',
            'test type',
            'test id',
          );
          variableMap.renameVariable(variable, 'test name');

          assertEventNotFired(
            eventSpy,
            Blockly.Events.VarRename,
            {},
            workspace.id,
          );
        });
      });
    });

    suite('variable type change events', function () {
      test('are fired when a variable has its type changed', function () {
        const variable = workspace
          .getVariableMap()
          .createVariable('name1', 'type1', 'id1');
        variableMap.changeVariableType(variable, 'type2');
        assertEventFired(
          eventSpy,
          Blockly.Events.VarTypeChange,
          {
            oldType: 'type1',
            newType: 'type2',
            varId: 'id1',
          },
          workspace.id,
        );
      });
    });
  });
});
