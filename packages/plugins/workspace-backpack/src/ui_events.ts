/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview UI events used for the backpack plugin.
 * @author kozbial@google.com (Monica Kozbial)
 */

import * as Blockly from 'blockly/core';

/**
 * Name of event that records a backpack open.
 */
export const backpackOpen = 'backpack_open';

/**
 * A UI event representing a backpack opening or closing.
 */
export class BackpackOpen extends Blockly.Events.UiBase {
  /**
   * Type of this event.
   */
  type = backpackOpen;

  /**
   * Class for a backpack open event.
   *
   * @param isOpen Whether the backpack flyout is opening (false
   *    if closing). Undefined for a blank event.
   * @param workspaceId The workspace identifier for this event.
   *    Undefined for a blank event.
   */
  constructor(
    public isOpen?: boolean,
    workspaceId?: string,
  ) {
    super(workspaceId);
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  toJson(): BackpackOpenEventJson {
    const json = super.toJson() as BackpackOpenEventJson;
    json['isOpen'] = this.isOpen;
    return json;
  }

  /**
   * Decode the JSON event.
   *
   * @param json JSON representation.
   * @param workspace A workspace to create the event on.
   * @param event an instance of BackpackOpen to deserialize into.
   * @returns A newly deserialized BackpackOpen event.
   */
  static fromJson(
    json: BackpackOpenEventJson,
    workspace: Blockly.Workspace,
    event: unknown,
  ): BackpackOpen {
    const newEvent = super.fromJson(json, workspace, event) as BackpackOpen;
    newEvent.isOpen = json['isOpen'];
    return newEvent;
  }
}

export interface BackpackOpenEventJson
  extends Blockly.Events.AbstractEventJson {
  isOpen?: boolean;
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  backpackOpen,
  BackpackOpen,
);

/**
 * Name of event that records a backpack change.
 */
export const backpackChange = 'backpack_change';

/**
 * A UI event representing a change in a backpack's contents.
 */
export class BackpackChange extends Blockly.Events.UiBase {
  /**
   * Type of this event.
   */
  type = backpackChange;
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  backpackChange,
  BackpackChange,
);
