/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

const resizableListBlock = {
  type: 'resizable_list',
  message0: 'resizable list with %1',
  args0: [
    {
      type: 'input_value',
      name: 'ADD0',
    },
  ],
  output: null,
  style: 'list_blocks',
  mutator: 'list_mutator',
  tooltip: '',
  helpUrl: '',
};

// Create the block definitions
export const mutatorBlocks = Blockly.common.createBlockDefinitionsFromJsonArray(
  [resizableListBlock],
);
