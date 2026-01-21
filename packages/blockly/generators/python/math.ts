/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Python for math blocks.
 */

// Former goog.module ID: Blockly.Python.math

import type {Block} from '../../core/block.js';
import type {PythonGenerator} from './python_generator.js';
import {Order} from './python_generator.js';

// If any new block imports any library, add that library name here.
// RESERVED WORDS: 'math,random,Number'

export function math_number(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Numeric value.
  let number = Number(block.getFieldValue('NUM'));
  if (number === Infinity) {
    return ['float("inf")', Order.FUNCTION_CALL];
  } else if (number === -Infinity) {
    return ['-float("inf")', Order.UNARY_SIGN];
  } else {
    return [String(number), number < 0 ? Order.UNARY_SIGN : Order.ATOMIC];
  }
}

export function math_arithmetic(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Basic arithmetic operators, and power.
  const OPERATORS: Record<string, [string | null, Order]> = {
    'ADD': [' + ', Order.ADDITIVE],
    'MINUS': [' - ', Order.ADDITIVE],
    'MULTIPLY': [' * ', Order.MULTIPLICATIVE],
    'DIVIDE': [' / ', Order.MULTIPLICATIVE],
    'POWER': [' ** ', Order.EXPONENTIATION],
  };
  type OperatorOption = keyof typeof OPERATORS;
  const tuple = OPERATORS[block.getFieldValue('OP') as OperatorOption];
  const operator = tuple[0];
  const order = tuple[1];
  const argument0 = generator.valueToCode(block, 'A', order) || '0';
  const argument1 = generator.valueToCode(block, 'B', order) || '0';
  const code = argument0 + operator + argument1;
  return [code, order];
  // In case of 'DIVIDE', division between integers returns different results
  // in generator 2 and 3. However, is not an issue since Blockly does not
  // guarantee identical results in all languages.  To do otherwise would
  // require every operator to be wrapped in a function call.  This would kill
  // legibility of the generated code.
}

