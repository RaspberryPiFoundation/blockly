/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as browserEvents from '../browser_events.js';
import type {WorkspaceSvg} from '../workspace_svg.js';
import {Coordinate} from './coordinate.js';

const workspaceToDragDelta: WeakMap<WorkspaceSvg, Coordinate> = new WeakMap();

/**
 * Convert from mouse coordinates to workspace coordinates.
 *
 * @param workspace The workspace where the pointer event is occurring.
 * @param e The pointer event with the source coordinates.
 */
function mouseToWorkspacePoint(
  workspace: WorkspaceSvg,
  e: PointerEvent,
): SVGPoint {
  const point = browserEvents.mouseToSvg(
    e,
    workspace.getParentSvg(),
    workspace.getInverseScreenCTM(),
  );
  // Fix scale of mouse event.
  point.x /= workspace.scale;
  point.y /= workspace.scale;
  return point;
}

/**
 * Start tracking a drag of an object on this workspace by recording the offset
 * between the pointer's current location and the object's starting location.
 *
 * Used for resizing block comments and workspace comments.
 *
 * @param workspace The workspace where the drag is occurring.
 * @param e Pointer down event.
 * @param xy Starting location of object.
 */
export function start(
  workspace: WorkspaceSvg,
  e: PointerEvent,
  xy: Coordinate,
) {
  const point = mouseToWorkspacePoint(workspace, e);
  // Record the starting offset between the bubble's location and the mouse.
  workspaceToDragDelta.set(workspace, Coordinate.difference(xy, point));
}

/**
 * Compute the new position of a dragged object in this workspace based on the
 * current pointer position and the offset between the pointer's starting
 * location and the object's starting location.
 *
 * The start function should have be called previously, when the drag started.
 *
 * Used for resizing block comments and workspace comments.
 *
 * @param workspace The workspace where the drag is occurring.
 * @param e Pointer move event.
 * @returns New location of object.
 */
export function move(workspace: WorkspaceSvg, e: PointerEvent): Coordinate {
  const point = mouseToWorkspacePoint(workspace, e);
  const dragDelta = workspaceToDragDelta.get(workspace);
  if (!dragDelta) {
    throw new Error('Drag not initialized');
  }
  return Coordinate.sum(dragDelta, point);
}
