/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Events fired as a result of a theme update.
 *
 * @class
 */
// Former goog.module ID: Blockly.Events.ThemeChange

import * as registry from '../registry.js';
import type {Workspace} from '../workspace.js';
import {AbstractEventJson} from './events_abstract.js';
import {UiBase} from './events_ui_base.js';
import {EventType} from './type.js';

/**
 * Notifies listeners that the workspace theme has changed.
 */
export class ThemeChange extends UiBase {
  /** The name of the new theme that has been set. */
  themeName?: string;

  override type = EventType.THEME_CHANGE;

  /**
   * @param opt_themeName The theme name. Undefined for a blank event.
   * @param opt_workspaceId The workspace identifier for this event.
   *    event. Undefined for a blank event.
   */
  constructor(opt_themeName?: string, opt_workspaceId?: string) {
    super(opt_workspaceId);
    this.themeName = opt_themeName;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  override toJson(): ThemeChangeJson {
    const json = super.toJson() as ThemeChangeJson;
    if (!this.themeName) {
      throw new Error(
        'The theme name is undefined. Either pass a theme name to ' +
          'the constructor, or call fromJson',
      );
    }
    json['themeName'] = this.themeName;
    return json;
  }

  /**
   * Deserializes the JSON event.
   *
   * @param event The event to append new properties to. Should be a subclass
   *     of ThemeChange, but we can't specify that due to the fact that
   *     parameters to static methods in subclasses must be supertypes of
   *     parameters to static methods in superclasses.
   * @internal
   */
  static fromJson(
    json: ThemeChangeJson,
    workspace: Workspace,
    event?: any,
  ): ThemeChange {
    const newEvent = super.fromJson(
      json,
      workspace,
      event ?? new ThemeChange(),
    ) as ThemeChange;
    newEvent.themeName = json['themeName'];
    return newEvent;
  }
}

export interface ThemeChangeJson extends AbstractEventJson {
  themeName: string;
}

registry.register(registry.Type.EVENT, EventType.THEME_CHANGE, ThemeChange);
