/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ProcedureBase, ProcedureBaseJson} from './events_procedure_base';

/**
 * Notifies listeners that a procedure's return type/status has changed.
 */
export class ProcedureChangeReturn extends ProcedureBase {
  static readonly TYPE = 'procedure_change';

  /** A string used to check the type of the event. */
  type = ProcedureChangeReturn.TYPE;

  /** The new type(s) the procedure's return has been set to. */
  private newTypes: string[] | null;

  /**
   * Constructs the procedure change event.
   *
   * @param workpace The workspace this change event is associated with.
   * @param procedure The model this change event is associated with.
   * @param oldTypes The type(s) the procedure's return was set to before it
   *     changed.
   */
  constructor(
    workpace: Blockly.Workspace,
    procedure: Blockly.procedures.IProcedureModel,
    readonly oldTypes: string[] | null,
  ) {
    super(workpace, procedure);

    this.newTypes = procedure.getReturnTypes();
  }

  /**
   * Replays the event in the workspace.
   *
   * @param forward if true, play the event forward (redo), otherwise play it
   *     backward (undo).
   */
  run(forward: boolean) {
    const procedureModel = this.getEventWorkspace_()
      .getProcedureMap()
      .get(this.procedure.getId());
    if (!procedureModel) {
      throw new Error(
        'Cannot change the type of a procedure that does not exist ' +
          'in the procedure map',
      );
    }
    if (forward) {
      procedureModel.setReturnTypes(this.newTypes);
    } else {
      procedureModel.setReturnTypes(this.oldTypes);
    }
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  toJson(): ProcedureChangeReturnJson {
    const json = super.toJson() as ProcedureChangeReturnJson;
    json['oldTypes'] = this.oldTypes;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param json The JSON representation of a procedure change event.
   * @param workspace The workspace to deserialize the event into.
   * @returns The new procedure change return event.
   * @internal
   */
  static fromJson(
    json: ProcedureChangeReturnJson,
    workspace: Blockly.Workspace,
  ): ProcedureChangeReturn {
    const model = workspace.getProcedureMap().get(json['procedureId']);
    if (!model) {
      throw new Error(
        'Cannot deserialize procedure change return event because the ' +
          'target procedure does not exist',
      );
    }
    return new ProcedureChangeReturn(workspace, model, json['oldTypes']);
  }
}

export interface ProcedureChangeReturnJson extends ProcedureBaseJson {
  oldTypes: string[] | null;
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  ProcedureChangeReturn.TYPE,
  ProcedureChangeReturn,
);
