/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.bumpObjects

import {RenderedWorkspaceComment} from './comments/rendered_workspace_comment.js';
import type {Abstract} from './events/events_abstract.js';
import type {BlockCreate} from './events/events_block_create.js';
import type {BlockMove} from './events/events_block_move.js';
import type {CommentCreate} from './events/events_comment_create.js';
import type {CommentMove} from './events/events_comment_move.js';
import type {CommentResize} from './events/events_comment_resize.js';
import {isViewportChange} from './events/predicates.js';
import {BUMP_EVENTS, EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import type {IBoundedElement} from './interfaces/i_bounded_element.js';
import type {ContainerRegion} from './metrics_manager.js';
import * as mathUtils from './utils/math.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Bumps the given object that has passed out of bounds.
 *
 * @param workspace The workspace containing the object.
 * @param bounds The region to bump an object into. For example, pass
 *     ScrollMetrics to bump a block into the scrollable region of the
 *     workspace, or pass ViewMetrics to bump a block into the visible region of
 *     the workspace. This should be specified in workspace coordinates.
 * @param object The object to bump.
 * @returns True if object was bumped.
 */
function bumpObjectIntoBounds(
  workspace: WorkspaceSvg,
  bounds: ContainerRegion,
  object: IBoundedElement,
): boolean {
  // Compute new top/left position for object.
  const objectMetrics = object.getBoundingRectangle();
  const height = objectMetrics.bottom - objectMetrics.top;
  const width = objectMetrics.right - objectMetrics.left;

  const topClamp = bounds.top;
  const boundsBottom = bounds.top + bounds.height;
  const bottomClamp = boundsBottom - height;
  // If the object is taller than the workspace we want to
  // top-align the block
  const newYPosition = mathUtils.clamp(
    topClamp,
    objectMetrics.top,
    bottomClamp,
  );
  const deltaY = newYPosition - objectMetrics.top;

  // Note: Even in RTL mode the "anchor" of the object is the
  // top-left corner of the object.
  let leftClamp = bounds.left;
  const boundsRight = bounds.left + bounds.width;
  let rightClamp = boundsRight - width;
  if (workspace.RTL) {
    // If the object is wider than the workspace and we're in RTL
    // mode we want to right-align the block, which means setting
    // the left clamp to match.
    leftClamp = Math.min(rightClamp, leftClamp);
  } else {
    // If the object is wider than the workspace and we're in LTR
    // mode we want to left-align the block, which means setting
    // the right clamp to match.
    rightClamp = Math.max(leftClamp, rightClamp);
  }
  const newXPosition = mathUtils.clamp(
    leftClamp,
    objectMetrics.left,
    rightClamp,
  );
  const deltaX = newXPosition - objectMetrics.left;

  if (deltaX || deltaY) {
    object.moveBy(deltaX, deltaY, ['inbounds']);
    return true;
  }
  return false;
}
export const bumpIntoBounds = bumpObjectIntoBounds;

/**
 * Creates a handler for bumping objects when they cross fixed bounds.
 *
 * @param workspace The workspace to handle.
 * @returns The event handler.
 */
export function bumpIntoBoundsHandler(
  workspace: WorkspaceSvg,
): (p1: Abstract) => void {
  return (e) => {
    const metricsManager = workspace.getMetricsManager();
    if (!metricsManager.hasFixedEdges() || workspace.isDragging()) {
      return;
    }

    if (BUMP_EVENTS.includes(e.type ?? '')) {
      const scrollMetricsInWsCoords = metricsManager.getScrollMetrics(true);

      // Triggered by move/create event
      const object = extractObjectFromEvent(
        workspace,
        e as eventUtils.BumpEvent,
      );
      if (!object) {
        return;
      }
      // Handle undo.
      const existingGroup = eventUtils.getGroup() || false;
      eventUtils.setGroup(e.group);

      const wasBumped = bumpObjectIntoBounds(
        workspace,
        scrollMetricsInWsCoords,
        object as IBoundedElement,
      );

      if (wasBumped && !e.group) {
        console.warn(
          'Moved object in bounds but there was no' +
            ' event group. This may break undo.',
        );
      }
      eventUtils.setGroup(existingGroup);
    } else if (isViewportChange(e)) {
      if (e.scale && e.oldScale && e.scale > e.oldScale) {
        bumpTopObjectsIntoBounds(workspace);
      }
    }
  };
}

/**
 * Extracts the object from the given event.
 *
 * @param workspace The workspace the event originated
 *    from.
 * @param e An event containing an object.
 * @returns The extracted
 *    object.
 */
function extractObjectFromEvent(
  workspace: WorkspaceSvg,
  e: eventUtils.BumpEvent,
): IBoundedElement | null {
  let object = null;
  switch (e.type) {
    case EventType.BLOCK_CREATE:
    case EventType.BLOCK_MOVE:
      object = workspace.getBlockById((e as BlockCreate | BlockMove).blockId!);
      if (object) {
        object = object.getRootBlock();
      }
      break;
    case EventType.COMMENT_CREATE:
    case EventType.COMMENT_MOVE:
    case EventType.COMMENT_RESIZE:
      object = workspace.getCommentById(
        (e as CommentCreate | CommentMove | CommentResize).commentId!,
      ) as RenderedWorkspaceComment;
      break;
  }
  return object;
}

/**
 * Bumps the top objects in the given workspace into bounds.
 *
 * @param workspace The workspace.
 */
export function bumpTopObjectsIntoBounds(workspace: WorkspaceSvg) {
  const metricsManager = workspace.getMetricsManager();
  if (!metricsManager.hasFixedEdges() || workspace.isDragging()) {
    return;
  }

  const scrollMetricsInWsCoords = metricsManager.getScrollMetrics(true);
  const topBlocks = workspace.getTopBoundedElements();
  for (let i = 0, block; (block = topBlocks[i]); i++) {
    bumpObjectIntoBounds(workspace, scrollMetricsInWsCoords, block);
  }
}
