/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.Themes.Zelos

import {Theme} from '../theme.js';

const defaultBlockStyles = {
  'colour_blocks': {
    'colourPrimary': '#CF63CF',
    'colourSecondary': '#C94FC9',
    'colourTertiary': '#BD42BD',
  },
  'list_blocks': {
    'colourPrimary': '#9966FF',
    'colourSecondary': '#855CD6',
    'colourTertiary': '#774DCB',
  },
  'logic_blocks': {
    'colourPrimary': '#4C97FF',
    'colourSecondary': '#4280D7',
    'colourTertiary': '#3373CC',
  },
  'loop_blocks': {
    'colourPrimary': '#0fBD8C',
    'colourSecondary': '#0DA57A',
    'colourTertiary': '#0B8E69',
  },
  'math_blocks': {
    'colourPrimary': '#59C059',
    'colourSecondary': '#46B946',
    'colourTertiary': '#389438',
  },
  'procedure_blocks': {
    'colourPrimary': '#FF6680',
    'colourSecondary': '#FF4D6A',
    'colourTertiary': '#FF3355',
  },
  'text_blocks': {
    'colourPrimary': '#FFBF00',
    'colourSecondary': '#E6AC00',
    'colourTertiary': '#CC9900',
  },
  'variable_blocks': {
    'colourPrimary': '#FF8C1A',
    'colourSecondary': '#FF8000',
    'colourTertiary': '#DB6E00',
  },
  'variable_dynamic_blocks': {
    'colourPrimary': '#FF8C1A',
    'colourSecondary': '#FF8000',
    'colourTertiary': '#DB6E00',
  },
  'hat_blocks': {
    'colourPrimary': '#4C97FF',
    'colourSecondary': '#4280D7',
    'colourTertiary': '#3373CC',
    'hat': 'cap',
  },
};

const categoryStyles = {
  'colour_category': {'colour': '#CF63CF'},
  'list_category': {'colour': '#9966FF'},
  'logic_category': {'colour': '#4C97FF'},
  'loop_category': {'colour': '#0fBD8C'},
  'math_category': {'colour': '#59C059'},
  'procedure_category': {'colour': '#FF6680'},
  'text_category': {'colour': '#FFBF00'},
  'variable_category': {'colour': '#FF8C1A'},
  'variable_dynamic_category': {'colour': '#FF8C1A'},
};

/**
 * Zelos theme.
 */
export const Zelos = new Theme('zelos', defaultBlockStyles, categoryStyles);
