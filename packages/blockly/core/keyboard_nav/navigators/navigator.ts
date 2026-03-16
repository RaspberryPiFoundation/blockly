/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {BlockSvg} from '../../block_svg.js';
import {RenderedWorkspaceComment} from '../../comments/rendered_workspace_comment.js';
import {ConnectionType} from '../../connection_type.js';
import {Field} from '../../field.js';
import {getFocusManager} from '../../focus_manager.js';
import {Icon} from '../../icons/icon.js';
import type {IFocusableNode} from '../../interfaces/i_focusable_node.js';
import type {INavigationPolicy} from '../../interfaces/i_navigation_policy.js';
import {RenderedConnection} from '../../rendered_connection.js';
import {BlockCommentNavigationPolicy} from '../navigation_policies/block_comment_navigation_policy.js';
import {BlockNavigationPolicy} from '../navigation_policies/block_navigation_policy.js';
import {CommentBarButtonNavigationPolicy} from '../navigation_policies/comment_bar_button_navigation_policy.js';
import {CommentEditorNavigationPolicy} from '../navigation_policies/comment_editor_navigation_policy.js';
import {ConnectionNavigationPolicy} from '../navigation_policies/connection_navigation_policy.js';
import {FieldNavigationPolicy} from '../navigation_policies/field_navigation_policy.js';
import {IconNavigationPolicy} from '../navigation_policies/icon_navigation_policy.js';
import {WorkspaceCommentNavigationPolicy} from '../navigation_policies/workspace_comment_navigation_policy.js';
import {WorkspaceNavigationPolicy} from '../navigation_policies/workspace_navigation_policy.js';

type RuleList<T> = INavigationPolicy<T>[];

/**
 * Representation of the direction of travel within a navigation context.
 */
export enum NavigationDirection {
  NEXT,
  PREVIOUS,
  IN,
  OUT,
}

/**
 * Class responsible for determining where focus should move in response to
 * keyboard navigation commands.
 */
export class Navigator {
  /**
   * Map from classes to a corresponding ruleset to handle navigation from
   * instances of that class.
   */
  protected rules: RuleList<any> = [
    new BlockNavigationPolicy(),
    new FieldNavigationPolicy(),
    new ConnectionNavigationPolicy(),
    new WorkspaceNavigationPolicy(),
    new IconNavigationPolicy(),
    new WorkspaceCommentNavigationPolicy(),
    new CommentBarButtonNavigationPolicy(),
    new BlockCommentNavigationPolicy(),
    new CommentEditorNavigationPolicy(),
  ];

  /** Whether or not navigation loops around when reaching the end. */
  protected navigationLoops = false;

  protected relativeNode: IFocusableNode | null = null;

  /**
   * Adds a navigation ruleset to this Navigator.
   *
   * @param policy A ruleset that determines where focus should move starting
   *     from an instance of its managed class.
   */
  addNavigationPolicy(policy: INavigationPolicy<any>) {
    this.rules.push(policy);
  }

  /**
   * Returns the navigation ruleset associated with the given object instance's
   * class.
   *
   * @param current An object to retrieve a navigation ruleset for.
   * @returns The navigation ruleset of objects of the given object's class, or
   *     undefined if no ruleset has been registered for the object's class.
   */
  private get(
    current: IFocusableNode,
  ): INavigationPolicy<typeof current> | undefined {
    return this.rules.find((rule) => rule.isApplicable(current));
  }

  /**
   * Returns the first child of the given object instance, if any.
   *
   * @param current The object to retrieve the first child of.
   * @returns The first child node of the given object, if any.
   */
  getFirstChild(current: IFocusableNode): IFocusableNode | null {
    const result = this.get(current)?.getFirstChild(current);
    if (!result) return null;
    if (!this.get(result)?.isNavigable(result)) {
      return this.getFirstChild(result) || this.getNextSibling(result);
    }
    return result;
  }

  /**
   * Returns the parent of the given object instance, if any.
   *
   * @param current The object to retrieve the parent of.
   * @returns The parent node of the given object, if any.
   */
  getParent(current: IFocusableNode): IFocusableNode | null {
    const result = this.get(current)?.getParent(current);
    if (!result) return null;
    if (!this.get(result)?.isNavigable(result)) return this.getParent(result);
    return result;
  }

