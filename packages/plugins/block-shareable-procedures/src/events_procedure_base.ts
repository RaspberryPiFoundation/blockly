/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * The base event for an event associated with a procedure.
 */
export abstract class ProcedureBase extends Blockly.Events.Abstract {
  static readonly TYPE: string = 'procedure_base';

  /** A string used to check the type of the event. */
  type = ProcedureBase.TYPE;

  isBlank = false;

  /**
   * Constructs the base procedure event.
   *
   * @param workspace The workspace the procedure model exists in.
   * @param procedure The procedure model associated with this event.
   */
  constructor(
    workspace: Blockly.Workspace,
    readonly procedure: Blockly.procedures.IProcedureModel,
  ) {
    super();
    this.workspaceId = workspace.id;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  toJson(): ProcedureBaseJson {
    const json = super.toJson() as ProcedureBaseJson;
    json['procedureId'] = this.procedure.getId();
    return json;
  }
}

export interface ProcedureBaseJson extends Blockly.Events.AbstractEventJson {
  procedureId: string;
}
