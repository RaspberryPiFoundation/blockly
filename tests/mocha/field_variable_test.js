/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  createTestBlock,
  defineRowBlock,
} from './test_helpers/block_definitions.js';
import {
  assertFieldValue,
  runConstructorSuiteTests,
  runFromJsonSuiteTests,
  runSetValueTests,
} from './test_helpers/fields.js';
import {
  createGenUidStubWithReturns,
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

suite('Variable Fields', function () {
  const FAKE_VARIABLE_NAME = 'default_name';
  const FAKE_ID = 'id1';
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
    // Stub for default variable name.
    sinon
      .stub(Blockly.Variables.TEST_ONLY, 'generateUniqueNameInternal')
      .returns(FAKE_VARIABLE_NAME);
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });
  /**
   * Configuration for field creation tests with invalid values.
   * @type {!Array<!FieldCreationTestCase>}
   */
  const invalidValueCreationTestCases = [
    {title: 'Undefined', value: undefined, args: [undefined]},
    {title: 'Null', value: null, args: [null]},
    {title: 'Boolean true', value: true, args: [true]},
    {title: 'Boolean false', value: false, args: [false]},
    {title: 'Number (Truthy)', value: 1, args: [1]},
    {title: 'Number (Falsy)', value: 0, args: [0]},
    {title: 'NaN', value: NaN, args: [NaN]},
  ];
  /**
   * Configuration for field creation tests with valid values.
   * @type {!Array<!FieldCreationTestCase>}
   */
  const validValueCreationTestCases = [
    {
      title: 'String',
      value: 'id2',
      args: ['name2'],
      expectedValue: 'id2',
      expectedText: 'name2',
    },
  ];
  const addJson = function (testCase) {
    testCase.json = {'variable': testCase.args[0]};
  };
  invalidValueCreationTestCases.forEach(addJson);
  validValueCreationTestCases.forEach(addJson);

  const initVariableField = (workspace, fieldVariable) => {
    const mockBlock = createTestBlock();
    mockBlock.workspace = workspace;
    fieldVariable.setSourceBlock(mockBlock);

    // No view to initialize, but still need to init the model.
    const genUidStub = createGenUidStubWithReturns(FAKE_ID);
    fieldVariable.initModel();
    genUidStub.restore();

    return fieldVariable;
  };
  const customCreateWithJs = function (testCase) {
    const fieldVariable = testCase
      ? new Blockly.FieldVariable(...testCase.args)
      : new Blockly.FieldVariable();
    return initVariableField(this.workspace, fieldVariable);
  };
  const customCreateWithJson = function (testCase) {
    const fieldVariable = testCase
      ? Blockly.FieldVariable.fromJson(testCase.json)
      : Blockly.FieldVariable.fromJson({});
    return initVariableField(this.workspace, fieldVariable);
  };

  /**
   * The expected default name for the field being tested.
   * @type {*}
   */
  const defaultFieldName = FAKE_VARIABLE_NAME;
  /**
   * Asserts that the field property values are set to default.
   * @param {!Blockly.FieldVariable} field The field to check.
   */
  const assertFieldDefault = function (field) {
    assertFieldValue(field, FAKE_ID, defaultFieldName);
  };
  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {!Blockly.FieldVariable} field The field to check.
   * @param {!FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    assertFieldValue(field, FAKE_ID, testCase.expectedText);
  };

  runConstructorSuiteTests(
    Blockly.FieldVariable,
    validValueCreationTestCases,
    invalidValueCreationTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
    customCreateWithJs,
  );

  runFromJsonSuiteTests(
    Blockly.FieldVariable,
    validValueCreationTestCases,
    invalidValueCreationTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
    customCreateWithJson,
  );

  suite('initModel', function () {
    test('No Value Before InitModel', function () {
      const fieldVariable = new Blockly.FieldVariable('name1');
      assert.equal(fieldVariable.getText(), '');
      assert.isNull(fieldVariable.getValue());
    });
  });

  /**
   * Configuration for field tests with invalid values.
   * @type {!Array<!FieldCreationTestCase>}
   */
  const invalidValueTestCases = [
    ...invalidValueCreationTestCases,
    {
      title: 'Variable does not exist',
      value: 'id3',
      args: ['name2'],
      expectedValue: 'id2',
      expectedText: 'name2',
    },
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {!Array<!FieldCreationTestCase>}
   */
  const validValueTestCases = [
    {
      title: 'New variable ID',
      value: 'id2',
      args: ['name2'],
      expectedValue: 'id2',
      expectedText: 'name2',
    },
  ];

  suite('setValue', function () {
    setup(function () {
      this.workspace.createVariable('name2', null, 'id2');
      this.field = new Blockly.FieldVariable(null);
      initVariableField(this.workspace, this.field);

      // Invalid value test are expected to log errors.
      const nativeConsoleWarn = console.warn;
      this.nativeConsoleWarn = nativeConsoleWarn;
      console.warn = function (msg) {
        if (!msg.includes("Variable id doesn't point to a real variable")) {
          nativeConsoleWarn.call(this, ...arguments);
        }
      };
    });
    teardown(function () {
      console.warn = this.nativeConsoleWarn;
    });
    runSetValueTests(
      validValueTestCases,
      invalidValueTestCases,
      FAKE_ID,
      defaultFieldName,
    );
  });

  suite('Dropdown options', function () {
    const assertDropdownContents = (fieldVariable, expectedVarOptions) => {
      const dropdownOptions =
        Blockly.FieldVariable.dropdownCreate.call(fieldVariable);
      // Expect variable options, a rename option, and a delete option.
      assert.lengthOf(dropdownOptions, expectedVarOptions.length + 2);
      for (let i = 0, option; (option = expectedVarOptions[i]); i++) {
        assert.deepEqual(dropdownOptions[i], option);
      }
      assert.include(dropdownOptions[dropdownOptions.length - 2][0], 'Rename');

      assert.include(dropdownOptions[dropdownOptions.length - 1][0], 'Delete');
    };
    test('Contains variables created before field', function () {
      this.workspace.createVariable('name1', '', 'id1');
      this.workspace.createVariable('name2', '', 'id2');
      // Expect that the dropdown options will contain the variables that exist
      const fieldVariable = initVariableField(
        this.workspace,
        new Blockly.FieldVariable('name2'),
      );
      assertDropdownContents(fieldVariable, [
        ['name1', 'id1'],
        ['name2', 'id2'],
      ]);
    });
    test('Contains variables created after field', function () {
      // Expect that the dropdown options will contain the variables that exist
      const fieldVariable = initVariableField(
        this.workspace,
        new Blockly.FieldVariable('name1'),
      );
      // Expect that variables created after field creation will show up too.
      this.workspace.createVariable('name2', '', 'id2');
      assertDropdownContents(fieldVariable, [
        ['name1', 'id1'],
        ['name2', 'id2'],
      ]);
    });
    test('Contains variables created before and after field', function () {
      this.workspace.createVariable('name1', '', 'id1');
      this.workspace.createVariable('name2', '', 'id2');
      // Expect that the dropdown options will contain the variables that exist
      const fieldVariable = initVariableField(
        this.workspace,
        new Blockly.FieldVariable('name1'),
      );
      // Expect that variables created after field creation will show up too.
      this.workspace.createVariable('name3', '', 'id3');
      assertDropdownContents(fieldVariable, [
        ['name1', 'id1'],
        ['name2', 'id2'],
        ['name3', 'id3'],
      ]);
    });
  });

  suite('Validators', function () {
    setup(function () {
      this.workspace.createVariable('name1', null, 'id1');
      this.workspace.createVariable('name2', null, 'id2');
      this.workspace.createVariable('name3', null, 'id3');
      this.variableField = initVariableField(
        this.workspace,
        new Blockly.FieldVariable('name1'),
      );
    });
    suite('Null Validator', function () {
      setup(function () {
        this.variableField.setValidator(function () {
          return null;
        });
      });
      test('New Value', function () {
        this.variableField.setValue('id2');
        assertFieldValue(this.variableField, 'id1', 'name1');
      });
    });
    suite("Force 'id' ID Validator", function () {
      setup(function () {
        this.variableField.setValidator(function (newValue) {
          return 'id' + newValue.charAt(newValue.length - 1);
        });
      });
      test('New Value', function () {
        // Must create the var so that the field doesn't throw an error.
        this.workspace.createVariable('thing2', null, 'other2');
        this.variableField.setValue('other2');
        assertFieldValue(this.variableField, 'id2', 'name2');
      });
    });
    suite('Returns Undefined Validator', function () {
      setup(function () {
        this.variableField.setValidator(function () {});
      });
      test('New Value', function () {
        this.variableField.setValue('id2');
        assertFieldValue(this.variableField, 'id2', 'name2');
      });
    });
  });

  suite('Customizations', function () {
    suite('Types and Default Types', function () {
      test('JS Constructor', function () {
        const field = new Blockly.FieldVariable(
          'test',
          undefined,
          ['Type1'],
          'Type1',
        );
        assert.deepEqual(field.variableTypes, ['Type1']);
        assert.equal(field.defaultType, 'Type1');
      });
      test('Empty list of types', function () {
        assert.throws(function () {
          const fieldVariable = new Blockly.FieldVariable(
            'name1',
            undefined,
            [],
          );
        });
      });
      test('invalid value for list of types', function () {
        assert.throws(function () {
          const fieldVariable = new Blockly.FieldVariable(
            'name1',
            undefined,
            'not an array',
          );
        });
      });
      test('JSON Definition', function () {
        const field = Blockly.FieldVariable.fromJson({
          variable: 'test',
          variableTypes: ['Type1'],
          defaultType: 'Type1',
        });
        assert.deepEqual(field.variableTypes, ['Type1']);
        assert.equal(field.defaultType, 'Type1');
      });
      test('JS Configuration - Simple', function () {
        const field = new Blockly.FieldVariable(
          'test',
          undefined,
          undefined,
          undefined,
          {
            variableTypes: ['Type1'],
            defaultType: 'Type1',
          },
        );
        assert.deepEqual(field.variableTypes, ['Type1']);
        assert.equal(field.defaultType, 'Type1');
      });
      test('JS Configuration - Ignore', function () {
        const field = new Blockly.FieldVariable(
          'test',
          undefined,
          ['Type2'],
          'Type2',
          {
            variableTypes: ['Type1'],
            defaultType: 'Type1',
          },
        );
        assert.deepEqual(field.variableTypes, ['Type1']);
        assert.equal(field.defaultType, 'Type1');
      });
    });
  });
  suite('Get variable types', function () {
    setup(function () {
      this.workspace.createVariable('name1', 'type1');
      this.workspace.createVariable('name2', 'type2');
    });
    test('variableTypes is explicit', function () {
      // Expect that since variableTypes is defined, it will be the return
      // value, regardless of what types are available on the workspace.
      const fieldVariable = new Blockly.FieldVariable(
        'name1',
        null,
        ['type1', 'type2'],
        'type1',
      );
      const resultTypes = fieldVariable.getVariableTypes();
      assert.deepEqual(resultTypes, ['type1', 'type2']);
      assert.equal(
        fieldVariable.defaultType,
        'type1',
        'Default type was wrong',
      );
    });
    test('variableTypes is undefined', function () {
      // Expect all variable types in the workspace to be returned, same
      // as if variableTypes is null.
      const fieldVariable = new Blockly.FieldVariable('name1');
      const mockBlock = createTestBlock();
      mockBlock.workspace = this.workspace;
      fieldVariable.setSourceBlock(mockBlock);

      const resultTypes = fieldVariable.getVariableTypes();
      assert.deepEqual(resultTypes, ['type1', 'type2']);
    });
    test('variableTypes is null', function () {
      // Expect all variable types to be returned.
      // The field does not need to be initialized to do this--it just needs
      // a pointer to the workspace.
      const fieldVariable = new Blockly.FieldVariable('name1');
      const mockBlock = createTestBlock();
      mockBlock.workspace = this.workspace;
      fieldVariable.setSourceBlock(mockBlock);
      fieldVariable.variableTypes = null;

      const resultTypes = fieldVariable.getVariableTypes();
      assert.deepEqual(resultTypes, ['type1', 'type2']);
    });
    test('variableTypes is null and variable is in the flyout', function () {
      // Expect all variable types in the workspace and
      // flyout workspace to be returned.
      const fieldVariable = new Blockly.FieldVariable('name1', undefined, null);
      const mockBlock = createTestBlock();
      mockBlock.workspace = this.workspace;

      // Pretend this is a flyout workspace with potential variables
      mockBlock.isInFlyout = true;
      mockBlock.workspace.createPotentialVariableMap();
      mockBlock.workspace
        .getPotentialVariableMap()
        .createVariable('name3', 'type3');
      fieldVariable.setSourceBlock(mockBlock);

      const resultTypes = fieldVariable.getVariableTypes();
      assert.deepEqual(resultTypes, ['type1', 'type2', 'type3']);
    });
  });
  suite('Default types', function () {
    test('Default type exists', function () {
      const fieldVariable = new Blockly.FieldVariable(null, null, ['b'], 'b');
      assert.equal(
        fieldVariable.defaultType,
        'b',
        'The variable field\'s default type should be "b"',
      );
    });
    test('No default type', function () {
      const fieldVariable = new Blockly.FieldVariable(null);
      assert.equal(
        fieldVariable.defaultType,
        '',
        "The variable field's default type should be the empty string",
      );
      assert.isNull(
        fieldVariable.variableTypes,
        "The variable field's allowed types should be null",
      );
    });
    test('Default type mismatch', function () {
      // Invalid default type when creating a variable field.
      assert.throws(function () {
        new Blockly.FieldVariable(null, null, ['a'], 'b');
      });
    });
    test('Default type mismatch with empty array', function () {
      // Invalid default type when creating a variable field.
      assert.throws(function () {
        new Blockly.FieldVariable(null, null, ['a']);
      });
    });
  });
  suite('Renaming Variables', function () {
    setup(function () {
      this.workspace.createVariable('name1', null, 'id1');
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'field_variable_test_block',
          'message0': '%1',
          'args0': [
            {
              'type': 'field_variable',
              'name': 'VAR',
              'variable': 'name1',
            },
          ],
        },
      ]);
      this.variableBlock = new Blockly.Block(
        this.workspace,
        'field_variable_test_block',
      );
      this.variableField = this.variableBlock.getField('VAR');
    });
    test('Rename & Keep Old ID', function () {
      const variableMap = this.workspace.getVariableMap();
      variableMap.renameVariable(variableMap.getVariableById('id1'), 'name2');
      assert.equal(this.variableField.getText(), 'name2');
      assert.equal(this.variableField.getValue(), 'id1');
    });
    test('Rename & Get New ID', function () {
      const variableMap = this.workspace.getVariableMap();
      variableMap.createVariable('name2', null, 'id2');
      variableMap.renameVariable(variableMap.getVariableById('id1'), 'name2');
      assert.equal(this.variableField.getText(), 'name2');
      assert.equal(this.variableField.getValue(), 'id2');
    });
  });

  suite('Serialization', function () {
    setup(function () {
      this.workspace = new Blockly.Workspace();
      defineRowBlock();
      createGenUidStubWithReturns(new Array(10).fill().map((_, i) => 'id' + i));
    });

    teardown(function () {
      workspaceTeardown.call(this, this.workspace);
    });

    suite('Full', function () {
      test('Untyped', function () {
        const block = this.workspace.newBlock('row_block');
        const field = new Blockly.FieldVariable('x');
        block.getInput('INPUT').appendField(field, 'VAR');
        const jso = Blockly.serialization.blocks.save(block);
        assert.deepEqual(jso['fields'], {
          'VAR': {'id': 'id2', 'name': 'x', 'type': ''},
        });
      });

      test('Typed', function () {
        const block = this.workspace.newBlock('row_block');
        const field = new Blockly.FieldVariable(
          'x',
          undefined,
          undefined,
          'String',
        );
        block.getInput('INPUT').appendField(field, 'VAR');
        const jso = Blockly.serialization.blocks.save(block);
        assert.deepEqual(jso['fields'], {
          'VAR': {'id': 'id2', 'name': 'x', 'type': 'String'},
        });
      });
    });

    suite('Not full', function () {
      test('Untyped', function () {
        const block = this.workspace.newBlock('row_block');
        const field = new Blockly.FieldVariable('x');
        block.getInput('INPUT').appendField(field, 'VAR');
        const jso = Blockly.serialization.blocks.save(block, {
          doFullSerialization: false,
        });
        assert.deepEqual(jso['fields'], {'VAR': {'id': 'id2'}});
        assert.isUndefined(jso['fields']['VAR']['name']);
        assert.isUndefined(jso['fields']['VAR']['type']);
      });

      test('Typed', function () {
        const block = this.workspace.newBlock('row_block');
        const field = new Blockly.FieldVariable(
          'x',
          undefined,
          undefined,
          'String',
        );
        block.getInput('INPUT').appendField(field, 'VAR');
        const jso = Blockly.serialization.blocks.save(block, {
          doFullSerialization: false,
        });
        assert.deepEqual(jso['fields'], {'VAR': {'id': 'id2'}});
        assert.isUndefined(jso['fields']['VAR']['name']);
        assert.isUndefined(jso['fields']['VAR']['type']);
      });
    });
  });

  suite('Deserialization', function () {
    setup(function () {
      this.workspace = new Blockly.Workspace();
      defineRowBlock();
      createGenUidStubWithReturns(new Array(10).fill().map((_, i) => 'id' + i));
    });

    teardown(function () {
      workspaceTeardown.call(this, this.workspace);
    });

    test('ID', function () {
      this.workspace.createVariable('test', '', 'id1');
      const block = Blockly.serialization.blocks.append(
        {
          'type': 'variables_get',
          'fields': {
            'VAR': {
              'id': 'id1',
            },
          },
        },
        this.workspace,
      );
      const variable = block.getField('VAR').getVariable();
      assert.equal(variable.name, 'test');
      assert.equal(variable.type, '');
      assert.equal(variable.getId(), 'id1');
    });

    test('Name, untyped', function () {
      const block = Blockly.serialization.blocks.append(
        {
          'type': 'variables_get',
          'fields': {
            'VAR': {
              'name': 'test',
            },
          },
        },
        this.workspace,
      );
      const variable = block.getField('VAR').getVariable();
      assert.equal(variable.name, 'test');
      assert.equal(variable.type, '');
      assert.equal(variable.getId(), 'id2');
    });

    test('Name, typed', function () {
      const block = Blockly.serialization.blocks.append(
        {
          'type': 'variables_get',
          'fields': {
            'VAR': {
              'name': 'test',
              'type': 'string',
            },
          },
        },
        this.workspace,
      );
      const variable = block.getField('VAR').getVariable();
      assert.equal(variable.name, 'test');
      assert.equal(variable.type, 'string');
      assert.equal(variable.getId(), 'id2');
    });
  });
});
