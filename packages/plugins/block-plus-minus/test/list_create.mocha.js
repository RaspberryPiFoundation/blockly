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

suite('List create block', function () {
  /**
   * Asserts that the list block has the inputs and fields we expect.
   * @param {!Blockly.Block} block The list block.
   * @param {number=} inputCount The number of inputs we expect.
   */
  function assertListBlockStructure(block, inputCount = 0) {
    assert.equal(block.type, 'lists_create_with');
    if (inputCount === 0) {
      assert.equal(block.inputList.length, 1);
      const input = block.inputList[0];
      assert.equal(input.type, Blockly.inputs.inputTypes.DUMMY);
      assert.equal(input.name, 'EMPTY');
      assert.isNull(block.getField('MINUS'));
      // Easy way to test we're displaying empty instead of normal text.
      assert.equal(block.toString(), 'Add list item create empty list');
      return;
    }

    assert.equal(block.inputList.length, inputCount);
    for (let i = 0; i < inputCount; i++) {
      chai.assert.equal(block.inputList[i].name, 'ADD' + i);
    }
    assert.isNotNull(block.getField('MINUS'));
    // Easy way to test we're displaying normal text instead of empty.
    assert.notEqual(block.toString(), 'Add list item create empty list');
  }

  setup(function () {
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    this.workspace.dispose();
  });

  test('Creation', function () {
    this.block = this.workspace.newBlock('lists_create_with');
    assertListBlockStructure(this.block, 3);
  });

  suite('Code generation', function () {
    const trivialCreateBlock = (workspace) => {
      return workspace.newBlock('lists_create_with');
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
            expectedCode: '[null, null, null]',
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
            expectedCode: '[null, null, null]',
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
            expectedCode: '{nil, nil, nil}',
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
            expectedCode: 'array(null, null, null)',
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
            expectedCode: '[None, None, None]',
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
        xml: '<block type="lists_create_with"/>',
        expectedXml:
          '<block xmlns="https://developers.google.com/blockly/xml" ' +
          'type="lists_create_with" id="1">\n' +
          '  <mutation items="3"></mutation>\n' +
          '</block>',
        assertBlockStructure: (block) => {
          assertListBlockStructure(block, 3);
        },
      },
      {
        title: '3 items',
        xml:
          '<block xmlns="https://developers.google.com/blockly/xml" ' +
          'type="lists_create_with" id="1">\n' +
          '  <mutation items="3"></mutation>\n' +
          '</block>',
        assertBlockStructure: (block) => {
          assertListBlockStructure(block, 3);
        },
      },
      {
        title: '5 items',
        xml:
          '<block xmlns="https://developers.google.com/blockly/xml" ' +
          'type="lists_create_with" id="1">\n' +
          '  <mutation items="5"></mutation>\n' +
          '</block>',
        assertBlockStructure: (block) => {
          assertListBlockStructure(block, 5);
        },
      },
      {
        title: '0 items',
        xml:
          '<block xmlns="https://developers.google.com/blockly/xml" ' +
          'type="lists_create_with" id="1">\n' +
          '  <mutation items="0"></mutation>\n' +
          '</block>',
        assertBlockStructure: (block) => {
          assertListBlockStructure(block, 0);
        },
      },
      {
        title: '4 items with child attached',
        xml:
          '<block xmlns="https://developers.google.com/blockly/xml" ' +
          'type="lists_create_with" id="1">\n' +
          '  <mutation items="4"></mutation>\n' +
          '  <value name="ADD3">\n' +
          '    <block type="logic_boolean" id="1">\n' +
          '      <field name="BOOL">FALSE</field>\n' +
          '    </block>\n' +
          '  </value>\n' +
          '</block>',
        assertBlockStructure: (block) => {
          assertListBlockStructure(block, 4);
          const child = block.getInputTargetBlock('ADD3');
          assert.isNotNull(child);
          assert.equal(child.type, 'logic_boolean');
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
          type: 'lists_create_with',
        },
        expectedJson: {
          type: 'lists_create_with',
          id: '1',
          extraState: {
            itemCount: 3,
          },
        },
        assertBlockStructure: (block) => {
          assertListBlockStructure(block, 3);
        },
      },
      {
        title: '3 items',
        json: {
          type: 'lists_create_with',
          id: '1',
          extraState: {
            itemCount: 3,
          },
        },
        assertBlockStructure: (block) => {
          assertListBlockStructure(block, 3);
        },
      },
      {
        title: '5 items',
        json: {
          type: 'lists_create_with',
          id: '1',
          extraState: {
            itemCount: 5,
          },
        },
        assertBlockStructure: (block) => {
          assertListBlockStructure(block, 5);
        },
      },
      {
        title: '0 items',
        json: {
          type: 'lists_create_with',
          id: '1',
          extraState: {
            itemCount: 0,
          },
        },
        assertBlockStructure: (block) => {
          assertListBlockStructure(block, 0);
        },
      },
      {
        title: '4 items with child attached',
        json: {
          type: 'lists_create_with',
          id: '1',
          extraState: {
            itemCount: 4,
          },
          inputs: {
            ADD3: {
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
          assertListBlockStructure(block, 4);
          const child = block.getInputTargetBlock('ADD3');
          assert.isNotNull(child);
          assert.equal(child.type, 'logic_boolean');
          assert.equal(child.getFieldValue('BOOL'), 'FALSE');
        },
      },
    ];
    runSerializationTestSuite(testCases, Blockly);
  });

  runPlusMinusTestSuite(
    'lists_create_with',
    3,
    0,
    'ADD',
    assertListBlockStructure,
  );
});
