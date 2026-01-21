/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {BlockSvg} from '../block_svg.js';
import {IFocusableNode} from '../blockly.js';
import {config} from '../config.js';
import {EventType} from '../events/type.js';
import * as eventUtils from '../events/utils.js';
import {getFocusManager} from '../focus_manager.js';
import {ICopyData} from '../interfaces/i_copyable.js';
import {IPaster} from '../interfaces/i_paster.js';
import * as renderManagement from '../render_management.js';
import {State, append} from '../serialization/blocks.js';
import {Coordinate} from '../utils/coordinate.js';
import {WorkspaceSvg} from '../workspace_svg.js';
import * as registry from './registry.js';

export class BlockPaster implements IPaster<BlockCopyData, BlockSvg> {
  static TYPE = 'block';

  paste(
    copyData: BlockCopyData,
    workspace: WorkspaceSvg,
    coordinate?: Coordinate,
  ): BlockSvg | null {
    if (!workspace.isCapacityAvailable(copyData.typeCounts!)) return null;

    if (coordinate) {
      copyData.blockState['x'] = coordinate.x;
      copyData.blockState['y'] = coordinate.y;
    }

    // After appending the block to the workspace, it will be bumped from its neighbors
    // However, the algorithm for deciding where to paste a block depends on
    // the starting position of the copied block, so we'll pass those coordinates along
    const initialCoordinates =
      coordinate ||
      new Coordinate(
        copyData.blockState['x'] || 0,
        copyData.blockState['y'] || 0,
      );

    eventUtils.disable();
    let block;
    try {
      block = append(copyData.blockState, workspace) as BlockSvg;
      moveBlockToNotConflict(block, initialCoordinates);
    } finally {
      eventUtils.enable();
    }

    if (!block) return block;

    if (eventUtils.isEnabled() && !block.isShadow()) {
      eventUtils.fire(new (eventUtils.get(EventType.BLOCK_CREATE))(block));
    }

    // Sometimes there's a delay before the block is fully created and ready for
    // focusing, so wait slightly before focusing the newly pasted block.
    const nodeToFocus: IFocusableNode = block;
    renderManagement
      .finishQueuedRenders()
      .then(() => getFocusManager().focusNode(nodeToFocus));
    return block;
  }
}

/**
 * Moves the given block to a location where it does not: (1) overlap exactly
 * with any other blocks, or (2) look like it is connected to any other blocks.
 *
 * Exported for testing.
 *
 * @param block The block to move to an unambiguous location.
 * @param originalPosition The initial coordinate to start searching from,
 *    likely the position of the copied block.
 * @internal
 */
export function moveBlockToNotConflict(
  block: BlockSvg,
  originalPosition: Coordinate,
) {
  if (block.workspace.RTL) {
    originalPosition.x = block.workspace.getWidth() - originalPosition.x;
  }
  const workspace = block.workspace;
  const snapRadius = config.snapRadius;
  const bumpOffset = Coordinate.difference(
    originalPosition,
    block.getRelativeToSurfaceXY(),
  );
  const offset = new Coordinate(0, 0);
  // getRelativeToSurfaceXY is really expensive, so we want to cache this.
  const otherCoords = workspace
    .getAllBlocks(false)
    .filter((otherBlock) => otherBlock.id != block.id)
    .map((b) => b.getRelativeToSurfaceXY());

  while (
    blockOverlapsOtherExactly(
      Coordinate.sum(originalPosition, offset),
      otherCoords,
    ) ||
    blockIsInSnapRadius(block, Coordinate.sum(bumpOffset, offset), snapRadius)
  ) {
    if (workspace.RTL) {
      offset.translate(-snapRadius, snapRadius * 2);
    } else {
      offset.translate(snapRadius, snapRadius * 2);
    }
  }

  block!.moveTo(Coordinate.sum(originalPosition, offset));
}

/**
 * @returns true if the given block coordinates are less than a delta of 1 from
 *     any of the other coordinates.
 */
function blockOverlapsOtherExactly(
  coord: Coordinate,
  otherCoords: Coordinate[],
): boolean {
  return otherCoords.some(
    (otherCoord) =>
      Math.abs(otherCoord.x - coord.x) <= 1 &&
      Math.abs(otherCoord.y - coord.y) <= 1,
  );
}

/**
 * @returns true if the given block (when offset by the given amount) is close
 *     enough to any other connections (within the snap radius) that it looks
 *     like they could connect.
 */
function blockIsInSnapRadius(
  block: BlockSvg,
  offset: Coordinate,
  snapRadius: number,
): boolean {
  return block
    .getConnections_(false)
    .some((connection) => !!connection.closest(snapRadius, offset).connection);
}

export interface BlockCopyData extends ICopyData {
  blockState: State;
  typeCounts: {[key: string]: number};
}

registry.register(BlockPaster.TYPE, new BlockPaster());