  /**
   * Returns the next sibling of the given object instance, if any.
   *
   * @param current The object to retrieve the next sibling node of.
   * @returns The next sibling node of the given object, if any.
   */
  getNextSibling(current: IFocusableNode): IFocusableNode | null {
    const result = this.get(current)?.getNextSibling(current);
    if (!result) return null;
    if (!this.get(result)?.isNavigable(result)) {
      return this.getNextSibling(result);
    }
    return result;
  }

  /**
   * Returns the previous sibling of the given object instance, if any.
   *
   * @param current The object to retrieve the previous sibling node of.
   * @returns The previous sibling node of the given object, if any.
   */
  getPreviousSibling(current: IFocusableNode): IFocusableNode | null {
    const result = this.get(current)?.getPreviousSibling(current);
    if (!result) return null;
    if (!this.get(result)?.isNavigable(result)) {
      return this.getPreviousSibling(result);
    }
    return result;
  }

  /**
   * Returns the previous node relative to the given node.
   *
   * @param node The node to navigate relative to, defaults to the currently
   *     focused node.
   * @returns The previous node, generally on the "row" visually above the
   *     specified node, or null if there is none.
   */
  getPreviousNode(
    node = getFocusManager().getFocusedNode(),
  ): IFocusableNode | null {
    this.relativeNode = node;
    return this.getPreviousNodeImpl(node, NavigationDirection.PREVIOUS);
  }

  /**
   * Returns the node to the left of the given node.
   *
   * @param node The node to navigate relative to, defaults to the currently
   *     focused node.
   * @returns The node to the left of the given node, within the same visual
   *     "row" as the given node, or null if there is none.
   */
  getOutNode(node = getFocusManager().getFocusedNode()): IFocusableNode | null {
    this.relativeNode = node;
    return this.getPreviousNodeImpl(node, NavigationDirection.OUT);
  }

  /**
   * Returns next node relative to the given node.
   *
   * @param node The node to navigate relative to, defaults to the currently
   *     focused node.
   * @returns The next node, generally on the "row" visually below the
   *     specified node, or null if there is none.
   */
  getNextNode(
    node = getFocusManager().getFocusedNode(),
  ): IFocusableNode | null {
    this.relativeNode = node;
    return this.getNextNodeImpl(node, NavigationDirection.NEXT);
  }

  /**
   * Returns the node to the right of the given node.
   *
   * @param node The node to navigate relative to, defaults to the currently
   *     focused node.
   * @returns The node to the right of the given node, within the same visual
   *     "row" as the given node, or null if there is none.
   */
  getInNode(node = getFocusManager().getFocusedNode()): IFocusableNode | null {
    this.relativeNode = node;
    return this.getNextNodeImpl(node, NavigationDirection.IN);
  }

  /**
   * Returns the previous sibling/parent node relative to the given node.
   *
   * @param node The node to navigate relative to.
   * @param direction The direction to navigate, either OUT or PREVIOUS.
   * @param visitedNodes Set of already-visited nodes used to avoid cycles,
   *     should not be specified by the caller.
   * @returns The previous sibling/parent node, or null if there is none or a
   *     node was not provided.
   */
  private getPreviousNodeImpl(
    node: IFocusableNode | null,
    direction: NavigationDirection.PREVIOUS | NavigationDirection.OUT,
    visitedNodes: Set<IFocusableNode> = new Set<IFocusableNode>(),
  ): IFocusableNode | null {
    if (
      !node ||
      visitedNodes.has(node) ||
      (!this.getNavigationLoops() && node === this.getFirstNode())
    ) {
      return null;
    }

    const newNode =
      this.getRightMostChild(this.getPreviousSibling(node), node) ||
      this.getParent(node);

    const isValid = this.getValidationFunction(direction);
    if (newNode && isValid(newNode)) return newNode;
    if (newNode) {
      visitedNodes.add(node);
      return this.getPreviousNodeImpl(newNode, direction, visitedNodes);
    }
    return null;
  }

