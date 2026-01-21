/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Class for a block move event.
 *
 * @class
 */
// Former goog.module ID: Blockly.Events.BlockMove

import type {Block} from '../block.js';
import {ConnectionType} from '../connection_type.js';
import * as registry from '../registry.js';
import {Coordinate} from '../utils/coordinate.js';
import type {Workspace} from '../workspace.js';
import {BlockBase, BlockBaseJson} from './events_block_base.js';
import {EventType} from './type.js';

interface BlockLocation {
  parentId?: string;
  inputName?: string;
  coordinate?: Coordinate;
}

/**
 * Notifies listeners when a block is moved. This could be from one
 * connection to another, or from one location on the workspace to another.
 */
export class BlockMove extends BlockBase {
  override type = EventType.BLOCK_MOVE;

  /** The ID of the old parent block. Undefined if it was a top-level block. */
  oldParentId?: string;

  /**
   * The name of the old input. Undefined if it was a top-level block or the
   * parent's next block.
   */
  oldInputName?: string;

  /**
   * The old X and Y workspace coordinates of the block if it was a top level
   * block. Undefined if it was not a top level block.
   */
  oldCoordinate?: Coordinate;

  /** The ID of the new parent block. Undefined if it is a top-level block. */
  newParentId?: string;

  /**
   * The name of the new input. Undefined if it is a top-level block or the
   * parent's next block.
   */
  newInputName?: string;

  /**
   * The new X and Y workspace coordinates of the block if it is a top-level
   * block. Undefined if it is not a top level block.
   */
  newCoordinate?: Coordinate;

  /**
   * An explanation of what this move is for.  Known values include:
   *  'drag' -- A drag operation completed.
   *  'bump' -- Block got bumped away from an invalid connection.
   *  'snap' -- Block got shifted to line up with the grid.
   *  'inbounds' -- Block got pushed back into a non-scrolling workspace.
   *  'connect' -- Block got connected to another block.
   *  'disconnect' -- Block got disconnected from another block.
   *  'create' -- Block created via XML.
   *  'cleanup' -- Workspace aligned top-level blocks.
   * Event merging may create multiple reasons: ['drag', 'bump', 'snap'].
   */
  reason?: string[];

