/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
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
import {assertVariableValues} from './test_helpers/variables.js';

suite('Variable Map', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
    this.variableMap = this.workspace.getVariableMap();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('createVariable', function () {
    test('Trivial', function () {
      this.variableMap.createVariable('name1', 'type1', 'id1');
      assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
    });

    test('Already exists', function () {
      // Expect that when the variable already exists, the variableMap is unchanged.
      this.variableMap.createVariable('name1', 'type1', 'id1');

      // Assert there is only one variable in the this.variableMap.
      let keys = this.variableMap.getTypes();
      assert.equal(keys.length, 1);
      let varMapLength = this.variableMap.getVariablesOfType(keys[0]).length;
      assert.equal(varMapLength, 1);

      this.variableMap.createVariable('name1', 'type1');
      assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
      // Check that the size of the variableMap did not change.
      keys = this.variableMap.getTypes();
      assert.equal(keys.length, 1);
      varMapLength = this.variableMap.getVariablesOfType(keys[0]).length;
      assert.equal(varMapLength, 1);
    });

    test('Name already exists', function () {
      // Expect that when a variable with the same name but a different type already
      // exists, the new variable is created.
      this.variableMap.createVariable('name1', 'type1', 'id1');

      // Assert there is only one variable in the this.variableMap.
      let keys = this.variableMap.getTypes();
      assert.equal(keys.length, 1);
      const varMapLength = this.variableMap.getVariablesOfType(keys[0]).length;
      assert.equal(varMapLength, 1);

      this.variableMap.createVariable('name1', 'type2', 'id2');
      assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
      assertVariableValues(this.variableMap, 'name1', 'type2', 'id2');
      // Check that the size of the variableMap did change.
      keys = this.variableMap.getTypes();
      assert.equal(keys.length, 2);
    });

    test('Null type', function () {
      this.variableMap.createVariable('name1', null, 'id1');
      assertVariableValues(this.variableMap, 'name1', '', 'id1');
    });

    test('Undefined type', function () {
      this.variableMap.createVariable('name2', undefined, 'id2');
      assertVariableValues(this.variableMap, 'name2', '', 'id2');
    });

    test('Null id', function () {
      createGenUidStubWithReturns('1');
      this.variableMap.createVariable('name1', 'type1', null);
      assertVariableValues(this.variableMap, 'name1', 'type1', '1');
    });

    test('Undefined id', function () {
      createGenUidStubWithReturns('1');
      this.variableMap.createVariable('name1', 'type1', undefined);
      assertVariableValues(this.variableMap, 'name1', 'type1', '1');
    });

    test('Two variables same type', function () {
      this.variableMap.createVariable('name1', 'type1', 'id1');
      this.variableMap.createVariable('name2', 'type1', 'id2');

      assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
      assertVariableValues(this.variableMap, 'name2', 'type1', 'id2');
    });

    test('Two variables same name', function () {
      this.variableMap.createVariable('name1', 'type1', 'id1');
      this.variableMap.createVariable('name1', 'type2', 'id2');

      assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
      assertVariableValues(this.variableMap, 'name1', 'type2', 'id2');
    });

    suite('Error cases', function () {
      test('Id already exists', function () {
        this.variableMap.createVariable('name1', 'type1', 'id1');
        const variableMap = this.variableMap;
        assert.throws(function () {
          variableMap.createVariable('name2', 'type2', 'id1');
        }, /"id1".*in use/);
        assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
      });

      test('Mismatched id', function () {
        this.variableMap.createVariable('name1', 'type1', 'id1');
        const variableMap = this.variableMap;
        assert.throws(function () {
          variableMap.createVariable('name1', 'type1', 'id2');
        }, /"name1".*in use/);
        assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
      });

      test('Mismatched type', function () {
        this.variableMap.createVariable('name1', 'type1', 'id1');
        const variableMap = this.variableMap;
        assert.throws(function () {
          variableMap.createVariable('name1', 'type2', 'id1');
        });
        assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
        assert.isNull(this.variableMap.getVariableById('id2'));
      });
    });
  });

  suite('getVariable', function () {
    test('By name and type', function () {
      const var1 = this.variableMap.createVariable('name1', 'type1', 'id1');
      const var2 = this.variableMap.createVariable('name2', 'type1', 'id2');
      const var3 = this.variableMap.createVariable('name3', 'type2', 'id3');
      const result1 = this.variableMap.getVariable('name1', 'type1');
      const result2 = this.variableMap.getVariable('name2', 'type1');
      const result3 = this.variableMap.getVariable('name3', 'type2');

      // Searching by name + type is correct.
      assert.equal(result1, var1);
      assert.equal(result2, var2);
      assert.equal(result3, var3);

      // Searching only by name defaults to the '' type.
      assert.isNull(this.variableMap.getVariable('name1'));
      assert.isNull(this.variableMap.getVariable('name2'));
      assert.isNull(this.variableMap.getVariable('name3'));
    });

    test('Not found', function () {
      const result = this.variableMap.getVariable('name1');
      assert.isNull(result);
    });
  });

  suite('getVariableById', function () {
    test('Trivial', function () {
      const var1 = this.variableMap.createVariable('name1', 'type1', 'id1');
      const var2 = this.variableMap.createVariable('name2', 'type1', 'id2');
      const var3 = this.variableMap.createVariable('name3', 'type2', 'id3');
      const result1 = this.variableMap.getVariableById('id1');
      const result2 = this.variableMap.getVariableById('id2');
      const result3 = this.variableMap.getVariableById('id3');

      assert.equal(result1, var1);
      assert.equal(result2, var2);
      assert.equal(result3, var3);
    });

    test('Not found', function () {
      const result = this.variableMap.getVariableById('id1');
      assert.isNull(result);
    });
  });

  suite('getVariablesOfType', function () {
    test('Trivial', function () {
      const var1 = this.variableMap.createVariable('name1', 'type1', 'id1');
      const var2 = this.variableMap.createVariable('name2', 'type1', 'id2');
      this.variableMap.createVariable('name3', 'type2', 'id3');
      this.variableMap.createVariable('name4', 'type3', 'id4');
      const resultArray1 = this.variableMap.getVariablesOfType('type1');
      const resultArray2 = this.variableMap.getVariablesOfType('type5');
      assert.deepEqual(resultArray1, [var1, var2]);
      assert.deepEqual(resultArray2, []);
    });

    test('Null', function () {
      const var1 = this.variableMap.createVariable('name1', '', 'id1');
      const var2 = this.variableMap.createVariable('name2', '', 'id2');
      const var3 = this.variableMap.createVariable('name3', '', 'id3');
      this.variableMap.createVariable('name4', 'type1', 'id4');
      const resultArray = this.variableMap.getVariablesOfType(null);
      assert.deepEqual(resultArray, [var1, var2, var3]);
    });

    test('Empty string', function () {
      const var1 = this.variableMap.createVariable('name1', null, 'id1');
      const var2 = this.variableMap.createVariable('name2', null, 'id2');
      const resultArray = this.variableMap.getVariablesOfType('');
      assert.deepEqual(resultArray, [var1, var2]);
    });

    test('Deleted', function () {
      const variable = this.variableMap.createVariable('name1', null, 'id1');
      this.variableMap.deleteVariable(variable);
      const resultArray = this.variableMap.getVariablesOfType('');
      assert.deepEqual(resultArray, []);
    });

    test('Does not exist', function () {
      const resultArray = this.variableMap.getVariablesOfType('type1');
      assert.deepEqual(resultArray, []);
    });
  });

  suite(
    'Using changeVariableType to change the type of a variable',
    function () {
      test('updates it to a new non-empty value', function () {
        const variable = this.variableMap.createVariable(
          'name1',
          'type1',
          'id1',
        );
        this.variableMap.changeVariableType(variable, 'type2');
        const oldTypeVariables = this.variableMap.getVariablesOfType('type1');
        const newTypeVariables = this.variableMap.getVariablesOfType('type2');
        assert.deepEqual(oldTypeVariables, []);
        assert.deepEqual(newTypeVariables, [variable]);
        assert.equal(variable.getType(), 'type2');
      });

      test('updates it to a new empty value', function () {
        const variable = this.variableMap.createVariable(
          'name1',
          'type1',
          'id1',
        );
        this.variableMap.changeVariableType(variable, '');
        const oldTypeVariables = this.variableMap.getVariablesOfType('type1');
        const newTypeVariables = this.variableMap.getVariablesOfType('');
        assert.deepEqual(oldTypeVariables, []);
        assert.deepEqual(newTypeVariables, [variable]);
        assert.equal(variable.getType(), '');
      });

      test('removes the type from the map when the last instance is changed', function () {
        const var1 = this.variableMap.createVariable('name1', 'type1');
        const var2 = this.variableMap.createVariable('name2', 'type2');
        this.variableMap.changeVariableType(var1, 'type2');
        assert.deepEqual(this.variableMap.getTypes(), ['type2']);
      });
    },
  );

  suite('addVariable', function () {
    test('normally', function () {
      const variable = new Blockly.VariableModel(this.workspace, 'foo', 'int');
      assert.isNull(this.variableMap.getVariableById(variable.getId()));
      this.variableMap.addVariable(variable);
      assert.equal(
        this.variableMap.getVariableById(variable.getId()),
        variable,
      );
    });
  });

  suite('getTypes', function () {
    test('when map is empty', function () {
      const types = this.variableMap.getTypes();
      assert.deepEqual(types, []);
    });

    test('with various types', function () {
      this.variableMap.createVariable('name1', 'type1', 'id1');
      this.variableMap.createVariable('name2', '', 'id2');
      const types = this.variableMap.getTypes();
      assert.deepEqual(types, ['type1', '']);
    });
  });

  suite('getAllVariables', function () {
    test('Trivial', function () {
      const var1 = this.variableMap.createVariable('name1', 'type1', 'id1');
      const var2 = this.variableMap.createVariable('name2', 'type1', 'id2');
      const var3 = this.variableMap.createVariable('name3', 'type2', 'id3');
      const resultArray = this.variableMap.getAllVariables();
      assert.deepEqual(resultArray, [var1, var2, var3]);
    });

    test('None', function () {
      const resultArray = this.variableMap.getAllVariables();
      assert.deepEqual(resultArray, []);
    });
  });

  suite('event firing', function () {
    setup(function () {
      this.eventSpy = createChangeListenerSpy(this.workspace);
    });

    teardown(function () {
      this.workspace.removeChangeListener(this.eventSpy);
    });

    suite('variable create events', function () {
      test('create events are fired when a variable is created', function () {
        this.variableMap.createVariable('test name', 'test type', 'test id');

        assertEventFired(
          this.eventSpy,
          Blockly.Events.VarCreate,
          {
            varType: 'test type',
            varName: 'test name',
            varId: 'test id',
          },
          this.workspace.id,
        );
      });

      test('create events are not fired if a variable is already exists', function () {
        this.variableMap.createVariable('test name', 'test type', 'test id');

        this.eventSpy.resetHistory();
        this.variableMap.createVariable('test name', 'test type', 'test id');

        assertEventNotFired(
          this.eventSpy,
          Blockly.Events.VarCreate,
          {},
          this.workspace.id,
        );
      });
    });

    suite('variable delete events', function () {
      suite('deleting with a variable', function () {
        test('delete events are fired when a variable is deleted', function () {
          const variable = this.variableMap.createVariable(
            'test name',
            'test type',
            'test id',
          );
          this.variableMap.deleteVariable(variable);

          assertEventFired(
            this.eventSpy,
            Blockly.Events.VarDelete,
            {
              varType: 'test type',
              varName: 'test name',
              varId: 'test id',
            },
            this.workspace.id,
          );
        });

        test('delete events are not fired when a variable does not exist', function () {
          const variable = new Blockly.VariableModel(
            this.workspace,
            'test name',
            'test type',
            'test id',
          );
          this.variableMap.deleteVariable(variable);

          assertEventNotFired(
            this.eventSpy,
            Blockly.Events.VarDelete,
            {},
            this.workspace.id,
          );
        });
      });

      suite('deleting by ID', function () {
        test('delete events are fired when a variable is deleted', function () {
          this.variableMap.createVariable('test name', 'test type', 'test id');
          this.variableMap.deleteVariableById('test id');

          assertEventFired(
            this.eventSpy,
            Blockly.Events.VarDelete,
            {
              varType: 'test type',
              varName: 'test name',
              varId: 'test id',
            },
            this.workspace.id,
          );
        });

        test('delete events are not fired when a variable does not exist', function () {
          this.variableMap.deleteVariableById('test id');

          assertEventNotFired(
            this.eventSpy,
            Blockly.Events.VarDelete,
            {},
            this.workspace.id,
          );
        });
      });
    });

    suite('variable rename events', function () {
      suite('renaming with variable', function () {
        test('rename events are fired when a variable is renamed', function () {
          const variable = this.variableMap.createVariable(
            'test name',
            'test type',
            'test id',
          );
          this.variableMap.renameVariable(variable, 'new test name');

          assertEventFired(
            this.eventSpy,
            Blockly.Events.VarRename,
            {
              oldName: 'test name',
              newName: 'new test name',
              varId: 'test id',
            },
            this.workspace.id,
          );
        });

        test('rename events are not fired if the variable name already matches', function () {
          const variable = this.variableMap.createVariable(
            'test name',
            'test type',
            'test id',
          );
          this.variableMap.renameVariable(variable, 'test name');

          assertEventNotFired(
            this.eventSpy,
            Blockly.Events.VarRename,
            {},
            this.workspace.id,
          );
        });

        test('rename events are not fired if the variable does not exist', function () {
          const variable = new Blockly.VariableModel(
            'test name',
            'test type',
            'test id',
          );
          this.variableMap.renameVariable(variable, 'test name');

          assertEventNotFired(
            this.eventSpy,
            Blockly.Events.VarRename,
            {},
            this.workspace.id,
          );
        });
      });

      suite('renaming by ID', function () {
        test('rename events are fired when a variable is renamed', function () {
          this.variableMap.createVariable('test name', 'test type', 'test id');
          this.variableMap.renameVariableById('test id', 'new test name');

          assertEventFired(
            this.eventSpy,
            Blockly.Events.VarRename,
            {
              oldName: 'test name',
              newName: 'new test name',
              varId: 'test id',
            },
            this.workspace.id,
          );
        });

        test('rename events are not fired if the variable name already matches', function () {
          this.variableMap.createVariable('test name', 'test type', 'test id');
          this.variableMap.renameVariableById('test id', 'test name');

          assertEventNotFired(
            this.eventSpy,
            Blockly.Events.VarRename,
            {},
            this.workspace.id,
          );
        });

        test('renaming throws if the variable does not exist', function () {
          // Not sure why this throws when the other one doesn't but might
          // as well test it.
          assert.throws(() => {
            this.variableMap.renameVariableById('test id', 'test name');
          }, `Tried to rename a variable that didn't exist`);
        });
      });
    });

    suite('variable type change events', function () {
      test('are fired when a variable has its type changed', function () {
        const variable = this.variableMap.createVariable(
          'name1',
          'type1',
          'id1',
        );
        this.variableMap.changeVariableType(variable, 'type2');
        assertEventFired(
          this.eventSpy,
          Blockly.Events.VarTypeChange,
          {
            oldType: 'type1',
            newType: 'type2',
            varId: 'id1',
          },
          this.workspace.id,
        );
      });
    });
  });
});
