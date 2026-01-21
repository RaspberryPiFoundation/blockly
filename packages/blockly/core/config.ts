/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.config

/**
 * All the values that we expect developers to be able to change
 * before injecting Blockly.
 */
interface Config {
  dragRadius: number;
  flyoutDragRadius: number;
  snapRadius: number;
  currentConnectionPreference: number;
  bumpDelay: number;
  connectingSnapRadius: number;
}

/** Default snap radius. */
const DEFAULT_SNAP_RADIUS = 28;

/**
 * Object holding all the values on Blockly that we expect developers to be
 * able to change.
 */
export const config: Config = {
  /**
   * Number of pixels the mouse must move before a drag starts.
   *
   */
  dragRadius: 5,
  /**
   * Number of pixels the mouse must move before a drag/scroll starts from the
   * flyout.  Because the drag-intention is determined when this is reached, it
   * is larger than dragRadius so that the drag-direction is clearer.
   *
   */
  flyoutDragRadius: 10,
  /**
   * Maximum misalignment between connections for them to snap together.
   *
   */
  snapRadius: DEFAULT_SNAP_RADIUS,
  /**
   * Maximum misalignment between connections for them to snap together.
   * This should be the same as the snap radius.
   */
  connectingSnapRadius: DEFAULT_SNAP_RADIUS,
  /**
   * How much to prefer staying connected to the current connection over moving
   * to a new connection.  The current previewed connection is considered to be
   * this much closer to the matching connection on the block than it actually
   * is.
   *
   */
  currentConnectionPreference: 8,
  /**
   * Delay in ms between trigger and bumping unconnected block out of alignment.
   *
   */
  bumpDelay: 250,
};
