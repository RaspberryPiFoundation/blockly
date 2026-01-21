/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Events fired as a result of UI click in Blockly's editor.
 *
 * @class
 */

// Former goog.module ID: Blockly.Events.Click

import type {Block} from '../block.js';
import * as registry from '../registry.js';
import {Workspace} from '../workspace.js';
import {AbstractEventJson} from './events_abstract.js';
import {UiBase} from './events_ui_base.js';
import {EventType} from './type.js';

/**
 * Notifies listeners that some blockly element was clicked.
 */
export class Click extends UiBase {
  /** The ID of the block that was clicked, if a block was clicked. */
  blockId?: string;

  /**
   * The type of element that was clicked; one of 'block', 'workspace',
   * or 'zoom_controls'.
   */
  targetType?: ClickTarget;
  override type = EventType.CLICK;

  /**
   * @param opt_block The affected block. Null for click events that do not have
   *     an associated block (i.e. workspace click). Undefined for a blank
   *     event.
   * @param opt_workspaceId The workspace identifier for this event.
   *    Not used if block is passed. Undefined for a blank event.
   * @param opt_targetType The type of element targeted by this click event.
   *     Undefined for a blank event.
   */
  constructor(
    opt_block?: Block | null,
    opt_workspaceId?: string | null,
    opt_targetType?: ClickTarget,
  ) {
    let workspaceId = opt_block ? opt_block.workspace.id : opt_workspaceId;
    if (workspaceId === null) {
      workspaceId = undefined;
    }
    super(workspaceId);

    this.blockId = opt_block ? opt_block.id : undefined;
    this.targetType = opt_targetType;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): ClickJson {
    const json = super.toJson() as ClickJson;
    if (!this.targetType) {
      throw new Error(
        'The click target type is undefined. Either pass a block to ' +
          'the constructor, or call fromJson',
      );
    }
    json['targetType'] = this.targetType;
    json['blockId'] = this.blockId;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of Click, but we can't specify that due to the fact that parameters to
   *     static methods in subclasses must be supertypes of parameters to
   *     static methods in superclasses.
   * @internal
   */
  static fromJson(json: ClickJson, workspace: Workspace, event?: any): Click {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new Click(),
    ) as Click;
    newEvent.targetType = json['targetType'];
    newEvent.blockId = json['blockId'];
    return newEvent;
  }
}

export enum ClickTarget {
  BLOCK = 'block',
  WORKSPACE = 'workspace',
  ZOOM_CONTROLS = 'zoom_controls',
}

export interface ClickJson extends AbstractEventJson {
  targetType: ClickTarget;
  blockId?: string;
}

registry.register(registry.Type.EVENT, EventType.CLICK, Click);
