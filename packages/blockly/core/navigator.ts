/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IFocusableNode} from './interfaces/i_focusable_node.js';
import type {INavigationPolicy} from './interfaces/i_navigation_policy.js';
import {BlockCommentNavigationPolicy} from './keyboard_nav/block_comment_navigation_policy.js';
import {BlockNavigationPolicy} from './keyboard_nav/block_navigation_policy.js';
import {CommentBarButtonNavigationPolicy} from './keyboard_nav/comment_bar_button_navigation_policy.js';
import {CommentEditorNavigationPolicy} from './keyboard_nav/comment_editor_navigation_policy.js';
import {ConnectionNavigationPolicy} from './keyboard_nav/connection_navigation_policy.js';
import {FieldNavigationPolicy} from './keyboard_nav/field_navigation_policy.js';
import {IconNavigationPolicy} from './keyboard_nav/icon_navigation_policy.js';
import {WorkspaceCommentNavigationPolicy} from './keyboard_nav/workspace_comment_navigation_policy.js';
import {WorkspaceNavigationPolicy} from './keyboard_nav/workspace_navigation_policy.js';

type RuleList<T> = INavigationPolicy<T>[];

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
}
