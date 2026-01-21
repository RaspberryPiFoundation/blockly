/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.NextConnection

import type {RenderedConnection} from '../../rendered_connection.js';
import type {ConstantProvider} from '../common/constants.js';
import {Connection} from './connection.js';
import {Types} from './types.js';

/**
 * An object containing information about the space a next connection takes
 * up during rendering.
 */
export class NextConnection extends Connection {
  // This field exists solely to structurally distinguish this type from other
  // Measurable subclasses. Because this class otherwise has the same fields as
  // Measurable, and Typescript doesn't support nominal typing, Typescript will
  // consider it and other subclasses in the same situation as being of the same
  // type, even if typeguards are used, which could result in Typescript typing
  // objects of this class as `never`.
  private nextConnection: undefined;

  /**
   * @param constants The rendering constants provider.
   * @param connectionModel The connection object on the block that this
   *     represents.
   */
  constructor(
    constants: ConstantProvider,
    connectionModel: RenderedConnection,
  ) {
    super(constants, connectionModel);
    this.type |= Types.NEXT_CONNECTION;
    this.height = this.shape.height as number;
    this.width = this.shape.width as number;
  }
}
