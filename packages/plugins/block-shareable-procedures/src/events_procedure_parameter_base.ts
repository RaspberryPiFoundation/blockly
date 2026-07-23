/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ProcedureBase, ProcedureBaseJson} from './events_procedure_base';

/**
 * The base event for an event associated with a procedure parameter.
 */
export abstract class ProcedureParameterBase extends ProcedureBase {
  static readonly TYPE: string = 'procedure_parameter_base';

  /** A string used to check the type of the event. */
  type = ProcedureParameterBase.TYPE;

  /**
   * Constructs the procedure parameter base event.
   *
   * @param workspace The workspace the parameter model exists in.
   * @param procedure The procedure model the parameter model belongs to.
   * @param parameter The parameter model associated with this event.
   */
  constructor(
    workspace: Blockly.Workspace,
    procedure: Blockly.procedures.IProcedureModel,
    readonly parameter: Blockly.procedures.IParameterModel,
  ) {
    super(workspace, procedure);
    this.recordUndo = false;
  }

  /**
   * Finds the parameter with the given ID in the procedure model with the given
   * ID, if both things exist.
   *
   * @param workspace The workspace to search for the parameter.
   * @param procedureId The ID of the procedure model to search for
   *     the parameter.
   * @param paramId The ID of the parameter to search for.
   * @returns The parameter model that was found.
   * @internal
   */
  static findMatchingParameter(
    workspace: Blockly.Workspace,
    procedureId: string,
    paramId: string,
  ): ProcedureParameterPair {
    const procedure = workspace.getProcedureMap().get(procedureId);
    if (!procedure) return {procedure: undefined, parameter: undefined};
    const parameter = procedure
      .getParameters()
      .find((p) => p.getId() === paramId);
    if (!parameter) return {procedure, parameter: undefined};
    return {procedure, parameter};
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  toJson(): ProcedureParameterBaseJson {
    const json = super.toJson() as ProcedureParameterBaseJson;
    json['parameterId'] = this.parameter.getId();
    return json;
  }
}

export interface ProcedureParameterPair {
  procedure?: Blockly.procedures.IProcedureModel;
  parameter?: Blockly.procedures.IParameterModel;
}

export interface ProcedureParameterBaseJson extends ProcedureBaseJson {
  parameterId: string;
}
