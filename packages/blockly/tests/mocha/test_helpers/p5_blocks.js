/* eslint-disable camelcase */
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../../build/src/core/blockly.js';

// p5 Basic Setup Blocks

const p5SetupJson = {
  'type': 'p5_setup',
  'message0': 'setup %1',
  'args0': [
    {
      'type': 'input_statement',
      'name': 'STATEMENTS',
    },
  ],
  'colour': 300,
  'tooltip': 'Setup the p5 canvas. This code is run once.',
  'helpUrl': '',
};

const p5Setup = {
  init: function () {
    this.jsonInit(p5SetupJson);
    // The setup block can't be removed.
    this.setDeletable(false);
  },
};

const p5DrawJson = {
  'type': 'p5_draw',
  'message0': 'draw %1',
  'args0': [
    {
      'type': 'input_statement',
      'name': 'STATEMENTS',
    },
  ],
  'colour': 300,
  'tooltip': 'Draw on the canvas. This code is run continuously.',
  'helpUrl': '',
};

const p5Draw = {
  init: function () {
    this.jsonInit(p5DrawJson);
    // The draw block can't be removed.
    this.setDeletable(false);
  },
};

const p5CanvasJson = {
  'type': 'p5_canvas',
  'message0': 'create canvas with width %1 height %2',
  'args0': [
    {
      'type': 'field_number',
      'name': 'WIDTH',
      'value': 400,
      'max': 400,
      'precision': 1,
    },
    {
      'type': 'field_number',
      'name': 'HEIGHT',
      'value': 400,
      'max': 400,
      'precision': 1,
    },
  ],
  'previousStatement': null,
  'nextStatement': null,
  'colour': 300,
  'tooltip': 'Create a p5 canvas of the specified size.',
  'helpUrl': '',
};

const p5Canvas = {
  init: function () {
    this.jsonInit(p5CanvasJson);
    // The canvas block can't be moved or disconnected from its parent.
    this.setMovable(false);
    this.setDeletable(false);
  },
};

const buttonsJson = {
  'type': 'buttons',
  'message0': 'If %1 %2 Then %3 %4 more %5 %6 %7',
  'args0': [
    {
      'type': 'field_image',
      'name': 'BUTTON1',
      'src': 'https://www.gstatic.com/codesite/ph/images/star_on.gif',
      'width': 30,
      'height': 30,
      'alt': '*',
    },
    {
      'type': 'input_value',
      'name': 'VALUE1',
      'check': '',
    },
    {
      'type': 'field_image',
      'name': 'BUTTON2',
      'src': 'https://www.gstatic.com/codesite/ph/images/star_on.gif',
      'width': 30,
      'height': 30,
      'alt': '*',
    },
    {
      'type': 'input_dummy',
      'name': 'DUMMY1',
      'check': '',
    },
    {
      'type': 'input_value',
      'name': 'VALUE2',
      'check': '',
    },
    {
      'type': 'input_statement',
      'name': 'STATEMENT1',
      'check': 'Number',
    },
    {
      'type': 'field_image',
      'name': 'BUTTON3',
      'src': 'https://www.gstatic.com/codesite/ph/images/star_on.gif',
      'width': 30,
      'height': 30,
      'alt': '*',
    },
  ],
  'previousStatement': null,
  'nextStatement': null,
  'colour': 230,
  'tooltip': '',
  'helpUrl': '',
};

const buttonsBlock = {
  init: function () {
    this.jsonInit(buttonsJson);
    const clickHandler = function () {
      console.log('clicking a button!');
    };
    this.getField('BUTTON1').setOnClickHandler(clickHandler);
    this.getField('BUTTON2').setOnClickHandler(clickHandler);
    this.getField('BUTTON3').setOnClickHandler(clickHandler);
  },
};

const background = {
  'type': 'p5_background_color',
  'message0': 'Set background color to %1',
  'args0': [
    {
      'type': 'input_value',
      'name': 'COLOR',
    },
  ],
  'previousStatement': null,
  'nextStatement': null,
  'colour': 195,
  'tooltip': 'Set the background color of the canvas',
  'helpUrl': '',
};

