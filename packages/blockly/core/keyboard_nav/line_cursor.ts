/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview The class representing a line cursor.
 * A line cursor tries to traverse the blocks and connections on a block as if
 * they were lines of code in a text editor. Previous and next traverse previous
 * connections, next connections and blocks, while in and out traverse input
 * connections and fields.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */

import {BlockSvg} from '../block_svg.js';
import {RenderedWorkspaceComment} from '../comments/rendered_workspace_comment.js';
import {getFocusManager} from '../focus_manager.js';
import type {IFocusableNode} from '../interfaces/i_focusable_node.js';
import * as registry from '../registry.js';
import type {WorkspaceSvg} from '../workspace_svg.js';
import {Marker} from './marker.js';

/**
 * Class for a line cursor.
 */
export class LineCursor extends Marker {
  override type = 'cursor';

  /** Locations to try moving the cursor to after a deletion. */
  private potentialNodes: IFocusableNode[] | null = null;

  /**
   * @param workspace The workspace this cursor belongs to.
   */
  constructor(protected readonly workspace: WorkspaceSvg) {
    super();
  }

  /**
   * Moves the cursor to the next block or workspace comment in the pre-order
   * traversal.
   *
   * @returns The next node, or null if the current node is not set or there is
   *     no next value.
   */
  next(): IFocusableNode | null {
    const curNode = this.getCurNode();
    if (!curNode) {
      return null;
    }
    const newNode = this.getNextNode(
      curNode,
      (candidate: IFocusableNode | null) => {
        return (
          (candidate instanceof BlockSvg &&
            !candidate.outputConnection?.targetBlock()) ||
          candidate instanceof RenderedWorkspaceComment
        );
      },
      true,
    );

    if (newNode) {
      this.setCurNode(newNode);
    }
    return newNode;
  }

  /**
   * Moves the cursor to the next input connection or field
   * in the pre order traversal.
   *
   * @returns The next node, or null if the current node is
   *     not set or there is no next value.
   */
  in(): IFocusableNode | null {
    const curNode = this.getCurNode();
    if (!curNode) {
      return null;
    }

    const newNode = this.getNextNode(curNode, () => true, true);

    if (newNode) {
      this.setCurNode(newNode);
    }
    return newNode;
  }
  /**
   * Moves the cursor to the previous block or workspace comment in the
   * pre-order traversal.
   *
   * @returns The previous node, or null if the current node is not set or there
   *     is no previous value.
   */
  prev(): IFocusableNode | null {
    const curNode = this.getCurNode();
    if (!curNode) {
      return null;
    }
    const newNode = this.getPreviousNode(
      curNode,
      (candidate: IFocusableNode | null) => {
        return (
          (candidate instanceof BlockSvg &&
            !candidate.outputConnection?.targetBlock()) ||
          candidate instanceof RenderedWorkspaceComment
        );
      },
      true,
    );

    if (newNode) {
      this.setCurNode(newNode);
    }
    return newNode;
  }

  /**
   * Moves the cursor to the previous input connection or field in the pre order
   * traversal.
   *
   * @returns The previous node, or null if the current node
   *     is not set or there is no previous value.
   */
  out(): IFocusableNode | null {
    const curNode = this.getCurNode();
    if (!curNode) {
      return null;
    }

    const newNode = this.getPreviousNode(curNode, () => true, true);

    if (newNode) {
      this.setCurNode(newNode);
    }
    return newNode;
  }

  /**
   * Returns true iff the node to which we would navigate if in() were
   * called is the same as the node to which we would navigate if next() were
   * called - in effect, if the LineCursor is at the end of the 'current
   * line' of the program.
   */
  atEndOfLine(): boolean {
    const curNode = this.getCurNode();
    if (!curNode) return false;
    const inNode = this.getNextNode(curNode, () => true, true);
    const nextNode = this.getNextNode(
      curNode,
      (candidate: IFocusableNode | null) => {
        return (
          candidate instanceof BlockSvg &&
          !candidate.outputConnection?.targetBlock()
        );
      },
      true,
    );

    return inNode === nextNode;
  }

