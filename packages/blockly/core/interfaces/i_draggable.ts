/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Coordinate} from '../utils/coordinate.js';
import type {IBoundedElement} from './i_bounded_element.js';
import type {ISelectable} from './i_selectable.js';

export enum DragDisposition {
  COMMIT = 1,
  DELETE = 2,
  REVERT = 3,
}

/**
 * Represents an object that can be dragged.
 */
export interface IDraggable
  extends IDragStrategy,
    IBoundedElement,
    ISelectable {
  /**
   * Returns the current location of the draggable in workspace coordinates.
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
   * @param e Event that started the drag; can be used to check modifier keys,
   *     etc. May be missing when dragging is triggered programmatically rather
   *     than by user.
   */
  startDrag(e?: PointerEvent | KeyboardEvent): IDraggable;

  /**
   * Handles moving elements to the new location, and updating any
   * visuals based on that (e.g connection previews for blocks).
   *
   * @param newLoc Workspace coordinate to which the draggable has
   *     been dragged.
   * @param e Event that continued the drag.  Can be used to check modifier
   *     keys, etc.
   */
  drag(newLoc: Coordinate, e?: PointerEvent | KeyboardEvent): void;

  /**
   * Handles any drag cleanup, including e.g. connecting or deleting blocks.
   *
   * @param newLoc Workspace coordinate at which the drag finished.
   * @param e Event that finished the drag. Can be used to check modifier keys,
   *     etc.
   * @param disposition The end result of the drag.
   */
  endDrag(
    e: PointerEvent | KeyboardEvent | undefined,
    disposition: DragDisposition,
  ): void;

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
