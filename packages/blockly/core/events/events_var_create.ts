/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Class for a variable creation event.
 *
 * @class
 */
// Former goog.module ID: Blockly.Events.VarCreate

import type {
  IVariableModel,
  IVariableState,
} from '../interfaces/i_variable_model.js';
import * as registry from '../registry.js';

import type {Workspace} from '../workspace.js';
import {VarBase, VarBaseJson} from './events_var_base.js';
import {EventType} from './type.js';

/**
 * Notifies listeners that a variable model has been created.
 */
export class VarCreate extends VarBase {
  override type = EventType.VAR_CREATE;

  /** The type of the variable that was created. */
  varType?: string;

  /** The name of the variable that was created. */
  varName?: string;

  /**
   * @param opt_variable The created variable. Undefined for a blank event.
   */
  constructor(opt_variable?: IVariableModel<IVariableState>) {
    super(opt_variable);

    if (!opt_variable) {
      return; // Blank event to be populated by fromJson.
    }
    this.varType = opt_variable.getType();
    this.varName = opt_variable.getName();
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): VarCreateJson {
    const json = super.toJson() as VarCreateJson;
    if (this.varType === undefined) {
      throw new Error(
        'The var type is undefined. Either pass a variable to ' +
          'the constructor, or call fromJson',
      );
    }
    if (!this.varName) {
      throw new Error(
        'The var name is undefined. Either pass a variable to ' +
          'the constructor, or call fromJson',
      );
    }
    json['varType'] = this.varType;
    json['varName'] = this.varName;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of VarCreate, but we can't specify that due to the fact that parameters
   *     to static methods in subclasses must be supertypes of parameters to
   *     static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: VarCreateJson,
    workspace: Workspace,
    event?: any,
  ): VarCreate {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new VarCreate(),
    ) as VarCreate;
    newEvent.varType = json['varType'];
    newEvent.varName = json['varName'];
    return newEvent;
  }

  /**
   * Run a variable creation event.
   *
   * @param forward True if run forward, false if run backward (undo).
   */
  override run(forward: boolean) {
    const workspace = this.getEventWorkspace_();
    if (!this.varId) {
      throw new Error(
        'The var ID is undefined. Either pass a variable to ' +
          'the constructor, or call fromJson',
      );
    }
    if (!this.varName) {
      throw new Error(
        'The var name is undefined. Either pass a variable to ' +
          'the constructor, or call fromJson',
      );
    }
    const variableMap = workspace.getVariableMap();
    if (forward) {
      variableMap.createVariable(this.varName, this.varType, this.varId);
    } else {
      const variable = variableMap.getVariableById(this.varId);
      if (variable) variableMap.deleteVariable(variable);
    }
  }
}

export interface VarCreateJson extends VarBaseJson {
  varType: string;
  varName: string;
}

registry.register(registry.Type.EVENT, EventType.VAR_CREATE, VarCreate);
