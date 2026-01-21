/**
 * @license
 * Copyright 2013 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blocks

/**
 * A block definition.  For now this very loose, but it can potentially
 * be refined e.g. by replacing this typedef with a class definition.
 */
export type BlockDefinition = AnyDuringMigration;

/**
 * A mapping of block type names to block prototype objects.
 */
export const Blocks: {[key: string]: BlockDefinition} = Object.create(null);
