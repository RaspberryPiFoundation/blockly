/**
 * @license
 * Copyright 2015 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating PHP for logic blocks.
 */

// Former goog.module ID: Blockly.PHP.logic

import type {Block} from '../../core/block.js';
import type {PhpGenerator} from './php_generator.js';
import {Order} from './php_generator.js';

export function controls_if(block: Block, generator: PhpGenerator) {
  // If/elseif/else condition.
  let n = 0;
  let code = '',
    branchCode,
    conditionCode;
  if (generator.STATEMENT_PREFIX) {
    // Automatic prefix insertion is switched off for this block.  Add manually.
    code += generator.injectId(generator.STATEMENT_PREFIX, block);
  }
  do {
    conditionCode =
      generator.valueToCode(block, 'IF' + n, Order.NONE) || 'false';
    branchCode = generator.statementToCode(block, 'DO' + n);
    if (generator.STATEMENT_SUFFIX) {
      branchCode =
        generator.prefixLines(
          generator.injectId(generator.STATEMENT_SUFFIX, block),
          generator.INDENT,
        ) + branchCode;
    }
    code +=
      (n > 0 ? ' else ' : '') +
      'if (' +
      conditionCode +
      ') {\n' +
      branchCode +
      '}';
    n++;
  } while (block.getInput('IF' + n));

  if (block.getInput('ELSE') || generator.STATEMENT_SUFFIX) {
    branchCode = block.getInput('ELSE')
      ? generator.statementToCode(block, 'ELSE')
      : '';
    if (generator.STATEMENT_SUFFIX) {
      branchCode =
        generator.prefixLines(
          generator.injectId(generator.STATEMENT_SUFFIX, block),
          generator.INDENT,
        ) + branchCode;
    }
    code += ' else {\n' + branchCode + '}';
  }
  return code + '\n';
}

export const controls_ifelse = controls_if;

export function logic_compare(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Comparison operator.
  const OPERATORS = {
    'EQ': '==',
    'NEQ': '!=',
    'LT': '<',
    'LTE': '<=',
    'GT': '>',
    'GTE': '>=',
  };
  type OperatorOption = keyof typeof OPERATORS;
  const operator = OPERATORS[block.getFieldValue('OP') as OperatorOption];
  const order =
    operator === '==' || operator === '!=' ? Order.EQUALITY : Order.RELATIONAL;
  const argument0 = generator.valueToCode(block, 'A', order) || '0';
  const argument1 = generator.valueToCode(block, 'B', order) || '0';
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
}

export function logic_operation(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Operations 'and', 'or'.
  const operator = block.getFieldValue('OP') === 'AND' ? '&&' : '||';
  const order = operator === '&&' ? Order.LOGICAL_AND : Order.LOGICAL_OR;
  let argument0 = generator.valueToCode(block, 'A', order);
  let argument1 = generator.valueToCode(block, 'B', order);
  if (!argument0 && !argument1) {
    // If there are no arguments, then the return value is false.
    argument0 = 'false';
    argument1 = 'false';
  } else {
    // Single missing arguments have no effect on the return value.
    const defaultArgument = operator === '&&' ? 'true' : 'false';
    if (!argument0) {
      argument0 = defaultArgument;
    }
    if (!argument1) {
      argument1 = defaultArgument;
    }
  }
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
}

export function logic_negate(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Negation.
  const order = Order.LOGICAL_NOT;
  const argument0 = generator.valueToCode(block, 'BOOL', order) || 'true';
  const code = '!' + argument0;
  return [code, order];
}

export function logic_boolean(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Boolean values true and false.
  const code = block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false';
  return [code, Order.ATOMIC];
}

export function logic_null(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Null data type.
  return ['null', Order.ATOMIC];
}

export function logic_ternary(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Ternary operator.
  const value_if =
    generator.valueToCode(block, 'IF', Order.CONDITIONAL) || 'false';
  const value_then =
    generator.valueToCode(block, 'THEN', Order.CONDITIONAL) || 'null';
  const value_else =
    generator.valueToCode(block, 'ELSE', Order.CONDITIONAL) || 'null';
  const code = value_if + ' ? ' + value_then + ' : ' + value_else;
  return [code, Order.CONDITIONAL];
}
