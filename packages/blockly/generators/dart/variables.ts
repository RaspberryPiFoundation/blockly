/**
 * @license
 * Copyright 2014 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Dart for variable blocks.
 */

// Former goog.module ID: Blockly.Dart.variables

import type {Block} from '../../core/block.js';
import type {DartGenerator} from './dart_generator.js';
import {Order} from './dart_generator.js';

export function variables_get(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Variable getter.
  const code = generator.getVariableName(block.getFieldValue('VAR'));
  return [code, Order.ATOMIC];
}

export function variables_set(block: Block, generator: DartGenerator) {
  // Variable setter.
  const argument0 =
    generator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  return varName + ' = ' + argument0 + ';\n';
}
