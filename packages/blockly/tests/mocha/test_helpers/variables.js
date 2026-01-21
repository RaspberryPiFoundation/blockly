/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../../node_modules/chai/index.js';

/**
 * Check if a variable with the given values exists.
 * @param {Blockly.Workspace|Blockly.VariableMap} container The workspace  or
 *     variableMap the checked variable belongs to.
 * @param {!string} name The expected name of the variable.
 * @param {!string} type The expected type of the variable.
 * @param {!string} id The expected id of the variable.
 */
export function assertVariableValues(container, name, type, id) {
  const variableMap =
    container instanceof Blockly.Workspace
      ? container.getVariableMap()
      : container;
  const variable = variableMap.getVariableById(id);
  assert.isDefined(variable);
  assert.equal(variable.name, name);
  assert.equal(variable.type, type);
  assert.equal(variable.getId(), id);
}
