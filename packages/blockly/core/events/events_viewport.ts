/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Events fired as a result of a viewport change.
 *
 * @class
 */
// Former goog.module ID: Blockly.Events.ViewportChange

import * as registry from '../registry.js';
import type {Workspace} from '../workspace.js';
import {AbstractEventJson} from './events_abstract.js';
import {UiBase} from './events_ui_base.js';
import {EventType} from './type.js';

/**
 * Notifies listeners that the workspace surface's position or scale has
 * changed.
 *
 * Does not notify when the workspace itself resizes.
 */
export class ViewportChange extends UiBase {
  /**
   * Top edge of the visible portion of the workspace, relative to the
   * workspace origin.
   */
  viewTop?: number;

  /**
   * The left edge of the visible portion of the workspace, relative to
   * the workspace origin.
   */
  viewLeft?: number;

  /** The scale of the workpace. */
  scale?: number;

  /** The previous scale of the workspace. */
  oldScale?: number;

  override type = EventType.VIEWPORT_CHANGE;

  /**
   * @param opt_top Top-edge of the visible portion of the workspace, relative
   *     to the workspace origin. Undefined for a blank event.
   * @param opt_left Left-edge of the visible portion of the workspace relative
   *     to the workspace origin. Undefined for a blank event.
   * @param opt_scale The scale of the workspace. Undefined for a blank event.
   * @param opt_workspaceId The workspace identifier for this event.
   *    Undefined for a blank event.
   * @param opt_oldScale The old scale of the workspace. Undefined for a blank
   *     event.
   */
  constructor(
    opt_top?: number,
    opt_left?: number,
    opt_scale?: number,
    opt_workspaceId?: string,
    opt_oldScale?: number,
  ) {
    super(opt_workspaceId);

    this.viewTop = opt_top;
    this.viewLeft = opt_left;
    this.scale = opt_scale;
    this.oldScale = opt_oldScale;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): ViewportChangeJson {
    const json = super.toJson() as ViewportChangeJson;
    if (this.viewTop === undefined) {
      throw new Error(
        'The view top is undefined. Either pass a value to ' +
          'the constructor, or call fromJson',
      );
    }
    if (this.viewLeft === undefined) {
      throw new Error(
        'The view left is undefined. Either pass a value to ' +
          'the constructor, or call fromJson',
      );
    }
    if (this.scale === undefined) {
      throw new Error(
        'The scale is undefined. Either pass a value to ' +
          'the constructor, or call fromJson',
      );
    }
    if (this.oldScale === undefined) {
      throw new Error(
        'The old scale is undefined. Either pass a value to ' +
          'the constructor, or call fromJson',
      );
    }
    json['viewTop'] = this.viewTop;
    json['viewLeft'] = this.viewLeft;
    json['scale'] = this.scale;
    json['oldScale'] = this.oldScale;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of Viewport, but we can't specify that due to the fact that parameters
   *     to static methods in subclasses must be supertypes of parameters to
   *     static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: ViewportChangeJson,
    workspace: Workspace,
    event?: any,
  ): ViewportChange {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new ViewportChange(),
    ) as ViewportChange;
    newEvent.viewTop = json['viewTop'];
    newEvent.viewLeft = json['viewLeft'];
    newEvent.scale = json['scale'];
    newEvent.oldScale = json['oldScale'];
    return newEvent;
  }
}

export interface ViewportChangeJson extends AbstractEventJson {
  viewTop: number;
  viewLeft: number;
  scale: number;
  oldScale: number;
}

registry.register(
  registry.Type.EVENT,
  EventType.VIEWPORT_CHANGE,
  ViewportChange,
);
