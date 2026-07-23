/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ProcedureParameterRename} from './events_procedure_parameter_rename';
import {triggerProceduresUpdate} from './update_procedures';

/** Represents a procedure parameter. */
export class ObservableParameterModel
  implements Blockly.procedures.IParameterModel
{
  private id: string;
  private variable: Blockly.IVariableModel<Blockly.IVariableState>;
  private shouldFireEvents = false;
  private procedureModel: Blockly.procedures.IProcedureModel | null = null;

  /**
   * Constructor for the procedure parameter.
   *
   * @param workspace The workspace this parameter model exists in.
   * @param name The name of this parameter.
   * @param id The optional unique language-neutral ID of the parameter.
   * @param varId The optional ID of the variable this parameter should be
   *     associated with.
   */
  constructor(
    private readonly workspace: Blockly.Workspace,
    name: string,
    id?: string,
    varId?: string,
  ) {
    this.id = id ?? Blockly.utils.idGenerator.genUid();
    this.variable = this.createBackingVariable(name, varId);
  }

  /**
   * Sets the name of this parameter to the given name.
   *
   * @param name The string to set the name to.
   * @param id The optional ID the backing variable should have.
   * @returns This parameter model.
   */
  setName(name: string, id?: string): this {
    if (name === this.variable.getName()) return this;
    const oldName = this.variable.getName();
    this.variable =
      this.workspace.getVariableMap().getVariable(name) ??
      this.workspace.getVariableMap().createVariable(name, '', id);
    triggerProceduresUpdate(this.workspace);
    if (this.shouldFireEvents) {
      Blockly.Events.fire(
        new ProcedureParameterRename(
          this.workspace,
          this.procedureModel,
          this,
          oldName,
        ),
      );
    }
    return this;
  }

  /**
   * Creates a backing variable in a way that is subclassable.
   *
   * @param name The string to set set the variable to.
   * @param varId The optional ID the backing variable should have.
   * @returns The created variable model.
   */
  protected createBackingVariable(
    name: string,
    varId?: string,
  ): Blockly.IVariableModel<Blockly.IVariableState> {
    this.variable = Blockly.Variables.getOrCreateVariablePackage(
      this.workspace,
      varId || null,
      name,
      '',
    );
    return this.variable;
  }

  /**
   * Unimplemented. The built-in ParameterModel does not support typing.
   * If you want your procedure blocks to have typed parameters, you need to
   * implement your own ParameterModel.
   *
   * @param types The types to set this parameter to.
   * @throws {!Error} Throws for the ObservableParameterModel specifically
   *     because this method is unimplemented.
   */
  setTypes(types: string[]): this {
    throw new Error(
      'The built-in ParameterModel does not support typing. You need to ' +
        'implement your own custom ParameterModel.',
    );
  }

  /**
   * @returns the name of this parameter.
   */
  getName(): string {
    return this.variable.getName();
  }

  /**
   * @returns the types of this parameter.
   */
  getTypes(): string[] {
    return [];
  }

  /**
   * Returns the unique language-neutral ID for the parameter. This represents
   * the identity of the variable model which does not change over time.
   *
   * @returns The unique language-neutral ID for the parameter.
   */
  getId(): string {
    return this.id;
  }

  /**
   * @returns the variable model associated with the parameter model.
   */
  getVariableModel(): Blockly.IVariableModel<Blockly.IVariableState> {
    return this.variable;
  }

  /**
   * Tells the parameter model it should fire events.
   *
   * @internal
   */
  startPublishing() {
    this.shouldFireEvents = true;
  }

  /**
   * Tells the parameter model it should not fire events.
   *
   * @internal
   */
  stopPublishing() {
    this.shouldFireEvents = false;
  }

  /**
   * Sets the procedure model this parameter is a part of.
   *
   * @param model The procedure model this parameter is a part of.
   * @returns This parameter model.
   */
  setProcedureModel(model: Blockly.procedures.IProcedureModel): this {
    this.procedureModel = model;
    return this;
  }

  /**
   * Serializes the state of this parameter to JSON.
   *
   * @returns JSON serializable state of the parameter.
   */
  saveState(): Blockly.serialization.procedures.ParameterState {
    const state: Blockly.serialization.procedures.ParameterState = {
      id: this.getId(),
      name: this.getName(),
    };
    if (!this.getTypes().length) return state;
    state.types = this.getTypes();
    return state;
  }

  /**
   * Returns a new parameter model with the given state.
   *
   * @param state The state of the parameter to load.
   * @param workspace The workspace to load the parameter into.
   * @returns The loaded parameter model.
   */
  static loadState(
    state: Blockly.serialization.procedures.ParameterState,
    workspace: Blockly.Workspace,
  ): ObservableParameterModel {
    const model = new ObservableParameterModel(workspace, state.name, state.id);
    if (state.types) model.setTypes(state.types);
    return model;
  }
}
