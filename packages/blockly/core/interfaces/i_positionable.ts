/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IPositionable

import type {UiMetrics} from '../metrics_manager.js';
import type {Rect} from '../utils/rect.js';
import type {IComponent} from './i_component.js';

/**
 * Interface for a component that is positioned on top of the workspace.
 */
export interface IPositionable extends IComponent {
  /**
   * Positions the element. Called when the window is resized.
   *
   * @param metrics The workspace metrics.
   * @param savedPositions List of rectangles that are already on the workspace.
   */
  position(metrics: UiMetrics, savedPositions: Rect[]): void;

  /**
   * Returns the bounding rectangle of the UI element in pixel units relative to
   * the Blockly injection div.
   *
   * @returns The UI elements's bounding box. Null if bounding box should be
   *     ignored by other UI elements.
   */
  getBoundingRectangle(): Rect | null;
}
