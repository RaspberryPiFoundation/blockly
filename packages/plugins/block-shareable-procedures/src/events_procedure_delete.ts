/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ProcedureBase, ProcedureBaseJson} from './events_procedure_base';

/**
 * Notifies listeners that a procedure data model has been deleted.
 */
export class ProcedureDelete extends ProcedureBase {
  static readonly TYPE = 'procedure_delete';

  /** A string used to check the type of the event. */
  type = ProcedureDelete.TYPE;

  /**
   * Replays the event in the workspace.
   *
   * @param forward if true, play the event forward (redo), otherwise play it
   *     backward (undo).
   */
  run(forward: boolean) {
    const workspace = this.getEventWorkspace_();
    const procedureMap = workspace.getProcedureMap();
    if (forward) {
      if (!procedureMap.get(this.procedure.getId())) return;
      procedureMap.delete(this.procedure.getId());
    } else {
      if (procedureMap.get(this.procedure.getId())) return;
      procedureMap.add(this.procedure);
    }
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  toJson(): ProcedureDeleteJson {
    return super.toJson() as ProcedureDeleteJson;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param json The JSON representation of a procedure delete event.
   * @param workspace The workspace to deserialize the event into.
   * @returns The new procedure delete event.
   * @internal
   */
  static fromJson(
    json: ProcedureDeleteJson,
    workspace: Blockly.Workspace,
  ): ProcedureDelete {
    const model = workspace.getProcedureMap().get(json['procedureId']);
    if (!model) {
      throw new Error(
        'Cannot deserialize procedure delete event because the ' +
          'target procedure does not exist',
      );
    }
    return new ProcedureDelete(workspace, model);
  }
}

export type ProcedureDeleteJson = ProcedureBaseJson;

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  ProcedureDelete.TYPE,
  ProcedureDelete,
);
