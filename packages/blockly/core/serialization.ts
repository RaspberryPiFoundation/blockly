/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Serialization methods.
 */
// Former goog.module ID: Blockly.serialization

import {ISerializer} from './interfaces/i_serializer.js';
import * as blocks from './serialization/blocks.js';
import * as exceptions from './serialization/exceptions.js';
import * as priorities from './serialization/priorities.js';
import * as procedures from './serialization/procedures.js';
import * as registry from './serialization/registry.js';
import * as variables from './serialization/variables.js';
import * as workspaceComments from './serialization/workspace_comments.js';
import * as workspaces from './serialization/workspaces.js';

export {
  blocks,
  exceptions,
  ISerializer,
  priorities,
  procedures,
  registry,
  variables,
  workspaceComments,
  workspaces,
};
