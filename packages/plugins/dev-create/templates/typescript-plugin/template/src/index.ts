/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Edit plugin overview.
/**
 * @fileoverview Plugin overview.
 */
import * as Blockly from 'blockly/core';

// TODO: Rename plugin and edit plugin description.
/**
 * Plugin description.
 */
export class Plugin {
  /** The workspace. */
  protected workspace: Blockly.WorkspaceSvg;
  /**
   * Constructor for ...
   *
   * @param workspace The workspace that the plugin will
   *     be added to.
   */
  constructor(workspace: Blockly.WorkspaceSvg) {
    this.workspace = workspace;
  }

  /**
   * Initialize.
   */
  init(): void {
    // TODO: Add initialization code.
  }
}
