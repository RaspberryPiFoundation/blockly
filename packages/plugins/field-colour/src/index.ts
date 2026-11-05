/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './field_colour.js';

import * as colourPicker from './blocks/colourPicker.js';
import * as colourRandom from './blocks/colourRandom.js';
import * as colourRgb from './blocks/colourRgb.js';
import * as colourBlend from './blocks/colourBlend.js';
import type {Generators} from './blocks/generatorsType.js';

// Re-export all parts of the definition.
export * as colourPicker from './blocks/colourPicker.js';
export * as colourRandom from './blocks/colourRandom.js';
export * as colourRgb from './blocks/colourRgb.js';
export * as colourBlend from './blocks/colourBlend.js';

/**
 * Install all of the blocks defined in this file and all of their
 * dependencies.
 *
 * @param generators The CodeGenerators to install per-block
 *     generators on.
 */
export function installAllBlocks(generators: Generators = {}) {
  colourPicker.installBlock(generators);
  colourRgb.installBlock(generators);
  colourRandom.installBlock(generators);
  colourBlend.installBlock(generators);
}
