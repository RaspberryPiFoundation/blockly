/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Coordinate} from '../utils/coordinate';
import type {IDraggable} from './i_draggable';

export interface IDragger {
  /**
   * Handles any drag startup.
   *
   * @param e Event that started the drag.
   */
  onDragStart(e?: PointerEvent | KeyboardEvent): IDraggable;

  /**
   * Handles dragging, including calculating where the element should
   * actually be moved to.
   *
   * @param e Event that continued the drag.
   * @param totalDelta The total distance, in pixels, that the draggable
   *     has moved since the start of the drag.
   */
  onDrag(
    e: PointerEvent | KeyboardEvent | undefined,
    totalDelta: Coordinate,
  ): void;

  /**
   * Handles any drag cleanup when a drag finishes normally.
   *
   * @param e Event that finished the drag.
   * @param totalDelta The total distance, in pixels, that the draggable
   *     has moved since the start of the drag.
   */
  onDragEnd(
    e: PointerEvent | KeyboardEvent | undefined,
    totalDelta: Coordinate,
  ): void;

  /**
   * Handles any drag cleanup when a drag is reverted.
   *
   * @param e Event that finished the drag.
   * @param totalDelta The total distance, in pixels, that the draggable
   *     has moved since the start of the drag.
   */
  onDragRevert(
    e: PointerEvent | KeyboardEvent | undefined,
    totalDelta: Coordinate,
  ): void;
}
