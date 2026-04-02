/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {BlockSvg} from '../../block_svg.js';
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
    if (!this.isNavigable(result)) {
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
    if (!this.isNavigable(result)) return this.getParent(result);
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
    if (!this.isNavigable(result)) {
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
    if (!this.isNavigable(result)) {
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
    if (!node) return null;

    let previous = this.getPreviousNodeImpl(
      node,
      node,
      NavigationDirection.PREVIOUS,
    );

    // If the previous node is the root focusable tree or null, we need to
    // traverse stacks of top-level items on the tree. Since we're going
    // backwards to the previous stack, we actually want the last node in the
    // stack (most adjacent to the current node) rather than the root of the
    // stack.
    if (!previous || (previous as any) === node.getFocusableTree()) {
      const stackRoot = this.navigateStacks(node, -1);
      if (!stackRoot) return null;
      previous = this.getLastNodeInStack(stackRoot, node);
    }

    return this.getLeftmostSibling(previous);
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
    // Special case: blocks and input value connections on blocks with external
    // inputs should always navigate to the parent block, even though they're
    // not necessarily on the same visual row.
    const connection =
      node instanceof BlockSvg
        ? node.outputConnection?.targetConnection
        : node instanceof RenderedConnection &&
            node.type === ConnectionType.INPUT_VALUE
          ? node
          : null;
    if (
      connection &&
      !connection.getSourceBlock().getInputsInline() &&
      connection !== connection.getSourceBlock().inputList[0].connection
    ) {
      return connection.getSourceBlock();
    }

    return this.getPreviousNodeImpl(node, node, NavigationDirection.OUT);
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
    const next = this.getNextNodeImpl(node, node, NavigationDirection.NEXT);

    if (node && next === null) {
      return this.navigateStacks(node, 1);
    }

    return next;
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
    return this.getNextNodeImpl(node, node, NavigationDirection.IN);
  }

  /**
   * Returns the previous sibling/parent node relative to the given node.
   *
   * @param startNode The node that navigation is starting from.
   * @param node The node to navigate relative to.
   * @param direction The direction to navigate, either OUT or PREVIOUS.
   * @param visitedNodes Set of already-visited nodes used to avoid cycles,
   *     should not be specified by the caller.
   * @returns The previous sibling/parent node, or null if there is none or a
   *     node was not provided.
   */
  private getPreviousNodeImpl(
    startNode: IFocusableNode | null,
    node: IFocusableNode | null,
    direction: NavigationDirection.PREVIOUS | NavigationDirection.OUT,
    visitedNodes: Set<IFocusableNode> = new Set<IFocusableNode>(),
  ): IFocusableNode | null {
    if (!node || !startNode || visitedNodes.has(node)) {
      return null;
    }

    const newNode =
      this.getRightMostChild(this.getPreviousSibling(node), node) ||
      this.getParent(node);

    if (newNode && this.transitionAllowed(startNode, newNode, direction)) {
      return newNode;
    }

    if (newNode) {
      visitedNodes.add(node);
      return this.getPreviousNodeImpl(
        startNode,
        newNode,
        direction,
        visitedNodes,
      );
    }
    return null;
  }

  /**
   * Returns the next sibling/child node relative to the given node.
   *
   * @param startNode The node that navigation is starting from.
   * @param node The node to navigate relative to.
   * @param direction The direction to navigate, either IN or NEXT.
   * @param visitedNodes Set of already-visited nodes used to avoid cycles,
   *     should not be specified by the caller.
   * @returns The next sibling/child node, or null if there is none or a
   *     node was not provided.
   */
  private getNextNodeImpl(
    startNode: IFocusableNode | null,
    node: IFocusableNode | null,
    direction: NavigationDirection.NEXT | NavigationDirection.IN,
    visitedNodes: Set<IFocusableNode> = new Set<IFocusableNode>(),
  ): IFocusableNode | null {
    if (!node || !startNode || visitedNodes.has(node)) {
      return null;
    }

    let newNode = this.getFirstChild(node) || this.getNextSibling(node);

    let target = node;
    while (target && !newNode) {
      const parent = this.getParent(target);
      if (!parent) break;
      newNode = this.getNextSibling(parent);
      target = parent;
    }

    if (newNode && this.transitionAllowed(startNode, newNode, direction)) {
      return newNode;
    }
    if (newNode) {
      visitedNodes.add(node);
      return this.getNextNodeImpl(startNode, newNode, direction, visitedNodes);
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
   * Determines whether navigation is allowed between two nodes.
   *
   * @param current The starting node for proposed navigation.
   * @param candidate The proposed destination node.
   * @param direction The direction in which the user is navigating.
   * @returns True if navigation should be allowed to proceed, or false to find
   *     a different candidate.
   */
  protected transitionAllowed(
    current: IFocusableNode,
    candidate: IFocusableNode,
    direction: NavigationDirection,
  ) {
    switch (direction) {
      case NavigationDirection.IN:
      case NavigationDirection.OUT:
        return this.getRowId(current) === this.getRowId(candidate);
      case NavigationDirection.NEXT:
      case NavigationDirection.PREVIOUS:
        return this.getRowId(current) !== this.getRowId(candidate);
    }
  }

  /**
   * Returns the leftmost node in the same row as the given node.
   *
   * @param node The node to find the leftmost sibling of.
   * @returns The leftmost sibling of the given node in the same row.
   */
  private getLeftmostSibling(node: IFocusableNode | null) {
    if (!node) return null;

    let left = node;
    let temp;
    while (
      (temp = this.getPreviousNodeImpl(left, left, NavigationDirection.OUT))
    ) {
      left = temp;
    }

    return left;
  }

  /**
   * Returns the last node in a stack of blocks or other top-level workspace
   * entity.
   *
   * @param stackRoot A top-level item to get the last node of.
   * @param stopIfFound A sentinel node that terminates traversal if
   *     encountered; typically the root node of the next stack.
   * @returns The last node in the given stack.
   */
  private getLastNodeInStack(
    stackRoot: IFocusableNode,
    stopIfFound: IFocusableNode,
  ) {
    let target = stackRoot;
    let temp;
    while (
      (temp = this.getNextNodeImpl(target, target, NavigationDirection.NEXT)) &&
      temp !== stopIfFound
    ) {
      target = temp;
    }

    return target;
  }

  private getRowId(node: IFocusableNode) {
    return this.get(node)?.getRowId(node);
  }

  /**
   * Returns the next/previous stack relative to the given element's stack.
   *
   * @internal
   * @param current The element whose stack will be navigated relative to.
   * @param delta The difference in index to navigate; positive values navigate
   *     to the nth next stack, while negative values navigate to the nth
   *     previous stack.
   * @returns The first element in the stack offset by `delta` relative to the
   *     current element's stack, or the last element in the stack offset by
   * `delta` relative to the current element's stack when navigating backwards.
   */
  navigateStacks(current: IFocusableNode, delta: number) {
    const stacks = this.getTopLevelItems(current);
    const root =
      this.getSourceBlockFromNode(current)?.getRootBlock() ?? current;
    const currentIndex = stacks.indexOf(root);
    const targetIndex = currentIndex + delta;
    let result: IFocusableNode | null = null;
    if (targetIndex >= 0 && targetIndex < stacks.length) {
      result = stacks[targetIndex];
    } else if (targetIndex < 0 && this.getNavigationLoops()) {
      result = stacks[stacks.length - 1];
    } else if (targetIndex >= stacks.length && this.getNavigationLoops()) {
      result = stacks[0];
    }

    return result;
  }

  /**
   * Returns a list of all top-level focusable items on the given node's
   * focusable tree.
   *
   * @param current The node whose root focusable tree to retrieve the top-level
   *     items of.
   * @returns A list of all top-level items on the given node's parent tree.
   */
  protected getTopLevelItems(current: IFocusableNode): IFocusableNode[] {
    const workspace = current.getFocusableTree();
    return (workspace as any).getTopBoundedElements(true);
  }

  /**
   * Returns whether or not the given node is navigable.
   *
   * @param node A focusable node to check the navigability of.
   * @returns True if the node is navigable, otherwise false.
   */
  protected isNavigable(node: IFocusableNode) {
    return this.get(node)?.isNavigable(node);
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
