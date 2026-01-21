/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Events fired as a block drag.
 *
 * @class
 */
// Former goog.module ID: Blockly.Events.BlockDrag

import type {Block} from '../block.js';
import * as registry from '../registry.js';
import {Workspace} from '../workspace.js';
import {AbstractEventJson} from './events_abstract.js';
import {UiBase} from './events_ui_base.js';
import {EventType} from './type.js';

/**
 * Notifies listeners when a block is being manually dragged/dropped.
 */
export class BlockDrag extends UiBase {
  /** The ID of the top-level block being dragged. */
  blockId?: string;

  /** True if this is the start of a drag, false if this is the end of one. */
  isStart?: boolean;

  /**
   * A list of all of the blocks (i.e. all descendants of the block associated
   * with the block ID) being dragged.
   */
  blocks?: Block[];

  override type = EventType.BLOCK_DRAG;

  /**
   * @param opt_block The top block in the stack that is being dragged.
   *     Undefined for a blank event.
   * @param opt_isStart Whether this is the start of a block drag.
   *    Undefined for a blank event.
   * @param opt_blocks The blocks affected by this drag. Undefined for a blank
   *     event.
   */
  constructor(opt_block?: Block, opt_isStart?: boolean, opt_blocks?: Block[]) {
    const workspaceId = opt_block ? opt_block.workspace.id : undefined;
    super(workspaceId);
    if (!opt_block) return;

    this.blockId = opt_block.id;
    this.isStart = opt_isStart;
    this.blocks = opt_blocks;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): BlockDragJson {
    const json = super.toJson() as BlockDragJson;
    if (this.isStart === undefined) {
      throw new Error(
        'Whether this event is the start of a drag is undefined. ' +
          'Either pass the value to the constructor, or call fromJson',
      );
    }
    if (this.blockId === undefined) {
      throw new Error(
        'The block ID is undefined. Either pass a block to ' +
          'the constructor, or call fromJson',
      );
    }
    json['isStart'] = this.isStart;
    json['blockId'] = this.blockId;
    // TODO: I don't think we should actually apply the blocks array to the JSON
    //   object b/c they have functions and aren't actually serializable.
    json['blocks'] = this.blocks;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of BlockDrag, but we can't specify that due to the fact that parameters
   *     to static methods in subclasses must be supertypes of parameters to
   *     static methods in superclasses..
   * @internal
   */
  static fromJson(
    json: BlockDragJson,
    workspace: Workspace,
    event?: any,
  ): BlockDrag {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockDrag(),
    ) as BlockDrag;
    newEvent.isStart = json['isStart'];
    newEvent.blockId = json['blockId'];
    newEvent.blocks = json['blocks'];
    return newEvent;
  }
}

export interface BlockDragJson extends AbstractEventJson {
  isStart: boolean;
  blockId: string;
  blocks?: Block[];
}

registry.register(registry.Type.EVENT, EventType.BLOCK_DRAG, BlockDrag);
