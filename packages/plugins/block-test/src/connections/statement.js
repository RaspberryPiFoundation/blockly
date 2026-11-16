/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Statement connection test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_connections_statement_blue',
    message0: 'Blue %1',
    args0: [
      {
        type: 'input_statement',
        name: 'NAME',
        check: 'greenRel',
      },
    ],
    previousStatement: 'nonePrev',
    nextStatement: 'greenRel',
    colour: 230,
    tooltip:
      'Prev: nonePrev\n' +
      'Next: greenRel\n' +
      'Statement: greenRel\n' +
      'Next connection can accept yellow blocks but not red blocks.\n' +
      'Statement connection can accept yellow blocks but not red blocks.',
  },
  {
    type: 'test_connections_statement_yellow',
    message0: 'Yellow %1',
    args0: [
      {
        type: 'input_statement',
        name: 'NAME',
        check: ['yellowRel', 'orangeRel'],
      },
    ],
    previousStatement: ['greenRel', 'yellowRel'],
    nextStatement: ['yellowRel', 'orangeRel'],
    colour: 60,
    tooltip:
      'Prev: yellowRel, greenRel\n' +
      'Next: yellowRel, orangeRel\n' +
      'Statement: orangeRel\n' +
      'Prev can connect to yellow blocks and blue blocks, but not red' +
      ' blocks.\n' +
      'Next can connect to yellow blocks and red blocks, but not blue' +
      ' blocks.\n' +
      'Statement connection can accept yellow blocks and red blocks but not' +
      ' blue blocks.\n',
  },
  {
    type: 'test_connections_statement_red',
    message0: 'Red %1',
    args0: [
      {
        type: 'input_statement',
        name: 'NAME',
        check: 'noneNext',
      },
    ],
    previousStatement: 'orangeRel',
    nextStatement: 'noneNext',
    colour: 0,
    tooltip:
      'Prev: orangeRel\n' +
      'Next: noneNext\n' +
      'Statement: noneNext\n' +
      'Prev connection can accept yellow blocks but not blue blocks.\n' +
      'Statement connection accepts none.',
  },
  {
    type: 'test_connections_statement_nonext',
    message0: 'None %1',
    args0: [
      {
        type: 'input_statement',
        name: 'NAME',
        check: ['yellowRel', 'orangeRel'],
      },
    ],
    previousStatement: ['greenRel', 'yellowRel'],
    colour: 60,
    tooltip:
      'Prev: yellowRel, greenRel\n' +
      'Next: yellowRel, orangeRel\n' +
      'Statement: orangeRel\n' +
      'Prev can connect to yellow blocks and blue blocks, but not red' +
      ' blocks.\n' +
      'Statement connection can accept yellow blocks and red blocks but not' +
      ' blue blocks.\n',
  },
  {
    type: 'test_connections_multistatement_1valid',
    message0: 'none %1 both %2',
    args0: [
      {
        type: 'input_statement',
        name: 'NAME',
        check: 'noneNext',
      },
      {
        type: 'input_statement',
        name: 'NAME',
        check: ['yellowRel', 'orangeRel'],
      },
    ],
    previousStatement: ['greenRel', 'yellowRel'],
    colour: 60,
    tooltip:
      'Prev: yellowRel, greenRel\n' +
      'Next: yellowRel, orangeRel\n' +
      'Statement: orangeRel\n' +
      'Prev can connect to yellow blocks and blue blocks, but not red' +
      ' blocks.\n' +
      'Top Statement cannot connect to anything, except grey blocks.\n' +
      'Bottom Statement connection can accept yellow blocks and red blocks' +
      ' but not blue blocks.\n',
  },
  {
    type: 'test_connections_multistatement_2valid',
    message0: 'both %1 both %2',
    args0: [
      {
        type: 'input_statement',
        name: 'NAME',
        check: ['yellowRel', 'orangeRel'],
      },
      {
        type: 'input_statement',
        name: 'NAME',
        check: ['yellowRel', 'orangeRel'],
      },
    ],
    previousStatement: ['greenRel', 'yellowRel'],
    colour: 60,
    tooltip:
      'Prev: yellowRel, greenRel\n' +
      'Next: yellowRel, orangeRel\n' +
      'Statement: orangeRel\n' +
      'Prev can connect to yellow blocks and blue blocks, but not red' +
      ' blocks.\n' +
      'Top Statement connection can accept yellow blocks and red blocks but' +
      ' not blue blocks.\n' +
      'Bottom Statement connection can accept yellow blocks and red blocks' +
      ' but not blue blocks.\n',
  },
]);

/**
 * Handles "insert" button in the connection statement test category. This will
 * insert a group of test blocks connected as statements.
 * @param {!Blockly.FlyoutButton} button The flyout button.
 */
const insertConnectionStatements = function (button) {
  const workspace = button.getTargetWorkspace();
  Blockly.Xml.domToWorkspace(
    Blockly.utils.xml.textToDom(
      '<xml xmlns="https://developers.google.com/blockly/xml">\n' +
        '  <block type="test_connections_statement_blue">\n' +
        '    <statement name="NAME">\n' +
        '      <block type="test_connections_statement_yellow">\n' +
        '        <statement name="NAME">\n' +
        '          <block type="test_connections_statement_yellow">\n' +
        '            <statement name="NAME">\n' +
        '              <block type="test_connections_statement_red"/>\n' +
        '            </statement>\n' +
        '          </block>\n' +
        '        </statement>\n' +
        '      </block>\n' +
        '    </statement>\n' +
        '  </block>\n' +
        '</xml>',
    ),
    workspace,
  );
};

/**
 * The Statement connections category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Statement',
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
      callbackkey: 'insertConnectionStatements',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_statement_blue',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_statement_yellow',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_statement_red',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_statement_nonext',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_multistatement_1valid',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_multistatement_2valid',
    },
  ],
};

/**
 * Initialize this toolbox category.
 * @param {!Blockly.WorkspaceSvg} workspace The Blockly workspace.
 */
export function onInit(workspace) {
  workspace.registerButtonCallback(
    'insertConnectionStatements',
    insertConnectionStatements,
  );
}
