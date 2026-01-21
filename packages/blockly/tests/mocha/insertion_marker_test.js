/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('InsertionMarkers', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = Blockly.inject('blocklyDiv', {});
    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'stack_block',
        'message0': '',
        'previousStatement': null,
        'nextStatement': null,
      },
      {
        'type': 'row_block',
        'message0': '%1',
        'args0': [
          {
            'type': 'input_value',
            'name': 'INPUT',
          },
        ],
        'output': null,
      },
      {
        'type': 'statement_block',
        'message0': '%1',
        'args0': [
          {
            'type': 'input_statement',
            'name': 'STATEMENT',
          },
        ],
        'previousStatement': null,
        'nextStatement': null,
      },
    ]);
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });
  suite('Code Generation', function () {
    setup(function () {
      javascriptGenerator.forBlock['stack_block'] = function (block) {
        return 'stack[' + block.id + '];\n';
      };
      javascriptGenerator.forBlock['row_block'] = function (block) {
        const value = javascriptGenerator.valueToCode(
          block,
          'INPUT',
          javascriptGenerator.ORDER_NONE,
        );
        const code = 'row[' + block.id + '](' + value + ')';
        return [code, javascriptGenerator.ORDER_NONE];
      };
      javascriptGenerator.forBlock['statement_block'] = function (block) {
        return (
          'statement[' +
          block.id +
          ']{\n' +
          javascriptGenerator.statementToCode(block, 'STATEMENT') +
          '};\n'
        );
      };

      this.assertGen = function (xml, expectedCode) {
        Blockly.Xml.domToWorkspace(xml, this.workspace);
        const block = this.workspace.getBlockById('insertion');
        block.isInsertionMarker_ = true;
        const code = javascriptGenerator.workspaceToCode(this.workspace);
        assert.equal(code, expectedCode);
      };
    });
    teardown(function () {
      delete javascriptGenerator.forBlock['stack_block'];
      delete javascriptGenerator.forBlock['row_block'];
      delete javascriptGenerator.forBlock['statement_block'];
    });
    test('Marker Surrounds', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="statement_block" id="insertion">' +
          '    <statement name="STATEMENT">' +
          '      <block type="statement_block" id="a"/>' +
          '    </statement>' +
          '  </block>' +
          '</xml>',
      );
      this.assertGen(xml, 'statement[a]{\n};\n');
    });
    test('Marker Enclosed', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="statement_block" id="a">' +
          '    <statement name="STATEMENT">' +
          '      <block type="statement_block" id="insertion"/>' +
          '    </statement>' +
          '  </block>' +
          '</xml>',
      );
      this.assertGen(xml, 'statement[a]{\n};\n');
    });
    test('Marker Enclosed and Surrounds', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="statement_block" id="a">' +
          '    <statement name="STATEMENT">' +
          '      <block type="statement_block" id="insertion">' +
          '        <statement name="STATEMENT">' +
          '          <block type="statement_block" id="b"/>' +
          '        </statement>' +
          '      </block>' +
          '    </statement>' +
          '  </block>' +
          '</xml>',
      );
      this.assertGen(
        xml,
        'statement[a]{\n' + '  statement[b]{\n' + '  };\n' + '};\n',
      );
    });
    test('Marker Prev', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="stack_block" id="insertion">' +
          '    <next>' +
          '      <block type="stack_block" id="a"/>' +
          '    </next>' +
          '  </block>' +
          '</xml>',
      );
      this.assertGen(xml, 'stack[a];\n');
    });
    test('Marker Next', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="stack_block" id="a">' +
          '    <next>' +
          '      <block type="stack_block" id="insertion"/>' +
          '    </next>' +
          '  </block>' +
          '</xml>',
      );
      this.assertGen(xml, 'stack[a];\n');
    });
    test('Marker Middle of Stack', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="stack_block" id="a">' +
          '    <next>' +
          '      <block type="stack_block" id="insertion">' +
          '        <next>' +
          '          <block type="stack_block" id="b"/>' +
          '        </next>' +
          '      </block>' +
          '    </next>' +
          '  </block>' +
          '</xml>',
      );
      this.assertGen(xml, 'stack[a];\n' + 'stack[b];\n');
    });
    test('Marker On Output', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="row_block" id="insertion">' +
          '    <value name="INPUT">' +
          '      <block type="row_block" id="a"/>' +
          '    </value>' +
          '  </block>' +
          '</xml>',
      );
      this.assertGen(xml, 'row[a]();\n');
    });
    test('Marker On Input', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="row_block" id="a">' +
          '    <value name="INPUT">' +
          '      <block type="row_block" id="insertion"/>' +
          '    </value>' +
          '  </block>' +
          '</xml>',
      );
      this.assertGen(xml, 'row[a]();\n');
    });
    test('Marker Middle of Row', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="row_block" id="a">' +
          '    <value name="INPUT">' +
          '      <block type="row_block" id="insertion">' +
          '        <value name="INPUT">' +
          '          <block type="row_block" id="b"/>' +
          '        </value>' +
          '      </block>' +
          '    </value>' +
          '  </block>' +
          '</xml>',
      );
      this.assertGen(xml, 'row[a](row[b]());\n');
    });
    test('Marker Detatched', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="stack_block" id="insertion"/>' +
          '  <block type="stack_block" id="a"/>' +
          '</xml>',
      );
      this.assertGen(xml, 'stack[a];\n');
    });
  });
  suite('Serialization', function () {
    setup(function () {
      this.assertXml = function (xmlIn, expectXml) {
        Blockly.Xml.domToWorkspace(xmlIn, this.workspace);
        const block = this.workspace.getBlockById('insertion');
        block.setInsertionMarker(true);
        let xml = Blockly.Xml.workspaceToDom(this.workspace);
        Blockly.Xml.domToWorkspace(xml, this.workspace);
        xml = Blockly.Xml.domToText(xml);
        assert.equal(xml, expectXml);
      };
    });
    test('Marker Surrounds', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="statement_block" id="insertion" x="20" y="20">' +
          '    <statement name="STATEMENT">' +
          '      <block type="statement_block" id="a"/>' +
          '    </statement>' +
          '  </block>' +
          '</xml>',
      );
      // Note how the x and y are not 20, they are slightly lower and end-er
      // because these are the coords of the wrapped block.
      this.assertXml(
        xml,
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '<block type="statement_block" id="a" x="41" y="31"></block>' +
          '</xml>',
      );
    });
    test('Marker Enclosed', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="statement_block" id="a" x="20" y="20">' +
          '    <statement name="STATEMENT">' +
          '      <block type="statement_block" id="insertion"/>' +
          '    </statement>' +
          '  </block>' +
          '</xml>',
      );
      this.assertXml(
        xml,
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '<block type="statement_block" id="a" x="20" y="20"></block>' +
          '</xml>',
      );
    });
    test('Marker Enclosed and Surrounds', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="statement_block" id="a" x="20" y="20">' +
          '    <statement name="STATEMENT">' +
          '      <block type="statement_block" id="insertion">' +
          '        <statement name="STATEMENT">' +
          '          <block type="statement_block" id="b"/>' +
          '        </statement>' +
          '      </block>' +
          '    </statement>' +
          '  </block>' +
          '</xml>',
      );
      this.assertXml(
        xml,
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '<block type="statement_block" id="a" x="20" y="20">' +
          '<statement name="STATEMENT">' +
          '<block type="statement_block" id="b"></block>' +
          '</statement>' +
          '</block>' +
          '</xml>',
      );
    });
    test('Marker Prev', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="stack_block" id="insertion" x="20" y="20">' +
          '    <next>' +
          '      <block type="stack_block" id="a"/>' +
          '    </next>' +
          '  </block>' +
          '</xml>',
      );
      // Note how the y coord is not at 20, it is lower. This is because these
      // are the coords of the next block.
      this.assertXml(
        xml,
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '<block type="stack_block" id="a" x="20" y="46"></block>' +
          '</xml>',
      );
    });
    test('Marker Next', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="stack_block" id="a" x="20" y="20">' +
          '    <next>' +
          '      <block type="stack_block" id="insertion"/>' +
          '    </next>' +
          '  </block>' +
          '</xml>',
      );
      this.assertXml(
        xml,
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '<block type="stack_block" id="a" x="20" y="20"></block>' +
          '</xml>',
      );
    });
    test('Marker Middle of Stack', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="stack_block" id="a" x="20" y="20">' +
          '    <next>' +
          '      <block type="stack_block" id="insertion">' +
          '        <next>' +
          '          <block type="stack_block" id="b"/>' +
          '        </next>' +
          '      </block>' +
          '    </next>' +
          '  </block>' +
          '</xml>',
      );
      this.assertXml(
        xml,
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '<block type="stack_block" id="a" x="20" y="20">' +
          '<next>' +
          '<block type="stack_block" id="b"></block>' +
          '</next>' +
          '</block>' +
          '</xml>',
      );
    });
    test('Marker On Output', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="row_block" id="insertion" x="20" y="20">' +
          '    <value name="INPUT">' +
          '      <block type="row_block" id="a"/>' +
          '    </value>' +
          '  </block>' +
          '</xml>',
      );
      // Note how the x value is not at 20. This is because these are the coords
      // of the wrapped block.
      this.assertXml(
        xml,
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '<block type="row_block" id="a" x="41" y="20"></block>' +
          '</xml>',
      );
    });
    test('Marker On Input', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="row_block" id="a" x="20" y="20">' +
          '    <value name="INPUT">' +
          '      <block type="row_block" id="insertion"/>' +
          '    </value>' +
          '  </block>' +
          '</xml>',
      );
      this.assertXml(
        xml,
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '<block type="row_block" id="a" x="20" y="20"></block>' +
          '</xml>',
      );
    });
    test('Marker Middle of Row', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="row_block" id="a" x="20" y="20">' +
          '    <value name="INPUT">' +
          '      <block type="row_block" id="insertion">' +
          '        <value name="INPUT">' +
          '          <block type="row_block" id="b"/>' +
          '        </value>' +
          '      </block>' +
          '    </value>' +
          '  </block>' +
          '</xml>',
      );
      this.assertXml(
        xml,
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '<block type="row_block" id="a" x="20" y="20">' +
          '<value name="INPUT">' +
          '<block type="row_block" id="b"></block>' +
          '</value>' +
          '</block>' +
          '</xml>',
      );
    });
    test('Marker Detatched', function () {
      const xml = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="stack_block" id="insertion"/>' +
          '  <block type="stack_block" id="a" x="20" y="20"/>' +
          '</xml>',
      );
      this.assertXml(
        xml,
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '<block type="stack_block" id="a" x="20" y="20"></block>' +
          '</xml>',
      );
    });
  });
});
