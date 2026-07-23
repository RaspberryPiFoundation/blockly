/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/* eslint-disable @typescript-eslint/naming-convention */

/** The interface for a block which models a procedure. */
export interface IProcedureBlock {
  getProcedureModel(): Blockly.procedures.IProcedureModel;
  doProcedureUpdate(): void;
  isProcedureDef(): boolean;
}

/**
 * A type guard which checks if the given block is a procedure block.
 *
 * @param block The block to check for procedure-y-ness.
 * @returns Whether this block is a procedure block or not.
 */
export function isProcedureBlock(
  block: Blockly.Block | IProcedureBlock,
): block is IProcedureBlock {
  return (
    (block as IProcedureBlock).getProcedureModel !== undefined &&
    (block as IProcedureBlock).doProcedureUpdate !== undefined &&
    (block as IProcedureBlock).isProcedureDef !== undefined
  );
}
