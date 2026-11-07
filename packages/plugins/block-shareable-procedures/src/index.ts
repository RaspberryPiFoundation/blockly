/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ObservableParameterModel} from './observable_parameter_model.js';
import {ObservableProcedureModel} from './observable_procedure_model.js';

export {blocks} from './blocks.js';
export {IProcedureBlock, isProcedureBlock} from './i_procedure_block.js';
export {ProcedureBase, ProcedureBaseJson} from './events_procedure_base.js';
export {
  ProcedureChangeReturn,
  ProcedureChangeReturnJson,
} from './events_procedure_change_return.js';
export {
  ProcedureCreate,
  ProcedureCreateJson,
} from './events_procedure_create.js';
export {
  ProcedureDelete,
  ProcedureDeleteJson,
} from './events_procedure_delete.js';
export {
  ProcedureParameterBase,
  ProcedureParameterBaseJson,
} from './events_procedure_parameter_base.js';
export {
  ProcedureParameterCreate,
  ProcedureParameterCreateJson,
} from './events_procedure_parameter_create.js';
export {
  ProcedureParameterDelete,
  ProcedureParameterDeleteJson,
} from './events_procedure_parameter_delete.js';
export {
  ProcedureParameterRename,
  ProcedureParameterRenameJson,
} from './events_procedure_parameter_rename.js';
export {
  ProcedureRename,
  ProcedureRenameJson,
} from './events_procedure_rename.js';
export {triggerProceduresUpdate} from './update_procedures.js';

export {ObservableParameterModel, ObservableProcedureModel};

/**
 * Unregisters all of the procedure blocks.
 *
 * Usually used to unregister the built-in blocks, before register the
 * blocks provided by this plugin.
 */
export function unregisterProcedureBlocks() {
  delete Blockly.Blocks['procedures_defnoreturn'];
  delete Blockly.Blocks['procedures_callnoreturn'];
  delete Blockly.Blocks['procedures_defreturn'];
  delete Blockly.Blocks['procedures_callreturn'];
}

/**
 * Unregisters any existing procedure serializer, and registers a new one
 * parameterized with the shareable procedure backing data models.
 */
export function registerProcedureSerializer() {
  Blockly.serialization.registry.unregister('procedures');
  Blockly.serialization.registry.register(
    'procedures',
    new Blockly.serialization.procedures.ProcedureSerializer(
      ObservableProcedureModel,
      ObservableParameterModel,
    ),
  );
}
