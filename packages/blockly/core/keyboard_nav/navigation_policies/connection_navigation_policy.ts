/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {BlockSvg} from '../../block_svg.js';
import {ConnectionType} from '../../connection_type.js';
import type {IFocusableNode} from '../../interfaces/i_focusable_node.js';
import type {INavigationPolicy} from '../../interfaces/i_navigation_policy.js';
import {RenderedConnection} from '../../rendered_connection.js';
import {navigateBlock} from './block_navigation_policy.js';

/**
 * Set of rules controlling keyboard navigation from a connection.
 */
export class ConnectionNavigationPolicy
  implements INavigationPolicy<RenderedConnection>
{
  /**
   * Returns the first child of a connection.
   *
   * @returns Null, as connections do not have children.
   */
  getFirstChild(): IFocusableNode | null {
    return null;
  }

  /**
   * Returns the parent of the given connection.
   *
   * @param current The connection to return the parent of.
   * @returns The given connection's parent block.
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
      return navigateBlock(current.getSourceBlock(), current, 1);
    } else if (
      current.type === ConnectionType.NEXT_STATEMENT &&
      current.getSourceBlock().getSurroundParent() &&
      !current.targetConnection
    ) {
      return navigateBlock(
        current.getSourceBlock().getSurroundParent()!,
        current,
        1,
      );
    }

    switch (current.type) {
      case ConnectionType.NEXT_STATEMENT:
        return current.targetConnection;
      case ConnectionType.PREVIOUS_STATEMENT:
      case ConnectionType.OUTPUT_VALUE:
        return current.getSourceBlock();
    }

    return null;
  }

  /**
   * Returns the element preceding the given connection.
   *
   * @param current The connection to navigate from.
   * @returns The field, input connection or block preceding this connection.
   */
  getPreviousSibling(current: RenderedConnection): IFocusableNode | null {
    if (current.getParentInput()) {
      return navigateBlock(
        current.getParentInput()!.getSourceBlock() as BlockSvg,
        current,
        -1,
      );
    }
    switch (current.type) {
      case ConnectionType.NEXT_STATEMENT:
        return current.getSourceBlock();
      case ConnectionType.PREVIOUS_STATEMENT:
      case ConnectionType.OUTPUT_VALUE:
        return current.targetConnection;
    }

    return null;
  }

  /**
   * Returns the row ID of the given connection.
   *
   * @param current The connection to retrieve the row ID of.
   * @returns The row ID of the given connection.
   */
  getRowId(current: RenderedConnection) {
    switch (current.type) {
      case ConnectionType.NEXT_STATEMENT:
      case ConnectionType.PREVIOUS_STATEMENT:
        return current.id;
      case ConnectionType.INPUT_VALUE:
        return current.getParentInput()!.getRowId();
      case ConnectionType.OUTPUT_VALUE:
      default:
        return current.getSourceBlock().getRowId();
    }
  }

  /**
   * Returns whether or not the given connection can be navigated to.
   *
   * @param current The instance to check for navigability.
   * @returns True if the given connection can be focused.
   */
  isNavigable(current: RenderedConnection): boolean {
    if (!current.canBeFocused()) return false;

    // Empty next connections on block stacks inside of a C shaped block are
    // navigable.
    if (current.type === ConnectionType.NEXT_STATEMENT) {
      if (current.targetBlock()) return false;

      const rootBlock =
        current.getSourceBlock().getRootBlock() ?? current.getSourceBlock();
      if (current === rootBlock.lastConnectionInStack(false)) return false;

      return true;
    }

    // Empty input connections are navigable.
    return (
      current.type === ConnectionType.INPUT_VALUE && !current.targetBlock()
    );
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
