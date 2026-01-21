/**
 * @license
 * Copyright 2014 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Dart for math blocks.
 */

// Former goog.module ID: Blockly.Dart.math

import type {Block} from '../../core/block.js';
import type {DartGenerator} from './dart_generator.js';
import {Order} from './dart_generator.js';

// RESERVED WORDS: 'Math'

export function math_number(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Numeric value.
  const number = Number(block.getFieldValue('NUM'));
  if (number === Infinity) {
    return ['double.infinity', Order.UNARY_POSTFIX];
  } else if (number === -Infinity) {
    return ['-double.infinity', Order.UNARY_PREFIX];
  } else {
    // -4.abs() returns -4 in generator due to strange order of
    // operation choices.  4 is actually an operator and a number.
    // Reflect this in the order.
    return [String(number), number < 0 ? Order.UNARY_PREFIX : Order.ATOMIC];
  }
}

export function math_arithmetic(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Basic arithmetic operators, and power.
  const OPERATORS: Record<string, [string | null, Order]> = {
    'ADD': [' + ', Order.ADDITIVE],
    'MINUS': [' - ', Order.ADDITIVE],
    'MULTIPLY': [' * ', Order.MULTIPLICATIVE],
    'DIVIDE': [' / ', Order.MULTIPLICATIVE],
    'POWER': [null, Order.NONE], // Handle power separately.
  };
  type OperatorOption = keyof typeof OPERATORS;
  const tuple = OPERATORS[block.getFieldValue('OP') as OperatorOption];
  const operator = tuple[0];
  const order = tuple[1];
  const argument0 = generator.valueToCode(block, 'A', order) || '0';
  const argument1 = generator.valueToCode(block, 'B', order) || '0';
  let code;
  // Power in generator requires a special case since it has no operator.
  if (!operator) {
    // TODO(#7600): find better approach than casting to any to override
    // CodeGenerator declaring .definitions protected.
    (generator as AnyDuringMigration).definitions_['import_dart_math'] =
      "import 'dart:math' as Math;";
    code = 'Math.pow(' + argument0 + ', ' + argument1 + ')';
    return [code, Order.UNARY_POSTFIX];
  }
  code = argument0 + operator + argument1;
  return [code, order];
}

