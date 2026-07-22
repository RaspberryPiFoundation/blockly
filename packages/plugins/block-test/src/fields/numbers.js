/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Number fields test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_numbers_float',
    message0: 'float %1',
    args0: [
      {
        type: 'field_number',
        name: 'NUM',
        text: '0',
      },
    ],
    style: 'math_blocks',
    output: 'Number',
    tooltip: 'A number.',
  },
  {
    type: 'test_numbers_whole',
    message0: 'precision 1 %1',
    args0: [
      {
        type: 'field_number',
        name: 'NUM',
        precision: 1,
        text: '0',
      },
    ],
    style: 'math_blocks',
    output: 'Number',
    tooltip: 'The number should be rounded to multiples of 1',
  },
  {
    type: 'test_numbers_hundredths',
    message0: 'precision 0.01 %1',
    args0: [
      {
        type: 'field_number',
        name: 'NUM',
        precision: 0.01,
        text: '0',
      },
    ],
    style: 'math_blocks',
    output: 'Number',
    tooltip: 'The number should be rounded to multiples of 0.01',
  },
  {
    type: 'test_numbers_halves',
    message0: 'precision 0.5 %1',
    args0: [
      {
        type: 'field_number',
        name: 'NUM',
        precision: 0.5,
        text: '0',
      },
    ],
    style: 'math_blocks',
    output: 'Number',
    tooltip: 'The number should be rounded to multiples of 0.5',
  },
  {
    type: 'test_numbers_three_halves',
    message0: 'precision 1.5 %1',
    args0: [
      {
        type: 'field_number',
        name: 'NUM',
        precision: 1.5,
        text: '0',
      },
    ],
    style: 'math_blocks',
    output: 'Number',
    tooltip: 'The number should be rounded to multiples of 1.5',
  },
  {
    type: 'test_numbers_whole_bounded',
    message0: 'midi note %1',
    args0: [
      {
        type: 'field_number',
        name: 'NOTE',
        precision: 1,
        min: 1,
        max: 127,
        text: '0',
      },
    ],
    style: 'math_blocks',
    output: 'Note',
    tooltip: 'A midi note.',
  },
]);

/**
 * The Numbers field category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Numbers',
  contents: [
    {
      kind: 'BLOCK',
      blockxml: `
<block type="test_numbers_float">
  <field name="NUM">123.456</field>
</block>`,
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="test_numbers_hundredths">
  <field name="NUM">123.456</field>
</block>`,
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="test_numbers_halves">
  <field name="NUM">123.456</field>
</block>`,
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="test_numbers_whole">
  <field name="NUM">123.456</field>
</block>`,
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="test_numbers_three_halves">
  <field name="NUM">123.456</field>
</block>`,
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="test_numbers_whole_bounded">
  <field name="NOTE">60</field>
</block>`,
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
