/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Colour HSV Sliders field test playground.
 */

import * as Blockly from 'blockly';
import {createPlayground} from '@blockly/dev-tools';
import '../src/index';

/**
 * An array of blocks that are defined only for the purposes of
 * manually and visually testing the HSV slider field.
 */
const testBlockDefinitions = [
  {
    type: 'test_standard_field_values',
    message0: '%1',
    args0: [
      {
        type: 'field_colour_hsv_sliders',
        name: 'FIELDNAME',
        alt: {
          type: 'field_label',
          text: `No field_colour_hsv_sliders`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_custom_field_values',
    message0: '%1',
    args0: [
      {
        type: 'field_colour_hsv_sliders',
        name: 'FIELDNAME',
        colour: '#ff0000',
        alt: {
          type: 'field_label',
          text: `No field_colour_hsv_sliders`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_standard_field_values_and_label',
    message0: 'block %1',
    args0: [
      {
        type: 'field_colour_hsv_sliders',
        name: 'FIELDNAME',
        alt: {
          type: 'field_label',
          text: `No field_colour_hsv_sliders`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_custom_field_values_and_label',
    message0: 'block %1',
    args0: [
      {
        type: 'field_colour_hsv_sliders',
        name: 'FIELDNAME',
        colour: '#ff0000',
        alt: {
          type: 'field_label',
          text: `No field_colour_hsv_sliders`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_parent_block',
    message0: 'parent %1',
    args0: [
      {
        type: 'input_value',
        name: 'INPUT',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'loop_blocks',
  },
];

Blockly.defineBlocksWithJsonArray(testBlockDefinitions);

/**
 * A test toolbox containing the exported blocks and a variety of
 * test blocks to exercise the colour field in different contexts
 * (on a shadow block, as the only field on a block, etc).
 * These are in a simple toolbox, rather than a category toolbox, so that
 * they are all instantiated every time the test page is opened.
 */
const jsonToolbox = {
  contents: [
    {
      kind: 'label',
      text: 'Test blocks: default field values',
    },
    {
      kind: 'block',
      type: 'test_standard_field_values',
    },
    {
      kind: 'block',
      type: 'test_parent_block',
      inputs: {
        INPUT: {
          shadow: {
            type: 'test_standard_field_values',
          },
        },
      },
    },
    {
      kind: 'block',
      type: 'test_standard_field_values_and_label',
    },
    {
      kind: 'block',
      type: 'test_parent_block',
      inputs: {
        INPUT: {
          shadow: {
            type: 'test_standard_field_values_and_label',
          },
        },
      },
    },
    {
      kind: 'label',
      text: 'Test blocks: custom field values',
    },
    {
      kind: 'block',
      type: 'test_custom_field_values',
    },
    {
      kind: 'block',
      type: 'test_parent_block',
      inputs: {
        INPUT: {
          shadow: {
            type: 'test_custom_field_values',
          },
        },
      },
    },
    {
      kind: 'block',
      type: 'test_custom_field_values_and_label',
    },
    {
      kind: 'block',
      type: 'test_parent_block',
      inputs: {
        INPUT: {
          shadow: {
            type: 'test_custom_field_values_and_label',
          },
        },
      },
    },
  ],
};

/**
 * Create a workspace.
 *
 * @param blocklyDiv The blockly container div.
 * @param options The Blockly options.
 * @returns The created workspace.
 */
function createWorkspace(
  blocklyDiv: HTMLElement,
  options: Blockly.BlocklyOptions,
): Blockly.WorkspaceSvg {
  const workspace = Blockly.inject(blocklyDiv, options);
  return workspace;
}

document.addEventListener('DOMContentLoaded', function () {
  const defaultOptions: Blockly.BlocklyOptions = {
    toolbox: jsonToolbox,
  };
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createPlayground(rootElement, createWorkspace, defaultOptions);
  }
});
