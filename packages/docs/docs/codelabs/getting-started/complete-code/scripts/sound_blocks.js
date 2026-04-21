/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

Blockly.defineBlocksWithJsonArray([
  // Block for colour picker.
  {
    type: 'play_sound',
    message0: 'Play %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'VALUE',
        options: [
          ['C4', 'sounds/c4.m4a'],
          ['D4', 'sounds/d4.m4a'],
          ['E4', 'sounds/e4.m4a'],
          ['F4', 'sounds/f4.m4a'],
          ['G4', 'sounds/g4.m4a'],
        ],
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 355,
  },
]);

javascript.javascriptGenerator.forBlock['play_sound'] = function (block) {
  const value = "'" + block.getFieldValue('VALUE') + "'";
  return 'MusicMaker.queueSound(' + value + ');\n';
};
