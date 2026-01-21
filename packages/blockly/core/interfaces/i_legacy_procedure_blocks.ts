/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Legacy means of representing a procedure signature. The elements are
 * respectively: name, parameter names, and whether it has a return value.
 */
export type ProcedureTuple = [string, string[], boolean];

/**
 * Procedure block type.
 *
 * @internal
 */
export interface ProcedureBlock {
  getProcedureCall: () => string;
  renameProcedure: (p1: string, p2: string) => void;
  getProcedureDef: () => ProcedureTuple;
}

/** @internal */
export interface LegacyProcedureDefBlock {
  getProcedureDef: () => ProcedureTuple;
}

/** @internal */
export function isLegacyProcedureDefBlock(
  obj: any,
): obj is LegacyProcedureDefBlock {
  return obj && typeof obj.getProcedureDef === 'function';
}

/** @internal */
export interface LegacyProcedureCallBlock {
  getProcedureCall: () => string;
  renameProcedure: (p1: string, p2: string) => void;
}

/** @internal */
export function isLegacyProcedureCallBlock(
  obj: any,
): obj is LegacyProcedureCallBlock {
  return (
    obj &&
    typeof obj.getProcedureCall === 'function' &&
    typeof obj.renameProcedure === 'function'
  );
}
