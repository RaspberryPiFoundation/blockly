/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.uiPosition

import type {UiMetrics} from './metrics_manager.js';
import {Scrollbar} from './scrollbar.js';
import {Rect} from './utils/rect.js';
import type {Size} from './utils/size.js';
import * as toolbox from './utils/toolbox.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Enum for vertical positioning.
 *
 * @internal
 */
export enum verticalPosition {
  TOP,
  BOTTOM,
}

/**
 * Enum for horizontal positioning.
 *
 * @internal
 */
export enum horizontalPosition {
  LEFT,
  RIGHT,
}

/**
 * An object defining a horizontal and vertical positioning.
 *
 * @internal
 */
export interface Position {
  horizontal: horizontalPosition;
  vertical: verticalPosition;
}

/**
 * Enum for bump rules to use for dealing with collisions.
 *
 * @internal
 */
export enum bumpDirection {
  UP,
  DOWN,
}

/**
 * Returns a rectangle representing reasonable position for where to place a UI
 * element of the specified size given the restraints and locations of the
 * scrollbars. This method does not take into account any already placed UI
 * elements.
 *
 * @param position The starting horizontal and vertical position.
 * @param size the size of the UI element to get a start position for.
 * @param horizontalPadding The horizontal padding to use.
 * @param verticalPadding The vertical padding to use.
 * @param metrics The workspace UI metrics.
 * @param workspace The workspace.
 * @returns The suggested start position.
 * @internal
 */
export function getStartPositionRect(
  position: Position,
  size: Size,
  horizontalPadding: number,
  verticalPadding: number,
  metrics: UiMetrics,
  workspace: WorkspaceSvg,
): Rect {
  // Horizontal positioning.
  let left = 0;
  const hasVerticalScrollbar =
    workspace.scrollbar && workspace.scrollbar.canScrollVertically();
  if (position.horizontal === horizontalPosition.LEFT) {
    left = metrics.absoluteMetrics.left + horizontalPadding;
    if (hasVerticalScrollbar && workspace.RTL) {
      left += Scrollbar.scrollbarThickness;
    }
  } else {
    // position.horizontal === horizontalPosition.RIGHT
    left =
      metrics.absoluteMetrics.left +
      metrics.viewMetrics.width -
      size.width -
      horizontalPadding;
    if (hasVerticalScrollbar && !workspace.RTL) {
      left -= Scrollbar.scrollbarThickness;
    }
  }
  // Vertical positioning.
  let top = 0;
  if (position.vertical === verticalPosition.TOP) {
    top = metrics.absoluteMetrics.top + verticalPadding;
  } else {
    // position.vertical === verticalPosition.BOTTOM
    top =
      metrics.absoluteMetrics.top +
      metrics.viewMetrics.height -
      size.height -
      verticalPadding;
    if (workspace.scrollbar && workspace.scrollbar.canScrollHorizontally()) {
      // The scrollbars are always positioned on the bottom if they exist.
      top -= Scrollbar.scrollbarThickness;
    }
  }
  return new Rect(top, top + size.height, left, left + size.width);
}

/**
 * Returns a corner position that is on the opposite side of the workspace from
 * the toolbox.
 * If in horizontal orientation, defaults to the bottom corner. If in vertical
 * orientation, defaults to the right corner.
 *
 * @param workspace The workspace.
 * @param metrics The workspace metrics.
 * @returns The suggested corner position.
 * @internal
 */
export function getCornerOppositeToolbox(
  workspace: WorkspaceSvg,
  metrics: UiMetrics,
): Position {
  const leftCorner =
    metrics.toolboxMetrics.position !== toolbox.Position.LEFT &&
    (!workspace.horizontalLayout || workspace.RTL);
  const topCorner = metrics.toolboxMetrics.position === toolbox.Position.BOTTOM;
  const hPosition = leftCorner
    ? horizontalPosition.LEFT
    : horizontalPosition.RIGHT;
  const vPosition = topCorner ? verticalPosition.TOP : verticalPosition.BOTTOM;
  return {horizontal: hPosition, vertical: vPosition};
}

/**
 * Returns a position Rect based on a starting position that is bumped
 * so that it doesn't intersect with any of the provided savedPositions. This
 * method does not check that the bumped position is still within bounds.
 *
 * @param startRect The starting position to use.
 * @param margin The margin to use between elements when bumping.
 * @param bumpDir The direction to bump if there is a collision with an existing
 *     UI element.
 * @param savedPositions List of rectangles that represent the positions of UI
 *     elements already placed.
 * @returns The suggested position rectangle.
 * @internal
 */
export function bumpPositionRect(
  startRect: Rect,
  margin: number,
  bumpDir: bumpDirection,
  savedPositions: Rect[],
): Rect {
  let top = startRect.top;
  const left = startRect.left;
  const width = startRect.right - startRect.left;
  const height = startRect.bottom - startRect.top;

  // Check for collision and bump if needed.
  let boundingRect = startRect;
  for (let i = 0; i < savedPositions.length; i++) {
    const otherEl = savedPositions[i];
    if (boundingRect.intersects(otherEl)) {
      if (bumpDir === bumpDirection.UP) {
        top = otherEl.top - height - margin;
      } else {
        // bumpDir === bumpDirection.DOWN
        top = otherEl.bottom + margin;
      }
      // Recheck other savedPositions
      boundingRect = new Rect(top, top + height, left, left + width);
      i = -1;
    }
  }
  return boundingRect;
}
