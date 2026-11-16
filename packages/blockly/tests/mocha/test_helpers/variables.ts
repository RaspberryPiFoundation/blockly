/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';

/**
 * Check if a variable with the given values exists.
 *
 * @param container The workspace or variableMap the checked variable belongs
 *     to.
 * @param name The expected name of the variable.
 * @param type The expected type of the variable.
 * @param id The expected id of the variable.
 */
export function assertVariableValues(
  container:
    | Blockly.Workspace
    | Blockly.IVariableMap<Blockly.IVariableModel<Blockly.IVariableState>>,
  name: string,
  type: string,
  id: string,
) {
  const variableMap =
    container instanceof Blockly.Workspace
      ? container.getVariableMap()
      : container;
  const variable = variableMap.getVariableById(id);
  assert.isNotNull(variable);
  assert.equal(variable.getName(), name);
  assert.equal(variable.getType(), type);
  assert.equal(variable.getId(), id);
}
