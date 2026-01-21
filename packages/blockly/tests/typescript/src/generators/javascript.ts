/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly-test/core';

/**
 * Test: should be able to import a generator instance, class, and
 * Order enum.
 */
import {
  javascriptGenerator,
  JavascriptGenerator,
  Order,
} from 'blockly-test/javascript';

/**
 * Test: should be able to create a simple block generator function,
 * correctly typed, and insert it into the .forBlock dictionary.
 */
javascriptGenerator.forBlock['the_answer'] = function (
  _block: Blockly.Block,
  _generator: JavascriptGenerator,
): [string, Order] {
  return ['42', Order.ATOMIC];
};