export function math_single(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Math operators with single operand.
  const operator = block.getFieldValue('OP');
  let code;
  let arg;
  if (operator === 'NEG') {
    // Negation is a special case given its different operator precedence.
    arg = generator.valueToCode(block, 'NUM', Order.UNARY_PREFIX) || '0';
    if (arg[0] === '-') {
      // --3 is not legal in generator.
      arg = ' ' + arg;
    }
    code = '-' + arg;
    return [code, Order.UNARY_PREFIX];
  }
  // TODO(#7600): find better approach than casting to any to override
  // CodeGenerator declaring .definitions protected.
  (generator as AnyDuringMigration).definitions_['import_dart_math'] =
    "import 'dart:math' as Math;";
  if (operator === 'ABS' || operator.substring(0, 5) === 'ROUND') {
    arg = generator.valueToCode(block, 'NUM', Order.UNARY_POSTFIX) || '0';
  } else if (operator === 'SIN' || operator === 'COS' || operator === 'TAN') {
    arg = generator.valueToCode(block, 'NUM', Order.MULTIPLICATIVE) || '0';
  } else {
    arg = generator.valueToCode(block, 'NUM', Order.NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = arg + '.abs()';
      break;
    case 'ROOT':
      code = 'Math.sqrt(' + arg + ')';
      break;
    case 'LN':
      code = 'Math.log(' + arg + ')';
      break;
    case 'EXP':
      code = 'Math.exp(' + arg + ')';
      break;
    case 'POW10':
      code = 'Math.pow(10,' + arg + ')';
      break;
    case 'ROUND':
      code = arg + '.round()';
      break;
    case 'ROUNDUP':
      code = arg + '.ceil()';
      break;
    case 'ROUNDDOWN':
      code = arg + '.floor()';
      break;
    case 'SIN':
      code = 'Math.sin(' + arg + ' / 180 * Math.pi)';
      break;
    case 'COS':
      code = 'Math.cos(' + arg + ' / 180 * Math.pi)';
      break;
    case 'TAN':
      code = 'Math.tan(' + arg + ' / 180 * Math.pi)';
      break;
  }
  if (code) {
    return [code, Order.UNARY_POSTFIX];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'LOG10':
      code = 'Math.log(' + arg + ') / Math.log(10)';
      break;
    case 'ASIN':
      code = 'Math.asin(' + arg + ') / Math.pi * 180';
      break;
    case 'ACOS':
      code = 'Math.acos(' + arg + ') / Math.pi * 180';
      break;
    case 'ATAN':
      code = 'Math.atan(' + arg + ') / Math.pi * 180';
      break;
    default:
      throw Error('Unknown math operator: ' + operator);
  }
  return [code, Order.MULTIPLICATIVE];
}

export function math_constant(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  const CONSTANTS: Record<string, [string, Order]> = {
    'PI': ['Math.pi', Order.UNARY_POSTFIX],
    'E': ['Math.e', Order.UNARY_POSTFIX],
    'GOLDEN_RATIO': ['(1 + Math.sqrt(5)) / 2', Order.MULTIPLICATIVE],
    'SQRT2': ['Math.sqrt2', Order.UNARY_POSTFIX],
    'SQRT1_2': ['Math.sqrt1_2', Order.UNARY_POSTFIX],
    'INFINITY': ['double.infinity', Order.ATOMIC],
  };
  type ConstantOption = keyof typeof CONSTANTS;
  const constant = block.getFieldValue('CONSTANT') as ConstantOption;
  if (constant !== 'INFINITY') {
    // TODO(#7600): find better approach than casting to any to override
    // CodeGenerator declaring .definitions protected.
    (generator as AnyDuringMigration).definitions_['import_dart_math'] =
      "import 'dart:math' as Math;";
  }
  return CONSTANTS[constant];
}

export function math_number_property(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  const PROPERTIES: Record<string, [string | null, Order, Order]> = {
    'EVEN': [' % 2 == 0', Order.MULTIPLICATIVE, Order.EQUALITY],
    'ODD': [' % 2 == 1', Order.MULTIPLICATIVE, Order.EQUALITY],
    'WHOLE': [' % 1 == 0', Order.MULTIPLICATIVE, Order.EQUALITY],
    'POSITIVE': [' > 0', Order.RELATIONAL, Order.RELATIONAL],
    'NEGATIVE': [' < 0', Order.RELATIONAL, Order.RELATIONAL],
    'DIVISIBLE_BY': [null, Order.MULTIPLICATIVE, Order.EQUALITY],
    'PRIME': [null, Order.NONE, Order.UNARY_POSTFIX],
  };
  type PropertyOption = keyof typeof PROPERTIES;
  const dropdownProperty = block.getFieldValue('PROPERTY') as PropertyOption;
  const [suffix, inputOrder, outputOrder] = PROPERTIES[dropdownProperty];
  const numberToCheck =
    generator.valueToCode(block, 'NUMBER_TO_CHECK', inputOrder) || '0';
  let code;
  if (dropdownProperty === 'PRIME') {
    // Prime is a special case as it is not a one-liner test.
    // TODO(#7600): find better approach than casting to any to override
    // CodeGenerator declaring .definitions protected.
    (generator as AnyDuringMigration).definitions_['import_dart_math'] =
      "import 'dart:math' as Math;";
    const functionName = generator.provideFunction_(
      'math_isPrime',
      `
bool ${generator.FUNCTION_NAME_PLACEHOLDER_}(n) {
  // https://en.wikipedia.org/wiki/Primality_test#Naive_methods
  if (n == 2 || n == 3) {
    return true;
  }
  // False if n is null, negative, is 1, or not whole.
  // And false if n is divisible by 2 or 3.
  if (n == null || n <= 1 || n % 1 != 0 || n % 2 == 0 || n % 3 == 0) {
    return false;
  }
  // Check all the numbers of form 6k +/- 1, up to sqrt(n).
  for (var x = 6; x <= Math.sqrt(n) + 1; x += 6) {
    if (n % (x - 1) == 0 || n % (x + 1) == 0) {
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
      generator.valueToCode(block, 'DIVISOR', Order.MULTIPLICATIVE) || '0';
    if (divisor === '0') {
      return ['false', Order.ATOMIC];
    }
    code = numberToCheck + ' % ' + divisor + ' == 0';
  } else {
    code = numberToCheck + suffix;
  }
  return [code, outputOrder];
}

export function math_change(block: Block, generator: DartGenerator) {
  // Add to a variable in place.
  const argument0 =
    generator.valueToCode(block, 'DELTA', Order.ADDITIVE) || '0';
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  return (
    varName +
    ' = (' +
    varName +
    ' is num ? ' +
    varName +
    ' : 0) + ' +
    argument0 +
    ';\n'
  );
}

// Rounding functions have a single operand.
export const math_round = math_single;
// Trigonometry functions have a single operand.
export const math_trig = math_single;

export function math_on_list(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Math functions for lists.
  const func = block.getFieldValue('OP');
  const list = generator.valueToCode(block, 'LIST', Order.NONE) || '[]';
  let code;
  switch (func) {
    case 'SUM': {
      const functionName = generator.provideFunction_(
        'math_sum',
        `
num ${generator.FUNCTION_NAME_PLACEHOLDER_}(List<num> myList) {
  num sumVal = 0;
  myList.forEach((num entry) {sumVal += entry;});
  return sumVal;
}
`,
      );
      code = functionName + '(' + list + ')';
      break;
    }
    case 'MIN': {
      // TODO(#7600): find better approach than casting to any to override
      // CodeGenerator declaring .definitions protected.
      (generator as AnyDuringMigration).definitions_['import_dart_math'] =
        "import 'dart:math' as Math;";
      const functionName = generator.provideFunction_(
        'math_min',
        `
num ${generator.FUNCTION_NAME_PLACEHOLDER_}(List<num> myList) {
  if (myList.isEmpty) return null;
  num minVal = myList[0];
  myList.forEach((num entry) {minVal = Math.min(minVal, entry);});
  return minVal;
}
`,
      );
      code = functionName + '(' + list + ')';
      break;
    }
    case 'MAX': {
      // TODO(#7600): find better approach than casting to any to override
      // CodeGenerator declaring .definitions protected.
      (generator as AnyDuringMigration).definitions_['import_dart_math'] =
        "import 'dart:math' as Math;";
      const functionName = generator.provideFunction_(
        'math_max',
        `
num ${generator.FUNCTION_NAME_PLACEHOLDER_}(List<num> myList) {
  if (myList.isEmpty) return null;
  num maxVal = myList[0];
  myList.forEach((num entry) {maxVal = Math.max(maxVal, entry);});
  return maxVal;
}
`,
      );
      code = functionName + '(' + list + ')';
      break;
    }
    case 'AVERAGE': {
      // This operation exclude null and values that are not int or float:
      //   math_mean([null,null,"aString",1,9]) -> 5.0
      const functionName = generator.provideFunction_(
        'math_mean',
        `
num ${generator.FUNCTION_NAME_PLACEHOLDER_}(List myList) {
  // First filter list for numbers only.
  List localList = new List.from(myList);
  localList.removeWhere((a) => a is! num);
  if (localList.isEmpty) return null;
  num sumVal = 0;
  localList.forEach((var entry) {sumVal += entry;});
  return sumVal / localList.length;
}
`,
      );
      code = functionName + '(' + list + ')';
      break;
    }
    case 'MEDIAN': {
      const functionName = generator.provideFunction_(
        'math_median',
        `
num ${generator.FUNCTION_NAME_PLACEHOLDER_}(List myList) {
  // First filter list for numbers only, then sort, then return middle value
  // or the average of two middle values if list has an even number of elements.
  List localList = new List.from(myList);
  localList.removeWhere((a) => a is! num);
  if (localList.isEmpty) return null;
  localList.sort((a, b) => (a - b));
  int index = localList.length ~/ 2;
  if (localList.length % 2 == 1) {
    return localList[index];
  } else {
    return (localList[index - 1] + localList[index]) / 2;
  }
}
`,
      );
      code = functionName + '(' + list + ')';
      break;
    }
    case 'MODE': {
      // TODO(#7600): find better approach than casting to any to override
      // CodeGenerator declaring .definitions protected.
      (generator as AnyDuringMigration).definitions_['import_dart_math'] =
        "import 'dart:math' as Math;";
      // As a list of numbers can contain more than one mode,
      // the returned result is provided as an array.
      // Mode of [3, 'x', 'x', 1, 1, 2, '3'] -> ['x', 1]
      const functionName = generator.provideFunction_(
        'math_modes',
        `
List ${generator.FUNCTION_NAME_PLACEHOLDER_}(List values) {
  List modes = [];
  List counts = [];
  int maxCount = 0;
  for (int i = 0; i < values.length; i++) {
    var value = values[i];
    bool found = false;
    int thisCount;
    for (int j = 0; j < counts.length; j++) {
      if (counts[j][0] == value) {
        thisCount = ++counts[j][1];
        found = true;
        break;
      }
    }
    if (!found) {
      counts.add([value, 1]);
      thisCount = 1;
    }
    maxCount = Math.max(thisCount, maxCount);
  }
  for (int j = 0; j < counts.length; j++) {
    if (counts[j][1] == maxCount) {
        modes.add(counts[j][0]);
    }
  }
  return modes;
}
`,
      );
      code = functionName + '(' + list + ')';
      break;
    }
    case 'STD_DEV': {
      // TODO(#7600): find better approach than casting to any to override
      // CodeGenerator declaring .definitions protected.
      (generator as AnyDuringMigration).definitions_['import_dart_math'] =
        "import 'dart:math' as Math;";
      const functionName = generator.provideFunction_(
        'math_standard_deviation',
        `
num ${generator.FUNCTION_NAME_PLACEHOLDER_}(List myList) {
  // First filter list for numbers only.
  List numbers = new List.from(myList);
  numbers.removeWhere((a) => a is! num);
  if (numbers.isEmpty) return null;
  num n = numbers.length;
  num sum = 0;
  numbers.forEach((x) => sum += x);
  num mean = sum / n;
  num sumSquare = 0;
  numbers.forEach((x) => sumSquare += Math.pow(x - mean, 2));
  return Math.sqrt(sumSquare / n);
}
`,
      );
      code = functionName + '(' + list + ')';
      break;
    }
    case 'RANDOM': {
      // TODO(#7600): find better approach than casting to any to override
      // CodeGenerator declaring .definitions protected.
      (generator as AnyDuringMigration).definitions_['import_dart_math'] =
        "import 'dart:math' as Math;";
      const functionName = generator.provideFunction_(
        'math_random_item',
        `
dynamic ${generator.FUNCTION_NAME_PLACEHOLDER_}(List myList) {
  int x = new Math.Random().nextInt(myList.length);
  return myList[x];
}
`,
      );
      code = functionName + '(' + list + ')';
      break;
    }
    default:
      throw Error('Unknown operator: ' + func);
  }
  return [code, Order.UNARY_POSTFIX];
}

export function math_modulo(
  block: Block,
  generator: DartGenerator,
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
  generator: DartGenerator,
): [string, Order] {
  // Constrain a number between two limits.
  // TODO(#7600): find better approach than casting to any to override
  // CodeGenerator declaring .definitions protected.
  (generator as AnyDuringMigration).definitions_['import_dart_math'] =
    "import 'dart:math' as Math;";
  const argument0 = generator.valueToCode(block, 'VALUE', Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'LOW', Order.NONE) || '0';
  const argument2 =
    generator.valueToCode(block, 'HIGH', Order.NONE) || 'double.infinity';
  const code =
    'Math.min(Math.max(' +
    argument0 +
    ', ' +
    argument1 +
    '), ' +
    argument2 +
    ')';
  return [code, Order.UNARY_POSTFIX];
}

export function math_random_int(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Random integer between [X] and [Y].
  // TODO(#7600): find better approach than casting to any to override
  // CodeGenerator declaring .definitions protected.
  (generator as AnyDuringMigration).definitions_['import_dart_math'] =
    "import 'dart:math' as Math;";
  const argument0 = generator.valueToCode(block, 'FROM', Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'TO', Order.NONE) || '0';
  const functionName = generator.provideFunction_(
    'math_random_int',
    `
int ${generator.FUNCTION_NAME_PLACEHOLDER_}(num a, num b) {
  if (a > b) {
    // Swap a and b to ensure a is smaller.
    num c = a;
    a = b;
    b = c;
  }
  return new Math.Random().nextInt(b - a + 1) + a;
}
`,
  );
  const code = functionName + '(' + argument0 + ', ' + argument1 + ')';
  return [code, Order.UNARY_POSTFIX];
}

export function math_random_float(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Random fraction between 0 and 1.
  // TODO(#7600): find better approach than casting to any to override
  // CodeGenerator declaring .definitions protected.
  (generator as AnyDuringMigration).definitions_['import_dart_math'] =
    "import 'dart:math' as Math;";
  return ['new Math.Random().nextDouble()', Order.UNARY_POSTFIX];
}

export function math_atan2(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Arctangent of point (X, Y) in degrees from -180 to 180.
  // TODO(#7600): find better approach than casting to any to override
  // CodeGenerator declaring .definitions protected.
  (generator as AnyDuringMigration).definitions_['import_dart_math'] =
    "import 'dart:math' as Math;";
  const argument0 = generator.valueToCode(block, 'X', Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'Y', Order.NONE) || '0';
  return [
    'Math.atan2(' + argument1 + ', ' + argument0 + ') / Math.pi * 180',
    Order.MULTIPLICATIVE,
  ];
}
