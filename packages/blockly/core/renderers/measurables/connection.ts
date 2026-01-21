/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.Connection

import type {RenderedConnection} from '../../rendered_connection.js';
import type {ConstantProvider, Shape} from '../common/constants.js';
import {Measurable} from './base.js';
import {Types} from './types.js';

/**
 * The base class to represent a connection and the space that it takes up on
 * the block.
 */
export class Connection extends Measurable {
  shape: Shape;
  isDynamicShape: boolean;
  highlighted: boolean;

  /**
   * @param constants The rendering constants provider.
   * @param connectionModel The connection object on the block that this
   *     represents.
   */
  constructor(
    constants: ConstantProvider,
    public connectionModel: RenderedConnection,
  ) {
    super(constants);

    this.type |= Types.CONNECTION;

    this.shape = this.constants_.shapeFor(connectionModel);
    this.isDynamicShape = 'isDynamic' in this.shape && this.shape.isDynamic;

    this.highlighted = connectionModel.isHighlighted();
  }
}
