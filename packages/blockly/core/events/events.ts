/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.Events

import {EventType} from './type.js';

// Events.
export {Abstract, AbstractEventJson} from './events_abstract.js';
export {BlockBase, BlockBaseJson} from './events_block_base.js';
export {BlockChange, BlockChangeJson} from './events_block_change.js';
export {BlockCreate, BlockCreateJson} from './events_block_create.js';
export {BlockDelete, BlockDeleteJson} from './events_block_delete.js';
export {BlockDrag, BlockDragJson} from './events_block_drag.js';
export {
  BlockFieldIntermediateChange,
  BlockFieldIntermediateChangeJson,
} from './events_block_field_intermediate_change.js';
export {BlockMove, BlockMoveJson} from './events_block_move.js';
export {BubbleOpen, BubbleOpenJson, BubbleType} from './events_bubble_open.js';
export {Click, ClickJson, ClickTarget} from './events_click.js';
export {CommentBase, CommentBaseJson} from './events_comment_base.js';
export {CommentChange, CommentChangeJson} from './events_comment_change.js';
export {
  CommentCollapse,
  CommentCollapseJson,
} from './events_comment_collapse.js';
export {CommentCreate, CommentCreateJson} from './events_comment_create.js';
export {CommentDelete} from './events_comment_delete.js';
export {CommentDrag, CommentDragJson} from './events_comment_drag.js';
export {CommentMove, CommentMoveJson} from './events_comment_move.js';
export {CommentResize, CommentResizeJson} from './events_comment_resize.js';
export {Selected, SelectedJson} from './events_selected.js';
export {ThemeChange, ThemeChangeJson} from './events_theme_change.js';
export {
  ToolboxItemSelect,
  ToolboxItemSelectJson,
} from './events_toolbox_item_select.js';

// Events.
export {TrashcanOpen, TrashcanOpenJson} from './events_trashcan_open.js';
export {UiBase} from './events_ui_base.js';
export {VarBase, VarBaseJson} from './events_var_base.js';
export {VarCreate, VarCreateJson} from './events_var_create.js';
export {VarDelete, VarDeleteJson} from './events_var_delete.js';
export {VarRename, VarRenameJson} from './events_var_rename.js';
export {VarTypeChange, VarTypeChangeJson} from './events_var_type_change.js';
export {ViewportChange, ViewportChangeJson} from './events_viewport.js';
export {FinishedLoading} from './workspace_events.js';

export type {BumpEvent} from './utils.js';

// Event types.
export const BLOCK_CHANGE = EventType.BLOCK_CHANGE;
export const BLOCK_CREATE = EventType.BLOCK_CREATE;
export const BLOCK_DELETE = EventType.BLOCK_DELETE;
export const BLOCK_DRAG = EventType.BLOCK_DRAG;
export const BLOCK_MOVE = EventType.BLOCK_MOVE;
export const BLOCK_FIELD_INTERMEDIATE_CHANGE =
  EventType.BLOCK_FIELD_INTERMEDIATE_CHANGE;
export const BUBBLE_OPEN = EventType.BUBBLE_OPEN;
/** @deprecated Use BLOCK_CHANGE instead */
export const CHANGE = EventType.BLOCK_CHANGE;
export const CLICK = EventType.CLICK;
export const COMMENT_CHANGE = EventType.COMMENT_CHANGE;
export const COMMENT_CREATE = EventType.COMMENT_CREATE;
export const COMMENT_DELETE = EventType.COMMENT_DELETE;
export const COMMENT_MOVE = EventType.COMMENT_MOVE;
export const COMMENT_RESIZE = EventType.COMMENT_RESIZE;
export const COMMENT_DRAG = EventType.COMMENT_DRAG;
/** @deprecated Use BLOCK_CREATE instead */
export const CREATE = EventType.BLOCK_CREATE;
/** @deprecated Use BLOCK_DELETE instead */
export const DELETE = EventType.BLOCK_DELETE;
export const FINISHED_LOADING = EventType.FINISHED_LOADING;
/** @deprecated Use BLOCK_MOVE instead */
export const MOVE = EventType.BLOCK_MOVE;
export const SELECTED = EventType.SELECTED;
export const THEME_CHANGE = EventType.THEME_CHANGE;
export const TOOLBOX_ITEM_SELECT = EventType.TOOLBOX_ITEM_SELECT;
export const TRASHCAN_OPEN = EventType.TRASHCAN_OPEN;
export const UI = EventType.UI;
export const VAR_CREATE = EventType.VAR_CREATE;
export const VAR_DELETE = EventType.VAR_DELETE;
export const VAR_RENAME = EventType.VAR_RENAME;
export const VIEWPORT_CHANGE = EventType.VIEWPORT_CHANGE;

export {BUMP_EVENTS} from './type.js';

// Event utils.
export {
  clearPendingUndo,
  disable,
  disableOrphans,
  enable,
  filter,
  fire,
  fromJson,
  get,
  getDescendantIds,
  getGroup,
  getRecordUndo,
  isEnabled,
  setGroup,
  setRecordUndo,
} from './utils.js';
