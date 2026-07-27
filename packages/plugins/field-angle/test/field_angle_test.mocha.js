/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {testHelpers} = require('@blockly/dev-tools');
const {FieldAngle, registerFieldAngle} = require('../src/index');
const {assert} = require('chai');

const {
  assertFieldValue,
  FieldCreationTestCase,
  FieldValueTestCase,
  runConstructorSuiteTests,
  runFromJsonSuiteTests,
  runSetValueTests,
} = testHelpers;

suite('FieldAngle', function () {
  setup(function () {
    registerFieldAngle();
  });

  /**
   * Configuration for field tests with invalid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const invalidValueTestCases = [
    {title: 'Undefined', value: undefined},
    {title: 'Null', value: null},
    {title: 'NaN', value: NaN},
    {title: 'Non-Parsable String', value: 'bad'},
    {title: 'Infinity', value: Infinity},
    {title: 'Negative Infinity', value: -Infinity},
    {title: 'Infinity String', value: 'Infinity'},
    {title: 'Negative Infinity String', value: '-Infinity'},
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const validValueTestCases = [
    {title: 'Integer', value: 16, expectedValue: 15},
    {title: 'Float', value: 14.5, expectedValue: 15},
    {title: 'Integer String', value: '30', expectedValue: 30},
    {title: 'Float String', value: '0.75', expectedValue: 0},
    {title: '> 360°', value: 360 + 16, expectedValue: 15},
    {title: '< 0°', value: -16, expectedValue: 360 - 15},
  ];
  const addArgsAndJson = function (testCase) {
    testCase.args = [testCase.value];
    testCase.json = {value: testCase.value};
  };
  invalidValueTestCases.forEach(addArgsAndJson);
  validValueTestCases.forEach(addArgsAndJson);

  /**
   * The expected default value for the field being tested.
   * @type {*}
   */
  const defaultFieldValue = 0;
  /**
   * Asserts that the field property values are set to default.
   * @param {FieldAngle} field The field to check.
   */
  const assertFieldDefault = function (field) {
    assertFieldValue(field, defaultFieldValue);
  };
  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {FieldAngle} field The field to check.
   * @param {!FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    assertFieldValue(field, testCase.expectedValue);
  };

  runConstructorSuiteTests(
    FieldAngle,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  runFromJsonSuiteTests(
    FieldAngle,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  suite('setValue', function () {
    /**
     * Create a mock block that may be used as the source block for a field.
     * @returns {!Object} Mock block.
     */
    function createBlockMock() {
      return {
        id: 'test',
        rendered: false,
        workspace: {
          rendered: false,
        },
        renameVarById: Blockly.Block.prototype.renameVarById,
        updateVarName: Blockly.Block.prototype.updateVarName,
        isShadow: () => false,
        isDeadOrDying: () => false,
      };
    }

    suite('Empty -> New Value', function () {
      setup(function () {
        this.field = new FieldAngle();
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        defaultFieldValue,
      );
      test('With source block', function () {
        this.field.setSourceBlock(createBlockMock());
        this.field.setValue(12.5);
        assertFieldValue(this.field, 15);
      });
    });
    suite('Value -> New Value', function () {
      setup(function () {
        this.field = new FieldAngle(12.5);
      });
      runSetValueTests(validValueTestCases, invalidValueTestCases, 15);
      test('With source block', function () {
        this.field.setSourceBlock(createBlockMock());
        this.field.setValue(-15);
        assertFieldValue(this.field, 360 - 15);
      });
    });
  });

  suite('Validators', function () {
    setup(function () {
      this.field = new FieldAngle(15);
    });
    const testSuites = [
      {
        title: 'Null Validator',
        validator: function () {
          return null;
        },
        value: 30,
        expectedValue: 15,
      },
      {
        title: 'Force multiple of 90 Validator',
        validator: function (newValue) {
          return Math.round(newValue / 90) * 90;
        },
        value: 60,
        expectedValue: 90,
      },
      {
        title: 'Returns Undefined Validator',
        validator: function () {},
        value: 30,
        expectedValue: 30,
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
            suiteInfo.expectedText,
          );
        });
      });
    });
  });

  suite('Customizations', function () {
    suite('Clockwise', function () {
      test('JS Configuration', function () {
        const field = new FieldAngle(0, null, {
          clockwise: true,
        });
        assert.isTrue(field.clockwise);
      });
      test('JSON Definition', function () {
        const field = FieldAngle.fromJson({
          value: 0,
          clockwise: true,
        });
        assert.isTrue(field.clockwise);
      });
    });

    suite('Offset', function () {
      test('JS Configuration', function () {
        const field = new FieldAngle(0, null, {
          offset: 90,
        });
        assert.equal(field.offset, 90);
      });
      test('JSON Definition', function () {
        const field = FieldAngle.fromJson({
          value: 0,
          offset: 90,
        });
        assert.equal(field.offset, 90);
      });
    });

    suite('Min/Max', function () {
      test('JS Configuration', function () {
        const field = new FieldAngle(0, null, {
          min: -180,
          max: 180,
        });
        assert.equal(field.getMin(), -180);
        assert.equal(field.getMax(), 180);
      });
      test('JSON Definition', function () {
        const field = FieldAngle.fromJson({
          value: 0,
          min: -180,
          max: 180,
        });
        assert.equal(field.getMin(), -180);
        assert.equal(field.getMax(), 180);
      });
    });

    suite('Precision', function () {
      test('JS Configuration', function () {
        const field = new FieldAngle(0, null, {
          precision: 30,
        });
        assert.equal(field.getPrecision(), 30);
      });
      test('JSON Definition', function () {
        const field = FieldAngle.fromJson({
          value: 0,
          precision: 30,
        });
        assert.equal(field.getPrecision(), 30);
      });
    });

    suite('Mode', function () {
      suite('Compass', function () {
        test('JS Configuration', function () {
          const field = new FieldAngle(0, null, {
            mode: 'compass',
          });
          assert.equal(field.offset, 90);
          assert.isTrue(field.clockwise);
        });
        test('JS Configuration', function () {
          const field = FieldAngle.fromJson({
            value: 0,
            mode: 'compass',
          });
          assert.equal(field.offset, 90);
          assert.isTrue(field.clockwise);
        });
      });
      suite('Protractor', function () {
        test('JS Configuration', function () {
          const field = new FieldAngle(0, null, {
            mode: 'protractor',
          });
          assert.equal(field.offset, 0);
          assert.isFalse(field.clockwise);
        });
        test('JS Configuration', function () {
          const field = FieldAngle.fromJson({
            value: 0,
            mode: 'protractor',
          });
          assert.equal(field.offset, 0);
          assert.isFalse(field.clockwise);
        });
      });
    });
  });

  suite('Serialization', function () {
    setup(function () {
      this.workspace = new Blockly.Workspace();
      Blockly.defineBlocksWithJsonArray([
        {
          type: 'row_block',
          message0: '%1',
          args0: [
            {
              type: 'input_value',
              name: 'INPUT',
            },
          ],
          output: null,
        },
      ]);

      this.assertValue = (value) => {
        const block = this.workspace.newBlock('row_block');
        const field = new FieldAngle(value);
        block.getInput('INPUT').appendField(field, 'ANGLE');
        const jso = Blockly.serialization.blocks.save(block);
        assert.deepEqual(jso['fields'], {ANGLE: value});
      };
    });

    teardown(function () {
      this.workspace.dispose();
    });

    test('Simple', function () {
      this.assertValue(90);
    });
  });
});
