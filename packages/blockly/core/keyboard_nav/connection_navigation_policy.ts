/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {BlockSvg} from '../block_svg.js';
import {ConnectionType} from '../connection_type.js';
import type {IFocusableNode} from '../interfaces/i_focusable_node.js';
import type {INavigationPolicy} from '../interfaces/i_navigation_policy.js';
import {RenderedConnection} from '../rendered_connection.js';
import {navigateBlock} from './block_navigation_policy.js';

/**
 * Set of rules controlling keyboard navigation from a connection.
 */
export class ConnectionNavigationPolicy
  implements INavigationPolicy<RenderedConnection>
{
  /**
   * Returns the first child of the given connection.
   *
   * @param current The connection to return the first child of.
   * @returns The connection's first child element, or null if not none.
   */
  getFirstChild(current: RenderedConnection): IFocusableNode | null {
    if (current.getParentInput()) {
      return current.targetConnection;
    }

    return null;
  }

  /**
   * Returns the parent of the given connection.
   *
   * @param current The connection to return the parent of.
   * @returns The given connection's parent connection or block.
   */
  getParent(current: RenderedConnection): IFocusableNode | null {
    return current.getSourceBlock();
  }

  /**
   * Returns the next element following the given connection.
   *
   * @param current The connection to navigate from.
   * @returns The field, input connection or block following this connection.
   */
  getNextSibling(current: RenderedConnection): IFocusableNode | null {
    if (current.getParentInput()) {
      return navigateBlock(current, 1);
    } else if (current.type === ConnectionType.NEXT_STATEMENT) {
      const nextBlock = current.targetConnection;
      // If this connection is the last one in the stack, our next sibling is
      // the next block stack.
      const sourceBlock = current.getSourceBlock();
      if (
        !nextBlock &&
        sourceBlock.getRootBlock().lastConnectionInStack(false) === current
      ) {
        const topBlocks = sourceBlock.workspace.getTopBlocks(true);
        let targetIndex = topBlocks.indexOf(sourceBlock.getRootBlock()) + 1;
        if (targetIndex >= topBlocks.length) {
          targetIndex = 0;
        }
        const nextBlock = topBlocks[targetIndex];
        return this.getParentConnection(nextBlock) ?? nextBlock;
      }

      return nextBlock;
    }

    return current.getSourceBlock();
  }

  /**
   * Returns the element preceding the given connection.
   *
   * @param current The connection to navigate from.
   * @returns The field, input connection or block preceding this connection.
   */
  getPreviousSibling(current: RenderedConnection): IFocusableNode | null {
    if (current.getParentInput()) {
      return navigateBlock(current, -1);
    } else if (
      current.type === ConnectionType.PREVIOUS_STATEMENT ||
      current.type === ConnectionType.OUTPUT_VALUE
    ) {
      const previousConnection =
        current.targetConnection && !current.targetConnection.getParentInput()
          ? current.targetConnection
          : null;

      // If this connection is a disconnected previous/output connection, our
      // previous sibling is the previous block stack's last connection/block.
      const sourceBlock = current.getSourceBlock();
      if (
        !previousConnection &&
        this.getParentConnection(sourceBlock.getRootBlock()) === current
      ) {
        const topBlocks = sourceBlock.workspace.getTopBlocks(true);
        let targetIndex = topBlocks.indexOf(sourceBlock.getRootBlock()) - 1;
        if (targetIndex < 0) {
          targetIndex = topBlocks.length - 1;
        }
        const previousRootBlock = topBlocks[targetIndex];
        return (
          previousRootBlock.lastConnectionInStack(false) ?? previousRootBlock
        );
      }

      return previousConnection;
    } else if (current.type === ConnectionType.NEXT_STATEMENT) {
      return current.getSourceBlock();
    }
    return null;
  }

  /**
   * Gets the parent connection on a block.
   * This is either an output connection, previous connection or undefined.
   * If both connections exist return the one that is actually connected
   * to another block.
   *
   * @param block The block to find the parent connection on.
   * @returns The connection connecting to the parent of the block.
   */
  protected getParentConnection(block: BlockSvg) {
    if (!block.outputConnection || block.previousConnection?.isConnected()) {
      return block.previousConnection;
    }
    return block.outputConnection;
  }

  /**
   * Returns whether or not the given connection can be navigated to.
   *
   * @param current The instance to check for navigability.
   * @returns True if the given connection can be focused.
   */
  isNavigable(current: RenderedConnection): boolean {
    return current.canBeFocused();
  }

  /**
   * Returns whether the given object can be navigated from by this policy.
   *
   * @param current The object to check if this policy applies to.
   * @returns True if the object is a RenderedConnection.
   */
  isApplicable(current: any): current is RenderedConnection {
    return current instanceof RenderedConnection;
  }
}
