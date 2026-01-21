/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IFocusableTree} from './i_focusable_tree.js';

/** Represents anything that can have input focus. */
export interface IFocusableNode {
  /**
   * Returns the DOM element that can be explicitly requested to receive focus.
   *
   * IMPORTANT: Please note that this element is expected to have a visual
   * presence on the page as it will both be explicitly focused and have its
   * style changed depending on its current focus state (i.e. blurred, actively
   * focused, and passively focused). The element will have one of two styles
   * attached (where no style indicates blurred/not focused):
   * - blocklyActiveFocus
   * - blocklyPassiveFocus
   *
   * The returned element must also have a valid ID specified, and this ID
   * should be unique across the entire page. Failing to have a properly unique
   * ID could result in trying to focus one node (such as via a mouse click)
   * leading to another node with the same ID actually becoming focused by
   * FocusManager.
   *
   * The returned element must be visible if the node is ever focused via
   * FocusManager.focusNode() or FocusManager.focusTree(). It's allowed for an
   * element to be hidden until onNodeFocus() is called, or become hidden with a
   * call to onNodeBlur().
   *
   * It's expected the actual returned element will not change for the lifetime
   * of the node (that is, its properties can change but a new element should
   * never be returned). Also, the returned element will have its tabindex
   * overwritten throughout the lifecycle of this node and FocusManager.
   *
   * If a node requires the ability to be focused directly without first being
   * focused via FocusManager then it must set its own tab index.
   *
   * @returns The HTMLElement or SVGElement which can both receive focus and be
   *     visually represented as actively or passively focused for this node.
   */
  getFocusableElement(): HTMLElement | SVGElement;

  /**
   * Returns the closest parent tree of this node (in cases where a tree has
   * distinct trees underneath it), which represents the tree to which this node
   * belongs.
   *
   * @returns The node's IFocusableTree.
   */
  getFocusableTree(): IFocusableTree;

  /**
   * Called when this node receives active focus.
   *
   * Note that it's fine for implementations to change visibility modifiers, but
   * they should avoid the following:
   * - Creating or removing DOM elements (including via the renderer or drawer).
   * - Affecting focus via DOM focus() calls or the FocusManager.
   *
   * Implementations may consider scrolling themselves into view here; that is
   * not handled by the focus manager.
   */
  onNodeFocus(): void;

  /**
   * Called when this node loses active focus. It may still have passive focus.
   *
   * This has the same implementation restrictions as onNodeFocus().
   */
  onNodeBlur(): void;

  /**
   * Indicates whether this node allows focus. If this returns false then none
   * of the other IFocusableNode methods will be called.
   *
   * Note that special care must be taken if implementations of this function
   * dynamically change their return value value over the lifetime of the node
   * as certain environment conditions could affect the focusability of this
   * node's DOM element (such as whether the element has a positive or zero
   * tabindex). Also, changing from a true to a false value while the node holds
   * focus will not immediately change the current focus of the node nor
   * FocusManager's internal state, and thus may result in some of the node's
   * functions being called later on when defocused (since it was previously
   * considered focusable at the time of being focused).
   *
   * Implementations should generally always return true here unless there are
   * circumstances under which this node should be skipped for focus
   * considerations. Examples may include being disabled, read-only, a purely
   * visual decoration, or a node with no visual representation that must
   * implement this interface (e.g. due to a parent interface extending it).
   * Keep in mind accessibility best practices when determining whether a node
   * should be focusable since even disabled and read-only elements are still
   * often relevant to providing organizational context to users (particularly
   * when using a screen reader).
   *
   * @returns Whether this node can be focused by FocusManager.
   */
  canBeFocused(): boolean;
}

/**
 * Determines whether the provided object fulfills the contract of
 * IFocusableNode.
 *
 * @param obj The object to test.
 * @returns Whether the provided object can be used as an IFocusableNode.
 */
export function isFocusableNode(obj: any): obj is IFocusableNode {
  return (
    obj &&
    typeof obj.getFocusableElement === 'function' &&
    typeof obj.getFocusableTree === 'function' &&
    typeof obj.onNodeFocus === 'function' &&
    typeof obj.onNodeBlur === 'function' &&
    typeof obj.canBeFocused === 'function'
  );
}
