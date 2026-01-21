/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Instantiate a PythonGenerator and populate it with the
 * complete set of block generator functions for Python.  This is the
 * entrypoint for python_compressed.js.
 */

// Former goog.module ID: Blockly.Python.all

import * as lists from './python/lists.js';
import * as logic from './python/logic.js';
import * as loops from './python/loops.js';
import * as math from './python/math.js';
import * as procedures from './python/procedures.js';
import {PythonGenerator} from './python/python_generator.js';
import * as text from './python/text.js';
import * as variables from './python/variables.js';
import * as variablesDynamic from './python/variables_dynamic.js';

export * from './python/python_generator.js';

/**
 * Python code generator instance.
 * @type {!PythonGenerator}
 */
export const pythonGenerator = new PythonGenerator();

// Add reserved words.  This list should include all words mentioned
// in RESERVED WORDS: comments in the imports above.
pythonGenerator.addReservedWords('math,random,Number');

// Install per-block-type generator functions:
// Install per-block-type generator functions:
const generators: typeof pythonGenerator.forBlock = {
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
  pythonGenerator.forBlock[name] = generators[name];
}
