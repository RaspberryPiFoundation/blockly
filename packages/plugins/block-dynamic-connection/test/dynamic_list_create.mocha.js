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

suite('List create block', function () {
  /**
   * Asserts that the list create block has the expected inputs.
   * @param {!Blockly.Block} block The block to check.
   * @param {!Array<RegExp>} expectedInputs The expected inputs.
   * @type {string=} The block type expected. Defaults to 'dynamic_list_create'.
   */
  function assertBlockStructure(
    block,
    expectedInputs,
    type = 'dynamic_list_create',
  ) {
    assert.equal(block.type, type);
    assert.equal(block.inputList.length, expectedInputs.length);
    for (let i = 0; i < expectedInputs.length; i++) {
      assert.match(block.inputList[i].name, expectedInputs[i]);
    }
  }

  /**
   * Creates a block and connects it to the specified connection.
   * @param {!Blockly.Workspace} workspace The workspace.
   * @param {!Blockly.Connection} connection The connection to connect a new
   *    block to.
   */
  function connectBlockToConnection(workspace, connection) {
    const newBlock = workspace.newBlock('text');
    const targetConnection = newBlock.outputConnection;
    connection.connect(targetConnection);
  }

  setup(function () {
    this.workspace = new Blockly.Workspace();
    overrideOldBlockDefinitions();

    const def1 = {...Blockly.Blocks['dynamic_list_create']};
    def1.minInputs = 1;
    Blockly.Blocks['dynamic_list_1_input'] = def1;

    const def5 = {...Blockly.Blocks['dynamic_list_create']};
    def5.minInputs = 5;
    Blockly.Blocks['dynamic_list_5_inputs'] = def5;
  });

  teardown(function () {
    this.workspace.dispose();
    delete Blockly.Blocks['dynamic_list_5_inputs'];
  });

  suite('Creation', function () {
    test('the default definition has two inputs', function () {
      const block = this.workspace.newBlock('dynamic_list_create');
      assertBlockStructure(block, [/ADD0/, /ADD1/]);
    });

    test('minInputs controls the number of inputs', function () {
      const block = this.workspace.newBlock('dynamic_list_5_inputs');
      assertBlockStructure(
        block,
        [/ADD0/, /ADD1/, /ADD2/, /ADD3/, /ADD4/],
        'dynamic_list_5_inputs',
      );
    });
  });

  suite('adding inputs', function () {
    test('attaching min items does not add an input', function () {
      const block = this.workspace.newBlock('dynamic_list_1_input');
      const connection = block.getInput('ADD0').connection;

      block.onPendingConnection(connection);

      assertBlockStructure(block, [/ADD0/], 'dynamic_list_1_input');
    });

    test('attaching three items creates an input', function () {
      const block = this.workspace.newBlock('dynamic_list_1_input');
      const connection = block.getInput('ADD0').connection;
      connectBlockToConnection(this.workspace, connection);

      block.onPendingConnection(connection);

      assertBlockStructure(block, [/ADD0/, /ADD.*/], 'dynamic_list_1_input');
    });
  });

  suite('finalizing inputs', function () {
    test('the block does not go below min inputs', function () {
      const block = this.workspace.newBlock('dynamic_list_5_inputs');

      block.finalizeConnections();

      assertBlockStructure(
        block,
        [/ADD0/, /ADD1/, /ADD2/, /ADD3/, /ADD4/],
        'dynamic_list_5_inputs',
      );
    });

    test('an extra input with no blocks is removed', function () {
      const block = this.workspace.newBlock('dynamic_list_1_input');
      const connection = block.getInput('ADD0').connection;
      connectBlockToConnection(this.workspace, connection);
      block.onPendingConnection(connection);

      block.finalizeConnections();

      assertBlockStructure(block, [/ADD0/], 'dynamic_list_1_input');
    });

    test('an extra input with blocks is kept', function () {
      const block = this.workspace.newBlock('dynamic_list_1_input');
      const connection = block.getInput('ADD0').connection;
      connectBlockToConnection(this.workspace, connection);
      block.onPendingConnection(connection);
      connectBlockToConnection(this.workspace, block.inputList[1].connection);

      block.finalizeConnections();

      assertBlockStructure(block, [/ADD0/, /ADD1/], 'dynamic_list_1_input');
    });

    test('extra inputs are removed starting at the end', function () {
      const block = this.workspace.newBlock('dynamic_list_5_inputs');
      const connection0 = block.getInput('ADD0').connection;
      const connection1 = block.getInput('ADD1').connection;
      connectBlockToConnection(this.workspace, connection0);
      connectBlockToConnection(this.workspace, connection1);
      block.onPendingConnection(connection0);

      block.finalizeConnections();

      assertBlockStructure(
        block,
        [/ADD0/, /ADD1/, /ADD2/, /ADD3/, /ADD4/],
        'dynamic_list_5_inputs',
      );
      assert.isOk(block.getInputTargetBlock('ADD0'));
      assert.isNotOk(
        block.getInputTargetBlock('ADD1'),
        'Expected the empty input created by pending to still exist.',
      );
      assert.isOk(block.getInputTargetBlock('ADD2'));
    });
  });

  const testCases = [
    {
      title: 'empty XML',
      xml: '<block type="dynamic_list_create"/>',
      expectedXml:
        '<block xmlns="https://developers.google.com/blockly/xml" ' +
        'type="dynamic_list_create" id="1">\n' +
        '  <mutation items="2"></mutation>\n</block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/ADD0/, /ADD1/]);
      },
    },
    {
      title: 'default state - old serialization',
      xml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_list_create" id="1">\n' +
        '  <mutation inputs="ADD0,ADD1" next="2"></mutation>\n' +
        '</block>',
      expectedXml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_list_create" id="1">\n' +
        '  <mutation items="2"></mutation>\n' +
        '</block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/ADD0/, /ADD1/]);
      },
    },
    {
      title: 'two inputs with one child - old serialization',
      xml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_list_create" id="1">\n' +
        '  <mutation inputs="ADD0,ADD1" next="2"></mutation>\n' +
        '  <value name="ADD1">\n' +
        '    <block type="text" id="2">\n' +
        '      <field name="TEXT">abc</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '</block>',
      expectedXml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_list_create" id="1">\n' +
        '  <mutation items="2"></mutation>\n' +
        '  <value name="ADD1">\n' +
        '    <block type="text" id="2">\n' +
        '      <field name="TEXT">abc</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '</block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/ADD0/, /ADD1/]);
      },
    },
    {
      title: 'multiple inputs with children - old serialization',
      xml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_list_create" id="1">\n' +
        '  <mutation inputs="ADD0,ADD1,ADD2,ADD3" next="4"></mutation>\n' +
        '  <value name="ADD0">\n' +
        '    <block type="text" id="2">\n' +
        '      <field name="TEXT">b</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD1">\n' +
        '    <block type="text" id="3">\n' +
        '      <field name="TEXT">d</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD2">\n' +
        '    <block type="text" id="4">\n' +
        '      <field name="TEXT">c</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD3">\n' +
        '    <block type="text" id="5">\n' +
        '      <field name="TEXT">a</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '</block>',
      expectedXml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_list_create" id="1">\n' +
        '  <mutation items="4"></mutation>\n' +
        '  <value name="ADD0">\n' +
        '    <block type="text" id="2">\n' +
        '      <field name="TEXT">b</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD1">\n' +
        '    <block type="text" id="3">\n' +
        '      <field name="TEXT">d</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD2">\n' +
        '    <block type="text" id="4">\n' +
        '      <field name="TEXT">c</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD3">\n' +
        '    <block type="text" id="5">\n' +
        '      <field name="TEXT">a</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '</block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/ADD0/, /ADD1/, /ADD2/, /ADD3/]);
      },
    },
    {
      title: 'multiple non-sequential inputs with children - old serialization',
      xml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_list_create" id="1">\n' +
        '  <mutation inputs="ADD1,ADD5,ADD2,ADD4" next="6"></mutation>\n' +
        '  <value name="ADD1">\n' +
        '    <block type="text" id="2">\n' +
        '      <field name="TEXT">b</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD5">\n' +
        '    <block type="text" id="3">\n' +
        '      <field name="TEXT">d</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD2">\n' +
        '    <block type="text" id="4">\n' +
        '      <field name="TEXT">c</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD4">\n' +
        '    <block type="text" id="5">\n' +
        '      <field name="TEXT">a</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '</block>',
      expectedXml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_list_create" id="1">\n' +
        '  <mutation items="4"></mutation>\n' +
        '  <value name="ADD0">\n' +
        '    <block type="text" id="2">\n' +
        '      <field name="TEXT">b</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD1">\n' +
        '    <block type="text" id="3">\n' +
        '      <field name="TEXT">d</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD2">\n' +
        '    <block type="text" id="4">\n' +
        '      <field name="TEXT">c</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD3">\n' +
        '    <block type="text" id="5">\n' +
        '      <field name="TEXT">a</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '</block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/ADD0/, /ADD1/, /ADD2/, /ADD3/]);
      },
    },
    {
      title: 'two inputs one child - standard serialization',
      xml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_list_create" id="1">\n' +
        '  <mutation items="2"></mutation>\n' +
        '  <value name="ADD1">\n' +
        '    <block type="text" id="2">\n' +
        '      <field name="TEXT">abc</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '</block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/ADD0/, /ADD1/]);
      },
    },
    {
      title: 'multiple inputs with children - standard serialization',
      xml:
        '<block xmlns="https://developers.google.com/blockly/xml"' +
        ' type="dynamic_list_create" id="1">\n' +
        '  <mutation items="4"></mutation>\n' +
        '  <value name="ADD0">\n' +
        '    <block type="text" id="2">\n' +
        '      <field name="TEXT">b</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD1">\n' +
        '    <block type="text" id="3">\n' +
        '      <field name="TEXT">d</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD2">\n' +
        '    <block type="text" id="4">\n' +
        '      <field name="TEXT">c</field>\n' +
        '    </block>\n  </value>\n' +
        '  <value name="ADD3">\n' +
        '    <block type="text" id="5">\n' +
        '      <field name="TEXT">a</field>\n' +
        '    </block>\n' +
        '  </value>\n' +
        '</block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/ADD0/, /ADD1/, /ADD2/, /ADD3/]);
      },
    },
    {
      title: 'standard/core XML still maintains minimum inputs',
      xml:
        '<block type="lists_create_with" id="1" x="63" y="113">' +
        '  <mutation items="0"></mutation>' +
        '</block>',
      expectedXml:
        '<block xmlns="https://developers.google.com/blockly/xml" ' +
        'type="lists_create_with" id="1">\n' +
        '  <mutation items="2"></mutation>\n</block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/ADD0/, /ADD1/], 'lists_create_with');
      },
    },
    {
      title: 'two inputs one child - json',
      json: {
        type: 'dynamic_list_create',
        id: '1',
        extraState: {
          itemCount: 2,
        },
        inputs: {
          ADD1: {
            block: {
              type: 'text',
              id: '2',
              fields: {
                TEXT: 'abc',
              },
            },
          },
        },
      },
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/ADD0/, /ADD1/]);
      },
    },
    {
      title: 'multiple inputs with children - json',
      json: {
        type: 'dynamic_list_create',
        id: '1',
        extraState: {
          itemCount: 4,
        },
        inputs: {
          ADD0: {
            block: {
              type: 'text',
              id: '2',
              fields: {
                TEXT: 'a',
              },
            },
          },
          ADD1: {
            block: {
              type: 'text',
              id: '3',
              fields: {
                TEXT: 'b',
              },
            },
          },
          ADD2: {
            block: {
              type: 'text',
              id: '4',
              fields: {
                TEXT: 'c',
              },
            },
          },
          ADD3: {
            block: {
              type: 'text',
              id: '5',
              fields: {
                TEXT: 'd',
              },
            },
          },
        },
      },
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/ADD0/, /ADD1/, /ADD2/, /ADD3/]);
      },
    },
    {
      title: 'multiple inputs with children - json with stringified old XML',
      json: {
        type: 'dynamic_list_create',
        id: '1',
        extraState:
          '<mutation inputs="ADD1,ADD5,ADD2,ADD4" next="6"></mutation>',
        inputs: {
          ADD1: {
            block: {
              type: 'text',
              id: '2',
              fields: {
                TEXT: 'a',
              },
            },
          },
          ADD5: {
            block: {
              type: 'text',
              id: '3',
              fields: {
                TEXT: 'b',
              },
            },
          },
          ADD2: {
            block: {
              type: 'text',
              id: '4',
              fields: {
                TEXT: 'c',
              },
            },
          },
          ADD4: {
            block: {
              type: 'text',
              id: '5',
              fields: {
                TEXT: 'd',
              },
            },
          },
        },
      },
      expectedJson: {
        type: 'dynamic_list_create',
        id: '1',
        extraState: {
          itemCount: 4,
        },
        inputs: {
          ADD0: {
            block: {
              type: 'text',
              id: '2',
              fields: {
                TEXT: 'a',
              },
            },
          },
          ADD1: {
            block: {
              type: 'text',
              id: '3',
              fields: {
                TEXT: 'b',
              },
            },
          },
          ADD2: {
            block: {
              type: 'text',
              id: '4',
              fields: {
                TEXT: 'c',
              },
            },
          },
          ADD3: {
            block: {
              type: 'text',
              id: '5',
              fields: {
                TEXT: 'd',
              },
            },
          },
        },
      },
      assertBlockStructure: (block) => {
        assertBlockStructure(block, [/ADD0/, /ADD1/, /ADD2/, /ADD3/]);
      },
    },
  ];
  testHelpers.runSerializationTestSuite(testCases, Blockly);
});
