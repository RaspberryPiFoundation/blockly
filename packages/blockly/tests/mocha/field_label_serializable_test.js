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
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

suite('Label Serializable Fields', function () {
  setup(function () {
    sharedTestSetup.call(this);
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });
  /**
   * Configuration for field tests with invalid values.
   * @type {!Array<!FieldCreationTestCase>}
   */
  const invalidValueTestCases = [
    {title: 'Undefined', value: undefined},
    {title: 'Null', value: null},
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {!Array<!FieldCreationTestCase>}
   */
  const validValueTestCases = [
    {title: 'String', value: 'value', expectedValue: 'value'},
    {title: 'Boolean true', value: true, expectedValue: 'true'},
    {title: 'Boolean false', value: false, expectedValue: 'false'},
    {title: 'Number (Truthy)', value: 1, expectedValue: '1'},
    {title: 'Number (Falsy)', value: 0, expectedValue: '0'},
    {title: 'NaN', value: NaN, expectedValue: 'NaN'},
  ];
  const addArgsAndJson = function (testCase) {
    testCase.args = [testCase.value];
    testCase.json = {'text': testCase.value};
  };
  invalidValueTestCases.forEach(addArgsAndJson);
  validValueTestCases.forEach(addArgsAndJson);

  /**
   * The expected default value for the field being tested.
   * @type {*}
   */
  const defaultFieldValue = '';
  /**
   * Asserts that the field property values are set to default.
   * @param {!Blockly.FieldLabelSerializable} field The field to check.
   */
  const assertFieldDefault = function (field) {
    assertFieldValue(field, defaultFieldValue);
  };
  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {!Blockly.FieldLabelSerializable} field The field to check.
   * @param {!FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    assertFieldValue(field, testCase.expectedValue);
  };

  runConstructorSuiteTests(
    Blockly.FieldLabelSerializable,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  runFromJsonSuiteTests(
    Blockly.FieldLabelSerializable,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  suite('setValue', function () {
    suite('Empty -> New Value', function () {
      setup(function () {
        this.field = new Blockly.FieldLabelSerializable();
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        defaultFieldValue,
      );
      test('With source block', function () {
        this.field.setSourceBlock(createTestBlock());
        this.field.setValue('value');
        assertFieldValue(this.field, 'value');
      });
    });
    suite('Value -> New Value', function () {
      const initialValue = 'oldValue';
      setup(function () {
        this.field = new Blockly.FieldLabelSerializable(initialValue);
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        initialValue,
      );
      test('With source block', function () {
        this.field.setSourceBlock(createTestBlock());
        this.field.setValue('value');
        assertFieldValue(this.field, 'value');
      });
    });
  });

  suite('Customizations', function () {
    function assertHasClass(labelField, cssClass) {
      labelField.fieldGroup_ = Blockly.utils.dom.createSvgElement(
        Blockly.utils.Svg.G,
        {},
        null,
      );
      labelField.constants_ = {
        FIELD_TEXT_BASELINE_Y: 13,
      };
      labelField.initView();
      assert.isTrue(
        Blockly.utils.dom.hasClass(labelField.textElement_, cssClass),
      );
    }
    function assertDoesNotHaveClass(labelField, cssClass) {
      labelField.fieldGroup_ = Blockly.utils.dom.createSvgElement(
        Blockly.utils.Svg.G,
        {},
        null,
      );
      labelField.constants_ = {
        FIELD_TEXT_BASELINE_Y: 13,
      };
      labelField.initView();
      assert.isFalse(
        Blockly.utils.dom.hasClass(labelField.textElement_, cssClass),
      );
    }
    test('JS Constructor', function () {
      const field = new Blockly.FieldLabelSerializable('text', 'testClass');
      assertHasClass(field, 'testClass');
    });
    test('JSON Definition', function () {
      const field = Blockly.FieldLabelSerializable.fromJson({
        class: 'testClass',
      });
      assertHasClass(field, 'testClass');
    });
    test('JS Configuration - Simple', function () {
      const field = new Blockly.FieldLabelSerializable('text', null, {
        class: 'testClass',
      });
      assertHasClass(field, 'testClass');
    });
    test('JS Configuration - Ignore', function () {
      const field = new Blockly.FieldLabelSerializable('text', 'paramClass', {
        class: 'configClass',
      });
      assertDoesNotHaveClass(field, 'paramClass');
      assertHasClass(field, 'configClass');
    });
    test("JS Configuration - Ignore - ''", function () {
      const field = new Blockly.FieldLabelSerializable('text', '', {
        class: 'configClass',
      });
      assertHasClass(field, 'configClass');
    });
    test("JS Configuration - Ignore - Config ''", function () {
      const field = new Blockly.FieldLabelSerializable('text', 'paramClass', {
        class: '',
      });
      assertDoesNotHaveClass(field, 'paramClass');
    });
    suite('setClass', function () {
      test('setClass', function () {
        const field = new Blockly.FieldLabelSerializable();
        field.fieldGroup_ = Blockly.utils.dom.createSvgElement(
          Blockly.utils.Svg.G,
          {},
          null,
        );
        field.constants_ = {
          FIELD_TEXT_BASELINE_Y: 13,
        };
        field.initView();
        field.setClass('testClass');
        // Don't call assertHasClass b/c we don't want to re-initialize.
        assert.isTrue(
          Blockly.utils.dom.hasClass(field.textElement_, 'testClass'),
        );
      });
      test('setClass Before Initialization', function () {
        const field = new Blockly.FieldLabelSerializable();
        field.setClass('testClass');
        assertHasClass(field, 'testClass');
      });
      test('Remove Class', function () {
        const field = new Blockly.FieldLabelSerializable('text', null, {
          class: 'testClass',
        });
        assertHasClass(field, 'testClass');
        field.setClass(null);
        assert.isFalse(
          Blockly.utils.dom.hasClass(field.textElement_, 'testClass'),
        );
      });
    });
  });

  suite('Serialization', function () {
    setup(function () {
      this.workspace = new Blockly.Workspace();
      defineRowBlock();

      this.assertValue = (value) => {
        const block = this.workspace.newBlock('row_block');
        const field = new Blockly.FieldLabelSerializable(value);
        block.getInput('INPUT').appendField(field, 'LABEL');
        const jso = Blockly.serialization.blocks.save(block);
        assert.deepEqual(jso['fields'], {'LABEL': value});
      };
    });

    teardown(function () {
      workspaceTeardown.call(this, this.workspace);
    });

    test('Simple', function () {
      this.assertValue('test label');
    });
  });
});
