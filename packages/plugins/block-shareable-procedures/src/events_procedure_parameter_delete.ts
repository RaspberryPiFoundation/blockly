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

/**
 * Notifies listeners that a parameter has been removed from a procedure.
 */
export class ProcedureParameterDelete extends ProcedureParameterBase {
  static readonly TYPE = 'procedure_parameter_delete';

  /** A string used to check the type of the event. */
  type = ProcedureParameterDelete.TYPE;

  /**
   * Constructs the procedure parameter delete event.
   *
   * @param workspace The workspace this event is associated with.
   * @param procedure The procedure model this event is associated with.
   * @param parameter The parameter model that was just removed from the
   *     procedure.
   * @param index The index the parameter was at before it was removed.
   */
  constructor(
    workspace: Blockly.Workspace,
    procedure: Blockly.procedures.IProcedureModel,
    parameter: Blockly.procedures.IParameterModel,
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
      procedureModel.deleteParameter(this.index);
    } else {
      procedureModel.insertParameter(this.parameter, this.index);
    }
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  toJson(): ProcedureParameterDeleteJson {
    const json = super.toJson() as ProcedureParameterDeleteJson;
    json['index'] = this.index;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param json The JSON representation of a procedure parameter delete event.
   * @param workspace The workspace to deserialize the event into.
   * @returns The new procedure parameter delete event.
   * @internal
   */
  static fromJson(
    json: ProcedureParameterDeleteJson,
    workspace: Blockly.Workspace,
  ): ProcedureParameterDelete {
    const {procedure, parameter} = ProcedureParameterBase.findMatchingParameter(
      workspace,
      json['procedureId'],
      json['parameterId'],
    );
    if (!parameter) {
      throw new Error('Cannot delete a non existant parameter');
    }
    return new ProcedureParameterDelete(
      workspace,
      procedure,
      parameter,
      json['index'],
    );
  }
}

export interface ProcedureParameterDeleteJson extends ProcedureParameterBaseJson {
  index: number;
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  ProcedureParameterDelete.TYPE,
  ProcedureParameterDelete,
);
