/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {BlockSvg} from '../../block_svg.js';
import type {IFocusableNode} from '../../interfaces/i_focusable_node.js';
import {hasBubble} from '../../interfaces/i_has_bubble.js';
import type {INavigationPolicy} from '../../interfaces/i_navigation_policy.js';
import {RenderedConnection} from '../../rendered_connection.js';

/**
 * Set of rules controlling keyboard navigation from a block.
 */
export class BlockNavigationPolicy implements INavigationPolicy<BlockSvg> {
  /**
   * Returns the first child of the given block.
   *
   * @param current The block to return the first child of.
   * @returns The first icon, field, or input of the given block, if any.
   */
  getFirstChild(current: BlockSvg): IFocusableNode | null {
    return getBlockNavigationCandidates(current)[0];
  }

  /**
   * Returns the parent of the given block.
   *
   * @param current The block to return the parent of.
   * @returns The top block of the given block's stack, or the connection to
   *     which it is attached.
   */
  getParent(current: BlockSvg): IFocusableNode | null {
    if (current.previousConnection?.targetBlock()) {
      const surroundParent = current.getSurroundParent();
      if (surroundParent) return surroundParent;
    } else if (current.outputConnection?.targetBlock()) {
      return current.outputConnection.targetBlock();
    }

    return current.workspace;
  }

  /**
   * Returns the next peer node of the given block.
   *
   * @param current The block to find the following element of.
   * @returns The block's next connection, or the next peer on its parent block,
   *     otherwise null.
   */
  getNextSibling(current: BlockSvg): IFocusableNode | null {
    if (current.nextConnection) {
      return current.nextConnection.targetBlock() ?? current.nextConnection;
    } else if (current.outputConnection?.targetConnection) {
      const parent = this.getParent(current) as BlockSvg;
      return navigateBlock(parent, current, 1);
    }

    return null;
  }

  /**
   * Returns the previous peer node of the given block.
   *
   * @param current The block to find the preceding element of.
   * @returns The block's previous connection, or the previous peer on its
   *     parent block, otherwise null.
   */
  getPreviousSibling(current: BlockSvg): IFocusableNode | null {
    if (current.previousConnection?.targetBlock()) {
      return current.previousConnection;
    } else if (current.outputConnection?.targetBlock()) {
      return navigateBlock(
        current.outputConnection.targetBlock()!,
        current,
        -1,
      );
    }

    return null;
  }

  /**
   * Returns the visual row ID of the given block.
   *
   * @param current The block to retrieve the row ID of.
   * @returns The row ID of the given block.
   */
  getRowId(current: BlockSvg) {
    return current.getRowId();
  }

  /**
   * Returns whether or not the given block can be navigated to.
   *
   * @param current The instance to check for navigability.
   * @returns True if the given block can be focused.
   */
  isNavigable(current: BlockSvg): boolean {
    return current.canBeFocused();
  }

  /**
   * Returns whether the given object can be navigated from by this policy.
   *
   * @param current The object to check if this policy applies to.
   * @returns True if the object is a BlockSvg.
   */
  isApplicable(current: any): current is BlockSvg {
    return current instanceof BlockSvg;
  }
}

/**
 * Returns a list of the navigable children of the given block.
 *
 * @param block The block to retrieve the navigable children of.
 * @returns A list of navigable/focusable children of the given block.
 */
function getBlockNavigationCandidates(block: BlockSvg): IFocusableNode[] {
  // Collapsed blocks have no navigable children.
  if (block.isCollapsed()) return [];

  const candidates: IFocusableNode[] = [];

  // Icons and open bubbles are navigable.
  for (const icon of block.getIcons()) {
    candidates.push(icon);
    let bubble;
    if (
      hasBubble(icon) &&
      icon.bubbleIsVisible() &&
      (bubble = icon.getBubble())
    ) {
      candidates.push(bubble);
    }
  }

  for (const input of block.inputList) {
    // Invisible inputs are not valid navigation candidates.
    if (!input.isVisible()) continue;

    // Fields are navigable.
    candidates.push(...input.fieldRow);

    // Connections on inputs are navigable.
    const connection = input.connection;
    if (!connection) continue;
    candidates.push(connection as RenderedConnection);

    // Child blocks attached to inputs are navigable.
    const attachedBlock = connection.targetBlock();
    if (!attachedBlock) continue;
    candidates.push(attachedBlock as BlockSvg);

    // The last (empty) next connection in a child statement block stack is
    // navigable.
    const lastConnection = attachedBlock.lastConnectionInStack(false);
    if (!lastConnection) continue;
    candidates.push(lastConnection as RenderedConnection);
  }

  // The block's next connection is navigable.
  if (block.nextConnection) {
    candidates.push(block.nextConnection);
  }

  return candidates;
}

/**
 * Returns the next navigable item relative to the provided block child.
 *
 * @param block The block whose children should be navigated.
 * @param current The navigable block child item to navigate relative to.
 * @param delta The difference in index to navigate; positive values navigate
 *     forward by n, while negative values navigate backwards by n.
 * @returns The navigable block child offset by `delta` relative to `current`.
 */
export function navigateBlock(
  block: BlockSvg,
  current: IFocusableNode,
  delta: number,
): IFocusableNode | null {
  const candidates = getBlockNavigationCandidates(block);
  const currentIndex = candidates.indexOf(current);
  if (currentIndex === -1) return null;

  const targetIndex = currentIndex + delta;
  if (targetIndex >= 0 && targetIndex < candidates.length) {
    return candidates[targetIndex];
  }

  return null;
}
