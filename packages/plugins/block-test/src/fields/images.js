/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Image fields test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_images_datauri',
    message0: 'Image data: URI %1',
    args0: [
      {
        type: 'field_image',
        src: 'data:image/png;base64,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',
        width: 50,
        height: 50,
        alt: '*',
      },
    ],
    style: 'text_blocks',
  },
  {
    type: 'test_images_small',
    message0: 'Image too small %1',
    args0: [
      {
        type: 'field_image',
        src: 'media/30px.png',
        width: 50,
        height: 50,
        alt: '*',
      },
    ],
    style: 'text_blocks',
  },
  {
    type: 'test_images_large',
    message0: 'Image too large %1',
    args0: [
      {
        type: 'field_image',
        src: 'media/200px.png',
        width: 50,
        height: 50,
        alt: '*',
      },
    ],
    style: 'text_blocks',
  },
  {
    type: 'test_images_fliprtl',
    message0: 'Image flipped RTL %1',
    args0: [
      {
        type: 'field_image',
        src: 'media/arrow.png',
        width: 50,
        height: 50,
        alt: '*',
        flipRtl: true,
      },
    ],
    colour: 160,
  },
  {
    type: 'test_images_missing',
    message0: 'Image missing %1',
    args0: [
      {
        type: 'field_image',
        src: 'missing.png',
        width: 50,
        height: 50,
        alt: '*',
      },
    ],
    style: 'text_blocks',
  },
  {
    type: 'test_images_many_icons',
    message0:
      'Lots of network icons: %1 %2 %3 %4 %5 %6 %7 %8 %9 %10 %11' +
      ' %12 %13 %14 %15 %16 %17 %18',
    args0: [
      {
        type: 'input_dummy',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/a.png',
        width: 32,
        height: 32,
        alt: 'A',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/b.png',
        width: 32,
        height: 32,
        alt: 'B',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/c.png',
        width: 32,
        height: 32,
        alt: 'C',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/d.png',
        width: 32,
        height: 32,
        alt: 'D',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/e.png',
        width: 32,
        height: 32,
        alt: 'E',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/f.png',
        width: 32,
        height: 32,
        alt: 'F',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/g.png',
        width: 32,
        height: 32,
        alt: 'G',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/h.png',
        width: 32,
        height: 32,
        alt: 'H',
      },
      {
        type: 'input_dummy',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/a.png',
        width: 32,
        height: 32,
        alt: 'A',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/b.png',
        width: 32,
        height: 32,
        alt: 'B',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/c.png',
        width: 32,
        height: 32,
        alt: 'C',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/d.png',
        width: 32,
        height: 32,
        alt: 'D',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/e.png',
        width: 32,
        height: 32,
        alt: 'E',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/f.png',
        width: 32,
        height: 32,
        alt: 'F',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/g.png',
        width: 32,
        height: 32,
        alt: 'G',
      },
      {
        type: 'field_image',
        src: 'https://blockly-demo.appspot.com/static/tests/media/h.png',
        width: 32,
        height: 32,
        alt: 'H',
      },
    ],
    style: 'text_blocks',
  },
]);

Blockly.Blocks['test_images_clickhandler'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Image click handler')
      .appendField(
        new Blockly.FieldImage(
          'https://blockly-demo.appspot.com/static/tests/media/a.png',
          32,
          32,
          'image with click handler',
          this.onClick_,
        ),
        'IMAGE',
      );
    this.setStyle('text_blocks');
  },
  onClick_: function () {
    alert('Image clicked');
  },
};

/**
 * The Image field category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Images',
  contents: [
    {
      kind: 'BLOCK',
      type: 'test_images_datauri',
    },
    {
      kind: 'BLOCK',
      type: 'test_images_small',
    },
    {
      kind: 'BLOCK',
      type: 'test_images_large',
    },
    {
      kind: 'BLOCK',
      type: 'test_images_fliprtl',
    },
    {
      kind: 'BLOCK',
      type: 'test_images_missing',
    },
    {
      kind: 'BLOCK',
      type: 'test_images_many_icons',
    },
    {
      kind: 'BLOCK',
      type: 'test_images_clickhandler',
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
