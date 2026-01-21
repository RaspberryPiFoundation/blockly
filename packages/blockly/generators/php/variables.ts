/**
 * @license
 * Copyright 2015 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating PHP for variable blocks.
 */

// Former goog.module ID: Blockly.PHP.variables

import type {Block} from '../../core/block.js';
import type {PhpGenerator} from './php_generator.js';
import {Order} from './php_generator.js';

export function variables_get(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Variable getter.
  const code = generator.getVariableName(block.getFieldValue('VAR'));
  return [code, Order.ATOMIC];
}

export function variables_set(block: Block, generator: PhpGenerator) {
  // Variable setter.
  const argument0 =
    generator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  return varName + ' = ' + argument0 + ';\n';
}
