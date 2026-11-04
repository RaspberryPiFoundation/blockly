/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Emojis in fields test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

/**
 * The Emoji category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Emoji! o((*^ᴗ^*))o',
  contents: [
    {
      kind: 'LABEL',
      text: 'Unicode & Emojis',
    },
    {
      kind: 'BLOCK',
      type: 'test_style_emoji',
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="text">
  <field name="TEXT">Robot face in text field:🤖</field>
</block>`,
    },
    {
      kind: 'BLOCK',
      blockxml: `
<block type="text">
  <field name="TEXT">Zalgo in text field:B̛̻̦̬̘̰͎̥̈̔͊͞ͅl̡͖̫̺̬̖̣̳̃̀́͑͑̕͟͠͝o̢̹͙̮̫͔͋̉̊̑̿̽̚c̸̹̹̜͙̹̠͋̒͑̊̇͝k̡͉̫͇̖̳͖̊͒́̆̄̎̂̔̕͜͞l̰̙̞̳̩̠͖̯̀̆̈́̿̈̓͗y̨̡̟͇̮͈̬̙̲̏̅̀͘͠</field>
</block>`,
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
