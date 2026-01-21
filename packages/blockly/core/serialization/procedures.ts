/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {IParameterModel} from '../interfaces/i_parameter_model.js';
import {IProcedureModel} from '../interfaces/i_procedure_model.js';
import type {ISerializer} from '../interfaces/i_serializer.js';
import type {Workspace} from '../workspace.js';
import * as priorities from './priorities.js';

/** Represents the state of a procedure model. */
export interface State {
  id: string;
  name: string;
  returnTypes: string[] | null;
  parameters?: ParameterState[];
  [key: string]: unknown;
}

/** Represents the state of a parameter model. */
export interface ParameterState {
  id: string;
  name: string;
  types?: string[];
  [key: string]: unknown;
}

/**
 * A newable signature for an IProcedureModel.
 *
 * Refer to
 * https://www.typescriptlang.org/docs/handbook/interfaces.html#difference-between-the-static-and-instance-sides-of-classes
 * for what is going on with this.
 */
interface ProcedureModelConstructor<ProcedureModel extends IProcedureModel> {
  new (workspace: Workspace, name: string, id: string): ProcedureModel;

  /**
   * Deserializes the JSON state and returns a procedure model.
   *
   * @param state The state to deserialize.
   * @param workspace The workspace to load the procedure model into.
   * @returns The constructed procedure model.
   */
  loadState(state: object, workspace: Workspace): ProcedureModel;
}

/**
 * A newable signature for an IParameterModel.
 *
 * Refer to
 * https://www.typescriptlang.org/docs/handbook/interfaces.html#difference-between-the-static-and-instance-sides-of-classes
 * for what is going on with this.
 */
interface ParameterModelConstructor<ParameterModel extends IParameterModel> {
  new (workspace: Workspace, name: string, id: string): ParameterModel;

  /**
   * Deserializes the JSON state and returns a parameter model.
   *
   * @param state The state to deserialize.
   * @param workspace The workspace to load the parameter model into.
   * @returns The constructed parameter model.
   */
  loadState(state: object, workspace: Workspace): ParameterModel;
}

/**
 * Serializes the given IProcedureModel to JSON.
 */
export function saveProcedure(proc: IProcedureModel): State {
  const state: State = proc.saveState();
  if (!proc.getParameters().length) return state;
  state.parameters = proc.getParameters().map((param) => param.saveState());
  return state;
}

/**
 * Deserializes the given procedure model State from JSON.
 */
export function loadProcedure<
  ProcedureModel extends IProcedureModel,
  ParameterModel extends IParameterModel,
>(
  procedureModelClass: ProcedureModelConstructor<ProcedureModel>,
  parameterModelClass: ParameterModelConstructor<ParameterModel>,
  state: State,
  workspace: Workspace,
): ProcedureModel {
  const proc = procedureModelClass.loadState(state, workspace);
  if (!state.parameters) return proc;
  for (const [index, param] of state.parameters.entries()) {
    proc.insertParameter(
      parameterModelClass.loadState(param, workspace),
      index,
    );
  }
  return proc;
}

/** Serializer for saving and loading procedure state. */
export class ProcedureSerializer<
  ProcedureModel extends IProcedureModel,
  ParameterModel extends IParameterModel,
> implements ISerializer
{
  public priority = priorities.PROCEDURES;

  /**
   * Constructs the procedure serializer.
   *
   * Example usage:
   *   new ProcedureSerializer(MyProcedureModelClass, MyParameterModelClass)
   *
   * @param procedureModelClass The class (implementing IProcedureModel) that
   *     you want this serializer to deserialize.
   * @param parameterModelClass The class (implementing IParameterModel) that
   *     you want this serializer to deserialize.
   */
  constructor(
    private readonly procedureModelClass: ProcedureModelConstructor<ProcedureModel>,
    private readonly parameterModelClass: ParameterModelConstructor<ParameterModel>,
  ) {}

  /** Serializes the procedure models of the given workspace. */
  save(workspace: Workspace): State[] | null {
    const save = workspace
      .getProcedureMap()
      .getProcedures()
      .map((proc) => saveProcedure(proc));
    return save.length ? save : null;
  }

  /**
   * Deserializes the procedures models defined by the given state into the
   * workspace.
   */
  load(state: State[], workspace: Workspace) {
    const map = workspace.getProcedureMap();
    for (const procState of state) {
      map.add(
        loadProcedure(
          this.procedureModelClass,
          this.parameterModelClass,
          procState,
          workspace,
        ),
      );
    }
  }

  /** Disposes of any procedure models that exist on the workspace. */
  clear(workspace: Workspace) {
    workspace.getProcedureMap().clear();
  }
}