  /**
   * Returns the next sibling/child node relative to the given node.
   *
   * @param node The node to navigate relative to.
   * @param direction The direction to navigate, either IN or NEXT.
   * @param visitedNodes Set of already-visited nodes used to avoid cycles,
   *     should not be specified by the caller.
   * @returns The next sibling/child node, or null if there is none or a
   *     node was not provided.
   */
  private getNextNodeImpl(
    node: IFocusableNode | null,
    direction: NavigationDirection.NEXT | NavigationDirection.IN,
    visitedNodes: Set<IFocusableNode> = new Set<IFocusableNode>(),
  ): IFocusableNode | null {
    if (!node || visitedNodes.has(node)) {
      return null;
    }

    let newNode = this.getFirstChild(node) || this.getNextSibling(node);

    let target = node;
    while (target && !newNode) {
      const parent = this.getParent(target);
      if (!parent) break;
      newNode = this.getNextSibling(parent);
      if (newNode === this.getFirstNode()) return null;
      target = parent;
    }

    const isValid = this.getValidationFunction(direction);
    if (newNode && isValid(newNode)) {
      return newNode;
    }
    if (newNode) {
      visitedNodes.add(node);
      return this.getNextNodeImpl(newNode, direction, visitedNodes);
    }

    return null;
  }

  private getRightMostChild(
    node: IFocusableNode | null,
    stopIfFound?: IFocusableNode,
  ): IFocusableNode | null {
    if (!node) return node;
    let newNode = this.getFirstChild(node);
    if (!newNode || newNode === stopIfFound) return node;
    for (
      let nextNode: IFocusableNode | null = newNode;
      nextNode;
      nextNode = this.getNextSibling(newNode)
    ) {
      if (nextNode === stopIfFound) break;
      newNode = nextNode;
    }
    return this.getRightMostChild(newNode, stopIfFound);
  }

  /**
   * Sets whether or not navigation should loop around when reaching the end
   * of the workspace.
   *
   * @param loops True if navigation should loop around, otherwise false.
   */
  setNavigationLoops(loops: boolean) {
    this.navigationLoops = loops;
  }

  /**
   * Returns whether or not navigation loops around when reaching the end of
   * the workspace.
   */
  getNavigationLoops(): boolean {
    return this.navigationLoops;
  }

  /**
   * Get the first navigable node on the workspace, or null if none exist.
   *
   * @returns The first navigable node on the workspace, or null.
   */
  getFirstNode(): IFocusableNode | null {
    const root = getFocusManager().getFocusedTree()?.getRootFocusableNode();
    if (!root) return null;

    return this.getFirstChild(root);
  }

  /**
   * Get the last navigable node on the workspace, or null if none exist.
   *
   * @returns The last navigable node on the workspace, or null.
   */
  getLastNode(): IFocusableNode | null {
    const first = this.getFirstNode();
    const oldLooping = this.getNavigationLoops();
    this.setNavigationLoops(true);
    const lastNode = this.getPreviousNode(first);
    this.setNavigationLoops(oldLooping);
    return lastNode;
  }

