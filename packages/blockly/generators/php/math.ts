/**
 * @license
 * Copyright 2015 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating PHP for math blocks.
 */

// Former goog.module ID: Blockly.PHP.math

import type {Block} from '../../core/block.js';
import type {PhpGenerator} from './php_generator.js';
import {Order} from './php_generator.js';

export function math_number(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Numeric value.
  let number = Number(block.getFieldValue('NUM'));
  if (number === Infinity) {
    return ['INF', Order.ATOMIC];
  } else if (number === -Infinity) {
    return ['-INF', Order.UNARY_NEGATION];
  }
  return [String(number), number >= 0 ? Order.ATOMIC : Order.UNARY_NEGATION];
}

export function math_arithmetic(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Basic arithmetic operators, and power.
  const OPERATORS: Record<string, [string, Order]> = {
    'ADD': [' + ', Order.ADDITION],
    'MINUS': [' - ', Order.SUBTRACTION],
    'MULTIPLY': [' * ', Order.MULTIPLICATION],
    'DIVIDE': [' / ', Order.DIVISION],
    'POWER': [' ** ', Order.POWER],
  };
  type OperatorOption = keyof typeof OPERATORS;
  const tuple = OPERATORS[block.getFieldValue('OP') as OperatorOption];
  const operator = tuple[0];
  const order = tuple[1];
  const argument0 = generator.valueToCode(block, 'A', order) || '0';
  const argument1 = generator.valueToCode(block, 'B', order) || '0';
  const code = argument0 + operator + argument1;
  return [code, order];
}

