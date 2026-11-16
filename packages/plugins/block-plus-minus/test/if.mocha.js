/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const chai = require('chai');
const {testHelpers} = require('@blockly/dev-tools');
const {runPlusMinusTestSuite} = require('./test_helpers.mocha');
const Blockly = require('blockly');
const {dartGenerator} = require('blockly/dart');
const {javascriptGenerator} = require('blockly/javascript');
const {luaGenerator} = require('blockly/lua');
const {phpGenerator} = require('blockly/php');
const {pythonGenerator} = require('blockly/python');

require('../src/index');

const assert = chai.assert;

const {
  CodeGenerationTestSuite,
  runCodeGenerationTestSuites,
  runSerializationTestSuite,
  SerializationTestCase,
} = testHelpers;

suite('If block', function () {
  /**
   * Asserts that the if block has the expected inputs and fields.
   * @param {!Blockly.Block} block The if block to check.
   * @param {number} ifCount The number of ifs we expect.
   * @param {boolean=} hasElse If we expect an else input.
   */
  function assertIfBlockStructure(block, ifCount, hasElse) {
    assert.equal(block.type, 'controls_if');
    const inputs = block.inputList;
    assert.exists(inputs);
    const length = inputs.length;
    const expectedLength = hasElse ? ifCount * 2 + 1 : ifCount * 2;
    assert.equal(length, expectedLength);
    for (let i = 0; i < ifCount; i++) {
      assert.equal(inputs[i * 2].name, 'IF' + i);
      assert.equal(inputs[i * 2 + 1].name, 'DO' + i);
      if (i > 0) {
        assert.isNotNull(block.getField('MINUS' + i));
      }
    }
    if (hasElse) {
      assert.equal(inputs[length - 1].name, 'ELSE');
    }
  }

  setup(function () {
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    this.workspace.dispose();
  });

  test('Creation', function () {
    this.block = this.workspace.newBlock('controls_if');
    assertIfBlockStructure(this.block, 1);
  });

  suite('Code generation', function () {
    const trivialCreateBlock = (workspace) => {
      return workspace.newBlock('controls_if');
    };

    /**
     * Test suites for code generation tests.
     * @type {Array<CodeGenerationTestSuite>}
     */
    const testSuites = [
      {
        title: 'Dart',
        generator: dartGenerator,
        testCases: [
          {
            title: 'Trivial',
            expectedCode: 'if (false) {\n}\n',
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
            expectedCode: 'if (false) {\n}\n',
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
            expectedCode: 'if false then\nend\n',
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
            expectedCode: 'if (false) {\n}\n',
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
            expectedCode: 'if False:\n  pass\n',
            createBlock: trivialCreateBlock,
          },
        ],
      },
    ];
    runCodeGenerationTestSuites(testSuites);
  });

  suite('XML', function () {
    /**
     * Test cases for serialization tests.
     * @type {Array<SerializationTestCase>}
     */
    const testCases = [
      {
        title: 'Empty Xml',
        xml: '<block type="controls_if"/>',
        expectedXml:
          '<block xmlns="https://developers.google.com/blockly/xml" ' +
          'type="controls_if" id="1"></block>',
        assertBlockStructure: (block) => {
          assertIfBlockStructure(block, 1);
        },
      },
      {
        title: '2 elseif no else',
        xml:
          '<block xmlns="https://developers.google.com/blockly/xml" ' +
          'type="controls_if" id="1">\n' +
          '  <mutation elseif="2"></mutation>\n' +
          '</block>',
        assertBlockStructure: (block) => {
          assertIfBlockStructure(block, 3);
        },
      },
      {
        title: '3 elseif with else',
        xml:
          '<block xmlns="https://developers.google.com/blockly/xml" ' +
          'type="controls_if" id="1">\n' +
          '  <mutation elseif="3" else="1"></mutation>\n' +
          '</block>',
        assertBlockStructure: (block) => {
          assertIfBlockStructure(block, 4, true);
        },
      },
    ];
    runSerializationTestSuite(testCases, Blockly);
  });

  suite('JSON', function () {
    /**
     * Test cases for serialization tests.
     * @type {Array<SerializationTestCase>}
     */
    const testCases = [
      {
        title: 'No mutation',
        json: {
          type: 'controls_if',
        },
        expectedJson: {
          type: 'controls_if',
          id: '1',
        },
        assertBlockStructure: (block) => {
          assertIfBlockStructure(block, 1);
        },
      },
      {
        title: '2 elseif no else',
        json: {
          type: 'controls_if',
          extraState: {
            elseIfCount: 2,
          },
          id: '1',
        },
        assertBlockStructure: (block) => {
          assertIfBlockStructure(block, 3);
        },
      },
      {
        title: '3 elseif with else',
        json: {
          type: 'controls_if',
          extraState: {
            elseIfCount: 3,
            hasElse: true,
          },
          id: '1',
        },
        assertBlockStructure: (block) => {
          assertIfBlockStructure(block, 4, true);
        },
      },
    ];
    runSerializationTestSuite(testCases, Blockly);
  });

  runPlusMinusTestSuite('controls_if', 1, 1, 'IF', assertIfBlockStructure);
});
