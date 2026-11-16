/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const chai = require('chai');
const {testHelpers} = require('@blockly/dev-tools');
const Blockly = require('blockly/core');
require('blockly/blocks');
const En = require('blockly/msg/en');
const {overrideOldBlockDefinitions} = require('../src/index');

const assert = chai.assert;

Blockly.setLocale(En);

suite('If block', function () {
  /**
   * Asserts that the if block has the expected inputs.
   * @param {!Blockly.Block} block The block to check.
   * @param {!Array<RegExp>} expectedInputs The expected inputs.
   * @param {string=} type The block type expected. Defaults to 'dynamic_if'.
   */
  function assertBlockStructure(block, expectedInputs, type = 'dynamic_if') {
    assert.equal(block.type, type);
    assert.equal(block.inputList.length, expectedInputs.length);
    assert.isTrue(expectedInputs.length >= 2);
    for (let i = 0; i < expectedInputs.length; i++) {
      assert.match(block.inputList[i].name, expectedInputs[i]);
    }
  }

  /**
   * Creates a boolean block and connects it to the specified connection.
   * @param {!Blockly.Workspace} workspace The workspace.
   * @param {!Blockly.Connection} connection The connection to connect a new
   *    block to.
   */
  function connectBooleanBlockToConnection(workspace, connection) {
    const newBlock = workspace.newBlock('logic_boolean');
    const targetConnection = newBlock.outputConnection;
    connection.connect(targetConnection);
  }

  /**
   * Creates a boolean block and connects it to the specified connection.
   * @param {!Blockly.Workspace} workspace The workspace.
   * @param {!Blockly.Connection} connection The connection to connect a new
   *    block to.
   */
  function connectStatementBlockToConnection(workspace, connection) {
    const newBlock = workspace.newBlock('text_print');
    const targetConnection = newBlock.previousConnection;
    connection.connect(targetConnection);
  }

  setup(function () {
    this.workspace = new Blockly.Workspace();
    overrideOldBlockDefinitions();
  });

  teardown(function () {
    this.workspace.dispose();
  });

  test('Creation', function () {
    const block = this.workspace.newBlock('dynamic_if');
    assertBlockStructure(block, [/IF0/, /DO0/]);
  });

  suite('adding inputs', function () {
    test('attaching the first predicate does not create a case', function () {
      const block = this.workspace.newBlock('dynamic_if');
      const connection = block.getInput('IF0').connection;

      block.onPendingConnection(connection);

      assertBlockStructure(block, [/IF0/, /DO0/]);
    });

    test('attaching the second predicate creates a case', function () {
      const block = this.workspace.newBlock('dynamic_if');
      const connection = block.getInput('IF0').connection;
      connectBooleanBlockToConnection(this.workspace, connection);

      block.onPendingConnection(connection);

      assertBlockStructure(block, [/IF0/, /DO0/, /IF.*/, /DO.*/]);
    });

    test('attaching the first statement creates an else', function () {
      const block = this.workspace.newBlock('dynamic_if');
      const connection = block.getInput('DO0').connection;

      block.onPendingConnection(connection);

      assertBlockStructure(block, [/IF0/, /DO0/, /ELSE/]);
    });

    test('attaching the second statement creates an else', function () {
      const block = this.workspace.newBlock('dynamic_if');
      const connection = block.getInput('DO0').connection;
      connectStatementBlockToConnection(this.workspace, connection);

      block.onPendingConnection(connection);

      assertBlockStructure(block, [/IF0/, /DO0/, /ELSE/]);
    });

    test('attaching to the next connection creates an else', function () {
      const block = this.workspace.newBlock('dynamic_if');
      const connection = block.nextConnection;

      block.onPendingConnection(connection);

      assertBlockStructure(block, [/IF0/, /DO0/, /ELSE/]);
    });
  });

  suite('finalizing inputs', function () {
    test('the block does not go below one case', function () {
      const block = this.workspace.newBlock('dynamic_if');

      block.finalizeConnections();

      assertBlockStructure(block, [/IF0/, /DO0/]);
    });

    test('a case with no blocks is removed', function () {
      const block = this.workspace.newBlock('dynamic_if');
      const connection = block.getInput('IF0').connection;
      connectBooleanBlockToConnection(this.workspace, connection);
      block.onPendingConnection(connection);

      block.finalizeConnections();

      assertBlockStructure(block, [/IF0/, /DO0/]);
    });

    test('a case with a predicate and statements is kept', function () {
      const block = this.workspace.newBlock('dynamic_if');
      const connection = block.getInput('IF0').connection;
      connectBooleanBlockToConnection(this.workspace, connection);
      block.onPendingConnection(connection);
      connectBooleanBlockToConnection(
        this.workspace,
        block.inputList[2].connection,
      );
      connectStatementBlockToConnection(
        this.workspace,
        block.inputList[3].connection,
      );

      block.finalizeConnections();

      assertBlockStructure(block, [/IF0/, /DO0/, /IF1/, /DO1/]);
    });

    test('a case with only a predicate is kept', function () {
      const block = this.workspace.newBlock('dynamic_if');
      const connection = block.getInput('IF0').connection;
      connectBooleanBlockToConnection(this.workspace, connection);
      block.onPendingConnection(connection);
      connectBooleanBlockToConnection(
        this.workspace,
        block.inputList[2].connection,
      );

      block.finalizeConnections();

      assertBlockStructure(block, [/IF0/, /DO0/, /IF1/, /DO1/]);
    });

    test('a case with only statements is kept', function () {
      const block = this.workspace.newBlock('dynamic_if');
      const connection = block.getInput('IF0').connection;
      connectBooleanBlockToConnection(this.workspace, connection);
      block.onPendingConnection(connection);
      connectStatementBlockToConnection(
        this.workspace,
        block.inputList[3].connection,
      );

      block.finalizeConnections();

      assertBlockStructure(block, [/IF0/, /DO0/, /IF1/, /DO1/]);
    });

    test('an else with no statements is removed', function () {
      const block = this.workspace.newBlock('dynamic_if');
      const connection = block.getInput('DO0').connection;
      block.onPendingConnection(connection);

      block.finalizeConnections();

      assertBlockStructure(block, [/IF0/, /DO0/]);
    });

    test('an else with statements is kept', function () {
      const block = this.workspace.newBlock('dynamic_if');
      const connection = block.getInput('DO0').connection;
      block.onPendingConnection(connection);
      connectStatementBlockToConnection(
        this.workspace,
        block.getInput('ELSE').connection,
      );

      block.finalizeConnections();

      assertBlockStructure(block, [/IF0/, /DO0/, /ELSE/]);
    });
  });

  const testCases = [
    {
      title: 'empty XML',
      xml: '<block type="dynamic_if"/>',
      expectedXml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_if" id="1">' +
        '</block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/IF0/, /DO0/]);
      },
    },
    {
      title: 'one if one else - old serialization',
      xml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_if" id="1">\n' +
        '  <mutation inputs="0" else="true" next="1"></mutation>\n' +
        '  <value name="IF0">\n' +
        '    <block type="logic_boolean" id="2">\n' +
        '      <field name="BOOL">TRUE</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '  <statement name="ELSE">\n' +
        '    <block type="text_print" id="3">\n' +
        '      <value name="TEXT">\n' +
        '        <shadow type="text" id="4">\n' +
        '          <field name="TEXT">abc</field>\n' +
        '        </shadow>\n' +
        '      </value>\n' +
        '    </block>\n' +
        '  </statement>\n' +
        '</block>',
      expectedXml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_if" id="1">\n' +
        '  <mutation else="1"></mutation>\n' +
        '  <value name="IF0">\n' +
        '    <block type="logic_boolean" id="2">\n' +
        '      <field name="BOOL">TRUE</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '  <statement name="ELSE">\n' +
        '    <block type="text_print" id="3">\n' +
        '      <value name="TEXT">\n' +
        '        <shadow type="text" id="4">\n' +
        '          <field name="TEXT">abc</field>\n' +
        '        </shadow>\n' +
        '      </value>\n' +
        '    </block>\n' +
        '  </statement>\n' +
        '</block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/IF0/, /DO0/, /ELSE/]);
      },
    },
    {
      title: 'multiple inputs with children - old serialization',
      xml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_if" id="1">\n' +
        '  <mutation inputs="0,1,2" else="true" next="3"></mutation>\n' +
        '  <value name="IF0">\n' +
        '    <block type="logic_boolean" id="2">\n' +
        '      <field name="BOOL">TRUE</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '  <statement name="DO0">\n' +
        '    <block type="text_print" id="3">\n' +
        '      <value name="TEXT">\n' +
        '        <shadow type="text" id="4">\n' +
        '          <field name="TEXT">abc</field>\n' +
        '        </shadow>\n' +
        '      </value>\n' +
        '    </block>\n' +
        '  </statement>\n' +
        '  <value name="IF1">\n' +
        '    <block type="logic_boolean" id="5">\n' +
        '      <field name="BOOL">TRUE</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '  <statement name="DO2">\n' +
        '    <block type="text_print" id="6">\n' +
        '      <value name="TEXT">\n' +
        '        <shadow type="text" id="7">\n' +
        '          <field name="TEXT">abc</field>\n' +
        '        </shadow>\n' +
        '      </value>\n' +
        '    </block>\n' +
        '  </statement>\n' +
        '  <statement name="ELSE">\n' +
        '    <block type="text_print" id="8">\n' +
        '      <value name="TEXT">\n' +
        '        <shadow type="text" id="9">\n' +
        '          <field name="TEXT">abc</field>\n' +
        '        </shadow>\n' +
        '      </value>\n' +
        '    </block>\n' +
        '  </statement>\n' +
        '</block>',
      expectedXml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_if" id="1">\n' +
        '  <mutation elseif="2" else="1"></mutation>\n' +
        '  <value name="IF0">\n' +
        '    <block type="logic_boolean" id="2">\n' +
        '      <field name="BOOL">TRUE</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '  <statement name="DO0">\n' +
        '    <block type="text_print" id="3">\n' +
        '      <value name="TEXT">\n' +
        '        <shadow type="text" id="4">\n' +
        '          <field name="TEXT">abc</field>\n' +
        '        </shadow>\n' +
        '      </value>\n' +
        '    </block>\n' +
        '  </statement>\n' +
        '  <value name="IF1">\n' +
        '    <block type="logic_boolean" id="5">\n' +
        '      <field name="BOOL">TRUE</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '  <statement name="DO2">\n' +
        '    <block type="text_print" id="6">\n' +
        '      <value name="TEXT">\n' +
        '        <shadow type="text" id="7">\n' +
        '          <field name="TEXT">abc</field>\n' +
        '        </shadow>\n' +
        '      </value>\n' +
        '    </block>\n' +
        '  </statement>\n' +
        '  <statement name="ELSE">\n' +
        '    <block type="text_print" id="8">\n' +
        '      <value name="TEXT">\n' +
        '        <shadow type="text" id="9">\n' +
        '          <field name="TEXT">abc</field>\n' +
        '        </shadow>\n' +
        '      </value>\n' +
        '    </block>\n' +
        '  </statement>\n' +
        '</block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [
          /IF0/,
          /DO0/,
          /IF1/,
          /DO1/,
          /IF2/,
          /DO2/,
          /ELSE/,
        ]);
      },
    },
    {
      title: 'multiple nonsequential inputs - old serialization',
      xml:
        '<block type="dynamic_if" id="1">\n' +
        '  <mutation inputs="1,3,2" else="false" next="4"></mutation>\n' +
        '  <value name="IF1">\n' +
        '    <block type="logic_boolean" id="1">\n' +
        '      <field name="BOOL">TRUE</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '  <statement name="DO1">\n' +
        '    <block type="text_print" id="3">\n' +
        '      <value name="TEXT">\n' +
        '        <shadow type="text" id="4">\n' +
        '          <field name="TEXT">abc</field>\n' +
        '        </shadow>\n' +
        '      </value>\n' +
        '    </block>\n' +
        '  </statement>\n' +
        '  <value name="IF3">\n' +
        '    <block type="logic_boolean" id="5">\n' +
        '      <field name="BOOL">TRUE</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '  <statement name="DO3">\n' +
        '    <block type="text_print" id="6">\n' +
        '      <value name="TEXT">\n' +
        '        <shadow type="text" id="7">\n' +
        '          <field name="TEXT">abc</field>\n' +
        '        </shadow>\n' +
        '      </value>\n' +
        '    </block>\n' +
        '  </statement>\n' +
        '  <value name="IF2">\n' +
        '    <block type="logic_boolean" id="8">\n' +
        '      <field name="BOOL">TRUE</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '  <statement name="DO2">\n' +
        '    <block type="text_print" id="9">\n' +
        '      <value name="TEXT">\n' +
        '        <shadow type="text" id="10">\n' +
        '          <field name="TEXT">abc</field>\n' +
        '        </shadow>\n' +
        '      </value>\n' +
        '    </block>\n' +
        '  </statement>\n' +
        '</block>\n',
      expectedXml:
        '<block xmlns="https://developers.google.com/blockly/xml" ' +
        'type="dynamic_if" id="1">\n' +
        '  <mutation elseif="2"></mutation>\n' +
        '  <value name="IF0">\n' +
        '    <block type="logic_boolean" id="1">\n' +
        '      <field name="BOOL">TRUE</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '  <statement name="DO0">\n' +
        '    <block type="text_print" id="3">\n' +
        '      <value name="TEXT">\n' +
        '        <shadow type="text" id="4">\n' +
        '          <field name="TEXT">abc</field>\n' +
        '        </shadow>\n' +
        '      </value>\n' +
        '    </block>\n' +
        '  </statement>\n' +
        '  <value name="IF1">\n' +
        '    <block type="logic_boolean" id="5">\n' +
        '      <field name="BOOL">TRUE</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '  <statement name="DO1">\n' +
        '    <block type="text_print" id="6">\n' +
        '      <value name="TEXT">\n' +
        '        <shadow type="text" id="7">\n' +
        '          <field name="TEXT">abc</field>\n' +
        '        </shadow>\n' +
        '      </value>\n' +
        '    </block>\n' +
        '  </statement>\n' +
        '  <value name="IF2">\n' +
        '    <block type="logic_boolean" id="8">\n' +
        '      <field name="BOOL">TRUE</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '  <statement name="DO2">\n' +
        '    <block type="text_print" id="9">\n' +
        '      <value name="TEXT">\n' +
        '        <shadow type="text" id="10">\n' +
        '          <field name="TEXT">abc</field>\n' +
        '        </shadow>\n' +
        '      </value>\n' +
        '    </block>\n' +
        '  </statement>\n' +
        '</block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/IF0/, /DO0/, /IF1/, /DO1/, /IF2/, /DO2/]);
      },
    },
    {
      title: 'one if one else - standard serialization',
      xml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_if" id="1">\n' +
        '  <mutation elseif="1" else="1"></mutation>\n' +
        '</block>',
      expectedXml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_if" id="1"></block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/IF0/, /DO0/], 'dynamic_if');
      },
    },
    {
      title: 'one if one else with children - standard serialization',
      xml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_if" id="1">\n' +
        '  <mutation elseif="1" else="1"></mutation>\n' +
        '  <value name="IF0">\n' +
        '    <block type="logic_boolean" id="2">\n' +
        '      <field name="BOOL">TRUE</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '  <value name="IF1">\n' +
        '    <block type="logic_boolean" id="3">\n' +
        '      <field name="BOOL">TRUE</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '  <statement name="ELSE">\n' +
        '    <block type="text_print" id="4"></block>\n' +
        '  </statement>\n' +
        '</block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(
          block,
          [/IF0/, /DO0/, /IF1/, /DO1/, /ELSE/],
          'dynamic_if',
        );
      },
    },
    {
      title: 'one if one else with children - json',
      json: {
        type: 'dynamic_if',
        id: '1',
        extraState: {
          elseIfCount: 1,
          hasElse: true,
        },
        inputs: {
          IF0: {
            block: {
              type: 'logic_boolean',
              id: '2',
              fields: {
                BOOL: 'TRUE',
              },
            },
          },
          IF1: {
            block: {
              type: 'logic_boolean',
              id: '3',
              fields: {
                BOOL: 'TRUE',
              },
            },
          },
          ELSE: {
            block: {
              type: 'text_print',
              id: '4',
            },
          },
        },
      },
      assertBlockStructure: (block) => {
        assertBlockStructure(
          block,
          [/IF0/, /DO0/, /IF1/, /DO1/, /ELSE/],
          'dynamic_if',
        );
      },
    },
    {
      title: 'one if one else with children - json with stringified old XML',
      json: {
        type: 'dynamic_if',
        id: '1',
        extraState: '<mutation inputs="1,3,2" else="true" next="4"></mutation>',
        inputs: {
          IF1: {
            block: {
              type: 'logic_boolean',
              id: '2',
              fields: {
                BOOL: 'TRUE',
              },
            },
          },
          IF3: {
            block: {
              type: 'logic_boolean',
              id: '3',
              fields: {
                BOOL: 'TRUE',
              },
            },
          },
          IF2: {
            block: {
              type: 'logic_boolean',
              id: '4',
              fields: {
                BOOL: 'TRUE',
              },
            },
          },
          ELSE: {
            block: {
              type: 'text_print',
              id: '5',
            },
          },
        },
      },
      expectedJson: {
        type: 'dynamic_if',
        id: '1',
        extraState: {
          elseIfCount: 2,
          hasElse: true,
        },
        inputs: {
          IF0: {
            block: {
              type: 'logic_boolean',
              id: '2',
              fields: {
                BOOL: 'TRUE',
              },
            },
          },
          IF1: {
            block: {
              type: 'logic_boolean',
              id: '3',
              fields: {
                BOOL: 'TRUE',
              },
            },
          },
          IF2: {
            block: {
              type: 'logic_boolean',
              id: '4',
              fields: {
                BOOL: 'TRUE',
              },
            },
          },
          ELSE: {
            block: {
              type: 'text_print',
              id: '5',
            },
          },
        },
      },
      assertBlockStructure: (block) => {
        assertBlockStructure(
          block,
          [/IF0/, /DO0/, /IF1/, /DO1/, /IF2/, /DO2/, /ELSE/],
          'dynamic_if',
        );
      },
    },
  ];
  testHelpers.runSerializationTestSuite(testCases, Blockly);
});
