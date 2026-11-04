/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {toolboxTestBlocksInit, toolboxTestBlocks} from '@blockly/block-test';

import {DebugDrawer} from './debugDrawer.js';
import {createNewRenderer} from './debug.js';
import {generateFieldTestBlocks} from './generateFieldTestBlocks.js';
import {populateRandom} from './populateRandom.js';
import {downloadWorkspaceScreenshot} from './screenshot.js';
import {spaghetti} from './spaghetti.js';
import * as logger from './logger.js';
import * as testHelpers from './test_helpers.mocha.js';
import toolboxCategories from './toolboxCategories.js';
import toolboxSimple from './toolboxSimple.js';
import {addCodeEditor} from './playground/monaco.js';

/**
 * Use dat.GUI to add controls to adjust configuration of a Blockly workspace.
 * Takes the same arguments as addGUIControls in ./playground/options.js, and
 * returns a promise that resolves with the dat.GUI instance.
 * @type {(
 *   ...args: Parameters<typeof import('./playground/options.js').addGUIControls>
 * ) => Promise<
 *   ReturnType<typeof import('./playground/options.js').addGUIControls>
 * >}
 */
const addGUIControls = async (...args) => {
  const options = await import('./playground/options.js');
  return options.addGUIControls(...args);
};

/**
 * Create the Blockly playground.
 * @type {typeof import('./playground/index.js').createPlayground}
 */
const createPlayground = async (...args) => {
  const playground = await import('./playground/index.js');
  return playground.createPlayground(...args);
};

// Export Blockly into the global namespace to make it easier to debug from the
// console.
globalThis.Blockly = Blockly;

export {
  addCodeEditor,
  addGUIControls,
  createNewRenderer,
  createPlayground,
  DebugDrawer,
  downloadWorkspaceScreenshot,
  generateFieldTestBlocks,
  populateRandom,
  logger,
  spaghetti,
  testHelpers,
  toolboxCategories,
  toolboxSimple,
  toolboxTestBlocks,
  toolboxTestBlocksInit,
};
