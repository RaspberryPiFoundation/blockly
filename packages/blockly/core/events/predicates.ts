/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Predicates for testing Abstract event subclasses based on
 * their .type properties.  These are useful because there are places
 * where it is not possible to use instanceof <ClassConstructor> tests
 * for type narrowing due to load ordering issues that would be caused
 * by the need to import (rather than just import type) the class
 * constructors in question.
 */

import type {Abstract} from './events_abstract.js';
import type {BlockChange} from './events_block_change.js';
import type {BlockCreate} from './events_block_create.js';
import type {BlockDelete} from './events_block_delete.js';
import type {BlockDrag} from './events_block_drag.js';
import type {BlockFieldIntermediateChange} from './events_block_field_intermediate_change.js';
import type {BlockMove} from './events_block_move.js';
import type {BubbleOpen} from './events_bubble_open.js';
import type {Click} from './events_click.js';
import type {CommentChange} from './events_comment_change.js';
import type {CommentCollapse} from './events_comment_collapse.js';
import type {CommentCreate} from './events_comment_create.js';
import type {CommentDelete} from './events_comment_delete.js';
import type {CommentDrag} from './events_comment_drag.js';
import type {CommentMove} from './events_comment_move.js';
import type {CommentResize} from './events_comment_resize.js';
import type {Selected} from './events_selected.js';
import type {ThemeChange} from './events_theme_change.js';
import type {ToolboxItemSelect} from './events_toolbox_item_select.js';
import type {TrashcanOpen} from './events_trashcan_open.js';
import type {VarCreate} from './events_var_create.js';
import type {VarDelete} from './events_var_delete.js';
import type {VarRename} from './events_var_rename.js';
import type {ViewportChange} from './events_viewport.js';
import type {FinishedLoading} from './workspace_events.js';

import {EventType} from './type.js';

/** @returns true iff event.type is EventType.BLOCK_CREATE */
export function isBlockCreate(event: Abstract): event is BlockCreate {
  return event.type === EventType.BLOCK_CREATE;
}

/** @returns true iff event.type is EventType.BLOCK_DELETE */
export function isBlockDelete(event: Abstract): event is BlockDelete {
  return event.type === EventType.BLOCK_DELETE;
}

/** @returns true iff event.type is EventType.BLOCK_CHANGE */
export function isBlockChange(event: Abstract): event is BlockChange {
  return event.type === EventType.BLOCK_CHANGE;
}

/** @returns true iff event.type is EventType.BLOCK_FIELD_INTERMEDIATE_CHANGE */
export function isBlockFieldIntermediateChange(
  event: Abstract,
): event is BlockFieldIntermediateChange {
  return event.type === EventType.BLOCK_FIELD_INTERMEDIATE_CHANGE;
}

/** @returns true iff event.type is EventType.BLOCK_MOVE */
export function isBlockMove(event: Abstract): event is BlockMove {
  return event.type === EventType.BLOCK_MOVE;
}

/** @returns true iff event.type is EventType.VAR_CREATE */
export function isVarCreate(event: Abstract): event is VarCreate {
  return event.type === EventType.VAR_CREATE;
}

/** @returns true iff event.type is EventType.VAR_DELETE */
export function isVarDelete(event: Abstract): event is VarDelete {
  return event.type === EventType.VAR_DELETE;
}

/** @returns true iff event.type is EventType.VAR_RENAME */
export function isVarRename(event: Abstract): event is VarRename {
  return event.type === EventType.VAR_RENAME;
}

/** @returns true iff event.type is EventType.BLOCK_DRAG */
export function isBlockDrag(event: Abstract): event is BlockDrag {
  return event.type === EventType.BLOCK_DRAG;
}

/** @returns true iff event.type is EventType.SELECTED */
export function isSelected(event: Abstract): event is Selected {
  return event.type === EventType.SELECTED;
}

/** @returns true iff event.type is EventType.CLICK */
export function isClick(event: Abstract): event is Click {
  return event.type === EventType.CLICK;
}

/** @returns true iff event.type is EventType.BUBBLE_OPEN */
export function isBubbleOpen(event: Abstract): event is BubbleOpen {
  return event.type === EventType.BUBBLE_OPEN;
}

/** @returns true iff event.type is EventType.TRASHCAN_OPEN */
export function isTrashcanOpen(event: Abstract): event is TrashcanOpen {
  return event.type === EventType.TRASHCAN_OPEN;
}

/** @returns true iff event.type is EventType.TOOLBOX_ITEM_SELECT */
export function isToolboxItemSelect(
  event: Abstract,
): event is ToolboxItemSelect {
  return event.type === EventType.TOOLBOX_ITEM_SELECT;
}

/** @returns true iff event.type is EventType.THEME_CHANGE */
export function isThemeChange(event: Abstract): event is ThemeChange {
  return event.type === EventType.THEME_CHANGE;
}

/** @returns true iff event.type is EventType.VIEWPORT_CHANGE */
export function isViewportChange(event: Abstract): event is ViewportChange {
  return event.type === EventType.VIEWPORT_CHANGE;
}

/** @returns true iff event.type is EventType.COMMENT_CREATE */
export function isCommentCreate(event: Abstract): event is CommentCreate {
  return event.type === EventType.COMMENT_CREATE;
}

/** @returns true iff event.type is EventType.COMMENT_DELETE */
export function isCommentDelete(event: Abstract): event is CommentDelete {
  return event.type === EventType.COMMENT_DELETE;
}

/** @returns true iff event.type is EventType.COMMENT_CHANGE */
export function isCommentChange(event: Abstract): event is CommentChange {
  return event.type === EventType.COMMENT_CHANGE;
}

/** @returns true iff event.type is EventType.COMMENT_MOVE */
export function isCommentMove(event: Abstract): event is CommentMove {
  return event.type === EventType.COMMENT_MOVE;
}

/** @returns true iff event.type is EventType.COMMENT_RESIZE */
export function isCommentResize(event: Abstract): event is CommentResize {
  return event.type === EventType.COMMENT_RESIZE;
}

/** @returns true iff event.type is EventType.COMMENT_DRAG */
export function isCommentDrag(event: Abstract): event is CommentDrag {
  return event.type === EventType.COMMENT_DRAG;
}

/** @returns true iff event.type is EventType.COMMENT_COLLAPSE */
export function isCommentCollapse(event: Abstract): event is CommentCollapse {
  return event.type === EventType.COMMENT_COLLAPSE;
}

/** @returns true iff event.type is EventType.FINISHED_LOADING */
export function isFinishedLoading(event: Abstract): event is FinishedLoading {
  return event.type === EventType.FINISHED_LOADING;
}
