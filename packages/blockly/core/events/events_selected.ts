/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Events fired as a result of element select action.
 *
 * @class
 */
// Former goog.module ID: Blockly.Events.Selected

import * as registry from '../registry.js';
import type {Workspace} from '../workspace.js';
import {AbstractEventJson} from './events_abstract.js';
import {UiBase} from './events_ui_base.js';
import {EventType} from './type.js';

/**
 * Class for a selected event.
 * Notifies listeners that a new element has been selected.
 */
export class Selected extends UiBase {
  /** The id of the last selected selectable element. */
  oldElementId?: string;

  /**
   * The id of the newly selected selectable element,
   * or undefined if unselected.
   */
  newElementId?: string;

  override type = EventType.SELECTED;

  /**
   * @param opt_oldElementId The ID of the previously selected element. Null if
   *     no element last selected. Undefined for a blank event.
   * @param opt_newElementId The ID of the selected element. Null if no element
   *     currently selected (deselect). Undefined for a blank event.
   * @param opt_workspaceId The workspace identifier for this event.
   *    Null if no element previously selected. Undefined for a blank event.
   */
  constructor(
    opt_oldElementId?: string | null,
    opt_newElementId?: string | null,
    opt_workspaceId?: string,
  ) {
    super(opt_workspaceId);

    this.oldElementId = opt_oldElementId ?? undefined;
    this.newElementId = opt_newElementId ?? undefined;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): SelectedJson {
    const json = super.toJson() as SelectedJson;
    json['oldElementId'] = this.oldElementId;
    json['newElementId'] = this.newElementId;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of Selected, but we can't specify that due to the fact that parameters
   *     to static methods in subclasses must be supertypes of parameters to
   *     static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: SelectedJson,
    workspace: Workspace,
    event?: any,
  ): Selected {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new Selected(),
    ) as Selected;
    newEvent.oldElementId = json['oldElementId'];
    newEvent.newElementId = json['newElementId'];
    return newEvent;
  }
}

export interface SelectedJson extends AbstractEventJson {
  oldElementId?: string;
  newElementId?: string;
}

registry.register(registry.Type.EVENT, EventType.SELECTED, Selected);
