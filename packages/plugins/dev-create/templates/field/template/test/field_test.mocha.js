/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {testHelpers} = require('@blockly/dev-tools');
const {FieldTemplate} = require('../src/index');

const {
  FieldCreationTestCase,
  FieldValueTestCase,
  runConstructorSuiteTests,
  runFromJsonSuiteTests,
  runSetValueTests,
} = testHelpers;

suite('FieldTemplate', function () {
  /**
   * Configuration for field tests with invalid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const invalidValueTestCases = [
    // TODO
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const validValueTestCases = [
    // TODO
  ];
  /**
   * The expected default value for the field being tested.
   * @type {*}
   */
  const defaultFieldValue = 0; // TODO update with default value
  /**
   * Asserts that the field property values are set to default.
   * @param {FieldTemplate} field The field to check.
   */
  const assertFieldDefault = function (field) {
    // TODO Recommend use of assertFieldValue from testHelpers
  };
  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {FieldTemplate} field The field to check.
   * @param {FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    // TODO
  };

  runConstructorSuiteTests(
    FieldTemplate,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  runFromJsonSuiteTests(
    FieldTemplate,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  suite('setValue', function () {
    suite('Empty -> New Value', function () {
      setup(function () {
        this.field = new FieldTemplate();
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        defaultFieldValue,
      );
    });
    suite('Value -> New Value', function () {
      const initialValue = 1; // TODO update with initial value for test.
      setup(function () {
        this.field = new FieldTemplate(initialValue);
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        initialValue,
      );
    });
  });

  suite('Validators', function () {
    // TODO
  });

  // TODO add any other relevant tests
});
