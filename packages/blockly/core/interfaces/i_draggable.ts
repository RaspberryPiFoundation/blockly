/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Coordinate} from '../utils/coordinate';

/**
 * Represents an object that can be dragged.
 */
export interface IDraggable extends IDragStrategy {
  /**
   * Returns the current location of the draggable in workspace
   * coordinates.
   *
   * @returns Coordinate of current location on workspace.
   */
  getRelativeToSurfaceXY(): Coordinate;
}

export interface IDragStrategy {
  /** Returns true iff the element is currently movable. */
  isMovable(): boolean;

  /**
   * Handles any drag startup (e.g moving elements to the front of the
   * workspace).
   *
   * @param e PointerEvent that started the drag; can be used to
   *     check modifier keys, etc.  May be missing when dragging is
   *     triggered programatically rather than by user.
   */
  startDrag(e?: PointerEvent): void;

  /**
   * Handles moving elements to the new location, and updating any
   * visuals based on that (e.g connection previews for blocks).
   *
   * @param newLoc Workspace coordinate to which the draggable has
   *     been dragged.
   * @param e PointerEvent that continued the drag.  Can be
   *     used to check modifier keys, etc.
   */
  drag(newLoc: Coordinate, e?: PointerEvent): void;

  /**
   * Handles any drag cleanup, including e.g. connecting or deleting
   * blocks.
   *
   * @param newLoc Workspace coordinate at which the drag finished.
   *     been dragged.
   * @param e PointerEvent that finished the drag.  Can be
   *     used to check modifier keys, etc.
   */
  endDrag(e?: PointerEvent): void;

  /** Moves the draggable back to where it was at the start of the drag. */
  revertDrag(): void;
}

/** Returns whether the given object is an IDraggable or not. */
export function isDraggable(obj: any): obj is IDraggable {
  return (
    obj &&
    typeof obj.getRelativeToSurfaceXY === 'function' &&
    typeof obj.isMovable === 'function' &&
    typeof obj.startDrag === 'function' &&
    typeof obj.drag === 'function' &&
    typeof obj.endDrag === 'function' &&
    typeof obj.revertDrag === 'function'
  );
}
