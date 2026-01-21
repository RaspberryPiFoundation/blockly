/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Class for a block delete event.
 *
 * @class
 */
// Former goog.module ID: Blockly.Events.BlockDelete

import type {Block} from '../block.js';
import * as registry from '../registry.js';
import * as blocks from '../serialization/blocks.js';
import * as utilsXml from '../utils/xml.js';
import {Workspace} from '../workspace.js';
import * as Xml from '../xml.js';
import {BlockBase, BlockBaseJson} from './events_block_base.js';
import {EventType} from './type.js';
import * as eventUtils from './utils.js';

/**
 * Notifies listeners when a block (or connected stack of blocks) is
 * deleted.
 */
export class BlockDelete extends BlockBase {
  /** The XML representation of the deleted block(s). */
  oldXml?: Element | DocumentFragment;

  /** The JSON respresentation of the deleted block(s). */
  oldJson?: blocks.State;

  /** All of the IDs of deleted blocks. */
  ids?: string[];

  /** True if the deleted block was a shadow block, false otherwise. */
  wasShadow?: boolean;

  override type = EventType.BLOCK_DELETE;

  /** @param opt_block The deleted block.  Undefined for a blank event. */
  constructor(opt_block?: Block) {
    super(opt_block);

    if (!opt_block) {
      return; // Blank event to be populated by fromJson.
    }

    if (opt_block.getParent()) {
      throw Error('Connected blocks cannot be deleted.');
    }
    if (opt_block.isShadow()) {
      // Respawning shadow blocks is handled via disconnection.
      this.recordUndo = false;
    }

    this.oldXml = Xml.blockToDomWithXY(opt_block);
    this.ids = eventUtils.getDescendantIds(opt_block);
    this.wasShadow = opt_block.isShadow();
    this.oldJson = blocks.save(opt_block, {
      addCoordinates: true,
    }) as blocks.State;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): BlockDeleteJson {
    const json = super.toJson() as BlockDeleteJson;
    if (!this.oldXml) {
      throw new Error(
        'The old block XML is undefined. Either pass a block ' +
          'to the constructor, or call fromJson',
      );
    }
    if (!this.ids) {
      throw new Error(
        'The block IDs are undefined. Either pass a block to ' +
          'the constructor, or call fromJson',
      );
    }
    if (this.wasShadow === undefined) {
      throw new Error(
        'Whether the block was a shadow is undefined. Either ' +
          'pass a block to the constructor, or call fromJson',
      );
    }
    if (!this.oldJson) {
      throw new Error(
        'The old block JSON is undefined. Either pass a block ' +
          'to the constructor, or call fromJson',
      );
    }
    json['oldXml'] = Xml.domToText(this.oldXml);
    json['ids'] = this.ids;
    json['wasShadow'] = this.wasShadow;
    json['oldJson'] = this.oldJson;
    if (!this.recordUndo) {
      json['recordUndo'] = this.recordUndo;
    }
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of BlockDelete, but we can't specify that due to the fact that
   *     parameters to static methods in subclasses must be supertypes of
   *     parameters to static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: BlockDeleteJson,
    workspace: Workspace,
    event?: any,
  ): BlockDelete {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockDelete(),
    ) as BlockDelete;
    newEvent.oldXml = utilsXml.textToDom(json['oldXml']);
    newEvent.ids = json['ids'];
    newEvent.wasShadow =
      json['wasShadow'] || newEvent.oldXml.tagName.toLowerCase() === 'shadow';
    newEvent.oldJson = json['oldJson'];
    if (json['recordUndo'] !== undefined) {
      newEvent.recordUndo = json['recordUndo'];
    }
    return newEvent;
  }

  /**
   * Run a deletion event.
   *
   * @param forward True if run forward, false if run backward (undo).
   */
  override run(forward: boolean) {
    const workspace = this.getEventWorkspace_();
    if (!this.ids) {
      throw new Error(
        'The block IDs are undefined. Either pass a block to ' +
          'the constructor, or call fromJson',
      );
    }
    if (!this.oldJson) {
      throw new Error(
        'The old block JSON is undefined. Either pass a block ' +
          'to the constructor, or call fromJson',
      );
    }
    if (forward) {
      for (let i = 0; i < this.ids.length; i++) {
        const id = this.ids[i];
        const block = workspace.getBlockById(id);
        if (block) {
          block.dispose(false);
        } else if (id === this.blockId) {
          // Only complain about root-level block.
          console.warn("Can't delete non-existent block: " + id);
        }
      }
    } else {
      blocks.append(this.oldJson, workspace);
    }
  }
}

export interface BlockDeleteJson extends BlockBaseJson {
  oldXml: string;
  ids: string[];
  wasShadow: boolean;
  oldJson: blocks.State;
  recordUndo?: boolean;
}

registry.register(registry.Type.EVENT, EventType.BLOCK_DELETE, BlockDelete);
