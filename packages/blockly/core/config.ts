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
  textContrast: number;
  increasedTextContrast: number;
}

/** Default snap radius. */
const DEFAULT_SNAP_RADIUS = 28;

/**
 * Object holding all the values on Blockly that we expect developers to be
 * able to change.
 */
export const config = {
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
   * Default is 28.
   *
   */
  snapRadius: DEFAULT_SNAP_RADIUS,
  /**
   * Maximum misalignment between connections for them to snap together.
   * This should be the same as the snap radius.
   * Default is 28.
   *
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
  /**
   * The lowest contrast ratio at which text on a block stays white. On blocks
   * where white text would have less contrast than this, the text is black.
   *
   * The default of 1 keeps text white on every block. WCAG asks for at least
   * 3 for large text and graphics, and 4.5 for normal text. Raising this
   * makes text easier to read on light blocks, but changes the text colour
   * on more of the default block colours.
   *
   * Users who ask their operating system for more contrast get at least
   * `increasedTextContrast`.
   */
  textContrast: 1,
  /**
   * The lowest contrast ratio at which text on a block stays white, for users
   * who ask their operating system for more contrast.
   *
   * The default of 4.5 is the WCAG minimum for normal text.
   */
  increasedTextContrast: 4.5,
} satisfies Config;