  /** @param opt_block The moved block.  Undefined for a blank event. */
  constructor(opt_block?: Block) {
    super(opt_block);

    if (!opt_block) {
      return;
    }
    // Blank event to be populated by fromJson.
    if (opt_block.isShadow()) {
      // Moving shadow blocks is handled via disconnection.
      this.recordUndo = false;
    }

    const location = this.currentLocation();
    this.oldParentId = location.parentId;
    this.oldInputName = location.inputName;
    this.oldCoordinate = location.coordinate;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): BlockMoveJson {
    const json = super.toJson() as BlockMoveJson;
    json['oldParentId'] = this.oldParentId;
    json['oldInputName'] = this.oldInputName;
    if (this.oldCoordinate) {
      json['oldCoordinate'] =
        `${Math.round(this.oldCoordinate.x)}, ` +
        `${Math.round(this.oldCoordinate.y)}`;
    }
    json['newParentId'] = this.newParentId;
    json['newInputName'] = this.newInputName;
    if (this.newCoordinate) {
      json['newCoordinate'] =
        `${Math.round(this.newCoordinate.x)}, ` +
        `${Math.round(this.newCoordinate.y)}`;
    }
    if (this.reason) {
      json['reason'] = this.reason;
    }
    if (!this.recordUndo) {
      json['recordUndo'] = this.recordUndo;
    }
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of BlockMove, but we can't specify that due to the fact that parameters
   *     to static methods in subclasses must be supertypes of parameters to
   *     static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: BlockMoveJson,
    workspace: Workspace,
    event?: any,
  ): BlockMove {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new BlockMove(),
    ) as BlockMove;
    newEvent.oldParentId = json['oldParentId'];
    newEvent.oldInputName = json['oldInputName'];
    if (json['oldCoordinate']) {
      const xy = json['oldCoordinate'].split(',');
      newEvent.oldCoordinate = new Coordinate(Number(xy[0]), Number(xy[1]));
    }
    newEvent.newParentId = json['newParentId'];
    newEvent.newInputName = json['newInputName'];
    if (json['newCoordinate']) {
      const xy = json['newCoordinate'].split(',');
      newEvent.newCoordinate = new Coordinate(Number(xy[0]), Number(xy[1]));
    }
    if (json['reason'] !== undefined) {
      newEvent.reason = json['reason'];
    }
    if (json['recordUndo'] !== undefined) {
      newEvent.recordUndo = json['recordUndo'];
    }
    return newEvent;
  }

  /** Record the block's new location.  Called after the move. */
  recordNew() {
    const location = this.currentLocation();
    this.newParentId = location.parentId;
    this.newInputName = location.inputName;
    this.newCoordinate = location.coordinate;
  }

  /**
   * Set the reason for a move event.
   *
   * @param reason Why is this move happening?  'drag', 'bump', 'snap', ...
   */
  setReason(reason: string[]) {
    this.reason = reason;
  }

  /**
   * Returns the parentId and input if the block is connected,
   *   or the XY location if disconnected.
   *
   * @returns Collection of location info.
   */
  private currentLocation(): BlockLocation {
    const workspace = this.getEventWorkspace_();
    if (!this.blockId) {
      throw new Error(
        'The block ID is undefined. Either pass a block to ' +
          'the constructor, or call fromJson',
      );
    }
    const block = workspace.getBlockById(this.blockId);
    if (!block) {
      throw new Error(
        'The block associated with the block move event ' +
          'could not be found',
      );
    }
    const location = {} as BlockLocation;
    const parent = block.getParent();
    if (parent) {
      location.parentId = parent.id;
      const input = parent.getInputWithBlock(block);
      if (input) {
        location.inputName = input.name;
      }
    } else {
      location.coordinate = block.getRelativeToSurfaceXY();
    }
    return location;
  }

  /**
   * Does this event record any change of state?
   *
   * @returns False if something changed.
   */
  override isNull(): boolean {
    return (
      this.oldParentId === this.newParentId &&
      this.oldInputName === this.newInputName &&
      Coordinate.equals(this.oldCoordinate, this.newCoordinate)
    );
  }

  /**
   * Run a move event.
   *
   * @param forward True if run forward, false if run backward (undo).
   */
  override run(forward: boolean) {
    const workspace = this.getEventWorkspace_();
    if (!this.blockId) {
      throw new Error(
        'The block ID is undefined. Either pass a block to ' +
          'the constructor, or call fromJson',
      );
    }
    const block = workspace.getBlockById(this.blockId);
    if (!block) {
      console.warn("Can't move non-existent block: " + this.blockId);
      return;
    }
    const parentId = forward ? this.newParentId : this.oldParentId;
    const inputName = forward ? this.newInputName : this.oldInputName;
    const coordinate = forward ? this.newCoordinate : this.oldCoordinate;
    let parentBlock: Block | null;
    if (parentId) {
      parentBlock = workspace.getBlockById(parentId);
      if (!parentBlock) {
        console.warn("Can't connect to non-existent block: " + parentId);
        return;
      }
    }
    if (block.getParent()) {
      block.unplug();
    }
    if (coordinate) {
      const xy = block.getRelativeToSurfaceXY();
      block.moveBy(coordinate.x - xy.x, coordinate.y - xy.y, this.reason);
    } else {
      let blockConnection = block.outputConnection;
      if (
        !blockConnection ||
        (block.previousConnection && block.previousConnection.isConnected())
      ) {
        blockConnection = block.previousConnection;
      }
      let parentConnection;
      const connectionType = blockConnection?.type;
      if (inputName) {
        const input = parentBlock!.getInput(inputName);
        if (input) {
          parentConnection = input.connection;
        }
      } else if (connectionType === ConnectionType.PREVIOUS_STATEMENT) {
        parentConnection = parentBlock!.nextConnection;
      }
      if (parentConnection && blockConnection) {
        blockConnection.connect(parentConnection);
      } else {
        console.warn("Can't connect to non-existent input: " + inputName);
      }
    }
  }
}

export interface BlockMoveJson extends BlockBaseJson {
  oldParentId?: string;
  oldInputName?: string;
  oldCoordinate?: string;
  newParentId?: string;
  newInputName?: string;
  newCoordinate?: string;
  reason?: string[];
  recordUndo?: boolean;
}

registry.register(registry.Type.EVENT, EventType.BLOCK_MOVE, BlockMove);
