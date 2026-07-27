/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import {testHelpers} from '@blockly/dev-tools';
import {FieldDate} from '../src/index';
import {getLocaleDateString} from '../src/utils';

const {
  assertFieldValue,
  FieldCreationTestCase,
  FieldValueTestCase,
  runConstructorSuiteTests,
  runFromJsonSuiteTests,
  runSetValueTests,
} = testHelpers;

// Add polyfill for global variables needed.
if (!global.navigator) {
  global.navigator = {
    language: 'en-US',
  };
}

suite('FieldDate', function () {
  /**
   * Configuration for field tests with invalid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const invalidValueTestCases = [
    {title: 'Undefined', value: undefined},
    {title: 'Null', value: null},
    {title: 'NaN', value: NaN},
    {title: 'Non-Parsable String', value: 'bad'},
    {title: 'Invalid Date - Month(2020-13-20)', value: '2020-13-20'},
    {title: 'Invalid Date - Day(2020-02-32)', value: '2020-02-32'},
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const validValueTestCases = [
    {
      title: 'String',
      value: '3030-03-30',
      expectedValue: '3030-03-30',
      expectedText: '3/30/3030',
    },
  ];
  const addArgsAndJson = function (testCase) {
    testCase.args = [testCase.value];
    testCase.json = {date: testCase.value};
  };
  invalidValueTestCases.forEach(addArgsAndJson);
  validValueTestCases.forEach(addArgsAndJson);
  // Construct ISO string using current timezone.
  // Cannot use toISOString() because it returns in UTC.
  const defaultFieldValue = new Date()
    .toLocaleDateString('en-US')
    .replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2')
    .replace(/-(\d)(?!\d)/g, '-0$1');
  // NOTE: The actual text depends on system settings of the one running it.
  const defaultFieldText = new Date().toLocaleDateString();
  const assertFieldDefault = function (field) {
    assertFieldValue(field, defaultFieldValue, defaultFieldText);
  };

  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {FieldDate} field The field to check.
   * @param {FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    assertFieldValue(field, testCase.expectedValue, testCase.expectedText);
  };

  runConstructorSuiteTests(
    FieldDate,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  runFromJsonSuiteTests(
    FieldDate,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  suite('setValue', function () {
    suite('Empty -> New Value', function () {
      setup(function () {
        this.field = new FieldDate();
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        defaultFieldValue,
        defaultFieldText,
      );
    });
    suite('Value -> New Value', function () {
      const initialValue = '2020-02-20';
      const initialText = getLocaleDateString(initialValue);
      setup(function () {
        this.field = new FieldDate(initialValue);
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        initialValue,
        initialText,
      );
    });
  });

  suite('Validators', function () {
    setup(function () {
      this.field = new FieldDate('2020-02-20');
    });
    teardown(function () {
      this.field.setValidator(null);
    });
    suite('when validator returns null', function () {
      setup(function () {
        this.field.setValidator(() => {
          return null;
        });
      });
      test('should not set the new value', function () {
        this.field.setValue('3030-03-30');
        assertFieldValue(this.field, '2020-02-20', '2/20/2020');
      });
    });
    suite('when validator sets day to 20s', function () {
      setup(function () {
        this.field.setValidator(function (newValue) {
          return newValue.substr(0, 8) + '2' + newValue.substr(9, 1);
        });
      });
      test('should set the value to a "20s" date', function () {
        this.field.setValue('3030-03-30');
        assertFieldValue(this.field, '3030-03-20', '3/20/3030');
      });
    });
    suite('when validator returns undefined', function () {
      setup(function () {
        this.field.setValidator(() => {});
      });
      test('should set the value without changing it', function () {
        this.field.setValue('3030-03-30');
        assertFieldValue(this.field, '3030-03-30', '3/30/3030');
      });
    });
  });

  suite('Time Zones', function () {
    // https://nodejs.org/api/cli.html#tz
    const INITIAL_TZ = process.env.TZ;
    const TZ_STRINGS = {
      WESTERN: 'America/New_York',
      UNIVERSAL: 'Etc/Universal',
      EASTERN: 'Europe/Paris',
    };
    const TZ_OFFSET = {
      WESTERN: '-05:00',
      UNIVERSAL: '+00:00',
      EASTERN: '+01:00',
    };

    suite('Western', () => {
      setup(() => {
        process.env.TZ = TZ_STRINGS.WESTERN;
      });

      test('should return the same date when provided a date string', () => {
        const dateString = '2000-01-23';
        const fieldDate = new FieldDate(dateString);
        assert.equal(fieldDate.getValue(), dateString);
      });

      test('should return the same date for 23:00 western datetime', () => {
        const dateString = '2000-01-23';
        const dateTimeString = dateString + 'T23:00:00' + TZ_OFFSET.WESTERN;
        const fieldDate = new FieldDate(dateTimeString);
        assert.equal(fieldDate.getValue(), dateString);
      });

      test('should return the day before for 00:00 universal datetime', () => {
        const dateString = '2000-01-23';
        const dateTimeString = dateString + 'T00:00:00' + TZ_OFFSET.UNIVERSAL;
        const fieldDate = new FieldDate(dateTimeString);
        assert.equal(fieldDate.getValue(), '2000-01-22');
      });

      teardown(() => {
        process.env.TSZ = INITIAL_TZ;
      });
    });

    suite('Universal', () => {
      setup(() => {
        process.env.TZ = TZ_STRINGS.UNIVERSAL;
      });

      test('should return the same date when provided a date string', () => {
        const dateString = '2000-01-23';
        const fieldDate = new FieldDate(dateString);
        assert.equal(fieldDate.getValue(), dateString);
      });

      test('should return the day after for 23:00 western datetime', () => {
        const dateString = '2000-01-23';
        const dateTimeString = dateString + 'T23:00:00' + TZ_OFFSET.WESTERN;
        const fieldDate = new FieldDate(dateTimeString);
        assert.equal(fieldDate.getValue(), '2000-01-24');
      });

      test('should return the same date for 00:00 universal datetime', () => {
        const dateString = '2000-01-23';
        const dateTimeString = dateString + 'T00:00:00' + TZ_OFFSET.UNIVERSAL;
        const fieldDate = new FieldDate(dateTimeString);
        assert.equal(fieldDate.getValue(), dateString);
      });

      teardown(() => {
        process.env.TSZ = INITIAL_TZ;
      });
    });

    suite('Eastern', () => {
      setup(() => {
        process.env.TZ = TZ_STRINGS.EASTERN;
      });

      test('should return the same date when provided a date string', () => {
        const dateString = '2000-01-23';
        const fieldDate = new FieldDate(dateString);
        assert.equal(fieldDate.getValue(), dateString);
      });

      test('should return the day after for 23:00 universal datetime', () => {
        const dateString = '2000-01-23';
        const dateTimeString = dateString + 'T23:00:00' + TZ_OFFSET.UNIVERSAL;
        const fieldDate = new FieldDate(dateTimeString);
        assert.equal(fieldDate.getValue(), '2000-01-24');
      });

      test('should return the same date for 00:00 eastern datetime', () => {
        const dateString = '2000-01-23';
        const dateTimeString = dateString + 'T00:00:00' + TZ_OFFSET.EASTERN;
        const fieldDate = new FieldDate(dateTimeString);
        assert.equal(fieldDate.getValue(), dateString);
      });

      teardown(() => {
        process.env.TSZ = INITIAL_TZ;
      });
    });
  });
});
