/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.serialization.exceptions

import type {Block} from '../block.js';
import type {State} from './blocks.js';

export class DeserializationError extends Error {}

/**
 * Represents an error where the serialized state is expected to provide a
 * block type, but it is not provided.
 *
 */
export class MissingBlockType extends DeserializationError {
  /**
   * @param state The state object which is missing the block type.
   * @internal
   */
  constructor(public state: State) {
    super(`Expected to find a 'type' property, defining the block type`);
  }
}

/**
 * Represents an error where deserialization encountered a block that did
 * not have a connection that was defined in the serialized state.
 */
export class MissingConnection extends DeserializationError {
  /**
   * @param connection The name of the connection that is missing. E.g.
   *     'IF0', or 'next'.
   * @param block The block missing the connection.
   * @param state The state object containing the bad connection.
   * @internal
   */
  constructor(
    connection: string,
    public block: Block,
    public state: State,
  ) {
    super(`The block ${block.toDevString()} is missing a(n) ${connection}
connection`);
  }
}

/**
 * Represents an error where deserialization tried to connect two connections
 * that were not compatible.
 */
export class BadConnectionCheck extends DeserializationError {
  /**
   * @param reason The reason the connections were not compatible.
   * @param childConnection The name of the incompatible child connection. E.g.
   *     'output' or 'previous'.
   * @param childBlock The child block that could not connect to its parent.
   * @param childState The state object representing the child block.
   * @internal
   */
  constructor(
    reason: string,
    childConnection: string,
    public childBlock: Block,
    public childState: State,
  ) {
    super(`The block ${childBlock.toDevString()} could not connect its
${childConnection} to its parent, because: ${reason}`);
  }
}

/**
 * Represents an error where deserialization encountered a real block as it
 * was deserializing children of a shadow.
 * This is an error because it is an invariant of Blockly that shadow blocks
 * do not have real children.
 */
export class RealChildOfShadow extends DeserializationError {
  /**
   * @param state The state object representing the real block.
   * @internal
   */
  constructor(public state: State) {
    super(`Encountered a real block which is defined as a child of a shadow
block. It is an invariant of Blockly that shadow blocks only have shadow
children`);
  }
}

export class UnregisteredIcon extends DeserializationError {
  /**
   * @param iconType The type of the unregistered icon we are attempting to
   *     deserialize.
   * @param block The block we are attempting to add the unregistered icon to.
   * @param state The state object representing the block.
   */
  constructor(
    iconType: string,
    public block: Block,
    public state: State,
  ) {
    super(
      `Cannot add an icon of type '${iconType}' to the block ` +
        `${block.toDevString()}, because there is no icon registered with ` +
        `type '${iconType}'. Make sure that all of your icons have been ` +
        `registered.`,
    );
  }
}
