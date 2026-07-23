/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Basic test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_basic_empty',
    message0: '',
    args0: [],
  },
  {
    type: 'test_basic_stack',
    message0: 'stack block',
    previousStatement: null,
    nextStatement: null,
    colour: '120',
  },
  {
    type: 'test_basic_dummy',
    message0: 'dummy input %1',
    args0: [
      {
        type: 'input_dummy',
      },
    ],
    style: 'math_blocks',
  },
  {
    type: 'test_basic_multiple_dummy',
    message0: 'first dummy %1 second dummy %2',
    args0: [
      {
        type: 'input_dummy',
      },
      {
        type: 'input_dummy',
      },
    ],
    style: 'math_blocks',
  },
  {
    type: 'test_basic_row',
    message0: 'row block %1',
    args0: [
      {
        type: 'input_value',
        name: 'INPUT',
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_basic_value_to_stack',
    message0: 'value to stack',
    nextStatement: null,
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_basic_value_to_statement',
    message0: 'value to statement %1',
    args0: [
      {
        type: 'input_statement',
        name: 'STATEMENT',
      },
    ],
    output: null,
    style: 'math_blocks',
  },
  {
    type: 'test_basic_limit_instances',
    message0: 'limit 3 instances %1 %2',
    args0: [
      {
        type: 'input_dummy',
      },
      {
        type: 'input_statement',
        name: 'STATEMENT',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'math_blocks',
  },
  {
    type: 'test_basic_tooltips',
    message0: '%1 %2 %3',
    args0: [
      {
        type: 'field_label',
        name: 'NAME',
        text: 'field tooltip',
        tooltip: 'This is a JSON tooltip for the *field*.',
      },
      {
        type: 'input_dummy',
      },
      {
        type: 'field_label',
        name: 'NAME',
        text: 'block tooltip',
      },
    ],
    tooltip: 'This is a JSON tooltip for the *block*.',
    style: 'math_blocks',
  },
  {
    type: 'test_basic_javascript',
    message0: 'function %1(%2) { %3 %4 return %5 }',
    args0: [
      'foo',
      'args',
      {
        type: 'input_dummy',
      },
      {
        type: 'input_statement',
        name: 'STACK',
      },
      {
        type: 'input_value',
        check: 'number',
        align: 'right',
        name: 'RETURN',
      },
    ],
    inputsInline: true,
    colour: 200,
    tooltip: 'Hello world.',
  },
]);

Blockly.Blocks['test_basic_empty_with_mutator'] = {
  init: function () {
    this.setMutator(new Blockly.icons.MutatorIcon(['math_number'], this));
  },

  decompose: function (workspace) {
    const topBlock = workspace.newBlock('math_number');
    topBlock.initSvg();
    return topBlock;
  },
  compose: function () {},
};

/**
 * The Basic Category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Basic',
  contents: [
    {
      kind: 'BLOCK',
      type: 'test_basic_empty',
    },
    {
      kind: 'BLOCK',
      type: 'test_basic_empty_with_mutator',
    },
    {
      kind: 'BLOCK',
      type: 'test_basic_dummy',
    },
    {
      kind: 'BLOCK',
      type: 'test_basic_multiple_dummy',
    },
    {
      kind: 'BLOCK',
      type: 'test_basic_stack',
    },
    {
      kind: 'BLOCK',
      type: 'test_basic_row',
    },
    {
      kind: 'BLOCK',
      type: 'test_basic_value_to_stack',
    },
    {
      kind: 'BLOCK',
      type: 'test_basic_value_to_statement',
    },
    {
      kind: 'BLOCK',
      type: 'test_basic_limit_instances',
    },
    {
      kind: 'BLOCK',
      type: 'test_basic_tooltips',
    },
    {
      kind: 'BLOCK',
      type: 'test_basic_javascript',
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
