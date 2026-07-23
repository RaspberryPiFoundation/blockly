/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/** Defines if an object can be added to the backpack. */
export interface Backpackable {
  /**
   * @return A representation of this object as a FlyoutItemInfo array, so that
   * it can be displayed in the backpack.
   *
   * This method should remove any unique or useless state data (e.g. IDs or
   * coordinates).
   */
  toFlyoutInfo(): Blockly.utils.toolbox.FlyoutItemInfo[];
}

/**
 * @param obj The object we want to check is a Backpackable or not.
 * @return Whether the given object conforms to the Backpackable interface.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isBackpackable(obj: any): obj is Backpackable {
  return obj.toFlyoutInfo !== undefined;
}
