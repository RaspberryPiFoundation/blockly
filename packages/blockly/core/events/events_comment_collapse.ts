/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {WorkspaceComment} from '../comments/workspace_comment.js';
import * as registry from '../registry.js';
import type {Workspace} from '../workspace.js';
import {CommentBase, CommentBaseJson} from './events_comment_base.js';
import {EventType} from './type.js';

export class CommentCollapse extends CommentBase {
  override type = EventType.COMMENT_COLLAPSE;

  constructor(
    comment?: WorkspaceComment,
    public newCollapsed?: boolean,
  ) {
    super(comment);

    if (!comment) {
      return; // Blank event to be populated by fromJson.
    }
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): CommentCollapseJson {
    const json = super.toJson() as CommentCollapseJson;
    if (this.newCollapsed === undefined) {
      throw new Error(
        'The new collapse value undefined. Either call recordNew, or ' +
          'call fromJson',
      );
    }
    json['newCollapsed'] = this.newCollapsed;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of CommentCollapse, but we can't specify that due to the fact that
   *     parameters to static methods in subclasses must be supertypes of
   *     parameters to static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: CommentCollapseJson,
    workspace: Workspace,
    event?: any,
  ): CommentCollapse {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new CommentCollapse(),
    ) as CommentCollapse;
    newEvent.newCollapsed = json.newCollapsed;
    return newEvent;
  }

  /**
   * Run a collapse event.
   *
   * @param forward True if run forward, false if run backward (undo).
   */
  override run(forward: boolean) {
    const workspace = this.getEventWorkspace_();
    if (!this.commentId) {
      throw new Error(
        'The comment ID is undefined. Either pass a comment to ' +
          'the constructor, or call fromJson',
      );
    }
    // TODO: Remove cast when we update getCommentById.
    const comment = workspace.getCommentById(
      this.commentId,
    ) as unknown as WorkspaceComment;
    if (!comment) {
      console.warn(
        "Can't collapse or uncollapse non-existent comment: " + this.commentId,
      );
      return;
    }

    comment.setCollapsed(forward ? !!this.newCollapsed : !this.newCollapsed);
  }
}

export interface CommentCollapseJson extends CommentBaseJson {
  newCollapsed: boolean;
}

registry.register(
  registry.Type.EVENT,
  EventType.COMMENT_COLLAPSE,
  CommentCollapse,
);
