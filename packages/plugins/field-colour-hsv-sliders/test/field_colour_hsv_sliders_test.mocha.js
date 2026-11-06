/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {testHelpers} from '@blockly/dev-tools';
import jsdomGlobal from 'jsdom-global';

import {
  assertColourHsvSlidersField,
  assertColourHsvSlidersFieldDefault,
} from './field_colour_hsv_sliders_test_helpers.mocha.js';
import {FieldColourHsvSliders} from '../src/index.js';

const {
  FieldCreationTestCase,
  FieldValueTestCase,
  runConstructorSuiteTests,
  runFromJsonSuiteTests,
  runSetValueTests,
} = testHelpers;

suite('FieldColourHsvSliders', function () {
  setup(function () {
    this.jsdomCleanup = jsdomGlobal(
      '<!DOCTYPE html><div id="blocklyDiv"></div>',
    );
    this.field = new FieldColourHsvSliders();
  });

  teardown(function () {
    this.jsdomCleanup();
  });

  /**
   * Configuration for field tests with invalid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const invalidValueTestCases = [
    {title: 'Undefined', value: undefined},
    {title: 'Null', value: null},
    {title: 'NaN', value: NaN},
    {title: 'Non-Parsable String', value: 'wrong'},
    {title: 'Integer', value: 1},
    {title: 'Float', value: 1.5},
    {title: 'Integer String', value: '1'},
    {title: 'Float String', value: '1.5'},
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
    {
      title: 'Red',
      value: '#ff0000',
      expectedValue: '#ff0000',
      expectedText: '#f00',
    },
    {
      title: 'Black',
      value: '#000000',
      expectedValue: '#000000',
      expectedText: '#000',
    },
    {
      title: 'White',
      value: '#ffffff',
      expectedValue: '#ffffff',
      expectedText: '#fff',
    },
    {
      title: 'Gray',
      value: '#7f7f7f',
      expectedValue: '#7f7f7f',
      expectedText: '#7f7f7f',
    },
    {
      title: 'Shortened String',
      value: 'bad',
      expectedValue: '#bbaadd',
      expectedText: '#bad',
    },
  ];
  const addArgsAndJson = function (testCase) {
    testCase.args = [testCase.value];
    testCase.json = {colour: testCase.value};
  };
  invalidValueTestCases.forEach(addArgsAndJson);
  validValueTestCases.forEach(addArgsAndJson);

  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {FieldColourHsvSliders} field The field to check.
   * @param {FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    assertColourHsvSlidersField(
      field,
      testCase.expectedValue,
      testCase.expectedText,
    );
  };

  runConstructorSuiteTests(
    FieldColourHsvSliders,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertColourHsvSlidersFieldDefault,
  );

  runFromJsonSuiteTests(
    FieldColourHsvSliders,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertColourHsvSlidersFieldDefault,
  );

  suite('setValue', function () {
    suite('Empty -> New Value', function () {
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        '#ffffff',
        '#fff',
      );
    });
    suite('Value -> New Value', function () {
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        '#ffffff',
        '#fff',
      );
    });
  });
});
