/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Events fired as a result of selecting an item on the toolbox.
 *
 * @class
 */
// Former goog.module ID: Blockly.Events.ToolboxItemSelect

import * as registry from '../registry.js';
import type {Workspace} from '../workspace.js';
import {AbstractEventJson} from './events_abstract.js';
import {UiBase} from './events_ui_base.js';
import {EventType} from './type.js';

/**
 * Notifies listeners that a toolbox item has been selected.
 */
export class ToolboxItemSelect extends UiBase {
  /** The previously selected toolbox item. */
  oldItem?: string;

  /** The newly selected toolbox item. */
  newItem?: string;

  override type = EventType.TOOLBOX_ITEM_SELECT;

  /**
   * @param opt_oldItem The previously selected toolbox item.
   *     Undefined for a blank event.
   * @param opt_newItem The newly selected toolbox item. Undefined for a blank
   *     event.
   * @param opt_workspaceId The workspace identifier for this event.
   *    Undefined for a blank event.
   */
  constructor(
    opt_oldItem?: string | null,
    opt_newItem?: string | null,
    opt_workspaceId?: string,
  ) {
    super(opt_workspaceId);
    this.oldItem = opt_oldItem ?? undefined;
    this.newItem = opt_newItem ?? undefined;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): ToolboxItemSelectJson {
    const json = super.toJson() as ToolboxItemSelectJson;
    json['oldItem'] = this.oldItem;
    json['newItem'] = this.newItem;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of ToolboxItemSelect, but we can't specify that due to the fact that
   *     parameters to static methods in subclasses must be supertypes of
   *     parameters to static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: ToolboxItemSelectJson,
    workspace: Workspace,
    event?: any,
  ): ToolboxItemSelect {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new ToolboxItemSelect(),
    ) as ToolboxItemSelect;
    newEvent.oldItem = json['oldItem'];
    newEvent.newItem = json['newItem'];
    return newEvent;
  }
}

export interface ToolboxItemSelectJson extends AbstractEventJson {
  oldItem?: string;
  newItem?: string;
}

registry.register(
  registry.Type.EVENT,
  EventType.TOOLBOX_ITEM_SELECT,
  ToolboxItemSelect,
);
