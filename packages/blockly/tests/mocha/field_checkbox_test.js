/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import {assert} from '../../node_modules/chai/index.js';
import {defineRowBlock} from './test_helpers/block_definitions.js';
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

suite('Checkbox Fields', function () {
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
    {title: 'NaN', value: NaN},
    {title: 'Non-Parsable String', value: 'bad'},
    {title: 'Integer', value: 1},
    {title: 'Float', value: 1.5},
    {title: 'String true', value: 'true'},
    {title: 'String false', value: 'false'},
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {!Array<!FieldCreationTestCase>}
   */
  const validValueTestCases = [
    {
      title: 'Boolean true',
      value: true,
      expectedValue: 'TRUE',
      expectedText: 'true',
    },
    {
      title: 'Boolean false',
      value: false,
      expectedValue: 'FALSE',
      expectedText: 'false',
    },
    {
      title: 'String TRUE',
      value: 'TRUE',
      expectedValue: 'TRUE',
      expectedText: 'true',
    },
    {
      title: 'String FALSE',
      value: 'FALSE',
      expectedValue: 'FALSE',
      expectedText: 'false',
    },
  ];
  const addArgsAndJson = function (testCase) {
    testCase.args = [testCase.value];
    testCase.json = {'checked': testCase.value};
  };
  invalidValueTestCases.forEach(addArgsAndJson);
  validValueTestCases.forEach(addArgsAndJson);

  /**
   * The expected default value for the field being tested.
   * @type {*}
   */
  const defaultFieldValue = 'FALSE';
  /**
   * Asserts that the field property values are set to default.
   * @param {!Blockly.FieldCheckbox} field The field to check.
   */
  const assertFieldDefault = function (field) {
    assertFieldValue(field, defaultFieldValue, defaultFieldValue.toLowerCase());
  };
  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {!Blockly.FieldCheckbox} field The field to check.
   * @param {!FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    assertFieldValue(
      field,
      testCase.expectedValue,
      testCase.expectedValue.toLowerCase(),
    );
  };

  runConstructorSuiteTests(
    Blockly.FieldCheckbox,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  runFromJsonSuiteTests(
    Blockly.FieldCheckbox,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  suite('setValue', function () {
    suite('True -> New Value', function () {
      setup(function () {
        this.field = new Blockly.FieldCheckbox('TRUE');
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        'TRUE',
        'true',
      );
    });
    suite('False -> New Value', function () {
      setup(function () {
        this.field = new Blockly.FieldCheckbox('FALSE');
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        'FALSE',
        'false',
      );
    });
  });
  suite('Validators', function () {
    setup(function () {
      this.field = new Blockly.FieldCheckbox(true);
    });
    const testSuites = [
      {
        title: 'Null Validator',
        validator: function () {
          return null;
        },
        value: 'FALSE',
        expectedValue: 'TRUE',
      },
      {
        title: 'Always True Validator',
        validator: function () {
          return 'TRUE';
        },
        value: 'FALSE',
        expectedValue: 'TRUE',
      },
      {
        title: 'Always False Validator',
        validator: function () {
          return 'TRUE';
        },
        value: 'FALSE',
        expectedValue: 'TRUE',
      },
      {
        title: 'Returns Undefined Validator',
        validator: function () {},
        value: 'FALSE',
        expectedValue: 'FALSE',
      },
    ];
    testSuites.forEach(function (suiteInfo) {
      suite(suiteInfo.title, function () {
        setup(function () {
          this.field.setValidator(suiteInfo.validator);
        });
        test('New Value', function () {
          this.field.setValue(suiteInfo.value);
          assertFieldValue(
            this.field,
            suiteInfo.expectedValue,
            String(suiteInfo.expectedValue).toLowerCase(),
          );
        });
      });
    });
  });
  suite('Customizations', function () {
    suite('Check Character', function () {
      function assertCharacter(field, char) {
        field.fieldGroup_ = Blockly.utils.dom.createSvgElement(
          Blockly.utils.Svg.G,
          {},
          null,
        );
        field.sourceBlock_ = {
          RTL: false,
          rendered: true,
          workspace: {
            keyboardAccessibilityMode: false,
          },
          queueRender: function () {
            field.render_();
          },
          bumpNeighbours: function () {},
        };
        field.constants_ = {
          FIELD_CHECKBOX_X_OFFSET: 2,
          FIELD_CHECKBOX_Y_OFFSET: 2,
          FIELD_BORDER_RECT_RADIUS: 4,
          FIELD_BORDER_RECT_HEIGHT: 16,
          FIELD_TEXT_BASELINE_CENTER: false,
          FIELD_TEXT_HEIGHT: 16,
          FIELD_TEXT_BASELINE: 13,
        };
        field.initView();
        field.render_();
        assert(field.textContent_.nodeValue, char);
      }
      test('Constant', function () {
        const checkChar = Blockly.FieldCheckbox.CHECK_CHAR;
        // Note: Developers shouldn't actually do this. IMO they should change
        // the file and then recompile. But this is fine for testing.
        Blockly.FieldCheckbox.CHECK_CHAR = '\u2661';
        const field = new Blockly.FieldCheckbox(true);
        assertCharacter(field, '\u2661');
        Blockly.FieldCheckbox.CHECK_CHAR = checkChar;
      });
      test('JS Constructor', function () {
        const field = new Blockly.FieldCheckbox(true, null, {
          checkCharacter: '\u2661',
        });
        assertCharacter(field, '\u2661');
      });
      test('JSON Definition', function () {
        const field = Blockly.FieldCheckbox.fromJson({
          checkCharacter: '\u2661',
        });
        assertCharacter(field, '\u2661');
      });
      test('setCheckCharacter', function () {
        const field = new Blockly.FieldCheckbox();
        assertCharacter(field, Blockly.FieldCheckbox.CHECK_CHAR);
        field.setCheckCharacter('\u2661');
        // Don't call assertCharacter b/c we don't want to re-initialize.
        assert.equal(field.textContent_.nodeValue, '\u2661');
      });
      test('setCheckCharacter Before Init', function () {
        const field = new Blockly.FieldCheckbox();
        field.setCheckCharacter('\u2661');
        assertCharacter(field, '\u2661');
      });
      test('Remove Custom Character', function () {
        const field = new Blockly.FieldCheckbox(true, null, {
          'checkCharacter': '\u2661',
        });
        assertCharacter(field, '\u2661');
        field.setCheckCharacter(null);
        assert(field.textContent_.nodeValue, Blockly.FieldCheckbox.CHECK_CHAR);
      });
    });
  });

  suite('Serialization', function () {
    setup(function () {
      this.workspace = new Blockly.Workspace();
      defineRowBlock();

      this.assertValue = (value) => {
        const block = this.workspace.newBlock('row_block');
        const field = new Blockly.FieldCheckbox(value);
        block.getInput('INPUT').appendField(field, 'CHECK');
        const jso = Blockly.serialization.blocks.save(block);
        assert.deepEqual(jso['fields'], {'CHECK': value});
      };
    });

    teardown(function () {
      workspaceTeardown.call(this, this.workspace);
    });

    test('True', function () {
      this.assertValue(true);
    });

    test('False', function () {
      this.assertValue(false);
    });
  });
});
