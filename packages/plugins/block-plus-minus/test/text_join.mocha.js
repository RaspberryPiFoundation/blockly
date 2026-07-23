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

suite('Text join block', function () {
  /**
   * Asserts that the join block has the inputs and fields we expect.
   * @param {!Blockly.Block} block The text join block.
   * @param {number=} inputCount The number of inputs we expect.
   */
  function assertTextJoinBlockStructure(block, inputCount) {
    assert.equal(block.type, 'text_join');
    if (!inputCount) {
      assert.equal(block.inputList.length, 1);
      const input = block.inputList[0];
      assert.equal(input.type, Blockly.inputs.inputTypes.DUMMY);
      assert.equal(input.name, 'EMPTY');
      assert.isNull(block.getField('MINUS'));
      // Easy way to test we're displaying quotes instead of normal text.
      assert.equal(block.toString(), 'Add text “ ”');
      return;
    }

    assert.equal(block.inputList.length, inputCount);
    for (let i = 0; i < inputCount; i++) {
      chai.assert.equal(block.inputList[i].name, 'ADD' + i);
    }
    assert.isNotNull(block.getField('MINUS'));
    // Easy way to test we're displaying normal text instead of quotes.
    assert.notEqual(block.toString(), 'Add text “ ”');
  }

  setup(function () {
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    this.workspace.dispose();
  });

  test('Creation', function () {
    this.block = this.workspace.newBlock('text_join');
    assertTextJoinBlockStructure(this.block, 2);
  });

  suite('Code generation', function () {
    const trivialCreateBlock = (workspace) => {
      return workspace.newBlock('text_join');
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
            expectedCode: "['',''].join()",
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
            expectedCode: "'' + ''",
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
            expectedCode: "'' .. ''",
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
            expectedCode: "'' . ''",
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
            expectedCode: "'' + ''",
            createBlock: trivialCreateBlock,
          },
        ],
      },
    ];

    runCodeGenerationTestSuites(testSuites);
  });

  suite('Xml', function () {
    /**
     * Test cases for serialization tests.
     * @type {Array<SerializationTestCase>}
     */
    const testCases = [
      {
        title: 'Empty XML',
        xml: '<block type="text_join"/>',
        expectedXml:
          '<block xmlns="https://developers.google.com/blockly/xml" ' +
          'type="text_join" id="1">\n' +
          '  <mutation items="2"></mutation>\n' +
          '</block>',
        assertBlockStructure: (block) => {
          assertTextJoinBlockStructure(block, 2);
        },
      },
      {
        title: '0 items',
        xml:
          '<block xmlns="https://developers.google.com/blockly/xml" ' +
          'type="text_join" id="1">\n' +
          '  <mutation items="0"></mutation>\n' +
          '</block>',
        assertBlockStructure: (block) => {
          assertTextJoinBlockStructure(block, 0);
        },
      },
      {
        title: '3 items',
        xml:
          '<block xmlns="https://developers.google.com/blockly/xml" ' +
          'type="text_join" id="1">\n' +
          '  <mutation items="3"></mutation>\n' +
          '</block>',
        assertBlockStructure: (block) => {
          assertTextJoinBlockStructure(block, 3);
        },
      },
      {
        title: '3 items with child attached',
        xml:
          '<block xmlns="https://developers.google.com/blockly/xml" ' +
          'type="text_join" id="1">\n' +
          '  <mutation items="3"></mutation>\n' +
          '  <value name="ADD2">\n' +
          '    <block type="logic_boolean" id="1">\n' +
          '      <field name="BOOL">FALSE</field>\n' +
          '    </block>\n' +
          '  </value>\n' +
          '</block>',
        assertBlockStructure: (block) => {
          assertTextJoinBlockStructure(block, 3);
          const child = block.getInputTargetBlock('ADD2');
          assert.isNotNull(child);
          assert.equal(child.getFieldValue('BOOL'), 'FALSE');
        },
      },
    ];
    runSerializationTestSuite(testCases, Blockly);
  });

  suite('Json', function () {
    /**
     * Test cases for serialization tests.
     * @type {Array<SerializationTestCase>}
     */
    const testCases = [
      {
        title: 'No mutation',
        json: {
          type: 'text_join',
        },
        expectedJson: {
          type: 'text_join',
          id: '1',
          extraState: {
            itemCount: 2,
          },
        },
        assertBlockStructure: (block) => {
          assertTextJoinBlockStructure(block, 2);
        },
      },
      {
        title: '0 items',
        json: {
          type: 'text_join',
          id: '1',
          extraState: {
            itemCount: 0,
          },
        },
        assertBlockStructure: (block) => {
          assertTextJoinBlockStructure(block, 0);
        },
      },
      {
        title: '3 items',
        json: {
          type: 'text_join',
          id: '1',
          extraState: {
            itemCount: 3,
          },
        },
        assertBlockStructure: (block) => {
          assertTextJoinBlockStructure(block, 3);
        },
      },
      {
        title: '3 items with child attached',
        json: {
          type: 'text_join',
          id: '1',
          extraState: {
            itemCount: 3,
          },
          inputs: {
            ADD2: {
              block: {
                type: 'logic_boolean',
                id: '1',
                fields: {
                  BOOL: 'FALSE',
                },
              },
            },
          },
        },
        assertBlockStructure: (block) => {
          assertTextJoinBlockStructure(block, 3);
          const child = block.getInputTargetBlock('ADD2');
          assert.isNotNull(child);
          assert.equal(child.type, 'logic_boolean');
          assert.equal(child.getFieldValue('BOOL'), 'FALSE');
        },
      },
    ];
    runSerializationTestSuite(testCases, Blockly);
  });

  runPlusMinusTestSuite('text_join', 2, 0, 'ADD', assertTextJoinBlockStructure);
});
