/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.serialization.variables

import type {ISerializer} from '../interfaces/i_serializer.js';
import type {IVariableState} from '../interfaces/i_variable_model.js';
import * as registry from '../registry.js';
import type {Workspace} from '../workspace.js';
import * as priorities from './priorities.js';
import * as serializationRegistry from './registry.js';

/**
 * Serializer for saving and loading variable state.
 */
export class VariableSerializer implements ISerializer {
  priority: number;

  constructor() {
    /** The priority for deserializing variables. */
    this.priority = priorities.VARIABLES;
  }

  /**
   * Serializes the variables of the given workspace.
   *
   * @param workspace The workspace to save the variables of.
   * @returns The state of the workspace's variables, or null if there are no
   *     variables.
   */
  save(workspace: Workspace): IVariableState[] | null {
    const variableStates = workspace
      .getVariableMap()
      .getAllVariables()
      .map((v) => v.save());
    return variableStates.length ? variableStates : null;
  }

  /**
   * Deserializes the variable defined by the given state into the given
   * workspace.
   *
   * @param state The state of the variables to deserialize.
   * @param workspace The workspace to deserialize into.
   */
  load(state: IVariableState[], workspace: Workspace) {
    const VariableModel = registry.getObject(
      registry.Type.VARIABLE_MODEL,
      registry.DEFAULT,
    );
    state.forEach((s) => {
      VariableModel?.load(s, workspace);
    });
  }

  /**
   * Disposes of any variables that exist on the workspace.
   *
   * @param workspace The workspace to clear the variables of.
   */
  clear(workspace: Workspace) {
    workspace.getVariableMap().clear();
  }
}

serializationRegistry.register('variables', new VariableSerializer());
