/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ComponentManager} from '../component_manager.js';
import * as eventUtils from '../events/utils.js';
import {getFocusManager} from '../focus_manager.js';
import type {IDeletable} from '../interfaces/i_deletable.js';
import {isDeletable} from '../interfaces/i_deletable.js';
import type {IDeleteArea} from '../interfaces/i_delete_area.js';
import type {IDragTarget} from '../interfaces/i_drag_target.js';
import {DragDisposition, type IDraggable} from '../interfaces/i_draggable.js';
import type {IDragger} from '../interfaces/i_dragger.js';
import {isFocusableNode} from '../interfaces/i_focusable_node.js';
import * as registry from '../registry.js';
import {Coordinate} from '../utils/coordinate.js';

export class Dragger implements IDragger {
  protected startLoc: Coordinate;

  protected dragTarget: IDragTarget | null = null;

  constructor(protected draggable: IDraggable) {
    this.startLoc = draggable.getRelativeToSurfaceXY();
  }

  /** Handles any drag startup. */
  onDragStart(e?: PointerEvent | KeyboardEvent) {
    if (!eventUtils.getGroup()) {
      eventUtils.setGroup(true);
    }
    this.draggable = this.draggable.startDrag(e);
    this.startLoc = this.draggable.getRelativeToSurfaceXY();

    return this.draggable;
  }

  /**
   * Handles calculating where the element should actually be moved to.
   *
   * @param totalDelta The total amount in pixel coordinates the mouse has moved
   *     since the start of the drag.
   */
  onDrag(e: PointerEvent | KeyboardEvent | undefined, totalDelta: Coordinate) {
    this.moveDraggable(e, totalDelta);

    // Must check `wouldDelete` before calling other hooks on drag targets
    // since we have documented that we would do so.
    if (isDeletable(this.draggable)) {
      this.draggable.setDeleteStyle(
        this.wouldDeleteDraggable(
          this.draggable.getRelativeToSurfaceXY(),
          this.draggable,
        ),
      );
    }
    this.updateDragTarget(this.draggable.getRelativeToSurfaceXY());
  }

  /** Updates the drag target under the pointer (if there is one). */
  protected updateDragTarget(coordinate: Coordinate) {
    const newDragTarget = this.draggable.workspace.getDragTarget(coordinate);
    if (this.dragTarget !== newDragTarget) {
      this.dragTarget?.onDragExit(this.draggable);
      newDragTarget?.onDragEnter(this.draggable);
    }
    newDragTarget?.onDragOver(this.draggable);
    this.dragTarget = newDragTarget;
  }

  /**
   * Calculates the correct workspace coordinate for the movable and tells
   * the draggable to go to that location.
   */
  private moveDraggable(
    e: PointerEvent | KeyboardEvent | undefined,
    totalDelta: Coordinate,
  ) {
    const delta = this.pixelsToWorkspaceUnits(totalDelta);
    const newLoc = Coordinate.sum(this.startLoc, delta);
    this.draggable.drag(newLoc, e);
  }

  /**
   * Returns true if we would delete the draggable if it was dropped
   * at the current location.
   */
  protected wouldDeleteDraggable(
    coordinate: Coordinate,
    rootDraggable: IDraggable & IDeletable,
  ) {
    const dragTarget = this.draggable.workspace.getDragTarget(coordinate);
    if (!dragTarget) return false;

    const componentManager = this.draggable.workspace.getComponentManager();
    const isDeleteArea = componentManager.hasCapability(
      dragTarget.id,
      ComponentManager.Capability.DELETE_AREA,
    );
    if (!isDeleteArea) return false;

    return (dragTarget as IDeleteArea).wouldDelete(rootDraggable);
  }

  /** Handles any drag cleanup. */
  onDragEnd(e?: PointerEvent | KeyboardEvent) {
    const origGroup = eventUtils.getGroup();
    const dragTarget = this.draggable.workspace.getDragTarget(
      this.draggable.getRelativeToSurfaceXY(),
    );

    if (dragTarget) {
      this.dragTarget?.onDrop(this.draggable);
    }

    let reverted = false;
    if (
      this.shouldReturnToStart(
        this.draggable.getRelativeToSurfaceXY(),
        this.draggable,
      )
    ) {
      reverted = true;
      this.draggable.revertDrag();
    }

    const wouldDelete =
      isDeletable(this.draggable) &&
      this.wouldDeleteDraggable(
        this.draggable.getRelativeToSurfaceXY(),
        this.draggable,
      );

    if (wouldDelete && isDeletable(this.draggable)) {
      this.draggable.endDrag(e, DragDisposition.DELETE);
      // We want to make sure the delete gets grouped with any possible move
      // event. In core Blockly this shouldn't happen, but due to a change
      // in behavior older custom draggables might still clear the group.
      eventUtils.setGroup(origGroup);
      this.draggable.dispose();
    } else {
      this.draggable.endDrag(
        e,
        reverted ? DragDisposition.REVERT : DragDisposition.COMMIT,
      );
    }
    eventUtils.setGroup(false);

    if (!wouldDelete && isFocusableNode(this.draggable)) {
      // Ensure focusable nodes that have finished dragging (but aren't being
      // deleted) end with focus and selection.
      getFocusManager().focusNode(this.draggable);
    }
  }

  /** Handles a drag being reverted. */
  onDragRevert() {
    this.draggable.revertDrag();
    if (isFocusableNode(this.draggable)) {
      getFocusManager().focusNode(this.draggable);
    }
  }

  /**
   * Returns true if we should return the draggable to its original location
   * at the end of the drag.
   */
  protected shouldReturnToStart(
    coordinate: Coordinate,
    rootDraggable: IDraggable,
  ) {
    const dragTarget = this.draggable.workspace.getDragTarget(coordinate);
    if (!dragTarget) return false;
    return dragTarget.shouldPreventMove(rootDraggable);
  }

  protected pixelsToWorkspaceUnits(pixelCoord: Coordinate): Coordinate {
    const result = new Coordinate(
      pixelCoord.x / this.draggable.workspace.scale,
      pixelCoord.y / this.draggable.workspace.scale,
    );
    if (this.draggable.workspace.isMutator) {
      // If we're in a mutator, its scale is always 1, purely because of some
      // oddities in our rendering optimizations.  The actual scale is the same
      // as the scale on the parent workspace. Fix that for dragging.
      const mainScale = this.draggable.workspace.options.parentWorkspace!.scale;
      result.scale(1 / mainScale);
    }
    return result;
  }
}

registry.register(registry.Type.BLOCK_DRAGGER, registry.DEFAULT, Dragger);
