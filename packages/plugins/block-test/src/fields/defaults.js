/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Default field test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_fields_text_input',
    message0: 'text input %1',
    args0: [
      {
        type: 'field_input',
        name: 'TEXT_INPUT',
        text: 'default',
      },
    ],
    style: 'math_blocks',
    tooltip: '',
    helpUrl: '',
  },
  {
    type: 'test_fields_only_text_input',
    message0: '%1',
    args0: [
      {
        type: 'field_input',
        name: 'TEXT_INPUT',
        text: 'default',
      },
    ],
    style: 'textInput',
    tooltip: '',
    helpUrl: '',
    output: 'String',
  },
  {
    type: 'test_fields_checkbox',
    message0: 'checkbox %1',
    args0: [
      {
        type: 'field_checkbox',
        name: 'CHECKBOX',
        checked: true,
      },
    ],
    style: 'math_blocks',
    tooltip: '',
    helpUrl: '',
  },
  {
    type: 'test_fields_variable',
    message0: 'variable %1',
    args0: [
      {
        type: 'field_variable',
        name: 'VARIABLE',
        variable: 'item',
      },
    ],
    style: 'math_blocks',
    tooltip: '',
    helpUrl: '',
  },
  {
    type: 'test_fields_label_serializable',
    message0: 'label serializable %1',
    args0: [
      {
        type: 'field_label_serializable',
        name: 'LABEL',
        text: 'default',
      },
    ],
    style: 'math_blocks',
    tooltip: '',
    helpUrl: '',
  },
  {
    type: 'test_fields_image',
    message0: 'image %1',
    args0: [
      {
        type: 'field_image',
        name: 'IMAGE',
        src: 'https://blockly-demo.appspot.com/static/tests/media/a.png',
        width: 32,
        height: 32,
        alt: 'A',
      },
    ],
    colour: 230,
  },
]);

/**
 * The Default fields category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Defaults',
  contents: [
    {
      kind: 'BUTTON',
      text: 'add blocks to workspace',
      callbackkey: 'addAllBlocksToWorkspace',
    },
    {
      kind: 'SEP',
      gap: '8',
    },
    {
      kind: 'BUTTON',
      text: 'set random style',
      callbackkey: 'setRandomStyle',
    },
    {
      kind: 'SEP',
      gap: '8',
    },
    {
      kind: 'BUTTON',
      text: 'toggle enabled',
      callbackkey: 'toggleEnabled',
    },
    {
      kind: 'SEP',
      gap: '8',
    },
    {
      kind: 'BUTTON',
      text: 'toggle shadow',
      callbackkey: 'toggleShadow',
    },
    {
      kind: 'SEP',
      gap: '8',
    },
    {
      kind: 'BUTTON',
      text: 'toggle collapsed',
      callbackkey: 'toggleCollapsed',
    },
    {
      kind: 'BLOCK',
      type: 'test_fields_checkbox',
    },
    {
      kind: 'BLOCK',
      type: 'test_fields_text_input',
    },
    {
      kind: 'BLOCK',
      type: 'test_fields_only_text_input',
    },
    {
      kind: 'BLOCK',
      type: 'test_fields_variable',
    },
    {
      kind: 'BUTTON',
      text: 'randomize label text',
      callbackkey: 'randomizeLabelText',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_fields_label_serializable',
    },
    {
      kind: 'BUTTON',
      text: 'change image',
      callbackkey: 'changeImage',
    },
    {
      kind: 'SEP',
      gap: '12',
    },
    {
      kind: 'BLOCK',
      type: 'test_fields_image',
    },
  ],
};

/**
 * Initialize this toolbox category.
 * @param {!Blockly.WorkspaceSvg} workspace The Blockly workspace.
 */
export function onInit(workspace) {
  const randomizeLabelText = function (button) {
    const blocks = button
      .getTargetWorkspace()
      .getBlocksByType('test_fields_label_serializable');
    const possible = 'AB';
    for (let i = 0, block; (block = blocks[i]); i++) {
      let text = '';
      for (let j = 0; j < 4; j++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      block.setFieldValue(text, 'LABEL');
    }
  };
  const setRandomStyle = function (button) {
    const blocks = button
      .getTargetWorkspace()
      .getFlyout()
      .getWorkspace()
      .getAllBlocks(false);
    const styles = Object.keys(
      workspace.getRenderer().getConstants().blockStyles,
    );
    styles.splice(styles.indexOf(blocks[0].getStyleName()), 1);
    const style = styles[Math.floor(Math.random() * styles.length)];
    for (let i = 0, block; (block = blocks[i]); i++) {
      block.setStyle(style);
    }
  };
  const toggleEnabled = function (button) {
    const blocks = button
      .getTargetWorkspace()
      .getFlyout()
      .getWorkspace()
      .getAllBlocks(false);
    for (let i = 0, block; (block = blocks[i]); i++) {
      block.setDisabledReason(block.isEnabled(), 'Toggle block enabled');
    }
  };
  const toggleShadow = function (button) {
    const blocks = button
      .getTargetWorkspace()
      .getFlyout()
      .getWorkspace()
      .getAllBlocks(false);
    for (let i = 0, block; (block = blocks[i]); i++) {
      block.setShadow(!block.isShadow());
    }
  };
  const toggleCollapsed = function (button) {
    const blocks = button
      .getTargetWorkspace()
      .getFlyout()
      .getWorkspace()
      .getAllBlocks(false);
    for (let i = 0, block; (block = blocks[i]); i++) {
      block.setCollapsed(!block.isCollapsed());
    }
  };
  const changeImage = function (button) {
    const blocks = button
      .getTargetWorkspace()
      .getFlyout()
      .getWorkspace()
      .getBlocksByType('test_fields_image');
    const possible = 'abcdefghijklm';
    const image = possible.charAt(Math.floor(Math.random() * possible.length));
    const src =
      'https://blockly-demo.appspot.com/static/tests/media/' + image + '.png';
    for (let i = 0, block; (block = blocks[i]); i++) {
      const imageField = block.getField('IMAGE');
      imageField.setValue(src);
    }
  };
  workspace.registerButtonCallback('randomizeLabelText', randomizeLabelText);
  workspace.registerButtonCallback('setRandomStyle', setRandomStyle);
  workspace.registerButtonCallback('toggleEnabled', toggleEnabled);
  workspace.registerButtonCallback('toggleShadow', toggleShadow);
  workspace.registerButtonCallback('toggleCollapsed', toggleCollapsed);
  workspace.registerButtonCallback('changeImage', changeImage);
}