const stroke = {
  'type': 'p5_stroke',
  'message0': 'Set stroke color to %1',
  'args0': [
    {
      'type': 'input_value',
      'name': 'COLOR',
    },
  ],
  'previousStatement': null,
  'nextStatement': null,
  'colour': 195,
  'tooltip': 'Set the stroke color',
  'helpUrl': '',
};

const fill = {
  'type': 'p5_fill',
  'message0': 'Set fill color to %1',
  'args0': [
    {
      'type': 'input_value',
      'name': 'COLOR',
    },
  ],
  'previousStatement': null,
  'nextStatement': null,
  'colour': 195,
  'tooltip': 'Set the fill color',
  'helpUrl': '',
};

const ellipse = {
  'type': 'p5_ellipse',
  'message0': 'draw ellipse %1 x %2 y %3 width %4 height %5',
  'args0': [
    {
      'type': 'input_dummy',
    },
    {
      'type': 'input_value',
      'name': 'X',
      'check': 'Number',
    },
    {
      'type': 'input_value',
      'name': 'Y',
      'check': 'Number',
    },
    {
      'type': 'input_value',
      'name': 'WIDTH',
      'check': 'Number',
    },
    {
      'type': 'input_value',
      'name': 'HEIGHT',
      'check': 'Number',
    },
  ],
  'previousStatement': null,
  'nextStatement': null,
  'colour': 230,
  'tooltip': 'Draw an ellipse on the canvas.',
  'helpUrl': 'https://p5js.org/reference/#/p5/ellipse',
};

const draw_emoji = {
  'type': 'draw_emoji',
  'tooltip': '',
  'helpUrl': '',
  'message0': 'draw %1 %2',
  'args0': [
    {
      'type': 'field_dropdown',
      'name': 'emoji',
      'options': [
        ['❤️', '❤️'],
        ['✨', '✨'],
        ['🐻', '🐻'],
      ],
    },
    {
      'type': 'input_dummy',
      'name': '',
    },
  ],
  'previousStatement': null,
  'nextStatement': null,
  'colour': 230,
  'inputsInline': true,
};

const simpleCircle = {
  'type': 'simple_circle',
  'tooltip': '',
  'helpUrl': '',
  'message0': 'draw %1 circle %2',
  'args0': [
    {
      'type': 'input_value',
      'name': 'COLOR',
    },
    {
      'type': 'input_dummy',
    },
  ],
  'previousStatement': null,
  'nextStatement': null,
  'colour': 230,
  'inputsInline': true,
};

const writeTextWithoutShadow = {
  'type': 'write_text_without_shadow',
  'tooltip': '',
  'helpUrl': '',
  'message0': 'write without shadow %1',
  'args0': [
    {
      'type': 'field_input',
      'name': 'TEXT',
      'text': 'bit',
    },
  ],
  'previousStatement': null,
  'nextStatement': null,
  'colour': 225,
};

const writeTextWithShadow = {
  'type': 'write_text_with_shadow',
  'tooltip': '',
  'helpUrl': '',
  'message0': 'write with shadow %1',
  'args0': [
    {
      'type': 'input_value',
      'name': 'TEXT',
      'check': 'String',
    },
  ],
  'previousStatement': null,
  'nextStatement': null,
  'colour': 225,
};

const textBlock = {
  'type': 'text_only',
  'tooltip': '',
  'helpUrl': '',
  'message0': '%1',
  'args0': [
    {
      'type': 'field_input',
      'name': 'TEXT',
      'text': 'micro',
    },
  ],
  'output': 'String',
  'colour': 225,
};

// Create the block definitions for all the JSON-only blocks.
// This does not register their definitions with Blockly.
const jsonBlocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  background,
  stroke,
  fill,
  ellipse,
  draw_emoji,
  simpleCircle,
  writeTextWithoutShadow,
  writeTextWithShadow,
  textBlock,
]);

export const p5blocks = {
  'p5_setup': p5Setup,
  'p5_draw': p5Draw,
  'p5_canvas': p5Canvas,
  'buttons_block': buttonsBlock,
  ...jsonBlocks,
};
