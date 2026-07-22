/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Align test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_align_dummy_right',
    message0: 'text right %1 long text right %2',
    args0: [
      {
        type: 'input_dummy',
        align: 'RIGHT',
      },
      {
        type: 'input_dummy',
        align: 'RIGHT',
      },
    ],
    style: 'math_blocks',
  },
  {
    type: 'test_align_all',
    message0:
      'text %1 long text left %2 text centre %3 much longer text ' + 'right %4',
    args0: [
      {
        type: 'input_dummy',
      },
      {
        type: 'input_dummy',
        align: 'LEFT',
      },
      {
        type: 'input_dummy',
        align: 'CENTRE',
      },
      {
        type: 'input_dummy',
        align: 'RIGHT',
      },
    ],
    style: 'math_blocks',
  },
  {
    type: 'test_align_with_external_input',
    message0:
      'text right %1 long text centre %2 text left %3 much longer ' + 'text %4',
    args0: [
      {
        type: 'input_dummy',
        align: 'RIGHT',
      },
      {
        type: 'input_dummy',
        align: 'CENTRE',
      },
      {
        type: 'input_dummy',
        align: 'LEFT',
      },
      {
        type: 'input_value',
        name: 'VALUE',
      },
    ],
    inputsInline: false,
    style: 'math_blocks',
  },
]);

/**
 * The Align category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Align',
  contents: [
    {
      kind: 'BLOCK',
      type: 'test_align_dummy_right',
    },
    {
      kind: 'BLOCK',
      type: 'test_align_all',
    },
    {
      kind: 'BLOCK',
      type: 'test_align_with_external_input',
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
