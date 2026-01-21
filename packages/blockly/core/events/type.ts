/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Enum of values for the .type property for event classes (concrete subclasses
 * of Abstract).
 */
export enum EventType {
  /** Type of event that creates a block. */
  BLOCK_CREATE = 'create',
  /** Type of event that deletes a block. */
  BLOCK_DELETE = 'delete',
  /** Type of event that changes a block. */
  BLOCK_CHANGE = 'change',
  /**
   * Type of event representing an in-progress change to a field of a
   * block, which is expected to be followed by a block change event.
   */
  BLOCK_FIELD_INTERMEDIATE_CHANGE = 'block_field_intermediate_change',
  /** Type of event that moves a block. */
  BLOCK_MOVE = 'move',
  /** Type of event that creates a variable. */
  VAR_CREATE = 'var_create',
  /** Type of event that deletes a variable. */
  VAR_DELETE = 'var_delete',
  /** Type of event that renames a variable. */
  VAR_RENAME = 'var_rename',
  /** Type of event that changes the type of a variable. */
  VAR_TYPE_CHANGE = 'var_type_change',
  /**
   * Type of generic event that records a UI change.
   *
   * @deprecated Was only ever intended for internal use.
   */
  UI = 'ui',
  /** Type of event that drags a block. */
  BLOCK_DRAG = 'drag',
  /** Type of event that records a change in selected element. */
  SELECTED = 'selected',
  /** Type of event that records a click. */
  CLICK = 'click',
  /** Type of event that records a marker move. */
  MARKER_MOVE = 'marker_move',
  /** Type of event that records a bubble open. */
  BUBBLE_OPEN = 'bubble_open',
  /** Type of event that records a trashcan open. */
  TRASHCAN_OPEN = 'trashcan_open',
  /** Type of event that records a toolbox item select. */
  TOOLBOX_ITEM_SELECT = 'toolbox_item_select',
  /** Type of event that records a theme change. */
  THEME_CHANGE = 'theme_change',
  /** Type of event that records a viewport change. */
  VIEWPORT_CHANGE = 'viewport_change',
  /** Type of event that creates a comment. */
  COMMENT_CREATE = 'comment_create',
  /** Type of event that deletes a comment. */
  COMMENT_DELETE = 'comment_delete',
  /** Type of event that changes a comment. */
  COMMENT_CHANGE = 'comment_change',
  /** Type of event that moves a comment. */
  COMMENT_MOVE = 'comment_move',
  /** Type of event that resizes a comment. */
  COMMENT_RESIZE = 'comment_resize',
  /**  Type of event that drags a comment. */
  COMMENT_DRAG = 'comment_drag',
  /** Type of event that collapses a comment. */
  COMMENT_COLLAPSE = 'comment_collapse',
  /** Type of event that records a workspace load. */
  FINISHED_LOADING = 'finished_loading',
}

/**
 * List of events that cause objects to be bumped back into the visible
 * portion of the workspace.
 *
 * Not to be confused with bumping so that disconnected connections do not
 * appear connected.
 */
export const BUMP_EVENTS: string[] = [
  EventType.BLOCK_CREATE,
  EventType.BLOCK_MOVE,
  EventType.COMMENT_CREATE,
  EventType.COMMENT_MOVE,
];
