/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview All the custom JSON-related blocks defined in the custom
 * generator codelab.
 */

import * as Blockly from 'blockly';

export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  {
    type: 'object',
    message0: '{ %1 %2 }',
    args0: [
      {
        type: 'input_dummy',
      },
      {
        type: 'input_statement',
        name: 'MEMBERS',
      },
    ],
    output: null,
    colour: 230,
  },
  {
    type: 'member',
    message0: '%1 %2 %3',
    args0: [
      {
        type: 'field_input',
        name: 'MEMBER_NAME',
        text: '',
      },
      {
        type: 'field_label',
        name: 'COLON',
        text: ':',
      },
      {
        type: 'input_value',
        name: 'MEMBER_VALUE',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
  },
]);
