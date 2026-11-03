/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import * as sinon from 'sinon';
import * as commonTestHelpers from './common_test_helpers.mocha.js';
import * as Blockly from 'blockly/core';

const {runTestCases, runTestSuites, TestCase, TestSuite} = commonTestHelpers;

/**
 * Code generation test case configuration.
 * @implements {TestCase}
 * @record
 */
export class CodeGenerationTestCase {
  /**
   * Class for a code generation test case.
   */
  constructor() {
    /**
     * @type {string} The expected code.
     */
    this.expectedCode;
    /**
     * @type {boolean|undefined} Whether to use workspaceToCode instead of
     * blockToCode for test.
     */
    this.useWorkspaceToCode;
    /**
     * @type {number|undefined} The expected inner order.
     */
    this.expectedInnerOrder;
  }

  // This is an interface stub; test cases supply the real implementation.
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Creates the block to use for this test case.
   * @param {!Blockly.Workspace} workspace The workspace context for this
   *    test.
   * @returns {!Blockly.Block} The block to use for the test case.
   */
  createBlock(workspace) {}
}

/**
 * Code generation test suite.
 * @extends {TestSuite<CodeGenerationTestCase, CodeGenerationTestSuite>}
 * @record
 */
export class CodeGenerationTestSuite {
  /**
   * Class for a code generation test suite.
   */
  constructor() {
    /**
     * @type {!Blockly.Generator} The generator to use for running test cases.
     */
    this.generator;
  }
}

/**
 * Serialization test case.
 * @implements {TestCase}
 * @record
 */
export class SerializationTestCase {
  /**
   * Class for a block serialization test case.
   */
  constructor() {
    /**
     * @type {string} The block xml to use for test. Do not provide if json is
     *     provided.
     */
    this.xml;
    /**
     * @type {string|undefined} The expected xml after round trip. Provided if
     *    it different from xml that was passed in.
     */
    this.expectedXml;
    /**
     * @type {string} The block json to use for test. Do not provide if xml is
     *     provided.
     */
    this.json;
    /**
     * @type {string|undefined} The expected json after round trip. Provided if
     *    it is different from json that was passed in.
     */
    this.expectedJson;
  }
  /**
   * Asserts that the block created from xml has the expected structure.
   * @param {!Blockly.Block} block The block to check.
   */
  assertBlockStructure(block) {}
}

/**
 * Returns mocha test callback for code generation based on provided
 *    generator.
 * @param {!Blockly.Generator} generator The generator to use in test.
 * @returns {function(!CodeGenerationTestCase):!Function} Function that
 *    returns mocha test callback based on test case.
 * @private
 */
const createCodeGenerationTestFn_ = (generator) => {
  return (testCase) => {
    return function () {
      const block = testCase.createBlock(this.workspace);
      let code;
      let innerOrder;
      if (testCase.useWorkspaceToCode) {
        code = generator.workspaceToCode(this.workspace);
      } else {
        generator.init(this.workspace);
        code = generator.blockToCode(block);
        if (Array.isArray(code)) {
          innerOrder = code[1];
          code = code[0];
        }
      }
      const assertFunc =
        typeof testCase.expectedCode === 'string' ? assert.equal : assert.match;
      assertFunc(code, testCase.expectedCode);
      if (
        !testCase.useWorkspaceToCode &&
        testCase.expectedInnerOrder !== undefined
      ) {
        assert.equal(innerOrder, testCase.expectedInnerOrder);
      }
    };
  };
};

/**
 * Runs blockToCode test suites.
 * @param {!Array<!CodeGenerationTestSuite>} testSuites The test suites to run.
 */
export const runCodeGenerationTestSuites = (testSuites) => {
  /**
   * Creates function used to generate mocha test callback.
   * @param {!CodeGenerationTestSuite} suiteInfo The test suite information.
   * @returns {function(!CodeGenerationTestCase):!Function} Function that
   *    creates mocha test callback.
   */
  const createTestFn = (suiteInfo) => {
    return createCodeGenerationTestFn_(suiteInfo.generator);
  };

  runTestSuites(testSuites, createTestFn);
};

/**
 * Runs serialization test suite.
 * @param {!Array<!SerializationTestCase>} testCases The test cases to run.
 * @param {?Blockly} blockly The instance of Blockly to use for the
 *     tests.  Optional, but must be supplied and must correspond to
 *     the instance used to create this.workspace if that would not
 *     otherwise be the case.
 */
export const runSerializationTestSuite = (testCases, blockly = Blockly) => {
  /**
   * Creates test callback for xmlToBlock test.
   * @param {!SerializationTestCase} testCase The test case information.
   * @returns {!Function} The test callback.
   */
  const createSerializedDataToBlockTestCallback = (testCase) => {
    return function () {
      let block;
      if (testCase.json) {
        block = blockly.serialization.blocks.append(
          testCase.json,
          this.workspace,
          {recordUndo: true},
        );
      } else {
        block = blockly.Xml.domToBlock(
          blockly.utils.xml.textToDom(testCase.xml),
          this.workspace,
        );
      }
      if (globalThis.clock) globalThis.clock.runAll();
      testCase.assertBlockStructure(block);
    };
  };
  /**
   * Creates test callback for xml round trip test.
   * @param {!SerializationTestCase} testCase The test case information.
   * @returns {!Function} The test callback.
   */
  const createRoundTripTestCallback = (testCase) => {
    return function () {
      if (testCase.json) {
        const block = blockly.serialization.blocks.append(
          testCase.json,
          this.workspace,
          {recordUndo: true},
        );
        if (globalThis.clock) globalThis.clock.runAll();
        const generatedJson = blockly.serialization.blocks.save(block);
        const expectedJson = testCase.expectedJson || testCase.json;
        assert.deepEqual(generatedJson, expectedJson);
      } else {
        const block = blockly.Xml.domToBlock(
          blockly.utils.xml.textToDom(testCase.xml),
          this.workspace,
        );
        if (globalThis.clock) globalThis.clock.runAll();
        const generatedXml = blockly.Xml.domToPrettyText(
          blockly.Xml.blockToDom(block),
        );
        const expectedXml = testCase.expectedXml || testCase.xml;
        assert.equal(generatedXml, expectedXml);
      }
    };
  };
  suite('Serialization', function () {
    suite('append block', function () {
      runTestCases(testCases, createSerializedDataToBlockTestCallback);
    });
    suite('serialization round-trip', function () {
      setup(function () {
        sinon.stub(blockly.utils.idGenerator.TEST_ONLY, 'genUid').returns('1');
      });

      teardown(function () {
        sinon.restore();
      });

      runTestCases(testCases, createRoundTripTestCallback);
    });
  });
};
