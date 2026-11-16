/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {testHelpers} = require('@blockly/dev-tools');
const {assert} = require('chai');
const {FieldBitmap, DEFAULT_HEIGHT, DEFAULT_WIDTH} = require('../src/index');

/**
 * Helper method to reformat raw test cases to a format that the
 * various tests can use.
 * @param {!Array<!Object>} testCases raw testcases that
 * need to be reformatted
 * @returns {!Array<!Object>} the reformatted test cases
 * that can be used by various tests
 */
function processTestCases(testCases) {
  return testCases.map((x) => ({
    title: x.title,
    value: x.value,
    args: [x.value, null, {}],
    json: {value: x.value},
  }));
}

const {
  FieldCreationTestCase,
  FieldValueTestCase,
  runConstructorSuiteTests,
  runFromJsonSuiteTests,
} = testHelpers;

suite('FieldBitmap', function () {
  /**
   * Configuration for field tests with invalid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const invalidValueTestCases = processTestCases([
    {title: 'Undefined', value: undefined},
    {title: 'Null', value: null},
    {title: 'NaN', value: NaN},
    {title: 'Non-Parsable String', value: 'bad'},
    {title: 'Not an array', value: 1},
    {title: 'Not a 2D array', value: [0, 1, 0, 1]},
    {
      title: 'Not a rectangle',
      value: [
        [1, 1, 1],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1],
      ],
    },
    {
      title: 'Contains non-binary number',
      value: [
        [1, 99, 1],
        [1, 1, 1],
        [1, 1, 1],
      ],
    },
    {
      title: 'Contains bad value',
      value: [
        [1, 'b', 1],
        [1, 1, 1],
        [1, 1, 1],
      ],
    },
  ]);

  /**
   * Configuration for field tests with valid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const validValueTestCases = processTestCases([
    {
      title: '3x3 solid',
      value: [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ],
    },
    {
      title: '4x4 solid',
      value: [
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
    },
    {
      title: '3x3 checkerboard',
      value: [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1],
      ],
    },
    {
      title: '4x4 empty',
      value: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    },
  ]);

  /**
   * The expected default value for the field being tested.
   * @type {*}
   */
  const defaultFieldValue = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ];
  /**
   * Asserts that the field property values are set to default.
   * @param {FieldBitmap} field The field to check.
   */
  const assertFieldDefault = function (field) {
    assert.deepEqual(field.getValue(), defaultFieldValue);
  };
  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {FieldBitmap} field The field to check.
   * @param {FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    const expectedValue = testCase.value;
    assert.deepEqual(field.getValue(), expectedValue);
    assert.equal(field.getImageHeight(), expectedValue.length);
    assert.equal(field.getImageWidth(), expectedValue[0].length);
  };

  /**
   * Reimplementation of the function from TestHelpers that supports array
   * equality testing.
   * @param {*} validValueTestCases test cases for valid field values
   * @param {*} invalidValueTestCases test cases for invalid field values
   */
  function runSetValueTests(validValueTestCases, invalidValueTestCases) {
    const createFieldForTestCase = (testCase) =>
      FieldBitmap.fromJson(`{
        width: ${
          Array.isArray(testCase.value) ? testCase.value.length : DEFAULT_WIDTH
        },
        height:${
          testCase.value && Array.isArray(testCase.value[0])
            ? testCase.value[0].length
            : DEFAULT_HEIGHT
        },
      }`);

    /**
     * Creates test callback for invalid setValue test.
     * @param {!FieldValueTestCase} testCase The test case information.
     * @returns {!Function} The test callback.
     */
    const createInvalidSetValueTestCallback = (testCase) => {
      return function () {
        const field = createFieldForTestCase(testCase);
        field.setValue(testCase.value);
        assertFieldDefault(field);
      };
    };
    /**
     * Creates test callback for valid setValue test.
     * @param {!FieldValueTestCase} testCase The test case information.
     * @returns {!Function} The test callback.
     */
    const createValidSetValueTestCallback = (testCase) => {
      return function () {
        const field = createFieldForTestCase(testCase);
        field.setValue(testCase.value);
        validTestCaseAssertField(field, testCase);
      };
    };

    testHelpers.runTestCases(
      invalidValueTestCases,
      createInvalidSetValueTestCallback,
    );
    testHelpers.runTestCases(
      validValueTestCases,
      createValidSetValueTestCallback,
    );
  }

  runConstructorSuiteTests(
    FieldBitmap,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  runFromJsonSuiteTests(
    FieldBitmap,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  runSetValueTests(validValueTestCases, invalidValueTestCases);
});