export function math_single(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Math operators with single operand.
  const operator = block.getFieldValue('OP');
  let code;
  let arg;
  if (operator === 'NEG') {
    // Negation is a special case given its different operator precedence.
    arg = generator.valueToCode(block, 'NUM', Order.UNARY_NEGATION) || '0';
    if (arg[0] === '-') {
      // --3 is not legal in JS.
      arg = ' ' + arg;
    }
    code = '-' + arg;
    return [code, Order.UNARY_NEGATION];
  }
  if (operator === 'SIN' || operator === 'COS' || operator === 'TAN') {
    arg = generator.valueToCode(block, 'NUM', Order.DIVISION) || '0';
  } else {
    arg = generator.valueToCode(block, 'NUM', Order.NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = 'abs(' + arg + ')';
      break;
    case 'ROOT':
      code = 'sqrt(' + arg + ')';
      break;
    case 'LN':
      code = 'log(' + arg + ')';
      break;
    case 'EXP':
      code = 'exp(' + arg + ')';
      break;
    case 'POW10':
      code = 'pow(10,' + arg + ')';
      break;
    case 'ROUND':
      code = 'round(' + arg + ')';
      break;
    case 'ROUNDUP':
      code = 'ceil(' + arg + ')';
      break;
    case 'ROUNDDOWN':
      code = 'floor(' + arg + ')';
      break;
    case 'SIN':
      code = 'sin(' + arg + ' / 180 * pi())';
      break;
    case 'COS':
      code = 'cos(' + arg + ' / 180 * pi())';
      break;
    case 'TAN':
      code = 'tan(' + arg + ' / 180 * pi())';
      break;
  }
  if (code) {
    return [code, Order.FUNCTION_CALL];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'LOG10':
      code = 'log(' + arg + ') / log(10)';
      break;
    case 'ASIN':
      code = 'asin(' + arg + ') / pi() * 180';
      break;
    case 'ACOS':
      code = 'acos(' + arg + ') / pi() * 180';
      break;
    case 'ATAN':
      code = 'atan(' + arg + ') / pi() * 180';
      break;
    default:
      throw Error('Unknown math operator: ' + operator);
  }
  return [code, Order.DIVISION];
}

export function math_constant(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  const CONSTANTS: Record<string, [string, Order]> = {
    'PI': ['M_PI', Order.ATOMIC],
    'E': ['M_E', Order.ATOMIC],
    'GOLDEN_RATIO': ['(1 + sqrt(5)) / 2', Order.DIVISION],
    'SQRT2': ['M_SQRT2', Order.ATOMIC],
    'SQRT1_2': ['M_SQRT1_2', Order.ATOMIC],
    'INFINITY': ['INF', Order.ATOMIC],
  };
  type ConstantOption = keyof typeof CONSTANTS;
  return CONSTANTS[block.getFieldValue('CONSTANT') as ConstantOption];
}

export function math_number_property(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  const PROPERTIES: Record<
    string,
    [string, string, Order, Order] | [null, null, Order, Order]
  > = {
    'EVEN': ['', ' % 2 == 0', Order.MODULUS, Order.EQUALITY],
    'ODD': ['', ' % 2 == 1', Order.MODULUS, Order.EQUALITY],
    'WHOLE': ['is_int(', ')', Order.NONE, Order.FUNCTION_CALL],
    'POSITIVE': ['', ' > 0', Order.RELATIONAL, Order.RELATIONAL],
    'NEGATIVE': ['', ' < 0', Order.RELATIONAL, Order.RELATIONAL],
    'DIVISIBLE_BY': [null, null, Order.MODULUS, Order.EQUALITY],
    'PRIME': [null, null, Order.NONE, Order.FUNCTION_CALL],
  };
  type PropertyOption = keyof typeof PROPERTIES;
  const dropdownProperty = block.getFieldValue('PROPERTY') as PropertyOption;
  const [prefix, suffix, inputOrder, outputOrder] =
    PROPERTIES[dropdownProperty];
  const numberToCheck =
    generator.valueToCode(block, 'NUMBER_TO_CHECK', inputOrder) || '0';
  let code;
  if (dropdownProperty === 'PRIME') {
    // Prime is a special case as it is not a one-liner test.
    const functionName = generator.provideFunction_(
      'math_isPrime',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($n) {
  // https://en.wikipedia.org/wiki/Primality_test#Naive_methods
  if ($n == 2 || $n == 3) {
    return true;
  }
  // False if n is NaN, negative, is 1, or not whole.
  // And false if n is divisible by 2 or 3.
  if (!is_numeric($n) || $n <= 1 || $n % 1 != 0 || $n % 2 == 0 || $n % 3 == 0) {
    return false;
  }
  // Check all the numbers of form 6k +/- 1, up to sqrt(n).
  for ($x = 6; $x <= sqrt($n) + 1; $x += 6) {
    if ($n % ($x - 1) == 0 || $n % ($x + 1) == 0) {
      return false;
    }
  }
  return true;
}
`,
    );
    code = functionName + '(' + numberToCheck + ')';
  } else if (dropdownProperty === 'DIVISIBLE_BY') {
    const divisor =
      generator.valueToCode(block, 'DIVISOR', Order.MODULUS) || '0';
    if (divisor === '0') {
      return ['false', Order.ATOMIC];
    }
    code = numberToCheck + ' % ' + divisor + ' == 0';
  } else {
    code = prefix + numberToCheck + suffix;
  }
  return [code, outputOrder];
}

export function math_change(block: Block, generator: PhpGenerator) {
  // Add to a variable in place.
  const argument0 =
    generator.valueToCode(block, 'DELTA', Order.ADDITION) || '0';
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  return varName + ' += ' + argument0 + ';\n';
}

// Rounding functions have a single operand.
export const math_round = math_single;
// Trigonometry functions have a single operand.
export const math_trig = math_single;

export function math_on_list(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Math functions for lists.
  const func = block.getFieldValue('OP');
  let list;
  let code;
  switch (func) {
    case 'SUM':
      list =
        generator.valueToCode(block, 'LIST', Order.FUNCTION_CALL) || 'array()';
      code = 'array_sum(' + list + ')';
      break;
    case 'MIN':
      list =
        generator.valueToCode(block, 'LIST', Order.FUNCTION_CALL) || 'array()';
      code = 'min(' + list + ')';
      break;
    case 'MAX':
      list =
        generator.valueToCode(block, 'LIST', Order.FUNCTION_CALL) || 'array()';
      code = 'max(' + list + ')';
      break;
    case 'AVERAGE': {
      const functionName = generator.provideFunction_(
        'math_mean',
        `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($myList) {
  return array_sum($myList) / count($myList);
}
`,
      );
      list = generator.valueToCode(block, 'LIST', Order.NONE) || 'array()';
      code = functionName + '(' + list + ')';
      break;
    }
    case 'MEDIAN': {
      const functionName = generator.provideFunction_(
        'math_median',
        `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($arr) {
  sort($arr,SORT_NUMERIC);
  return (count($arr) % 2) ? $arr[floor(count($arr) / 2)] :
      ($arr[floor(count($arr) / 2)] + $arr[floor(count($arr) / 2) - 1]) / 2;
}
`,
      );
      list = generator.valueToCode(block, 'LIST', Order.NONE) || '[]';
      code = functionName + '(' + list + ')';
      break;
    }
    case 'MODE': {
      // As a list of numbers can contain more than one mode,
      // the returned result is provided as an array.
      // Mode of [3, 'x', 'x', 1, 1, 2, '3'] -> ['x', 1].
      const functionName = generator.provideFunction_(
        'math_modes',
        `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($values) {
  if (empty($values)) return array();
  $counts = array_count_values($values);
  arsort($counts); // Sort counts in descending order
  $modes = array_keys($counts, current($counts), true);
  return $modes;
}
`,
      );
      list = generator.valueToCode(block, 'LIST', Order.NONE) || '[]';
      code = functionName + '(' + list + ')';
      break;
    }
    case 'STD_DEV': {
      const functionName = generator.provideFunction_(
        'math_standard_deviation',
        `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($numbers) {
  $n = count($numbers);
  if (!$n) return null;
  $mean = array_sum($numbers) / count($numbers);
  foreach($numbers as $key => $num) $devs[$key] = pow($num - $mean, 2);
  return sqrt(array_sum($devs) / (count($devs) - 1));
}
`,
      );
      list = generator.valueToCode(block, 'LIST', Order.NONE) || '[]';
      code = functionName + '(' + list + ')';
      break;
    }
    case 'RANDOM': {
      const functionName = generator.provideFunction_(
        'math_random_list',
        `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($list) {
  $x = rand(0, count($list)-1);
  return $list[$x];
}
`,
      );
      list = generator.valueToCode(block, 'LIST', Order.NONE) || '[]';
      code = functionName + '(' + list + ')';
      break;
    }
    default:
      throw Error('Unknown operator: ' + func);
  }
  return [code, Order.FUNCTION_CALL];
}

export function math_modulo(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Remainder computation.
  const argument0 =
    generator.valueToCode(block, 'DIVIDEND', Order.MODULUS) || '0';
  const argument1 =
    generator.valueToCode(block, 'DIVISOR', Order.MODULUS) || '0';
  const code = argument0 + ' % ' + argument1;
  return [code, Order.MODULUS];
}

export function math_constrain(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Constrain a number between two limits.
  const argument0 = generator.valueToCode(block, 'VALUE', Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'LOW', Order.NONE) || '0';
  const argument2 =
    generator.valueToCode(block, 'HIGH', Order.NONE) || 'Infinity';
  const code =
    'min(max(' + argument0 + ', ' + argument1 + '), ' + argument2 + ')';
  return [code, Order.FUNCTION_CALL];
}

export function math_random_int(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Random integer between [X] and [Y].
  const argument0 = generator.valueToCode(block, 'FROM', Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'TO', Order.NONE) || '0';
  const functionName = generator.provideFunction_(
    'math_random_int',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($a, $b) {
  if ($a > $b) {
    return rand($b, $a);
  }
  return rand($a, $b);
}
`,
  );
  const code = functionName + '(' + argument0 + ', ' + argument1 + ')';
  return [code, Order.FUNCTION_CALL];
}

export function math_random_float(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Random fraction between 0 and 1.
  return ['(float)rand()/(float)getrandmax()', Order.FUNCTION_CALL];
}

export function math_atan2(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Arctangent of point (X, Y) in degrees from -180 to 180.
  const argument0 = generator.valueToCode(block, 'X', Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'Y', Order.NONE) || '0';
  return [
    'atan2(' + argument1 + ', ' + argument0 + ') / pi() * 180',
    Order.DIVISION,
  ];
}
