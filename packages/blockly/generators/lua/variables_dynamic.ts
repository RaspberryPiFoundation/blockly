/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Lua for dynamic variable blocks.
 */

// Former goog.module ID: Blockly.Lua.variablesDynamic

// Lua is dynamically typed.
export {
  variables_get as variables_get_dynamic,
  variables_set as variables_set_dynamic,
} from './variables.js';
