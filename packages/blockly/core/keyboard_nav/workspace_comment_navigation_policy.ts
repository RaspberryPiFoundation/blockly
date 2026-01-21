/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {RenderedWorkspaceComment} from '../comments/rendered_workspace_comment.js';
import type {IFocusableNode} from '../interfaces/i_focusable_node.js';
import type {INavigationPolicy} from '../interfaces/i_navigation_policy.js';
import {navigateStacks} from './block_navigation_policy.js';

/**
 * Set of rules controlling keyboard navigation from an RenderedWorkspaceComment.
 */
export class WorkspaceCommentNavigationPolicy
  implements INavigationPolicy<RenderedWorkspaceComment>
{
  /**
   * Returns the first child of the given workspace comment.
   *
   * @param current The workspace comment to return the first child of.
   * @returns The first child button of the given comment.
   */
  getFirstChild(current: RenderedWorkspaceComment): IFocusableNode | null {
    return current.view.getCommentBarButtons()[0];
  }

  /**
   * Returns the parent of the given workspace comment.
   *
   * @param current The workspace comment to return the parent of.
   * @returns The parent workspace of the given comment.
   */
  getParent(current: RenderedWorkspaceComment): IFocusableNode | null {
    return current.workspace;
  }

  /**
   * Returns the next peer node of the given workspace comment.
   *
   * @param current The workspace comment to find the following element of.
   * @returns The next workspace comment or block stack, if any.
   */
  getNextSibling(current: RenderedWorkspaceComment): IFocusableNode | null {
    return navigateStacks(current, 1);
  }

  /**
   * Returns the previous peer node of the given workspace comment.
   *
   * @param current The workspace comment to find the preceding element of.
   * @returns The previous workspace comment or block stack, if any.
   */
  getPreviousSibling(current: RenderedWorkspaceComment): IFocusableNode | null {
    return navigateStacks(current, -1);
  }

  /**
   * Returns whether or not the given workspace comment can be navigated to.
   *
   * @param current The instance to check for navigability.
   * @returns True if the given workspace comment can be focused.
   */
  isNavigable(current: RenderedWorkspaceComment): boolean {
    return current.canBeFocused();
  }

  /**
   * Returns whether the given object can be navigated from by this policy.
   *
   * @param current The object to check if this policy applies to.
   * @returns True if the object is an RenderedWorkspaceComment.
   */
  isApplicable(current: any): current is RenderedWorkspaceComment {
    return current instanceof RenderedWorkspaceComment;
  }
}
