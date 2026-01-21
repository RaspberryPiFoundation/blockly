/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Base class for events fired as a result of UI actions in
 * Blockly's editor.
 *
 * @class
 */
// Former goog.module ID: Blockly.Events.UiBase

import {Abstract as AbstractEvent} from './events_abstract.js';

/**
 * Base class for a UI event.
 * UI events are events that don't need to be sent over the wire for multi-user
 * editing to work (e.g. scrolling the workspace, zooming, opening toolbox
 * categories).
 * UI events do not undo or redo.
 */
export class UiBase extends AbstractEvent {
  override isBlank = true;
  override workspaceId: string;

  // UI events do not undo or redo.
  override recordUndo = false;

  /** Whether or not the event is a UI event. */
  override isUiEvent = true;

  /**
   * @param opt_workspaceId The workspace identifier for this event.
   *    Undefined for a blank event.
   */
  constructor(opt_workspaceId?: string) {
    super();

    /** Whether or not the event is blank (to be populated by fromJson). */
    this.isBlank = typeof opt_workspaceId === 'undefined';

    /** The workspace identifier for this event. */
    this.workspaceId = opt_workspaceId ? opt_workspaceId : '';
  }
}
