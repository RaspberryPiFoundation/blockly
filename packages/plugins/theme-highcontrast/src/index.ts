/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A Blockly high contrast theme.
 *
 * @packageDocumentation
 */

/* eslint-disable @typescript-eslint/naming-convention */

import * as Blockly from 'blockly/core';

const defaultBlockStyles = {
  colour_blocks: {
    colourPrimary: '#a52714',
    colourSecondary: '#FB9B8C',
    colourTertiary: '#FBE1DD',
  },
  list_blocks: {
    colourPrimary: '#4a148c',
    colourSecondary: '#AD7BE9',
    colourTertiary: '#CDB6E9',
  },
  logic_blocks: {
    colourPrimary: '#01579b',
    colourSecondary: '#64C7FF',
    colourTertiary: '#C5EAFF',
  },
  loop_blocks: {
    colourPrimary: '#33691e',
    colourSecondary: '#9AFF78',
    colourTertiary: '#E1FFD7',
  },
  math_blocks: {
    colourPrimary: '#1a237e',
    colourSecondary: '#8A9EFF',
    colourTertiary: '#DCE2FF',
  },
  procedure_blocks: {
    colourPrimary: '#006064',
    colourSecondary: '#77E6EE',
    colourTertiary: '#CFECEE',
  },
  text_blocks: {
    colourPrimary: '#004d40',
    colourSecondary: '#5ae27c',
    colourTertiary: '#D2FFDD',
  },
  variable_blocks: {
    colourPrimary: '#880e4f',
    colourSecondary: '#FF73BE',
    colourTertiary: '#FFD4EB',
  },
  variableDynamic_blocks: {
    colourPrimary: '#880e4f',
    colourSecondary: '#FF73BE',
    colourTertiary: '#FFD4EB',
  },
  hat_blocks: {
    colourPrimary: '#880e4f',
    colourSecondary: '#FF73BE',
    colourTertiary: '#FFD4EB',
    hat: 'cap',
  },
};

const categoryStyles = {
  colour_category: {colour: '#a52714'},
  list_category: {colour: '#4a148c'},
  logic_category: {colour: '#01579b'},
  loop_category: {colour: '#33691e'},
  math_category: {colour: '#1a237e'},
  procedure_category: {colour: '#006064'},
  text_category: {colour: '#004d40'},
  variable_category: {colour: '#880e4f'},
  variable_dynamic_category: {colour: '#880e4f'},
};

/**
 * High contrast theme.
 */
export default Blockly.Theme.defineTheme('highcontrast', {
  name: 'highcontrast',
  blockStyles: defaultBlockStyles,
  categoryStyles: categoryStyles,
  componentStyles: {
    selectedGlowColour: '#000000',
    // selectedGlowSize: 1,
  },
  fontStyle: {
    family: undefined, // Use default font-family.
    weight: undefined, // Use default font-weight.
    size: 16,
  },
  startHats: undefined,
});
