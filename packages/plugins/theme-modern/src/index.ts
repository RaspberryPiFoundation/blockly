/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A Blockly modern theme with darker block borders.
 *
 * @packageDocumentation
 */

/* eslint-disable @typescript-eslint/naming-convention */

import * as Blockly from 'blockly/core';

export default Blockly.Theme.defineTheme('modern', {
  name: 'modern',
  base: Blockly.Themes.Classic,
  blockStyles: {
    colour_blocks: {
      colourPrimary: '#a5745b',
      colourSecondary: '#dbc7bd',
      colourTertiary: '#845d49',
    },
    list_blocks: {
      colourPrimary: '#745ba5',
      colourSecondary: '#c7bddb',
      colourTertiary: '#5d4984',
    },
    logic_blocks: {
      colourPrimary: '#5b80a5',
      colourSecondary: '#bdccdb',
      colourTertiary: '#496684',
    },
    loop_blocks: {
      colourPrimary: '#5ba55b',
      colourSecondary: '#bddbbd',
      colourTertiary: '#498449',
    },
    math_blocks: {
      colourPrimary: '#5b67a5',
      colourSecondary: '#bdc2db',
      colourTertiary: '#495284',
    },
    procedure_blocks: {
      colourPrimary: '#995ba5',
      colourSecondary: '#d6bddb',
      colourTertiary: '#7a4984',
    },
    text_blocks: {
      colourPrimary: '#5ba58c',
      colourSecondary: '#bddbd1',
      colourTertiary: '#498470',
    },
    variable_blocks: {
      colourPrimary: '#a55b99',
      colourSecondary: '#dbbdd6',
      colourTertiary: '#84497a',
    },
    variableDynamic_blocks: {
      colourPrimary: '#a55b99',
      colourSecondary: '#dbbdd6',
      colourTertiary: '#84497a',
    },
    hat_blocks: {
      colourPrimary: '#a55b99',
      colourSecondary: '#dbbdd6',
      colourTertiary: '#84497a',
      hat: 'cap',
    },
  },
  categoryStyles: {
    colour_category: {
      colour: '#a5745b',
    },
    list_category: {
      colour: '#745ba5',
    },
    logic_category: {
      colour: '#5b80a5',
    },
    loop_category: {
      colour: '#5ba55b',
    },
    math_category: {
      colour: '#5b67a5',
    },
    procedure_category: {
      colour: '#995ba5',
    },
    text_category: {
      colour: '#5ba58c',
    },
    variable_category: {
      colour: '#a55b99',
    },
    variable_dynamic_category: {
      colour: '#a55b99',
    },
  },
  componentStyles: {},
  fontStyle: {},
  startHats: undefined,
});
