/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Complete helper functions for generating Lua for
 *     blocks.  This is the entrypoint for lua_compressed.js.
 */

// Former goog.module ID: Blockly.Lua.all

import * as lists from './lua/lists.js';
import * as logic from './lua/logic.js';
import * as loops from './lua/loops.js';
import {LuaGenerator} from './lua/lua_generator.js';
import * as math from './lua/math.js';
import * as procedures from './lua/procedures.js';
import * as text from './lua/text.js';
import * as variables from './lua/variables.js';
import * as variablesDynamic from './lua/variables_dynamic.js';

export * from './lua/lua_generator.js';

/**
 * Lua code generator instance.
 */
export const luaGenerator = new LuaGenerator();

// Install per-block-type generator functions:
const generators: typeof luaGenerator.forBlock = {
  ...lists,
  ...logic,
  ...loops,
  ...math,
  ...procedures,
  ...text,
  ...variables,
  ...variablesDynamic,
};
for (const name in generators) {
  luaGenerator.forBlock[name] = generators[name];
}
