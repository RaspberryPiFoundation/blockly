/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Coordinate} from '../utils/coordinate';

export interface IDragger {
  /**
   * Handles any drag startup.
   *
   * @param e PointerEvent that started the drag.
   */
  onDragStart(e: PointerEvent): void;

  /**
   * Handles dragging, including calculating where the element should
   * actually be moved to.
   *
   * @param e PointerEvent that continued the drag.
   * @param totalDelta The total distance, in pixels, that the mouse
   *     has moved since the start of the drag.
   */
  onDrag(e: PointerEvent, totalDelta: Coordinate): void;

  /**
   * Handles any drag cleanup.
   *
   * @param e PointerEvent that finished the drag.
   * @param totalDelta The total distance, in pixels, that the mouse
   *     has moved since the start of the drag.
   */
  onDragEnd(e: PointerEvent, totalDelta: Coordinate): void;
}
