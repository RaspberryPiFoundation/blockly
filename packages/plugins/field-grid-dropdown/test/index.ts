/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Field test.
 */

import * as Blockly from 'blockly';
import {createPlayground} from '@blockly/dev-tools';
import '../src/index';

/**
 * An array of blocks that are defined only for the purposes of
 * manually and visually testing the dropdown grid field.
 */
const testBlockDefinitions = [
  {
    type: 'test_standard_field_values',
    message0: '%1',
    args0: [
      {
        type: 'field_grid_dropdown',
        name: 'FIELDNAME',
        options: [['A', 'A']],
        alt: {
          type: 'field_label',
          text: `No field_grid_dropdown`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_custom_field_values',
    message0: 'Different text length %1',
    args0: [
      {
        type: 'field_grid_dropdown',
        name: 'FIELDNAME',
        options: [
          ['A', 'A'],
          ['long text ', 'long text'],
          ['B', 'B'],
          ['C', 'C'],
          [
            'really really really loooooong text',
            'really really really loooooong text',
          ],
          ['D', 'D'],
          ['E', 'E'],
        ],
        alt: {
          type: 'field_label',
          text: `No field_grid_dropdown`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_custom_field_values_long_text_list',
    message0: 'Long text list %1',
    args0: [
      {
        type: 'field_grid_dropdown',
        name: 'FIELDNAME',
        options: [
          ['A', 'A'],
          ['B', 'B'],
          ['C', 'C'],
          ['D', 'D'],
          ['E', 'E'],
          ['D', 'F'],
          ['G', 'G'],
          ['H', 'H'],
          ['I', 'I'],
          ['J', 'J'],
          ['K', 'K'],
          ['L', 'L'],
          ['M', 'M'],
          ['N', 'N'],
          ['O', 'O'],
          ['P', 'P'],
          ['Q', 'Q'],
          ['R', 'R'],
          ['S', 'S'],
          ['T', 'T'],
          ['U', 'U'],
          ['V', 'V'],
          ['W', 'W'],
          ['X', 'X'],
          ['Y', 'Y'],
          ['Z', 'Z'],
        ],
        alt: {
          type: 'field_label',
          text: `No field_grid_dropdown`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_custom_field_values_images',
    message0: 'Images %1',
    args0: [
      {
        type: 'field_grid_dropdown',
        name: 'FIELDNAME',
        options: [
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/a.png',
              width: 32,
              height: 32,
              alt: 'A',
            },
            'A',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/b.png',
              width: 32,
              height: 32,
              alt: 'B',
            },
            'B',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/c.png',
              width: 32,
              height: 32,
              alt: 'C',
            },
            'C',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/d.png',
              width: 32,
              height: 32,
              alt: 'D',
            },
            'D',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/e.png',
              width: 32,
              height: 32,
              alt: 'E',
            },
            'E',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/f.png',
              width: 32,
              height: 32,
              alt: 'F',
            },
            'F',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/g.png',
              width: 32,
              height: 32,
              alt: 'G',
            },
            'G',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/h.png',
              width: 32,
              height: 32,
              alt: 'H',
            },
            'H',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/i.png',
              width: 32,
              height: 32,
              alt: 'I',
            },
            'I',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/j.png',
              width: 32,
              height: 32,
              alt: 'J',
            },
            'J',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/k.png',
              width: 32,
              height: 32,
              alt: 'K',
            },
            'K',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/l.png',
              width: 32,
              height: 32,
              alt: 'L',
            },
            'L',
          ],
          [
            {
              src: 'https://blockly-demo.appspot.com/static/tests/media/m.png',
              width: 32,
              height: 32,
              alt: 'M',
            },
            'M',
          ],
        ],
        alt: {
          type: 'field_label',
          text: `No field_grid_dropdown`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_custom_field_values_4_columns',
    message0: '4 columns %1',
    args0: [
      {
        type: 'field_grid_dropdown',
        name: 'FIELDNAME',
        columns: '4',
        options: [
          ['A', 'A'],
          ['B', 'B'],
          ['C', 'C'],
          ['D', 'D'],
          ['E', 'E'],
          ['F', 'F'],
          ['G', 'G'],
          ['H', 'H'],
        ],
        alt: {
          type: 'field_label',
          text: `No field_grid_dropdown`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_custom_field_values_custom_colours',
    message0: 'Custom colours %1',
    args0: [
      {
        type: 'field_grid_dropdown',
        name: 'FIELDNAME',
        primaryColour: '#783105',
        borderColour: '#d6a587',
        options: [
          ['A', 'A'],
          ['B', 'B'],
          ['C', 'C'],
          ['D', 'D'],
          ['E', 'E'],
          ['F', 'F'],
          ['G', 'G'],
          ['H', 'H'],
        ],
        alt: {
          type: 'field_label',
          text: `No field_grid_dropdown`,
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
        type: 'field_grid_dropdown',
        name: 'FIELDNAME',
        options: [['A', 'A']],
        alt: {
          type: 'field_label',
          text: `No field_grid_dropdown`,
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
        type: 'field_grid_dropdown',
        name: 'FIELDNAME',
        options: [['A', 'A']],
        alt: {
          type: 'field_label',
          text: `No field_grid_dropdown`,
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
 * test blocks to exercise the dropdown grid field in different contexts
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
      type: 'test_custom_field_values_long_text_list',
    },
    {
      kind: 'block',
      type: 'test_custom_field_values_images',
    },
    {
      kind: 'block',
      type: 'test_custom_field_values_4_columns',
    },
    {
      kind: 'block',
      type: 'test_custom_field_values_custom_colours',
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
): Blockly.Workspace {
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
