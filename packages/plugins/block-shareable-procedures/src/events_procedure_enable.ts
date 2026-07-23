/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ProcedureBase, ProcedureBaseJson} from './events_procedure_base';

/**
 * Notifies listeners that the procedure data model has been enabled or
 * disabled.
 */
export class ProcedureEnable extends ProcedureBase {
  static readonly TYPE = 'procedure_enable';

  /** A string used to check the type of the event. */
  type = ProcedureEnable.TYPE;

  private oldState: boolean;
  private newState: boolean;

  /**
   * Constructs the procedure enable event.
   *
   * @param workspace The workspace this event is associated with.
   * @param procedure The model this event is associated with.
   * @param newState The (optional) new enabled state of the procedure model.
   *     If not provided, the procedure model will be inspected to determine
   *     its current state.
   */
  constructor(
    workspace: Blockly.Workspace,
    procedure: Blockly.procedures.IProcedureModel,
    newState?: boolean,
  ) {
    super(workspace, procedure);

    if (newState === undefined) {
      this.oldState = !procedure.getEnabled();
      this.newState = procedure.getEnabled();
    } else {
      this.oldState = !newState;
      this.newState = newState;
    }
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
        'Cannot change the enabled state of a procedure that does not ' +
          'exist in the procedure map',
      );
    }
    if (forward) {
      procedureModel.setEnabled(this.newState);
    } else {
      procedureModel.setEnabled(this.oldState);
    }
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  toJson(): ProcedureEnableJson {
    const json = super.toJson() as ProcedureEnableJson;
    json['newState'] = this.newState;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param json The JSON representation of a procedure enable event.
   * @param workspace The workspace to deserialize the event into.
   * @returns The new procedure enable event.
   * @internal
   */
  static fromJson(
    json: ProcedureEnableJson,
    workspace: Blockly.Workspace,
  ): ProcedureEnable {
    const model = workspace.getProcedureMap().get(json['procedureId']);
    if (!model) {
      throw new Error(
        'Cannot deserialize procedure enable event because the ' +
          'target procedure does not exist',
      );
    }
    return new ProcedureEnable(workspace, model, json['newState']);
  }
}

export interface ProcedureEnableJson extends ProcedureBaseJson {
  newState: boolean;
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  ProcedureEnable.TYPE,
  ProcedureEnable,
);
