/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Stack connection test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_connections_stack_next',
    message0: '',
    nextStatement: null,
    colour: '#aaaaaa',
    tooltip: 'No Checks\n' + 'Can connect to any previous connection.',
  },
  {
    type: 'test_connections_stack_blue',
    message0: '',
    previousStatement: 'nonePrev',
    nextStatement: 'greenRel',
    colour: 230,
    tooltip:
      'Prev: nonePrev\n' +
      'Next: greenRel\n' +
      'Next connection can accept yellow blocks but not red blocks.',
  },
  {
    type: 'test_connections_stack_yellow',
    message0: '',
    previousStatement: ['greenRel', 'yellowRel'],
    nextStatement: ['yellowRel', 'orangeRel'],
    colour: 60,
    tooltip:
      'Prev: yellowRel, greenRel\n' +
      'Next: yellowRel, orangeRel\n' +
      'Prev can connect to yellow blocks and blue blocks, but not red' +
      ' blocks.\n' +
      'Next can connect to yellow blocks and red blocks, but not blue' +
      ' blocks.',
  },
  {
    type: 'test_connections_stack_red',
    message0: '',
    previousStatement: 'orangeRel',
    nextStatement: 'noneNext',
    colour: 0,
    tooltip:
      'Prev: orangeRel\n' +
      'Next: noneNext\n' +
      'Prev can connect to yellow blocks, but not blue blocks.',
  },
  {
    type: 'test_connections_stack_prev',
    message0: '',
    previousStatement: null,
    colour: '#aaaaaa',
    tooltip: 'No Checks\n' + 'Can connect to any input connection.',
  },
]);

/**
 * Handles "insert" button in the connection stack test category. This will
 * insert a group of test blocks connected in a stack.
 * @param {!Blockly.FlyoutButton} button The flyout button.
 */
const insertConnectionStacks = function (button) {
  const workspace = button.getTargetWorkspace();
  Blockly.Xml.domToWorkspace(
    Blockly.utils.xml.textToDom(
      '<xml xmlns="https://developers.google.com/blockly/xml">\n' +
        '  <block type="test_connections_stack_next">\n' +
        '    <next>\n' +
        '      <block type="test_connections_stack_blue">\n' +
        '        <next>\n' +
        '          <block type="test_connections_stack_yellow">\n' +
        '            <next>\n' +
        '              <block type="test_connections_stack_yellow">\n' +
        '                <next>\n' +
        '                  <block type="test_connections_stack_red">\n' +
        '                    <next>\n' +
        '                      <block type="test_connections_stack_prev"/>\n' +
        '                    </next>\n' +
        '                  </block>\n' +
        '                </next>\n' +
        '              </block>\n' +
        '            </next>\n' +
        '          </block>\n' +
        '        </next>\n' +
        '      </block>\n' +
        '    </next>\n' +
        '  </block>\n' +
        '</xml>',
    ),
    workspace,
  );
};

/**
 * The Stack connections category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Stack',
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
      callbackkey: 'insertConnectionStacks',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_stack_next',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_stack_blue',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_stack_yellow',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_stack_red',
    },
    {
      kind: 'SEP',
      gap: '7',
    },
    {
      kind: 'BLOCK',
      type: 'test_connections_stack_prev',
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="test_connections_stack_yellow">
  <next>
    <block type="test_connections_stack_yellow" movable="false"></block>
  </next>
</block>`,
    },
  ],
};

/**
 * Initialize this toolbox category.
 * @param {!Blockly.WorkspaceSvg} workspace The Blockly workspace.
 */
export function onInit(workspace) {
  workspace.registerButtonCallback(
    'insertConnectionStacks',
    insertConnectionStacks,
  );
}
