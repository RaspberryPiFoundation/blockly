/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Test blocks for advanced compilation.
 */

// Former goog.module ID: testBlocks

import {defineBlocksWithJsonArray}  from '../../build/src/core/common.js';

defineBlocksWithJsonArray([
    {
      'type': 'test_style_hex1',
      'message0': 'Block color: Bright purple %1 %2 %3 %4',
      'args0': [
        {
          'type': 'field_input',
          'name': 'TEXT',
          'text': '#992aff',
        },
        {
          'type': 'field_dropdown',
          'name': 'DROPDOWN',
          'options': [
            ['option', 'ONE'],
            ['option', 'TWO'],
          ],
        },
        {
          'type': 'field_checkbox',
          'name': 'NAME',
          'checked': true,
        },
        {
          'type': 'input_value',
          'name': 'NAME',
        },
      ],
      'previousStatement': null,
      'nextStatement': null,
      'colour': '#992aff',
    }
]);
