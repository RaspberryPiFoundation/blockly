/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Abstract class for a variable event.
 *
 * @class
 */
// Former goog.module ID: Blockly.Events.VarBase

import type {
  IVariableModel,
  IVariableState,
} from '../interfaces/i_variable_model.js';
import type {Workspace} from '../workspace.js';
import {
  Abstract as AbstractEvent,
  AbstractEventJson,
} from './events_abstract.js';

/**
 * Abstract class for a variable event.
 */
export class VarBase extends AbstractEvent {
  override isBlank = true;
  /** The ID of the variable this event references. */
  varId?: string;

  /**
   * @param opt_variable The variable this event corresponds to.  Undefined for
   *     a blank event.
   */
  constructor(opt_variable?: IVariableModel<IVariableState>) {
    super();
    this.isBlank = typeof opt_variable === 'undefined';
    if (!opt_variable) return;

    this.varId = opt_variable.getId();
    this.workspaceId = opt_variable.getWorkspace().id;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): VarBaseJson {
    const json = super.toJson() as VarBaseJson;
    if (!this.varId) {
      throw new Error(
        'The var ID is undefined. Either pass a variable to ' +
          'the constructor, or call fromJson',
      );
    }
    json['varId'] = this.varId;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of VarBase, but we can't specify that due to the fact that parameters
   *     to static methods in subclasses must be supertypes of parameters to
   *     static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: VarBaseJson,
    workspace: Workspace,
    event?: any,
  ): VarBase {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new VarBase(),
    ) as VarBase;
    newEvent.varId = json['varId'];
    return newEvent;
  }
}

export interface VarBaseJson extends AbstractEventJson {
  varId: string;
}