  /**
   * Uses pre order traversal to navigate the Blockly AST. This will allow
   * a user to easily navigate the entire Blockly AST without having to go in
   * and out levels on the tree.
   *
   * @param node The current position in the AST.
   * @param isValid A function true/false depending on whether the given node
   *     should be traversed.
   * @param visitedNodes A set of previously visited nodes used to avoid cycles.
   * @returns The next node in the traversal.
   */
  private getNextNodeImpl(
    node: IFocusableNode | null,
    isValid: (p1: IFocusableNode | null) => boolean,
    visitedNodes: Set<IFocusableNode> = new Set<IFocusableNode>(),
  ): IFocusableNode | null {
    if (!node || visitedNodes.has(node)) return null;
    let newNode =
      this.workspace.getNavigator().getFirstChild(node) ||
      this.workspace.getNavigator().getNextSibling(node);

    let target = node;
    while (target && !newNode) {
      const parent = this.workspace.getNavigator().getParent(target);
      if (!parent) break;
      newNode = this.workspace.getNavigator().getNextSibling(parent);
      target = parent;
    }

    if (isValid(newNode)) return newNode;
    if (newNode) {
      visitedNodes.add(node);
      return this.getNextNodeImpl(newNode, isValid, visitedNodes);
    }
    return null;
  }

  /**
   * Get the next node in the AST, optionally allowing for loopback.
   *
   * @param node The current position in the AST.
   * @param isValid A function true/false depending on whether the given node
   *     should be traversed.
   * @param loop Whether to loop around to the beginning of the workspace if no
   *     valid node was found.
   * @returns The next node in the traversal.
   */
  getNextNode(
    node: IFocusableNode | null,
    isValid: (p1: IFocusableNode | null) => boolean,
    loop: boolean,
  ): IFocusableNode | null {
    if (!node || (!loop && this.getLastNode() === node)) return null;

    return this.getNextNodeImpl(node, isValid);
  }

  /**
   * Reverses the pre order traversal in order to find the previous node. This
   * will allow a user to easily navigate the entire Blockly AST without having
   * to go in and out levels on the tree.
   *
   * @param node The current position in the AST.
   * @param isValid A function true/false depending on whether the given node
   *     should be traversed.
   * @param visitedNodes A set of previously visited nodes used to avoid cycles.
   * @returns The previous node in the traversal or null if no previous node
   *     exists.
   */
  private getPreviousNodeImpl(
    node: IFocusableNode | null,
    isValid: (p1: IFocusableNode | null) => boolean,
    visitedNodes: Set<IFocusableNode> = new Set<IFocusableNode>(),
  ): IFocusableNode | null {
    if (!node || visitedNodes.has(node)) return null;

    const newNode =
      this.getRightMostChild(
        this.workspace.getNavigator().getPreviousSibling(node),
        node,
      ) || this.workspace.getNavigator().getParent(node);

    if (isValid(newNode)) return newNode;
    if (newNode) {
      visitedNodes.add(node);
      return this.getPreviousNodeImpl(newNode, isValid, visitedNodes);
    }
    return null;
  }

  /**
   * Get the previous node in the AST, optionally allowing for loopback.
   *
   * @param node The current position in the AST.
   * @param isValid A function true/false depending on whether the given node
   *     should be traversed.
   * @param loop Whether to loop around to the end of the workspace if no valid
   *     node was found.
   * @returns The previous node in the traversal or null if no previous node
   *     exists.
   */
  getPreviousNode(
    node: IFocusableNode | null,
    isValid: (p1: IFocusableNode | null) => boolean,
    loop: boolean,
  ): IFocusableNode | null {
    if (!node || (!loop && this.getFirstNode() === node)) return null;

    return this.getPreviousNodeImpl(node, isValid);
  }

