/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Style test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_style_hat',
    message0: 'Hat block (event)',
    nextStatement: null,
    style: 'hat_blocks',
  },
  {
    type: 'test_style_hex1',
    message0: 'Block color: Bright purple %1 %2 %3 %4',
    args0: [
      {
        type: 'field_input',
        name: 'TEXT',
        text: '#992aff',
      },
      {
        type: 'field_dropdown',
        name: 'DROPDOWN',
        options: [
          ['option', 'ONE'],
          ['option', 'TWO'],
        ],
      },
      {
        type: 'field_checkbox',
        name: 'NAME',
        checked: true,
      },
      {
        type: 'input_value',
        name: 'NAME',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#992aff',
  },
  {
    type: 'test_style_hex2',
    message0: 'Block color: White %1 %2 %3 %4',
    args0: [
      {
        type: 'field_input',
        name: 'TEXT',
        text: '#fefefe',
      },
      {
        type: 'field_dropdown',
        name: 'DROPDOWN',
        options: [
          ['option', 'ONE'],
          ['option', 'TWO'],
        ],
      },
      {
        type: 'field_checkbox',
        name: 'NAME',
        checked: true,
      },
      {
        type: 'input_value',
        name: 'NAME',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#fefefe',
  },
  {
    type: 'test_style_hex3',
    message0: 'Block color: Black %1 %2 %3 %4',
    args0: [
      {
        type: 'field_input',
        name: 'TEXT',
        text: '#010101',
      },
      {
        type: 'field_dropdown',
        name: 'DROPDOWN',
        options: [
          ['option', 'ONE'],
          ['option', 'TWO'],
        ],
      },
      {
        type: 'field_checkbox',
        name: 'NAME',
        checked: true,
      },
      {
        type: 'input_value',
        name: 'NAME',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#010101',
  },
  {
    type: 'test_style_no_colour',
    message0: 'Block color: unset',
  },
  {
    type: 'test_style_hex4',
    message0: 'Block color: #RRGGBBAA (invalid)',
    colour: '#992aff99',
  },
  {
    type: 'test_style_hex5',
    message0: 'Block color: #RRGGBB (invalid)',
    colour: '#NotHex',
  },
  {
    type: 'test_style_emoji',
    message0: 'Robot Face: \uD83E\uDD16',
    colour: '#AAAAAA',
  },
]);

/**
 * The Style category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Style',
  contents: [
    {
      kind: 'LABEL',
      text: 'Hats',
    },
    {
      kind: 'BLOCK',
      type: 'test_style_hat',
    },
    {
      kind: 'LABEL',
      text: 'Colour',
    },
    {
      kind: 'BLOCK',
      type: 'test_style_hex1',
    },
    {
      kind: 'BLOCK',
      type: 'test_style_hex2',
    },
    {
      kind: 'BLOCK',
      type: 'test_style_hex3',
    },
    {
      kind: 'BLOCK',
      type: 'test_style_no_colour',
    },
    {
      kind: 'BLOCK',
      type: 'test_style_hex4',
    },
    {
      kind: 'BLOCK',
      type: 'test_style_hex5',
      gap: '40',
    },
    {
      kind: 'BLOCK',
      type: 'test_style_hex5',
      disabled: 'true',
    },
  ],
};

/**
 * Initialize this toolbox category.
 * @param {!Blockly.WorkspaceSvg} workspace The Blockly workspace.
 */
export function onInit(workspace) {
  // NOP
}
