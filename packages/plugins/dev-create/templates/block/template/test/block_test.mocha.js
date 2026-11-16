/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import * as Blockly from 'blockly/core';
import {testHelpers} from '@blockly/dev-tools';
import {dartGenerator} from 'blockly/dart';
import {javascriptGenerator} from 'blockly/javascript';
import {luaGenerator} from 'blockly/lua';
import {phpGenerator} from 'blockly/php';
import {pythonGenerator} from 'blockly/python';
import '../src/index.js';

const {
  CodeGenerationTestSuite,
  runCodeGenerationTestSuites,
  runSerializationTestSuite,
  SerializationTestCase,
} = testHelpers;

suite('BlockTemplate', function () {
  /**
   * Asserts that the block has the expected inputs and fields.
   * @param {!Blockly.Block} block The block to check.
   */
  function assertBlockStructure(block) {
    // TODO replace with meaningful assertions.
    assert.exists(block);
  }

  setup(function () {
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    this.workspace.dispose();
  });

  suite('Creation', function () {
    // TODO Add basic test for creation of block using newBlock call.
    test('newBlock', function () {
      const block = this.workspace.newBlock('block_template');
      assertBlockStructure(block);
    });
  });

  suite('Code generation', function () {
    const trivialCreateBlock = (workspace) => {
      // TODO implement.
      // return workspace.newBlock('block_template');
    };

    /**
     * Test suites for code generation tests.
     * @type {Array<CodeGenerationTestSuite>}
     */
    const testSuites = [
      // TODO Remove unsupported languages.
      // TODO Update expectedCode for all test cases.
      // TODO Add additional useful testCases.
      {
        title: 'Dart',
        generator: dartGenerator,
        testCases: [
          {
            title: 'Trivial',
            expectedCode: 'TODO',
            createBlock: trivialCreateBlock,
          },
        ],
      },
      {
        title: 'JavaScript',
        generator: javascriptGenerator,
        testCases: [
          {
            title: 'Trivial',
            expectedCode: 'TODO',
            createBlock: trivialCreateBlock,
          },
        ],
      },
      {
        title: 'Lua',
        generator: luaGenerator,
        testCases: [
          {
            title: 'Trivial',
            expectedCode: 'TODO',
            createBlock: trivialCreateBlock,
          },
        ],
      },
      {
        title: 'PHP',
        generator: phpGenerator,
        testCases: [
          {
            title: 'Trivial',
            expectedCode: 'TODO',
            createBlock: trivialCreateBlock,
          },
        ],
      },
      {
        title: 'Python',
        generator: pythonGenerator,
        testCases: [
          {
            title: 'Trivial',
            expectedCode: 'TODO',
            createBlock: trivialCreateBlock,
          },
        ],
      },
    ];
    runCodeGenerationTestSuites(testSuites);
  });

  /**
   * Test cases for serialization tests.
   * @type {Array<SerializationTestCase>}
   */
  const testCases = [
    // TODO update xml and expectedXml.
    {
      title: 'Empty XML',
      xml: '<block type="block_template"/>',
      expectedXml:
        '<block xmlns="https://developers.google.com/blockly/xml" ' +
        'type="block_template" id="1"></block>',
      assertBlockStructure: (block) => {
        // TODO implement.
        // assertBlockStructure(block);
      },
    },
    // TODO add additional test cases.
  ];
  runSerializationTestSuite(testCases, Blockly);

  // TODO add any other relevant tests
});
