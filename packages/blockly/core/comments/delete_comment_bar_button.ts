/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as browserEvents from '../browser_events.js';
import {getFocusManager} from '../focus_manager.js';
import * as touch from '../touch.js';
import * as dom from '../utils/dom.js';
import {Svg} from '../utils/svg.js';
import type {WorkspaceSvg} from '../workspace_svg.js';
import {CommentBarButton} from './comment_bar_button.js';
import type {CommentView} from './comment_view.js';

/**
 * Magic string appended to the comment ID to create a unique ID for this button.
 */
export const COMMENT_DELETE_BAR_BUTTON_FOCUS_IDENTIFIER = '_delete_bar_button';

/**
 * Button that deletes a comment.
 */
export class DeleteCommentBarButton extends CommentBarButton {
  /**
   * Opaque ID used to unbind event handlers during disposal.
   */
  private readonly bindId: browserEvents.Data;

  /**
   * SVG image displayed on this button.
   */
  protected override readonly icon: SVGImageElement;

  /**
   * Creates a new DeleteCommentBarButton instance.
   *
   * @param id The ID of this button's parent comment.
   * @param workspace The workspace this button's parent comment is shown on.
   * @param container An SVG group that this button should be a child of.
   */
  constructor(
    protected readonly id: string,
    protected readonly workspace: WorkspaceSvg,
    protected readonly container: SVGGElement,
    protected readonly commentView: CommentView,
  ) {
    super(id, workspace, container, commentView);

    this.icon = dom.createSvgElement(
      Svg.IMAGE,
      {
        'class': 'blocklyDeleteIcon',
        'href': `${this.workspace.options.pathToMedia}delete-icon.svg`,
        'id': `${this.id}${COMMENT_DELETE_BAR_BUTTON_FOCUS_IDENTIFIER}`,
      },
      container,
    );
    this.bindId = browserEvents.conditionalBind(
      this.icon,
      'pointerdown',
      this,
      this.performAction.bind(this),
    );
  }

  /**
   * Disposes of this button.
   */
  dispose() {
    browserEvents.unbind(this.bindId);
  }

  /**
   * Adjusts the positioning of this button within its container.
   */
  override reposition() {
    const margin = this.getMargin();
    // Reset to 0 so that our position doesn't force the parent container to
    // grow.
    this.icon.setAttribute('x', `0`);
    const containerSize = this.container.getBBox();
    this.icon.setAttribute('y', `${margin}`);
    this.icon.setAttribute(
      'x',
      `${containerSize.width - this.getSize(true).getWidth()}`,
    );
  }

  /**
   * Deletes parent comment.
   *
   * @param e The event that triggered this action.
   */
  override performAction(e?: Event) {
    touch.clearTouchIdentifier();
    if (e && e instanceof PointerEvent && browserEvents.isRightButton(e)) {
      e.stopPropagation();
      return;
    }

    this.getCommentView().dispose();
    e?.stopPropagation();
    getFocusManager().focusNode(this.workspace);
  }
}