  /**
   * Returns a function that will be used to determine whether a candidate for
   * navigation is valid.
   *
   * @param direction The direction in which the user is navigating.
   * @returns A function that takes a proposed navigation candidate and returns
   *     true if navigation should be allowed to proceed to it, or false to find
   *     a different candidate.
   */
  getValidationFunction(
    direction: NavigationDirection,
  ): (node: IFocusableNode) => boolean {
    switch (direction) {
      case NavigationDirection.IN:
      case NavigationDirection.OUT:
        return (candidate: IFocusableNode) => {
          const candidateBlock = this.getSourceBlockFromNode(candidate);
          const currentBlock = this.getSourceBlockFromNode(this.relativeNode);

          // Preventing escaping the current block/comment/etc by:
          // Disallow moving from a node with a block to a non-block node (other than a block comment editor)
          // Disallow moving from a non-block node to a block node
          // Disallow moving to the workspace
          if (
            (currentBlock && !candidateBlock) ||
            (!currentBlock && candidateBlock) ||
            (candidate as unknown) === this.relativeNode?.getFocusableTree()
          ) {
            return false;
          }

          if (!candidateBlock || !currentBlock) return true;

          const currentParents = currentBlock.getOutputParents();
          const candidateParents = candidateBlock.getOutputParents();
          // If we're navigating from a block (or nested element) to a block
          // (or nested element), ensure that we're not crossing a statement
          // block boundary (i.e. moving to a next or previous block vertically)
          // by verifying that the two blocks in question are either the same
          // or have a common parent accessible only by traversing output
          // connections, meaning that they are part of the same row.
          return (
            (candidateParents as any).intersection(currentParents).size > 0
          );
        };
      case NavigationDirection.NEXT:
      case NavigationDirection.PREVIOUS:
        return (candidate: IFocusableNode | null) => {
          if (
            (candidate instanceof BlockSvg &&
              !candidate.outputConnection?.targetBlock()) ||
            candidate instanceof RenderedWorkspaceComment ||
            (candidate instanceof RenderedConnection &&
              (candidate.type === ConnectionType.NEXT_STATEMENT ||
                (candidate.type === ConnectionType.INPUT_VALUE &&
                  candidate.getSourceBlock().statementInputCount &&
                  candidate.getSourceBlock().inputList[0] !==
                    candidate.getParentInput())))
          ) {
            return true;
          }

          const currentNode = this.relativeNode;
          if (direction === NavigationDirection.PREVIOUS) {
            // Don't visit rightmost/nested blocks in statement blocks when
            // navigating to the previous block.
            if (
              currentNode instanceof RenderedConnection &&
              currentNode.type === ConnectionType.NEXT_STATEMENT &&
              !currentNode.getParentInput() &&
              candidate !== currentNode.getSourceBlock()
            ) {
              return false;
            }

            // Don't visit the first value/input block in a block with statement
            // inputs when navigating to the previous block. This is consistent
            // with the behavior when navigating to the next block and avoids
            // duplicative screen reader narration. Also don't visit value
            // blocks nested in non-statement inputs.
            if (
              candidate instanceof BlockSvg &&
              candidate.outputConnection?.targetConnection
            ) {
              const parentInput =
                candidate.outputConnection.targetConnection.getParentInput();
              if (
                !parentInput?.getSourceBlock().statementInputCount ||
                parentInput?.getSourceBlock().inputList[0] === parentInput
              ) {
                return false;
              }
            }
          }

          const currentBlock = this.getSourceBlockFromNode(currentNode);
          if (
            candidate instanceof BlockSvg &&
            currentBlock instanceof BlockSvg
          ) {
            // If the candidate's parent uses inline inputs, disallow the
            // candidate; it follows that it must be on the same row as its
            // parent.
            if (candidate.outputConnection?.targetBlock()?.getInputsInline()) {
              return false;
            }

            const candidateParents = candidate.getParents();
            // If the candidate block is an (in)direct child of the current
            // block, disallow it; it cannot be on a different row than the
            // current block.
            if (
              currentBlock === this.relativeNode &&
              candidateParents.has(currentBlock)
            ) {
              return false;
            }

            const currentParents = currentBlock.getParents();

            const sharedParents = (currentParents as any).intersection(
              candidateParents,
            );
            // Allow the candidate if it and the current block have no parents
            // in common, or if they have a shared parent with external inputs.
            const result =
              !sharedParents.size ||
              sharedParents
                .values()
                .some((block: BlockSvg) => !block.getInputsInline());
            return result;
          }

          return false;
        };
    }
  }

  /**
   * Returns the block that the given node is a child of.
   *
   * @returns The parent block of the node if any, otherwise null.
   */
  getSourceBlockFromNode(node: IFocusableNode | null): BlockSvg | null {
    if (node instanceof BlockSvg) {
      return node;
    } else if (node instanceof Field) {
      return node.getSourceBlock() as BlockSvg;
    } else if (node instanceof RenderedConnection) {
      return node.getSourceBlock();
    } else if (node instanceof Icon) {
      return node.getSourceBlock() as BlockSvg;
    }

    return null;
  }
}
