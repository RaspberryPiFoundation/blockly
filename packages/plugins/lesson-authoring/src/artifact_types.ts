/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Blockly from 'blockly/core';

export type WorkspaceState = ReturnType<
  typeof Blockly.serialization.workspaces.save
>;

/** Names a lesson refers to that the host must provide. */
export interface LessonRequirements {
  blockTypes: string[];
  // Later, needed:
  // dynamicCategories?: string[];  // toolbox `custom` values
  // categoryStyles?: string[];     // `categorystyle` names
  // buttonCallbacks?: string[];    // button `callbackKey`s
}

export interface LessonArtifact {
  title: string;
  toolbox: Blockly.utils.toolbox.ToolboxInfo;
  initialWorkspaceState: WorkspaceState;
}
