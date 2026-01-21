/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IFocusableNode} from '../interfaces/i_focusable_node.js';
import {Rect} from '../utils/rect.js';
import type {WorkspaceSvg} from '../workspace_svg.js';
import type {CommentView} from './comment_view.js';

/**
 * Button displayed on a comment's top bar.
 */
export abstract class CommentBarButton implements IFocusableNode {
  /**
   * SVG image displayed on this button.
   */
  protected abstract readonly icon: SVGImageElement;

  /**
   * Creates a new CommentBarButton instance.
   *
   * @param id The ID of this button's parent comment.
   * @param workspace The workspace this button's parent comment is on.
   * @param container An SVG group that this button should be a child of.
   */
  constructor(
    protected readonly id: string,
    protected readonly workspace: WorkspaceSvg,
    protected readonly container: SVGGElement,
    protected readonly commentView: CommentView,
  ) {}

  /**
   * Returns whether or not this button is currently visible.
   */
  isVisible(): boolean {
    return this.icon.checkVisibility();
  }

  /**
   * Returns the parent comment view of this comment bar button.
   */
  getCommentView(): CommentView {
    return this.commentView;
  }

  /** Adjusts the position of this button within its parent container. */
  abstract reposition(): void;

  /** Perform the action this button should take when it is acted on. */
  abstract performAction(e?: Event): void;

  /**
   * Returns the dimensions of this button in workspace coordinates.
   *
   * @param includeMargin True to include the margin when calculating the size.
   * @returns The size of this button.
   */
  getSize(includeMargin = false): Rect {
    const bounds = this.icon.getBBox();
    const rect = Rect.from(bounds);
    if (includeMargin) {
      const margin = this.getMargin();
      rect.left -= margin;
      rect.top -= margin;
      rect.bottom += margin;
      rect.right += margin;
    }
    return rect;
  }

  /** Returns the margin in workspace coordinates surrounding this button. */
  getMargin(): number {
    return (this.container.getBBox().height - this.icon.getBBox().height) / 2;
  }

  /** Returns a DOM element representing this button that can receive focus. */
  getFocusableElement() {
    return this.icon;
  }

  /** Returns the workspace this button is a child of. */
  getFocusableTree() {
    return this.workspace;
  }

  /** Called when this button's focusable DOM element gains focus. */
  onNodeFocus() {
    const commentView = this.getCommentView();
    const xy = commentView.getRelativeToSurfaceXY();
    const size = commentView.getSize();
    const bounds = new Rect(xy.y, xy.y + size.height, xy.x, xy.x + size.width);
    commentView.workspace.scrollBoundsIntoView(bounds);
  }

  /** Called when this button's focusable DOM element loses focus. */
  onNodeBlur() {}

  /** Returns whether this button can be focused. True if it is visible. */
  canBeFocused() {
    return this.isVisible();
  }
}
