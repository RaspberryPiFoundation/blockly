/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Block} from '../block.js';
import {Input} from './input.js';
import {inputTypes} from './input_types.js';

/**
 * Represents an input on a block that is always the last input in the row. Any
 * following input will be rendered on the next row even if the block has inline
 * inputs. Any newline character in a JSON block definition's message will
 * automatically be parsed as an end-row input.
 */
export class EndRowInput extends Input {
  readonly type = inputTypes.END_ROW;

  /**
   * @param name Language-neutral identifier which may used to find this input
   *     again.
   * @param block The block containing this input.
   */
  constructor(
    public name: string,
    block: Block,
  ) {
    super(name, block);
  }
}
