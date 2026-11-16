/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Row connection test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_connections_row_input',
    message0: '%1',
    args0: [
      {
        type: 'input_value',
        name: 'NAME',
      },
    ],
    colour: '#aaaaaa',
    tooltip: 'No Checks\n' + 'Can connect to any output connection.',
  },
  {
    type: 'test_connections_row_blue',
    message0: '%1',
    args0: [
      {
        type: 'input_value',
        name: 'NAME',
        check: 'greenRel',
      },
    ],
    output: 'noneOut',
    colour: 230,
    tooltip:
      'Output: noneOut\n' +
      'Input: greenRel\n' +
      'Input connection can accept yellow blocks but not red blocks.',
  },
  {
    type: 'test_connections_row_yellow',
    message0: '%1',
    args0: [
      {
        type: 'input_value',
        name: 'NAME',
        check: ['orangeRel', 'yellowRel'],
      },
    ],
    output: ['yellowRel', 'greenRel'],
    colour: 60,
    tooltip:
      'Output: yellowRel, greenRel\n' +
      'Input: yellowRel, orangeRel\n' +
      'Output can connect to yellow blocks and blue blocks, but not red ' +
      'blocks.\n' +
      'Input can connect to yellow blocks and red blocks, but not blue ' +
      'blocks.',
  },
  {
    type: 'test_connections_row_red',
    message0: '%1',
    args0: [
      {
        type: 'input_value',
        name: 'NAME',
        check: 'noneIn',
      },
    ],
    output: 'orangeRel',
    colour: 0,
    tooltip:
      'Output: orangeRel\n' +
      'Input: noneIn\n' +
      'Output can connect to yellow blocks, but not blue blocks.',
  },
  {
    type: 'test_connections_row_output',
    message0: '',
    output: null,
    colour: '#aaaaaa',
    tooltip: 'No Checks\n' + 'Can connect to any input connection.',
  },

  {
    type: 'test_connections_multivalue_1valid',
    message0: 'none %1 both %2',
    args0: [
      {
        type: 'input_value',
        name: 'NAME1',
        align: 'RIGHT',
        check: 'noneIn',
      },
      {
        type: 'input_value',
        name: 'NAME2',
        align: 'RIGHT',
        check: ['yellowRel', 'orangeRel'],
      },
    ],
    output: ['yellowRel', 'greenRel'],
    colour: 60,
    tooltip:
      'Output: yellowRel, greenRel\n' +
      'Input Top: noneIn\n' +
      'Input Bottom: yellowRel, orangeRel\n' +
      'Output can connect to yellow blocks and blue blocks, but not red' +
      ' blocks.\n' +
      'Top Input can connect to nothing, except grey blocks.\n' +
      'Bottom Input can connect to yellow blocks and red blocks, but not' +
      ' blue blocks.',
  },
  {
    type: 'test_connections_multivalue_2valid',
    message0: 'both %1 both %2',
    args0: [
      {
        type: 'input_value',
        name: 'NAME1',
        align: 'RIGHT',
        check: ['yellowRel', 'orangeRel'],
      },
      {
        type: 'input_value',
        name: 'NAME2',
        align: 'RIGHT',
        check: ['yellowRel', 'orangeRel'],
      },
    ],
    output: ['yellowRel', 'greenRel'],
    colour: 60,
    tooltip:
      'Output: yellowRel, greenRel\n' +
      'Input Top:  yellowRel, orangeRel\n' +
      'Input Bottom: yellowRel, orangeRel\n' +
      'Output can connect to yellow blocks and blue blocks, but not red' +
      ' blocks.\n' +
      'Top Input can connect to yellow blocks and red blocks, but not blue' +
      ' blocks.\n' +
      'Bottom Input can connect to yellow blocks and red blocks, but not' +
      ' blue blocks.',
  },
]);

/**
 * Handles "insert" button in the connection row test category. This will insert
 * a group of test blocks connected in a row.
 * @param {!Blockly.FlyoutButton} button The Flyout button.
 */
const insertConnectionRows = function (button) {
  const workspace = button.getTargetWorkspace();
  Blockly.Xml.domToWorkspace(
    Blockly.utils.xml.textToDom(
      '<xml xmlns="https://developers.google.com/blockly/xml">\n' +
        '  <block type="test_connections_row_input">\n' +
        '    <value name="NAME">\n' +
        '      <block type="test_connections_row_blue">\n' +
        '        <value name="NAME">\n' +
        '          <block type="test_connections_row_yellow">\n' +
        '            <value name="NAME">\n' +
        '              <block type="test_connections_row_yellow">\n' +
        '                <value name="NAME">\n' +
        '                  <block type="test_connections_row_red">\n' +
        '                    <value name="NAME">\n' +
        '                      <block type="test_connections_row_output"/>\n' +
        '                    </value>\n' +
        '                  </block>\n' +
        '                </value>\n' +
        '              </block>\n' +
        '            </value>\n' +
        '          </block>\n' +
        '        </value>\n' +
        '      </block>\n' +
        '    </value>\n' +
        '  </block>\n' +
        '</xml>',
    ),
    workspace,
  );
};

/**
 * The Row connections category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Row',
  contents: [
    {
      kind: 'LABEL',
      text: 'blocks have',
    },
    {
      kind: 'SEP',
      gap: '-1',
    },
    {
      kind: 'LABEL',
      text: 'tooltips',
    },
    {
      kind: 'BUTTON',
      text: 'insert',
      callbackkey: 'insertConnectionRows',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_row_input',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_row_blue',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_row_yellow',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_row_red',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_row_output',
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="test_connections_row_yellow">
  <value name="NAME">
    <block type="test_connections_row_yellow" movable="false">
    </block>
  </value>
</block>`,
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_multivalue_1valid',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_multivalue_2valid',
    },
  ],
};

/**
 * Initialize this toolbox category.
 * @param {!Blockly.WorkspaceSvg} workspace The Blockly workspace.
 */
export function onInit(workspace) {
  workspace.registerButtonCallback(
    'insertConnectionRows',
    insertConnectionRows,
  );
}
