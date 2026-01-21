/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Events fired when a workspace comment is dragged.
 */

import type {WorkspaceComment} from '../comments/workspace_comment.js';
import * as registry from '../registry.js';
import {Workspace} from '../workspace.js';
import {AbstractEventJson} from './events_abstract.js';
import {UiBase} from './events_ui_base.js';
import {EventType} from './type.js';

/**
 * Notifies listeners when a comment is being manually dragged/dropped.
 */
export class CommentDrag extends UiBase {
  /** The ID of the top-level comment being dragged. */
  commentId?: string;

  /** True if this is the start of a drag, false if this is the end of one. */
  isStart?: boolean;

  override type = EventType.COMMENT_DRAG;

  /**
   * @param opt_comment The comment that is being dragged.
   *     Undefined for a blank event.
   * @param opt_isStart Whether this is the start of a comment drag.
   *    Undefined for a blank event.
   */
  constructor(opt_comment?: WorkspaceComment, opt_isStart?: boolean) {
    const workspaceId = opt_comment ? opt_comment.workspace.id : undefined;
    super(workspaceId);
    if (!opt_comment) return;

    this.commentId = opt_comment.id;
    this.isStart = opt_isStart;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): CommentDragJson {
    const json = super.toJson() as CommentDragJson;
    if (this.isStart === undefined) {
      throw new Error(
        'Whether this event is the start of a drag is undefined. ' +
          'Either pass the value to the constructor, or call fromJson',
      );
    }
    if (this.commentId === undefined) {
      throw new Error(
        'The comment ID is undefined. Either pass a comment to ' +
          'the constructor, or call fromJson',
      );
    }
    json['isStart'] = this.isStart;
    json['commentId'] = this.commentId;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of CommentDrag, but we can't specify that due to the fact that parameters
   *     to static methods in subclasses must be supertypes of parameters to
   *     static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: CommentDragJson,
    workspace: Workspace,
    event?: any,
  ): CommentDrag {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new CommentDrag(),
    ) as CommentDrag;
    newEvent.isStart = json['isStart'];
    newEvent.commentId = json['commentId'];
    return newEvent;
  }
}

export interface CommentDragJson extends AbstractEventJson {
  isStart: boolean;
  commentId: string;
}

registry.register(registry.Type.EVENT, EventType.COMMENT_DRAG, CommentDrag);
