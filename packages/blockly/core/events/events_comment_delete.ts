/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Class for comment deletion event.
 *
 * @class
 */
// Former goog.module ID: Blockly.Events.CommentDelete

import type {WorkspaceComment} from '../comments/workspace_comment.js';
import * as registry from '../registry.js';
import * as comments from '../serialization/workspace_comments.js';
import * as utilsXml from '../utils/xml.js';
import type {Workspace} from '../workspace.js';
import * as Xml from '../xml.js';
import {CommentBase, CommentBaseJson} from './events_comment_base.js';
import {EventType} from './type.js';

/**
 * Notifies listeners that a workspace comment has been deleted.
 */
export class CommentDelete extends CommentBase {
  override type = EventType.COMMENT_DELETE;

  /** The XML representation of the deleted workspace comment. */
  xml?: Element;

  /** The JSON representation of the created workspace comment. */
  json?: comments.State;

  /**
   * @param opt_comment The deleted comment.
   *     Undefined for a blank event.
   */
  constructor(opt_comment?: WorkspaceComment) {
    super(opt_comment);

    if (!opt_comment) {
      return; // Blank event to be populated by fromJson.
    }

    this.xml = Xml.saveWorkspaceComment(opt_comment);
    this.json = comments.save(opt_comment, {addCoordinates: true});
  }

  /**
   * Run a creation event.
   *
   * @param forward True if run forward, false if run backward (undo).
   */
  override run(forward: boolean) {
    CommentBase.CommentCreateDeleteHelper(this, !forward);
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): CommentDeleteJson {
    const json = super.toJson() as CommentDeleteJson;
    if (!this.xml) {
      throw new Error(
        'The comment XML is undefined. Either pass a comment to ' +
          'the constructor, or call fromJson',
      );
    }
    if (!this.json) {
      throw new Error(
        'The comment JSON is undefined. Either pass a block to ' +
          'the constructor, or call fromJson',
      );
    }
    json['xml'] = Xml.domToText(this.xml);
    json['json'] = this.json;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of CommentDelete, but we can't specify that due to the fact that
   *     parameters to static methods in subclasses must be supertypes of
   *     parameters to static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: CommentDeleteJson,
    workspace: Workspace,
    event?: any,
  ): CommentDelete {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new CommentDelete(),
    ) as CommentDelete;
    newEvent.xml = utilsXml.textToDom(json['xml']);
    newEvent.json = json['json'];
    return newEvent;
  }
}

export interface CommentDeleteJson extends CommentBaseJson {
  xml: string;
  json: object;
}

registry.register(registry.Type.EVENT, EventType.COMMENT_DELETE, CommentDelete);
