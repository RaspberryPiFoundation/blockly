/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Python for variable blocks.
 */

// Former goog.module ID: Blockly.Python.variables

import type {Block} from '../../core/block.js';
import type {PythonGenerator} from './python_generator.js';
import {Order} from './python_generator.js';

export function variables_get(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Variable getter.
  const code = generator.getVariableName(block.getFieldValue('VAR'));
  return [code, Order.ATOMIC];
}

export function variables_set(block: Block, generator: PythonGenerator) {
  // Variable setter.
  const argument0 = generator.valueToCode(block, 'VALUE', Order.NONE) || '0';
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  return varName + ' = ' + argument0 + '\n';
}
