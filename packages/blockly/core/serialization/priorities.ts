/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.serialization.priorities

/**
 * The priority for deserializing variables.
 */
export const VARIABLES = 100;

/**
 * The priority for deserializing variable data.
 */
export const PROCEDURES = 75;

/**
 * The priority for deserializing blocks.
 */
export const BLOCKS = 50;

/** The priority for deserializing workspace comments. */
export const WORKSPACE_COMMENTS = 25;