export function math_single(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Math operators with single operand.
  const operator = block.getFieldValue('OP');
  let code;
  let arg;
  if (operator === 'NEG') {
    // Negation is a special case given its different operator precedence.
    code = generator.valueToCode(block, 'NUM', Order.UNARY_SIGN) || '0';
    return ['-' + code, Order.UNARY_SIGN];
  }
  // TODO(#7600): find better approach than casting to any to override
  // CodeGenerator declaring .definitions protected (here and below).
  (generator as AnyDuringMigration).definitions_['import_math'] = 'import math';
  if (operator === 'SIN' || operator === 'COS' || operator === 'TAN') {
    arg = generator.valueToCode(block, 'NUM', Order.MULTIPLICATIVE) || '0';
  } else {
    arg = generator.valueToCode(block, 'NUM', Order.NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = 'math.fabs(' + arg + ')';
      break;
    case 'ROOT':
      code = 'math.sqrt(' + arg + ')';
      break;
    case 'LN':
      code = 'math.log(' + arg + ')';
      break;
    case 'LOG10':
      code = 'math.log10(' + arg + ')';
      break;
    case 'EXP':
      code = 'math.exp(' + arg + ')';
      break;
    case 'POW10':
      code = 'math.pow(10,' + arg + ')';
      break;
    case 'ROUND':
      code = 'round(' + arg + ')';
      break;
    case 'ROUNDUP':
      code = 'math.ceil(' + arg + ')';
      break;
    case 'ROUNDDOWN':
      code = 'math.floor(' + arg + ')';
      break;
    case 'SIN':
      code = 'math.sin(' + arg + ' / 180.0 * math.pi)';
      break;
    case 'COS':
      code = 'math.cos(' + arg + ' / 180.0 * math.pi)';
      break;
    case 'TAN':
      code = 'math.tan(' + arg + ' / 180.0 * math.pi)';
      break;
  }
  if (code) {
    return [code, Order.FUNCTION_CALL];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ASIN':
      code = 'math.asin(' + arg + ') / math.pi * 180';
      break;
    case 'ACOS':
      code = 'math.acos(' + arg + ') / math.pi * 180';
      break;
    case 'ATAN':
      code = 'math.atan(' + arg + ') / math.pi * 180';
      break;
    default:
      throw Error('Unknown math operator: ' + operator);
  }
  return [code, Order.MULTIPLICATIVE];
}

export function math_constant(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  const CONSTANTS: Record<string, [string, Order]> = {
    'PI': ['math.pi', Order.MEMBER],
    'E': ['math.e', Order.MEMBER],
    'GOLDEN_RATIO': ['(1 + math.sqrt(5)) / 2', Order.MULTIPLICATIVE],
    'SQRT2': ['math.sqrt(2)', Order.MEMBER],
    'SQRT1_2': ['math.sqrt(1.0 / 2)', Order.MEMBER],
    'INFINITY': ["float('inf')", Order.ATOMIC],
  };
  type ConstantOption = keyof typeof CONSTANTS;
  const constant = block.getFieldValue('CONSTANT') as ConstantOption;
  if (constant !== 'INFINITY') {
    (generator as AnyDuringMigration).definitions_['import_math'] =
      'import math';
  }
  return CONSTANTS[constant];
}

export function math_number_property(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  const PROPERTIES: Record<string, [string | null, Order, Order]> = {
    'EVEN': [' % 2 == 0', Order.MULTIPLICATIVE, Order.RELATIONAL],
    'ODD': [' % 2 == 1', Order.MULTIPLICATIVE, Order.RELATIONAL],
    'WHOLE': [' % 1 == 0', Order.MULTIPLICATIVE, Order.RELATIONAL],
    'POSITIVE': [' > 0', Order.RELATIONAL, Order.RELATIONAL],
    'NEGATIVE': [' < 0', Order.RELATIONAL, Order.RELATIONAL],
    'DIVISIBLE_BY': [null, Order.MULTIPLICATIVE, Order.RELATIONAL],
    'PRIME': [null, Order.NONE, Order.FUNCTION_CALL],
  };
  type PropertyOption = keyof typeof PROPERTIES;
  const dropdownProperty = block.getFieldValue('PROPERTY') as PropertyOption;
  const [suffix, inputOrder, outputOrder] = PROPERTIES[dropdownProperty];
  const numberToCheck =
    generator.valueToCode(block, 'NUMBER_TO_CHECK', inputOrder) || '0';
  let code;
  if (dropdownProperty === 'PRIME') {
    // Prime is a special case as it is not a one-liner test.
    (generator as AnyDuringMigration).definitions_['import_math'] =
      'import math';
    (generator as AnyDuringMigration).definitions_[
      'from_numbers_import_Number'
    ] = 'from numbers import Number';
    const functionName = generator.provideFunction_(
      'math_isPrime',
      `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(n):
  # https://en.wikipedia.org/wiki/Primality_test#Naive_methods
  # If n is not a number but a string, try parsing it.
  if not isinstance(n, Number):
    try:
      n = float(n)
    except:
      return False
  if n == 2 or n == 3:
    return True
  # False if n is negative, is 1, or not whole, or if n is divisible by 2 or 3.
  if n <= 1 or n % 1 != 0 or n % 2 == 0 or n % 3 == 0:
    return False
  # Check all the numbers of form 6k +/- 1, up to sqrt(n).
  for x in range(6, int(math.sqrt(n)) + 2, 6):
    if n % (x - 1) == 0 or n % (x + 1) == 0:
      return False
  return True
`,
    );
    code = functionName + '(' + numberToCheck + ')';
  } else if (dropdownProperty === 'DIVISIBLE_BY') {
    const divisor =
      generator.valueToCode(block, 'DIVISOR', Order.MULTIPLICATIVE) || '0';
    // If 'divisor' is some code that evals to 0, generator will raise an error.
    if (divisor === '0') {
      return ['False', Order.ATOMIC];
    }
    code = numberToCheck + ' % ' + divisor + ' == 0';
  } else {
    code = numberToCheck + suffix;
  }
  return [code, outputOrder];
}

export function math_change(block: Block, generator: PythonGenerator) {
  // Add to a variable in place.
  (generator as AnyDuringMigration).definitions_['from_numbers_import_Number'] =
    'from numbers import Number';
  const argument0 =
    generator.valueToCode(block, 'DELTA', Order.ADDITIVE) || '0';
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  return (
    varName +
    ' = (' +
    varName +
    ' if isinstance(' +
    varName +
    ', Number) else 0) + ' +
    argument0 +
    '\n'
  );
}

// Rounding functions have a single operand.
export const math_round = math_single;
// Trigonometry functions have a single operand.
export const math_trig = math_single;

export function math_on_list(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Math functions for lists.
  const func = block.getFieldValue('OP');
  const list = generator.valueToCode(block, 'LIST', Order.NONE) || '[]';
  let code;
  switch (func) {
    case 'SUM':
      code = 'sum(' + list + ')';
      break;
    case 'MIN':
      code = 'min(' + list + ')';
      break;
    case 'MAX':
      code = 'max(' + list + ')';
      break;
    case 'AVERAGE': {
      (generator as AnyDuringMigration).definitions_[
        'from_numbers_import_Number'
      ] = 'from numbers import Number';
      // This operation excludes null and values that aren't int or float:
      // math_mean([null, null, "aString", 1, 9]) -> 5.0
      const functionName = generator.provideFunction_(
        'math_mean',
        `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(myList):
  localList = [e for e in myList if isinstance(e, Number)]
  if not localList: return
  return float(sum(localList)) / len(localList)
`,
      );
      code = functionName + '(' + list + ')';
      break;
    }
    case 'MEDIAN': {
      (generator as AnyDuringMigration).definitions_[
        'from_numbers_import_Number'
      ] = 'from numbers import Number';
      // This operation excludes null values:
      // math_median([null, null, 1, 3]) -> 2.0
      const functionName = generator.provideFunction_(
        'math_median',
        `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(myList):
  localList = sorted([e for e in myList if isinstance(e, Number)])
  if not localList: return
  if len(localList) % 2 == 0:
    return (localList[len(localList) // 2 - 1] + localList[len(localList) // 2]) / 2.0
  else:
    return localList[(len(localList) - 1) // 2]
`,
      );
      code = functionName + '(' + list + ')';
      break;
    }
    case 'MODE': {
      // As a list of numbers can contain more than one mode,
      // the returned result is provided as an array.
      // Mode of [3, 'x', 'x', 1, 1, 2, '3'] -> ['x', 1]
      const functionName = generator.provideFunction_(
        'math_modes',
        `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(some_list):
  modes = []
  # Using a lists of [item, count] to keep count rather than dict
  # to avoid "unhashable" errors when the counted item is itself a list or dict.
  counts = []
  maxCount = 1
  for item in some_list:
    found = False
    for count in counts:
      if count[0] == item:
        count[1] += 1
        maxCount = max(maxCount, count[1])
        found = True
    if not found:
      counts.append([item, 1])
  for counted_item, item_count in counts:
    if item_count == maxCount:
      modes.append(counted_item)
  return modes
`,
      );
      code = functionName + '(' + list + ')';
      break;
    }
    case 'STD_DEV': {
      (generator as AnyDuringMigration).definitions_['import_math'] =
        'import math';
      const functionName = generator.provideFunction_(
        'math_standard_deviation',
        `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(numbers):
  n = len(numbers)
  if n == 0: return
  mean = float(sum(numbers)) / n
  variance = sum((x - mean) ** 2 for x in numbers) / n
  return math.sqrt(variance)
`,
      );
      code = functionName + '(' + list + ')';
      break;
    }
    case 'RANDOM':
      (generator as AnyDuringMigration).definitions_['import_random'] =
        'import random';
      code = 'random.choice(' + list + ')';
      break;
    default:
      throw Error('Unknown operator: ' + func);
  }
  return [code, Order.FUNCTION_CALL];
}

export function math_modulo(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Remainder computation.
  const argument0 =
    generator.valueToCode(block, 'DIVIDEND', Order.MULTIPLICATIVE) || '0';
  const argument1 =
    generator.valueToCode(block, 'DIVISOR', Order.MULTIPLICATIVE) || '0';
  const code = argument0 + ' % ' + argument1;
  return [code, Order.MULTIPLICATIVE];
}

export function math_constrain(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Constrain a number between two limits.
  const argument0 = generator.valueToCode(block, 'VALUE', Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'LOW', Order.NONE) || '0';
  const argument2 =
    generator.valueToCode(block, 'HIGH', Order.NONE) || "float('inf')";
  const code =
    'min(max(' + argument0 + ', ' + argument1 + '), ' + argument2 + ')';
  return [code, Order.FUNCTION_CALL];
}

export function math_random_int(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Random integer between [X] and [Y].
  (generator as AnyDuringMigration).definitions_['import_random'] =
    'import random';
  const argument0 = generator.valueToCode(block, 'FROM', Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'TO', Order.NONE) || '0';
  const code = 'random.randint(' + argument0 + ', ' + argument1 + ')';
  return [code, Order.FUNCTION_CALL];
}

export function math_random_float(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Random fraction between 0 and 1.
  (generator as AnyDuringMigration).definitions_['import_random'] =
    'import random';
  return ['random.random()', Order.FUNCTION_CALL];
}

export function math_atan2(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Arctangent of point (X, Y) in degrees from -180 to 180.
  (generator as AnyDuringMigration).definitions_['import_math'] = 'import math';
  const argument0 = generator.valueToCode(block, 'X', Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'Y', Order.NONE) || '0';
  return [
    'math.atan2(' + argument1 + ', ' + argument0 + ') / math.pi * 180',
    Order.MULTIPLICATIVE,
  ];
}
