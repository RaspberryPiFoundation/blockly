/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Test case configuration.
 * @record
 */
export class TestCase {
  /**
   * Class for a test case configuration.
   */
  constructor() {
    /**
     * @type {string} The title for the test case.
     */
    this.title;
    /**
     * @type {boolean|undefined} Whether this test case should be skipped.
     *   Used to skip buggy test case and should have an associated bug.
     */
    this.skip;
    /**
     * @type {boolean|undefined} Whether this test case should be called as
     *   only. Used for debugging.
     */
    this.only;
  }
}

/**
 * Test suite configuration.
 * @record
 * @template {TestCase} T
 * @template {TestSuite} U
 */
export class TestSuite {
  /**
   * Class for a test suite configuration.
   */
  constructor() {
    /**
     * @type {string} The title for the test case.
     */
    this.title;
    /**
     * @type {?Array<T>} The associated test cases.
     */
    this.testCases;
    /**
     * @type {?Array<U>} List of nested inner test suites.
     */
    this.testSuites;
    /**
     * @type {boolean|undefined} Whether this test suite should be skipped.
     *   Used to skip buggy test case and should have an associated bug.
     */
    this.skip;
    /**
     * @type {boolean|undefined} Whether this test suite should be called as
     *   only. Used for debugging.
     */
    this.only;
  }
}

/**
 * Runs provided test cases.
 * @template {TestCase} T
 * @param {!Array<T>} testCases The test cases to run.
 * @param {function(T):Function} createTestCallback Creates test
 *    callback using given test case.
 */
export function runTestCases(testCases, createTestCallback) {
  testCases.forEach((testCase) => {
    let testCall = testCase.skip ? test.skip : test;
    testCall = testCase.only ? test.only : testCall;
    testCall(testCase.title, createTestCallback(testCase));
  });
}

/**
 * Runs provided test suite.
 * @template {TestCase} T
 * @template {TestSuite<T, U>} U
 * @param {Array<!U>} testSuites The test suites to run.
 * @param {function(!U):(function(T):!Function)
 *    } createTestCaseCallback Creates test case callback using given test
 *    suite.
 */
export function runTestSuites(testSuites, createTestCaseCallback) {
  testSuites.forEach((testSuite) => {
    let suiteCall = testSuite.skip ? suite.skip : suite;
    suiteCall = testSuite.only ? suite.only : suiteCall;
    suiteCall(testSuite.title, function () {
      if (testSuite.testSuites && testSuite.testSuites.length) {
        runTestSuites(testSuite.testSuites, createTestCaseCallback);
      }
      if (testSuite.testCases && testSuite.testCases.length) {
        runTestCases(testSuite.testCases, createTestCaseCallback(testSuite));
      }
    });
  });
}
