/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Angle field test playground.
 */

import * as Blockly from 'blockly';
import {createPlayground} from '@blockly/dev-tools';
import {registerFieldAngle} from '../src/index';

/**
 * An array of blocks that are defined only for the purposes of
 * manually and visually testing the angle field.
 */
const testBlockDefinitions = [
  {
    type: 'test_standard_field_values',
    message0: '%1',
    args0: [
      {
        type: 'field_angle',
        name: 'FIELDNAME',
        alt: {
          type: 'field_label',
          text: `No field_angle`,
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
        type: 'field_angle',
        name: 'FIELDNAME',
        value: 50,
        alt: {
          type: 'field_label',
          text: `No field_angle`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_custom_field_values_compass',
    message0: 'compass %1',
    args0: [
      {
        type: 'field_angle',
        name: 'FIELDNAME',
        mode: 'compass',
        value: 90,
        alt: {
          type: 'field_label',
          text: `No field_angle`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_custom_field_values_protractor',
    message0: 'protractor %1',
    args0: [
      {
        type: 'field_angle',
        name: 'FIELDNAME',
        mode: 'protractor',
        value: 90,
        alt: {
          type: 'field_label',
          text: `No field_angle`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_custom_field_values_round',
    message0: 'round %1',
    args0: [
      {
        type: 'field_angle',
        name: 'FIELDNAME',
        precision: 0.1,
        value: 123,
        alt: {
          type: 'field_label',
          text: `No field_angle`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_custom_field_values_radians',
    message0: 'radians %1',
    args0: [
      {
        type: 'field_angle',
        name: 'FIELDNAME',
        precision: 0.1,
        clockwise: true,
        value: 0,
        min: 0,
        max: Math.PI,
        displayMin: -Math.PI,
        displayMax: Math.PI,
        minorTick: Math.PI / 8,
        majorTick: Math.PI,
        symbol: ' rad',
        alt: {
          type: 'field_label',
          text: `No field_angle`,
        },
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_custom_field_values_quadrant',
    message0: 'quadrant %1',
    args0: [
      {
        type: 'field_angle',
        name: 'FIELDNAME',
        precision: 1,
        value: 0,
        min: 0,
        max: 2,
        displayMin: 0,
        displayMax: 8,
        minorTick: 0,
        majorTick: 1,
        symbol: '',
        alt: {
          type: 'field_label',
          text: `No field_angle`,
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
        type: 'field_angle',
        name: 'FIELDNAME',
        alt: {
          type: 'field_label',
          text: `No field_angle`,
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
        type: 'field_angle',
        name: 'FIELDNAME',
        value: 50,
        alt: {
          type: 'field_label',
          text: `No field_angle`,
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
 * test blocks to exercise the angle field in different contexts
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
      type: 'test_custom_field_values_compass',
    },
    {
      kind: 'block',
      type: 'test_custom_field_values_protractor',
    },
    {
      kind: 'block',
      type: 'test_custom_field_values_round',
    },
    {
      kind: 'block',
      type: 'test_custom_field_values_radians',
    },
    {
      kind: 'block',
      type: 'test_custom_field_values_quadrant',
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
  registerFieldAngle();
  const defaultOptions: Blockly.BlocklyOptions = {
    toolbox: jsonToolbox,
  };
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createPlayground(rootElement, createWorkspace, defaultOptions);
  }
});
