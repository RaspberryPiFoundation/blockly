/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {CommentEditor} from '../comments/comment_editor.js';
import type {IFocusableNode} from '../interfaces/i_focusable_node.js';
import type {INavigationPolicy} from '../interfaces/i_navigation_policy.js';

/**
 * Set of rules controlling keyboard navigation from a comment editor.
 * This is a no-op placeholder (other than isNavigable/isApplicable) since
 * comment editors handle their own navigation when editing ends.
 */
export class CommentEditorNavigationPolicy
  implements INavigationPolicy<CommentEditor>
{
  getFirstChild(_current: CommentEditor): IFocusableNode | null {
    return null;
  }

  getParent(_current: CommentEditor): IFocusableNode | null {
    return null;
  }

  getNextSibling(_current: CommentEditor): IFocusableNode | null {
    return null;
  }

  getPreviousSibling(_current: CommentEditor): IFocusableNode | null {
    return null;
  }

  /**
   * Returns whether or not the given comment editor can be navigated to.
   *
   * @param current The instance to check for navigability.
   * @returns False.
   */
  isNavigable(current: CommentEditor): boolean {
    return current.canBeFocused();
  }

  /**
   * Returns whether the given object can be navigated from by this policy.
   *
   * @param current The object to check if this policy applies to.
   * @returns True if the object is a CommentEditor.
   */
  isApplicable(current: any): current is CommentEditor {
    return current instanceof CommentEditor;
  }
}
