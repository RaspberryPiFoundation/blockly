/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Base class for all types of block events.
 *
 * @class
 */
// Former goog.module ID: Blockly.Events.BlockBase

import type {Block} from '../block.js';
import type {Workspace} from '../workspace.js';
import {
  Abstract as AbstractEvent,
  AbstractEventJson,
} from './events_abstract.js';

/**
 * Abstract class for any event related to blocks.
 */
export class BlockBase extends AbstractEvent {
  override isBlank = true;

  /** The ID of the block associated with this event. */
  blockId?: string;

  /**
   * @param opt_block The block this event corresponds to.
   *     Undefined for a blank event.
   */
  constructor(opt_block?: Block) {
    super();
    this.isBlank = !opt_block;

    if (!opt_block) return;

    this.blockId = opt_block.id;
    this.workspaceId = opt_block.workspace.id;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): BlockBaseJson {
    const json = super.toJson() as BlockBaseJson;
    if (!this.blockId) {
      throw new Error(
        'The block ID is undefined. Either pass a block to ' +
          'the constructor, or call fromJson',
      );
    }
    json['blockId'] = this.blockId;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of BlockBase, but we can't specify that due to the fact that parameters
   *     to static methods in subclasses must be supertypes of parameters to
   *     static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: BlockBaseJson,
    workspace: Workspace,
    event?: any,
  ): BlockBase {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockBase(),
    ) as BlockBase;
    newEvent.blockId = json['blockId'];
    return newEvent;
  }
}

export interface BlockBaseJson extends AbstractEventJson {
  blockId: string;
}
