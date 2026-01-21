/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Components for the variable model.
 *
 * @class
 */
// Former goog.module ID: Blockly.VariableModel

// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_var_create.js';

import {EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import {IVariableModel, IVariableState} from './interfaces/i_variable_model.js';
import * as registry from './registry.js';
import * as idGenerator from './utils/idgenerator.js';
import type {Workspace} from './workspace.js';

/**
 * Class for a variable model.
 * Holds information for the variable including name, ID, and type.
 *
 * @see {Blockly.FieldVariable}
 */
export class VariableModel implements IVariableModel<IVariableState> {
  private type: string;
  private readonly id: string;

  /**
   * @param workspace The variable's workspace.
   * @param name The name of the variable.  This is the user-visible name (e.g.
   *     'my var' or '私の変数'), not the generated name.
   * @param opt_type The type of the variable like 'int' or 'string'.
   *     Does not need to be unique. Field_variable can filter variables based
   * on their type. This will default to '' which is a specific type.
   * @param opt_id The unique ID of the variable. This will default to a UUID.
   */
  constructor(
    private readonly workspace: Workspace,
    private name: string,
    opt_type?: string,
    opt_id?: string,
  ) {
    /**
     * The type of the variable, such as 'int' or 'sound_effect'. This may be
     * used to build a list of variables of a specific type. By default this is
     * the empty string '', which is a specific type.
     *
     * @see {Blockly.FieldVariable}
     */
    this.type = opt_type || '';

    /**
     * A unique ID for the variable. This should be defined at creation and
     * not change, even if the name changes. In most cases this should be a
     * UUID.
     */
    this.id = opt_id || idGenerator.genUid();
  }

  /** @returns The ID for the variable. */
  getId(): string {
    return this.id;
  }

  /** @returns The name of this variable. */
  getName(): string {
    return this.name;
  }

  /**
   * Updates the user-visible name of this variable.
   *
   * @returns The newly-updated variable.
   */
  setName(newName: string): this {
    this.name = newName;
    return this;
  }

  /** @returns The type of this variable. */
  getType(): string {
    return this.type;
  }

  /**
   * Updates the type of this variable.
   *
   * @returns The newly-updated variable.
   */
  setType(newType: string): this {
    this.type = newType;
    return this;
  }

  /**
   * Returns the workspace this VariableModel belongs to.
   *
   * @returns The workspace this VariableModel belongs to.
   */
  getWorkspace(): Workspace {
    return this.workspace;
  }

  /**
   * Serializes this VariableModel.
   *
   * @returns a JSON representation of this VariableModel.
   */
  save(): IVariableState {
    const state: IVariableState = {
      'name': this.getName(),
      'id': this.getId(),
    };
    const type = this.getType();
    if (type) {
      state['type'] = type;
    }

    return state;
  }

  /**
   * Loads the persisted state into a new variable in the given workspace.
   *
   * @param state The serialized state of a variable model from save().
   * @param workspace The workspace to create the new variable in.
   */
  static load(state: IVariableState, workspace: Workspace) {
    const variable = new this(
      workspace,
      state['name'],
      state['type'],
      state['id'],
    );
    workspace.getVariableMap().addVariable(variable);
    eventUtils.fire(new (eventUtils.get(EventType.VAR_CREATE))(variable));
  }
}

registry.register(
  registry.Type.VARIABLE_MODEL,
  registry.DEFAULT,
  VariableModel,
);