  /**
   * Get the right most child of a node.
   *
   * @param node The node to find the right most child of.
   * @returns The right most child of the given node, or the node if no child
   *     exists.
   */
  private getRightMostChild(
    node: IFocusableNode | null,
    stopIfFound: IFocusableNode,
  ): IFocusableNode | null {
    if (!node) return node;
    let newNode = this.workspace.getNavigator().getFirstChild(node);
    if (!newNode || newNode === stopIfFound) return node;
    for (
      let nextNode: IFocusableNode | null = newNode;
      nextNode;
      nextNode = this.workspace.getNavigator().getNextSibling(newNode)
    ) {
      if (nextNode === stopIfFound) break;
      newNode = nextNode;
    }
    return this.getRightMostChild(newNode, stopIfFound);
  }

  /**
   * Prepare for the deletion of a block by making a list of nodes we
   * could move the cursor to afterwards and save it to
   * this.potentialNodes.
   *
   * After the deletion has occurred, call postDelete to move it to
   * the first valid node on that list.
   *
   * The locations to try (in order of preference) are:
   *
   * - The current location.
   * - The connection to which the deleted block is attached.
   * - The block connected to the next connection of the deleted block.
   * - The parent block of the deleted block.
   * - A location on the workspace beneath the deleted block.
   *
   * N.B.: When block is deleted, all of the blocks conneccted to that
   * block's inputs are also deleted, but not blocks connected to its
   * next connection.
   *
   * @param deletedBlock The block that is being deleted.
   */
  preDelete(deletedBlock: BlockSvg) {
    const curNode = this.getCurNode();

    const nodes: IFocusableNode[] = curNode ? [curNode] : [];
    // The connection to which the deleted block is attached.
    const parentConnection =
      deletedBlock.previousConnection?.targetConnection ??
      deletedBlock.outputConnection?.targetConnection;
    if (parentConnection) {
      nodes.push(parentConnection);
    }
    // The block connected to the next connection of the deleted block.
    const nextBlock = deletedBlock.getNextBlock();
    if (nextBlock) {
      nodes.push(nextBlock);
    }
    //  The parent block of the deleted block.
    const parentBlock = deletedBlock.getParent();
    if (parentBlock) {
      nodes.push(parentBlock);
    }
    // A location on the workspace beneath the deleted block.
    // Move to the workspace.
    nodes.push(this.workspace);
    this.potentialNodes = nodes;
  }

  /**
   * Move the cursor to the first valid location in
   * this.potentialNodes, following a block deletion.
   */
  postDelete() {
    const nodes = this.potentialNodes;
    this.potentialNodes = null;
    if (!nodes) throw new Error('must call preDelete first');
    for (const node of nodes) {
      if (!this.getSourceBlockFromNode(node)?.disposed) {
        this.setCurNode(node);
        return;
      }
    }
    throw new Error('no valid nodes in this.potentialNodes');
  }

  /**
   * Get the current location of the cursor.
   *
   * Overrides normal Marker getCurNode to update the current node from the
   * selected block. This typically happens via the selection listener but that
   * is not called immediately when `Gesture` calls
   * `Blockly.common.setSelected`. In particular the listener runs after showing
   * the context menu.
   *
   * @returns The current field, connection, or block the cursor is on.
   */
  getCurNode(): IFocusableNode | null {
    return getFocusManager().getFocusedNode();
  }

  /**
   * Set the location of the cursor and draw it.
   *
   * Overrides normal Marker setCurNode logic to call
   * this.drawMarker() instead of this.drawer.draw() directly.
   *
   * @param newNode The new location of the cursor.
   */
  setCurNode(newNode: IFocusableNode) {
    getFocusManager().focusNode(newNode);
  }

  /**
   * Get the first navigable node on the workspace, or null if none exist.
   *
   * @returns The first navigable node on the workspace, or null.
   */
  getFirstNode(): IFocusableNode | null {
    return this.workspace.getNavigator().getFirstChild(this.workspace);
  }

  /**
   * Get the last navigable node on the workspace, or null if none exist.
   *
   * @returns The last navigable node on the workspace, or null.
   */
  getLastNode(): IFocusableNode | null {
    const first = this.getFirstNode();
    return this.getPreviousNode(first, () => true, true);
  }
}

registry.register(registry.Type.CURSOR, registry.DEFAULT, LineCursor);
