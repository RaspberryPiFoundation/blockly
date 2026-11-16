/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {testHelpers} = require('@blockly/dev-tools');
const {FieldGridDropdown} = require('../src/index');

const {
  assertFieldValue,
  FieldCreationTestCase,
  FieldValueTestCase,
  runConstructorSuiteTests,
  runFromJsonSuiteTests,
  runSetValueTests,
} = testHelpers;

suite('FieldGridDropdown', function () {
  /**
   * Configuration for field tests with invalid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const invalidValueCreationTestCases = [
    {title: 'Undefined', args: [undefined]},
    {title: 'Array Items not Arrays', args: [undefined]},
    {
      title: 'Array Items with Invalid IDs',
      args: [
        [
          ['1', 1],
          ['2', 2],
          ['3', 3],
        ],
      ],
    },
    {
      title: 'Array Items with Invalid Content',
      args: [
        [
          [1, '1'],
          [2, '2'],
          [3, '3'],
        ],
      ],
    },
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const validValueCreationTestCases = [
    {
      title: 'Text Dropdown',
      value: 'A',
      expectedValue: 'A',
      expectedText: 'a',
      args: [
        [
          ['a', 'A'],
          ['b', 'B'],
          ['c', 'C'],
        ],
      ],
    },
    {
      title: 'Image Dropdown',
      value: 'A',
      expectedValue: 'A',
      expectedText: 'a',
      args: [
        [
          [{src: 'scrA', alt: 'a', width: 0, height: 0}, 'A'],
          [{src: 'scrB', alt: 'b', width: 0, height: 0}, 'B'],
          [{src: 'scrC', alt: 'c', width: 0, height: 0}, 'C'],
        ],
      ],
    },
    {
      title: 'Dynamic Text Dropdown',
      value: 'A',
      expectedValue: 'A',
      expectedText: 'a',
      args: [
        () => {
          return [
            ['a', 'A'],
            ['b', 'B'],
            ['c', 'C'],
          ];
        },
      ],
    },
    {
      title: 'Dynamic Image Dropdown',
      value: 'A',
      expectedValue: 'A',
      expectedText: 'a',
      args: [
        () => {
          return [
            [{src: 'scrA', alt: 'a', width: 0, height: 0}, 'A'],
            [{src: 'scrB', alt: 'b', width: 0, height: 0}, 'B'],
            [{src: 'scrC', alt: 'c', width: 0, height: 0}, 'C'],
          ];
        },
      ],
    },
  ];
  const addJson = function (testCase) {
    testCase.json = {options: testCase.args[0]};
  };
  invalidValueCreationTestCases.forEach(addJson);
  validValueCreationTestCases.forEach(addJson);

  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {!FieldGridDropdown} field The field to check.
   * @param {!FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    assertFieldValue(field, testCase.expectedValue, testCase.expectedText);
  };

  runConstructorSuiteTests(
    FieldGridDropdown,
    validValueCreationTestCases,
    invalidValueCreationTestCases,
    validTestCaseAssertField,
  );

  runFromJsonSuiteTests(
    FieldGridDropdown,
    validValueCreationTestCases,
    invalidValueCreationTestCases,
    validTestCaseAssertField,
  );

  /**
   * Configuration for field tests with invalid values.
   * @type {!Array<!FieldCreationTestCase>}
   */
  const invalidValueSetValueTestCases = [
    {title: 'Null', value: null},
    {title: 'Undefined', value: undefined},
    {title: 'Invalid ID', value: 'bad'},
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {!Array<!FieldValueTestCase>}
   */
  const validValueSetValueTestCases = [
    {title: 'Valid ID', value: 'B', expectedValue: 'B', expectedText: 'b'},
  ];

  suite('setValue', function () {
    setup(function () {
      this.field = new FieldGridDropdown([
        ['a', 'A'],
        ['b', 'B'],
        ['c', 'C'],
      ]);
    });
    runSetValueTests(
      validValueSetValueTestCases,
      invalidValueSetValueTestCases,
      'A',
      'a',
    );
  });

  suite('Validators', function () {
    setup(function () {
      this.dropdownField = new FieldGridDropdown([
        ['1a', '1A'],
        ['1b', '1B'],
        ['1c', '1C'],
        ['2a', '2A'],
        ['2b', '2B'],
        ['2c', '2C'],
      ]);
    });
    teardown(function () {
      this.dropdownField.setValidator(null);
    });
    suite('Null Validator', function () {
      setup(function () {
        this.dropdownField.setValidator(function () {
          return null;
        });
      });
      test('New Value', function () {
        this.dropdownField.setValue('1B');
        assertFieldValue(this.dropdownField, '1A', '1a');
      });
    });
    suite('Force 1s Validator', function () {
      setup(function () {
        this.dropdownField.setValidator(function (newValue) {
          return '1' + newValue.charAt(1);
        });
      });
      test('New Value', function () {
        this.dropdownField.setValue('2B');
        assertFieldValue(this.dropdownField, '1B', '1b');
      });
    });
    suite('Returns Undefined Validator', function () {
      setup(function () {
        this.dropdownField.setValidator(function () {});
      });
      test('New Value', function () {
        this.dropdownField.setValue('1B');
        assertFieldValue(this.dropdownField, '1B', '1b');
      });
    });
  });
});
