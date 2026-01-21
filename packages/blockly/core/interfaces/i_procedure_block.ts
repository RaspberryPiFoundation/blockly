/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.procedures.IProcedureBlock

import type {Block} from '../block.js';
import {IProcedureModel} from './i_procedure_model.js';

/** The interface for a block which models a procedure. */
export interface IProcedureBlock {
  getProcedureModel(): IProcedureModel;
  doProcedureUpdate(): void;
  isProcedureDef(): boolean;
}

/** A type guard which checks if the given block is a procedure block. */
export function isProcedureBlock(
  block: Block | IProcedureBlock,
): block is IProcedureBlock {
  block = block as IProcedureBlock;
  return (
    typeof block.getProcedureModel === 'function' &&
    typeof block.doProcedureUpdate === 'function' &&
    typeof block.isProcedureDef === 'function'
  );
}
