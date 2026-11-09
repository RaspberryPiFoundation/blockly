/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type {ProcedureBaseJson} from './events_procedure_base.js';
import {ProcedureBase} from './events_procedure_base.js';
import type {ObservableParameterModel} from './observable_parameter_model.js';
import type {ObservableProcedureModel} from './observable_procedure_model.js';

let procedureModelClass: typeof ObservableProcedureModel | undefined;
let parameterModelClass: typeof ObservableParameterModel | undefined;

/**
 * Sets the model classes that `ProcedureCreate.fromJson` uses to deserialize
 * procedures. This is called by ObservableProcedureModel, which passes in the
 * classes. This avoids a circular dependency.
 *
 * @internal
 * @param procedureModel The class used to create procedure models.
 * @param parameterModel The class used to create parameter models.
 */
export function setProcedureModelClasses(
  procedureModel: typeof ObservableProcedureModel,
  parameterModel: typeof ObservableParameterModel,
) {
  procedureModelClass = procedureModel;
  parameterModelClass = parameterModel;
}

/**
 * Notifies listeners that a procedure data model has been created.
 */
export class ProcedureCreate extends ProcedureBase {
  static readonly TYPE = 'procedure_create';

  /** A string used to check the type of the event. */
  type = ProcedureCreate.TYPE;

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
      if (procedureMap.get(this.procedure.getId())) return;
      procedureMap.add(this.procedure);
    } else {
      if (!procedureMap.get(this.procedure.getId())) return;
      procedureMap.delete(this.procedure.getId());
    }
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  toJson(): ProcedureCreateJson {
    const json = super.toJson() as ProcedureCreateJson;
    json['procedure'] = Blockly.serialization.procedures.saveProcedure(
      this.procedure,
    );
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param json The JSON representation of a procedure create event.
   * @param workspace The workspace to deserialize the event into.
   * @returns The new procedure create event.
   * @internal
   */
  static fromJson(
    json: ProcedureCreateJson,
    workspace: Blockly.Workspace,
  ): ProcedureCreate {
    if (!procedureModelClass || !parameterModelClass) {
      throw new Error(
        'Cannot deserialize procedure create event because the procedure ' +
          'model classes have not been set.',
      );
    }
    return new ProcedureCreate(
      workspace,
      Blockly.serialization.procedures.loadProcedure(
        procedureModelClass,
        parameterModelClass,
        json['procedure'],
        workspace,
      ),
    );
  }
}

export interface ProcedureCreateJson extends ProcedureBaseJson {
  procedure: Blockly.serialization.procedures.State;
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  ProcedureCreate.TYPE,
  ProcedureCreate,
);
