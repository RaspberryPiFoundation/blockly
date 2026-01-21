/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Class for a variable type change event.
 *
 * @class
 */

import type {
  IVariableModel,
  IVariableState,
} from '../interfaces/i_variable_model.js';
import * as registry from '../registry.js';

import type {Workspace} from '../workspace.js';
import {VarBase, VarBaseJson} from './events_var_base.js';
import {EventType} from './type.js';

/**
 * Notifies listeners that a variable's type has changed.
 */
export class VarTypeChange extends VarBase {
  override type = EventType.VAR_TYPE_CHANGE;

  /**
   * @param variable The variable whose type changed. Undefined for a blank event.
   * @param oldType The old type of the variable. Undefined for a blank event.
   * @param newType The new type of the variable. Undefined for a blank event.
   */
  constructor(
    variable?: IVariableModel<IVariableState>,
    public oldType?: string,
    public newType?: string,
  ) {
    super(variable);
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): VarTypeChangeJson {
    const json = super.toJson() as VarTypeChangeJson;
    if (!this.oldType || !this.newType) {
      throw new Error(
        "The variable's types are undefined. Either pass them to " +
          'the constructor, or call fromJson',
      );
    }
    json['oldType'] = this.oldType;
    json['newType'] = this.newType;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of VarTypeChange, but we can't specify that due to the fact that
   *     parameters to static methods in subclasses must be supertypes of
   *     parameters to static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: VarTypeChangeJson,
    workspace: Workspace,
    event?: any,
  ): VarTypeChange {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new VarTypeChange(),
    ) as VarTypeChange;
    newEvent.oldType = json['oldType'];
    newEvent.newType = json['newType'];
    return newEvent;
  }

  /**
   * Run a variable type change event.
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
    if (!this.oldType || !this.newType) {
      throw new Error(
        "The variable's types are undefined. Either pass them to " +
          'the constructor, or call fromJson',
      );
    }
    const variable = workspace.getVariableMap().getVariableById(this.varId);
    if (!variable) return;
    if (forward) {
      workspace.getVariableMap().changeVariableType(variable, this.newType);
    } else {
      workspace.getVariableMap().changeVariableType(variable, this.oldType);
    }
  }
}

export interface VarTypeChangeJson extends VarBaseJson {
  oldType: string;
  newType: string;
}

registry.register(
  registry.Type.EVENT,
  EventType.VAR_TYPE_CHANGE,
  VarTypeChange,
);
