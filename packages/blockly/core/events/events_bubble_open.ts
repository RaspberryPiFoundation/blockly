/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Events fired as a result of bubble open.
 *
 * @class
 */

// Former goog.module ID: Blockly.Events.BubbleOpen

import type {BlockSvg} from '../block_svg.js';
import * as registry from '../registry.js';
import type {Workspace} from '../workspace.js';
import type {AbstractEventJson} from './events_abstract.js';
import {UiBase} from './events_ui_base.js';
import {EventType} from './type.js';

/**
 * Class for a bubble open event.
 */
export class BubbleOpen extends UiBase {
  /** The ID of the block the bubble is attached to. */
  blockId?: string;

  /** True if the bubble is opening, false if closing. */
  isOpen?: boolean;

  /** The type of bubble; one of 'mutator', 'comment', or 'warning'. */
  bubbleType?: BubbleType;

  override type = EventType.BUBBLE_OPEN;

  /**
   * @param opt_block The associated block. Undefined for a blank event.
   * @param opt_isOpen Whether the bubble is opening (false if closing).
   *     Undefined for a blank event.
   * @param opt_bubbleType The type of bubble. One of 'mutator', 'comment' or
   *     'warning'. Undefined for a blank event.
   */
  constructor(
    opt_block?: BlockSvg,
    opt_isOpen?: boolean,
    opt_bubbleType?: BubbleType,
  ) {
    const workspaceId = opt_block ? opt_block.workspace.id : undefined;
    super(workspaceId);
    if (!opt_block) return;

    this.blockId = opt_block.id;
    this.isOpen = opt_isOpen;
    this.bubbleType = opt_bubbleType;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): BubbleOpenJson {
    const json = super.toJson() as BubbleOpenJson;
    if (this.isOpen === undefined) {
      throw new Error(
        'Whether this event is for opening the bubble is undefined. ' +
          'Either pass the value to the constructor, or call fromJson',
      );
    }
    if (!this.bubbleType) {
      throw new Error(
        'The type of bubble is undefined. Either pass the ' +
          'value to the constructor, or call fromJson',
      );
    }
    json['isOpen'] = this.isOpen;
    json['bubbleType'] = this.bubbleType;
    json['blockId'] = this.blockId || '';
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of BubbleOpen, but we can't specify that due to the fact that
   *     parameters to static methods in subclasses must be supertypes of
   *     parameters to static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: BubbleOpenJson,
    workspace: Workspace,
    event?: any,
  ): BubbleOpen {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BubbleOpen(),
    ) as BubbleOpen;
    newEvent.isOpen = json['isOpen'];
    newEvent.bubbleType = json['bubbleType'];
    newEvent.blockId = json['blockId'];
    return newEvent;
  }
}

export enum BubbleType {
  MUTATOR = 'mutator',
  COMMENT = 'comment',
  WARNING = 'warning',
}

export interface BubbleOpenJson extends AbstractEventJson {
  isOpen: boolean;
  bubbleType: BubbleType;
  blockId: string;
}

registry.register(registry.Type.EVENT, EventType.BUBBLE_OPEN, BubbleOpen);
