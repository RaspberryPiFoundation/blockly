/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Import all the test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';

import {category as alignCategory, onInit as initAlign} from './align.js';
import {category as basicCategory, onInit as initBasic} from './basic.js';
import {
  category as chameleonCategory,
  onInit as initChameleon,
} from './chameleon.js';
import {
  category as connectionsCategory,
  onInit as initConnections,
} from './connections/index.js';
import {category as dragCategory, onInit as initDrag} from './drag.js';
import {
  category as fieldsCategory,
  onInit as initFields,
} from './fields/index.js';
import {
  category as mutatorsCategory,
  onInit as initMutators,
} from './mutators.js';
import {category as styleCategory, onInit as initStyle} from './style.js';
import {
  category as serializationCategory,
  onInit as initSerialization,
} from './serialization/category.js';

/**
 * The Test blocks toolbox.
 */
export const toolboxTestBlocks = {
  contents: [
    alignCategory,
    basicCategory,
    chameleonCategory,
    connectionsCategory,
    dragCategory,
    fieldsCategory,
    mutatorsCategory,
    styleCategory,
    serializationCategory,
  ],
};

/**
 * Initialize this toolbox.
 * @param {!Blockly.WorkspaceSvg} workspace The Blockly workspace.
 */
export function toolboxTestBlocksInit(workspace) {
  initAlign(workspace);
  initBasic(workspace);
  initChameleon(workspace);
  initConnections(workspace);
  initDrag(workspace);
  initFields(workspace);
  initMutators(workspace);
  initStyle(workspace);
  initSerialization(workspace);

  const addAllBlocksToWorkspace = function (button) {
    const workspace = button.getTargetWorkspace();
    const blocks = workspace.getFlyout().getWorkspace().getTopBlocks();
    for (let i = 0, block; (block = blocks[i]); i++) {
      const state = Blockly.serialization.blocks.save(block, {
        addCoordinates: true,
      });
      Blockly.serialization.blocks.append(state, workspace);
    }
  };
  workspace.registerButtonCallback(
    'addAllBlocksToWorkspace',
    addAllBlocksToWorkspace,
  );
}
