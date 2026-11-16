/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Fields test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import {category as fieldDefaults, onInit as initDefaults} from './defaults';
import {category as fieldNumbers, onInit as initNumbers} from './numbers';
import {category as fieldDropdowns, onInit as initDropdowns} from './dropdowns';
import {category as fieldImages, onInit as initImages} from './images';
import {category as fieldEmoji, onInit as initEmoji} from './emojis';
import {
  category as fieldValidators,
  onInit as initValidators,
} from './validators';

/**
 * The fields category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Fields',
  expanded: 'true',
  contents: [
    fieldDefaults,
    fieldNumbers,
    fieldDropdowns,
    fieldImages,
    fieldEmoji,
    fieldValidators,
  ],
};

/**
 * Initialize this toolbox category.
 * @param {!Blockly.WorkspaceSvg} workspace The Blockly workspace.
 */
export function onInit(workspace) {
  initDefaults(workspace);
  initNumbers(workspace);
  initDropdowns(workspace);
  initImages(workspace);
  initEmoji(workspace);
  initValidators(workspace);
}
