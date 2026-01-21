/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.serialization.ISerializer

import type {Workspace} from '../workspace.js';

/**
 * Serializes and deserializes a plugin or system.
 */
export interface ISerializer {
  /**
   * A priority value used to determine the order of deserializing state.
   * More positive priorities are deserialized before less positive
   * priorities. Eg if you have priorities (0, -10, 10, 100) the order of
   * deserialiation will be (100, 10, 0, -10).
   * If two serializers have the same priority, they are deserialized in an
   * arbitrary order relative to each other.
   */
  priority: number;

  /**
   * Saves the state of the plugin or system.
   *
   * @param workspace The workspace the system to serialize is associated with.
   * @returns A JS object containing the system's state, or null if there is no
   *     state to record.
   */
  save(workspace: Workspace): object | null;

  /**
   * Loads the state of the plugin or system.
   *
   * @param state The state of the system to deserialize. This will always be
   *     non-null.
   * @param workspace The workspace the system to deserialize is associated
   *     with.
   */
  load(state: object, workspace: Workspace): void;

  /**
   * Clears the state of the plugin or system.
   *
   * @param workspace The workspace the system to clear the state of is
   *     associated with.
   */
  clear(workspace: Workspace): void;
}
