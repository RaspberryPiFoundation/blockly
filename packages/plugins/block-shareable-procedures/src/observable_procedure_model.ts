/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ObservableParameterModel} from './observable_parameter_model';
import {ProcedureChangeReturn} from './events_procedure_change_return';
import {ProcedureCreate} from './events_procedure_create';
import {ProcedureDelete} from './events_procedure_delete';
import {ProcedureEnable} from './events_procedure_enable';
import {ProcedureParameterCreate} from './events_procedure_parameter_create';
import {ProcedureParameterDelete} from './events_procedure_parameter_delete';
import {ProcedureRename} from './events_procedure_rename';
import {triggerProceduresUpdate} from './update_procedures';

/** Represents a procedure signature. */
export class ObservableProcedureModel
  implements Blockly.procedures.IProcedureModel
{
  private id: string;
  private name: string;
  private parameters: ObservableParameterModel[] = [];
  private returnTypes: string[] | null = null;
  private enabled = true;
  private shouldFireEvents = false;
  private shouldTriggerUpdates = true;

  /**
   * Constructor for the procedure model.
   *
   * @param workspace The workspace the procedure model is associated with.
   * @param name The name of the new procedure.
   * @param id The (optional) unique language-neutral ID for the procedure.
   */
  constructor(
    private readonly workspace: Blockly.Workspace,
    name: string,
    id?: string,
  ) {
    this.id = id ?? Blockly.utils.idGenerator.genUid();
    this.name = name;
  }

  /**
   * Sets the human-readable name of the procedure.
   *
   * @param name The human-readable name of the procedure.
   * @returns This procedure model.
   */
  setName(name: string): this {
    if (name === this.name) return this;
    const oldName = this.name;
    this.name = name;
    if (this.shouldTriggerUpdates) triggerProceduresUpdate(this.workspace);
    if (this.shouldFireEvents) {
      Blockly.Events.fire(new ProcedureRename(this.workspace, this, oldName));
    }
    return this;
  }

  /**
   * Inserts a parameter into the list of parameters.
   * To move a parameter, first delete it, and then re-insert.
   *
   * @param parameterModel The parameter model to insert.
   * @param index The index to insert it at.
   * @returns This procedure model.
   */
  insertParameter(
    parameterModel: ObservableParameterModel,
    index: number,
  ): this {
    if (
      this.parameters[index] &&
      this.parameters[index].getId() === parameterModel.getId()
    ) {
      return this;
    }

    this.parameters.splice(index, 0, parameterModel);
    parameterModel.setProcedureModel(this);
    if (Blockly.isObservable(parameterModel)) {
      if (this.shouldFireEvents) {
        parameterModel.startPublishing();
      } else {
        parameterModel.stopPublishing();
      }
    }

    if (this.shouldTriggerUpdates) triggerProceduresUpdate(this.workspace);
    if (this.shouldFireEvents) {
      Blockly.Events.fire(
        new ProcedureParameterCreate(
          this.workspace,
          this,
          parameterModel,
          index,
        ),
      );
    }
    return this;
  }

  /**
   * Removes the parameter at the given index from the parameter list.
   *
   * @param index The index of the parameter to remove.
   * @returns This procedure model.
   */
  deleteParameter(index: number): this {
    if (!this.parameters[index]) return this;
    const oldParam = this.parameters[index];

    this.parameters.splice(index, 1);
    if (this.shouldTriggerUpdates) triggerProceduresUpdate(this.workspace);
    if (Blockly.isObservable(oldParam)) {
      oldParam.stopPublishing();
    }

    if (this.shouldFireEvents) {
      Blockly.Events.fire(
        new ProcedureParameterDelete(this.workspace, this, oldParam, index),
      );
    }
    return this;
  }

  /**
   * Sets whether the procedure has a return value (empty array) or no return
   * value (null).
   * This procedure model does not support procedures that have actual
   * return types (i.e. non-empty arrays, e.g. ['number']).
   *
   * @param types Used to set whether this procedure has a return value
   *     (empty array) or no return value (null).
   * @returns This procedure model.
   */
  setReturnTypes(types: string[] | null): this {
    if (types && types.length) {
      throw new Error(
        'The built-in ProcedureModel does not support typing. You need to ' +
          'implement your own custom ProcedureModel.',
      );
    }
    // Either they're both an empty array, or both null. Noop either way.
    if (!!types === !!this.returnTypes) return this;
    const oldReturnTypes = this.returnTypes;
    this.returnTypes = types;
    if (this.shouldTriggerUpdates) triggerProceduresUpdate(this.workspace);
    if (this.shouldFireEvents) {
      Blockly.Events.fire(
        new ProcedureChangeReturn(this.workspace, this, oldReturnTypes),
      );
    }
    return this;
  }

  /**
   * Sets whether this procedure is enabled/disabled. If a procedure is disabled
   * all procedure caller blocks should be disabled as well.
   *
   * @param enabled Whether this procedure is enabled/disabled.
   * @returns This procedure model.
   */
  setEnabled(enabled: boolean): this {
    if (enabled === this.enabled) return this;
    this.enabled = enabled;
    if (this.shouldTriggerUpdates) triggerProceduresUpdate(this.workspace);
    if (this.shouldFireEvents) {
      Blockly.Events.fire(new ProcedureEnable(this.workspace, this));
    }
    return this;
  }

  /**
   * Disables triggering updates to procedure blocks until the endBulkUpdate
   * is called.
   *
   * @internal
   */
  startBulkUpdate() {
    this.shouldTriggerUpdates = false;
  }

  /**
   * Triggers an update to procedure blocks. Should be used with
   * startBulkUpdate.
   *
   * @internal
   */
  endBulkUpdate() {
    this.shouldTriggerUpdates = true;
    triggerProceduresUpdate(this.workspace);
  }

  /**
   * @returns The unique language-neutral ID for the procedure.
   */
  getId(): string {
    return this.id;
  }

  /**
   * @returns The human-readable name of the procedure
   */
  getName(): string {
    return this.name;
  }

  /**
   * @param index The index of the parameter to return.
   * @returns the parameter at the given index in the parameter list.
   */
  getParameter(index: number): Blockly.procedures.IParameterModel {
    return this.parameters[index];
  }

  /**
   * @returns an array of all of the parameters in the parameter list.
   */
  getParameters(): Blockly.procedures.IParameterModel[] {
    return [...this.parameters];
  }

  /**
   * Returns the return type of the procedure.
   * Null represents a procedure that does not return a value.
   *
   * @returns the return type of the procedure.
   */
  getReturnTypes(): string[] | null {
    return this.returnTypes;
  }

  /**
   * Returns whether the procedure is enabled/disabled. If a procedure is
   * disabled, all procedure caller blocks should be disabled as well.
   *
   * @returns Returns whether the procedure is enabled/disabled.
   */
  getEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Tells the procedure model it should fire events.
   *
   * @internal
   */
  startPublishing() {
    this.shouldFireEvents = true;
    Blockly.Events.fire(new ProcedureCreate(this.workspace, this));
    for (const param of this.parameters) {
      if (Blockly.isObservable(param)) param.startPublishing();
    }
  }

  /**
   * Tells the procedure model it should not fire events.
   *
   * @internal
   */
  stopPublishing() {
    triggerProceduresUpdate(this.workspace);
    Blockly.Events.fire(new ProcedureDelete(this.workspace, this));
    this.shouldFireEvents = false;
    for (const param of this.parameters) {
      if (Blockly.isObservable(param)) param.stopPublishing();
    }
  }

  /**
   * Serializes the state of the procedure to JSON.
   *
   * @returns JSON serializable state of the procedure.
   */
  saveState(): Blockly.serialization.procedures.State {
    // Parameter state is serialized by core.
    return {
      id: this.getId(),
      name: this.getName(),
      returnTypes: this.getReturnTypes(),
    };
  }

  /**
   * Returns a new procedure model with the given state.
   *
   * @param state The state of the procedure to load.
   * @param workspace The workspace to load the procedure into.
   * @returns The loaded procedure model.
   */
  static loadState(
    state: Blockly.serialization.procedures.State,
    workspace: Blockly.Workspace,
  ): ObservableProcedureModel {
    return new ObservableProcedureModel(
      workspace,
      state.name,
      state.id,
    ).setReturnTypes(state.returnTypes);
  }
}
