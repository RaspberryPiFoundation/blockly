/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {
  ProcedureParameterBase,
  ProcedureParameterBaseJson,
} from './events_procedure_parameter_base';
import {ObservableParameterModel} from './observable_parameter_model';

/**
 * Notifies listeners that a parameter has been added to a procedure model.
 */
export class ProcedureParameterCreate extends ProcedureParameterBase {
  static readonly TYPE = 'procedure_parameter_create';

  /** A string used to check the type of the event. */
  type = ProcedureParameterCreate.TYPE;

  parameter: ObservableParameterModel;

  /**
   * Constructs the procedure parameter create event.js.
   *
   * @param workspace The workspace this event is associated with.
   * @param procedure The procedure model this event is associated with.
   * @param parameter The parameter model that was just added to the procedure.
   * @param index The index the parameter was inserted at.
   */
  constructor(
    workspace: Blockly.Workspace,
    procedure: Blockly.procedures.IProcedureModel,
    parameter: ObservableParameterModel,
    readonly index: number,
  ) {
    super(workspace, procedure, parameter);
  }

  /**
   * Replays the event in the workspace.
   *
   * @param forward if true, play the event forward (redo), otherwise play it
   *     backward (undo).
   */
  run(forward: boolean) {
    const workspace = this.getEventWorkspace_();
    const procedureMap = workspace.getProcedureMap();
    const procedureModel = procedureMap.get(this.procedure.getId());
    if (!procedureModel) {
      throw new Error(
        'Cannot add a parameter to a procedure that does not exist ' +
          'in the procedure map',
      );
    }
    if (forward) {
      procedureModel.insertParameter(this.parameter, this.index);
    } else {
      procedureModel.deleteParameter(this.index);
    }
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  toJson(): ProcedureParameterCreateJson {
    const json = super.toJson() as ProcedureParameterCreateJson;
    json['name'] = this.parameter.getName();
    json['id'] = this.parameter.getId();
    json['varId'] = this.parameter.getVariableModel().getId();
    json['index'] = this.index;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param json The JSON representation of a procedure parameter create event.
   * @param workspace The workspace to deserialize the event into.
   * @returns The new procedure parameter create event.
   * @internal
   */
  static fromJson(
    json: ProcedureParameterCreateJson,
    workspace: Blockly.Workspace,
  ): ProcedureParameterCreate {
    const procedure = workspace.getProcedureMap().get(json['procedureId']);
    if (!procedure) {
      throw new Error(
        'Cannot deserialize parameter create event because the ' +
          'target procedure does not exist',
      );
    }
    return new ProcedureParameterCreate(
      workspace,
      procedure,
      new ObservableParameterModel(
        workspace,
        json['name'],
        json['id'],
        json['varId'],
      ),
      json['index'],
    );
  }
}

export interface ProcedureParameterCreateJson extends ProcedureParameterBaseJson {
  parameter: Blockly.serialization.procedures.ParameterState;
  index: number;
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  ProcedureParameterCreate.TYPE,
  ProcedureParameterCreate,
);
