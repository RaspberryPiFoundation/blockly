/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Abstract class for events fired as a result of actions in
 * Blockly's editor.
 *
 * @class
 */
// Former goog.module ID: Blockly.Events.Abstract

import * as common from '../common.js';
import type {Workspace} from '../workspace.js';
import {getGroup, getRecordUndo} from './utils.js';

/**
 * Abstract class for an event.
 */
export abstract class Abstract {
  /**
   * Whether or not the event was constructed without necessary parameters
   * (to be populated by fromJson).
   */
  abstract isBlank: boolean;

  /** The workspace identifier for this event. */
  workspaceId?: string = undefined;

  /**
   * An ID for the group of events this block is associated with.
   *
   * Groups define events that should be treated as an single action from the
   * user's perspective, and should be undone together.
   */
  group: string;

  /** Whether this event is undoable or not. */
  recordUndo: boolean;

  /** Whether or not the event is a UI event. */
  isUiEvent = false;

  /** Type of this event. */
  type = '';

  constructor() {
    this.group = getGroup();
    this.recordUndo = getRecordUndo();
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  toJson(): AbstractEventJson {
    return {
      'type': this.type,
      'group': this.group,
    };
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of Abstract (like all events), but we can't specify that due to the
   *     fact that parameters to static methods in subclasses must be
   *     supertypes of parameters to static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: AbstractEventJson,
    workspace: Workspace,
    event: any,
  ): Abstract {
    event.isBlank = false;
    event.group = json['group'] || '';
    event.workspaceId = workspace.id;
    return event;
  }

  /**
   * Does this event record any change of state?
   *
   * @returns True if null, false if something changed.
   */
  isNull(): boolean {
    return false;
  }

  /**
   * Run an event.
   *
   * @param _forward True if run forward, false if run backward (undo).
   */
  run(_forward: boolean) {
    // Defined by subclasses. Cannot be abstract b/c UI events do /not/ define
    // this.
  }

  /**
   * Get workspace the event belongs to.
   *
   * @returns The workspace the event belongs to.
   * @throws {Error} if workspace is null.
   */
  getEventWorkspace_(): Workspace {
    let workspace;
    if (this.workspaceId) {
      workspace = common.getWorkspaceById(this.workspaceId);
    }
    if (!workspace) {
      throw Error(
        'Workspace is null. Event must have been generated from real' +
          ' Blockly events.',
      );
    }
    return workspace;
  }
}

export interface AbstractEventJson {
  type: string;
  group: string;
}
