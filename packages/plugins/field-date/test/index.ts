/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin test.
 */

import * as Blockly from 'blockly';
import {createPlayground} from '@blockly/dev-tools';
import '../src/index';

/**
 * An array of blocks that are defined only for the purposes of
 * manually and visually testing the date field.
 */
const testBlockDefinitions = [
  {
    type: 'test_standard_field_values',
    message0: '%1',
    args0: [
      {
        type: 'field_date',
        name: 'FIELDNAME',
        alt: {
          type: 'field_label',
          text: `No field_date`,
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
        type: 'field_date',
        name: 'FIELDNAME',
        date: '2020-02-20',
        alt: {
          type: 'field_label',
          text: `No field_date`,
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
        type: 'field_date',
        name: 'FIELDNAME',
        alt: {
          type: 'field_label',
          text: `No field_date`,
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
        type: 'field_date',
        name: 'FIELDNAME',
        date: '2020-02-20',
        alt: {
          type: 'field_label',
          text: `No field_date`,
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
  {
    type: 'test_custom_field_values_and_tooltip',
    message0: 'block %1',
    args0: [
      {
        type: 'field_date',
        name: 'FIELDNAME',
        date: '2021-03-13',
        tooltip: 'This date block has a tooltip!',
        alt: {
          type: 'field_label',
          text: `No field_date`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
];

Blockly.defineBlocksWithJsonArray(testBlockDefinitions);

/**
 * A test toolbox containing the exported blocks and a variety of
 * test blocks to exercise the date field in different contexts
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
    {
      kind: 'block',
      type: 'test_custom_field_values_and_tooltip',
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
    // NOTE: Will need to update @blockly/dev-tools package JSON to keep it's
    // version of Blockly in sync with this package's. Both call for ^9.0.0,
    // though the package-locks result in each installing different versions.
    createPlayground(rootElement, createWorkspace, defaultOptions);
  }
});
