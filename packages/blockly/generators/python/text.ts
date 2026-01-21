/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Python for text blocks.
 */

// Former goog.module ID: Blockly.Python.texts

import type {JoinMutatorBlock} from '../../blocks/text.js';
import type {Block} from '../../core/block.js';
import {NameType} from '../../core/names.js';
import * as stringUtils from '../../core/utils/string.js';
import type {PythonGenerator} from './python_generator.js';
import {Order} from './python_generator.js';

export function text(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Text value.
  const code = generator.quote_(block.getFieldValue('TEXT'));
  return [code, Order.ATOMIC];
}

/**
 * Regular expression to detect a single-quoted string literal.
 */
const strRegExp = /^\s*'([^']|\\')*'\s*$/;

/**
 * Enclose the provided value in 'str(...)' function.
 * Leave string literals alone.
 *
 * @param value Code evaluating to a value.
 * @returns Array containing code evaluating to a string
 *     and
 *    the order of the returned code.[string, number]
 */
const forceString = function (value: string): [string, Order] {
  if (strRegExp.test(value)) {
    return [value, Order.ATOMIC];
  }
  return ['str(' + value + ')', Order.FUNCTION_CALL];
};

export function text_join(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Create a string made up of any number of elements of any type.
  // Should we allow joining by '-' or ',' or any other characters?
  const joinBlock = block as JoinMutatorBlock;
  switch (joinBlock.itemCount_) {
    case 0:
      return ["''", Order.ATOMIC];
    case 1: {
      const element = generator.valueToCode(block, 'ADD0', Order.NONE) || "''";
      const codeAndOrder = forceString(element);
      return codeAndOrder;
    }
    case 2: {
      const element0 = generator.valueToCode(block, 'ADD0', Order.NONE) || "''";
      const element1 = generator.valueToCode(block, 'ADD1', Order.NONE) || "''";
      const code = forceString(element0)[0] + ' + ' + forceString(element1)[0];
      return [code, Order.ADDITIVE];
    }
    default: {
      const elements = [];
      for (let i = 0; i < joinBlock.itemCount_; i++) {
        elements[i] =
          generator.valueToCode(block, 'ADD' + i, Order.NONE) || "''";
      }
      const tempVar = generator.nameDB_!.getDistinctName(
        'x',
        NameType.VARIABLE,
      );
      const code =
        "''.join([str(" +
        tempVar +
        ') for ' +
        tempVar +
        ' in [' +
        elements.join(', ') +
        ']])';
      return [code, Order.FUNCTION_CALL];
    }
  }
}

export function text_append(block: Block, generator: PythonGenerator) {
  // Append to a variable in place.
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  return varName + ' = str(' + varName + ') + ' + forceString(value)[0] + '\n';
}

export function text_length(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Is the string null or array empty?
  const text = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";
  return ['len(' + text + ')', Order.FUNCTION_CALL];
}

export function text_isEmpty(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Is the string null or array empty?
  const text = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";
  const code = 'not len(' + text + ')';
  return [code, Order.LOGICAL_NOT];
}

export function text_indexOf(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Search the text for a substring.
  // Should we allow for non-case sensitive???
  const operator = block.getFieldValue('END') === 'FIRST' ? 'find' : 'rfind';
  const substring = generator.valueToCode(block, 'FIND', Order.NONE) || "''";
  const text = generator.valueToCode(block, 'VALUE', Order.MEMBER) || "''";
  const code = text + '.' + operator + '(' + substring + ')';
  if (block.workspace.options.oneBasedIndex) {
    return [code + ' + 1', Order.ADDITIVE];
  }
  return [code, Order.FUNCTION_CALL];
}

export function text_charAt(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Get letter at index.
  // Note: Until January 2013 this block did not have the WHERE input.
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const textOrder = where === 'RANDOM' ? Order.NONE : Order.MEMBER;
  const text = generator.valueToCode(block, 'VALUE', textOrder) || "''";
  switch (where) {
    case 'FIRST': {
      const code = text + '[0]';
      return [code, Order.MEMBER];
    }
    case 'LAST': {
      const code = text + '[-1]';
      return [code, Order.MEMBER];
    }
    case 'FROM_START': {
      const at = generator.getAdjustedInt(block, 'AT');
      const code = text + '[' + at + ']';
      return [code, Order.MEMBER];
    }
    case 'FROM_END': {
      const at = generator.getAdjustedInt(block, 'AT', 1, true);
      const code = text + '[' + at + ']';
      return [code, Order.MEMBER];
    }
    case 'RANDOM': {
      // TODO(#7600): find better approach than casting to any to override
      // CodeGenerator declaring .definitions protected (here and below).
      (generator as AnyDuringMigration).definitions_['import_random'] =
        'import random';
      const functionName = generator.provideFunction_(
        'text_random_letter',
        `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(text):
  x = int(random.random() * len(text))
  return text[x]
`,
      );
      const code = functionName + '(' + text + ')';
      return [code, Order.FUNCTION_CALL];
    }
  }
  throw Error('Unhandled option (text_charAt).');
}

export function text_getSubstring(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Get substring.
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  const text = generator.valueToCode(block, 'STRING', Order.MEMBER) || "''";
  let at1;
  switch (where1) {
    case 'FROM_START':
      at1 = generator.getAdjustedInt(block, 'AT1');
      if (at1 === 0) {
        at1 = '';
      }
      break;
    case 'FROM_END':
      at1 = generator.getAdjustedInt(block, 'AT1', 1, true);
      break;
    case 'FIRST':
      at1 = '';
      break;
    default:
      throw Error('Unhandled option (text_getSubstring)');
  }

  let at2;
  switch (where2) {
    case 'FROM_START':
      at2 = generator.getAdjustedInt(block, 'AT2', 1);
      break;
    case 'FROM_END':
      at2 = generator.getAdjustedInt(block, 'AT2', 0, true);
      // Ensure that if the result calculated is 0 that sub-sequence will
      // include all elements as expected.
      if (!stringUtils.isNumber(String(at2))) {
        (generator as AnyDuringMigration).definitions_['import_sys'] =
          'import sys';
        at2 += ' or sys.maxsize';
      } else if (at2 === 0) {
        at2 = '';
      }
      break;
    case 'LAST':
      at2 = '';
      break;
    default:
      throw Error('Unhandled option (text_getSubstring)');
  }
  const code = text + '[' + at1 + ' : ' + at2 + ']';
  return [code, Order.MEMBER];
}

export function text_changeCase(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Change capitalization.
  const OPERATORS = {
    'UPPERCASE': '.upper()',
    'LOWERCASE': '.lower()',
    'TITLECASE': '.title()',
  };
  type OperatorOption = keyof typeof OPERATORS;
  const operator = OPERATORS[block.getFieldValue('CASE') as OperatorOption];
  const text = generator.valueToCode(block, 'TEXT', Order.MEMBER) || "''";
  const code = text + operator;
  return [code, Order.FUNCTION_CALL];
}

export function text_trim(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Trim spaces.
  const OPERATORS = {
    'LEFT': '.lstrip()',
    'RIGHT': '.rstrip()',
    'BOTH': '.strip()',
  };
  type OperatorOption = keyof typeof OPERATORS;
  const operator = OPERATORS[block.getFieldValue('MODE') as OperatorOption];
  const text = generator.valueToCode(block, 'TEXT', Order.MEMBER) || "''";
  const code = text + operator;
  return [code, Order.FUNCTION_CALL];
}

export function text_print(block: Block, generator: PythonGenerator) {
  // Print statement.
  const msg = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  return 'print(' + msg + ')\n';
}

export function text_prompt_ext(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Prompt function.
  const functionName = generator.provideFunction_(
    'text_prompt',
    `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(msg):
  try:
    return raw_input(msg)
  except NameError:
    return input(msg)
`,
  );
  let msg;
  if (block.getField('TEXT')) {
    // Internal message.
    msg = generator.quote_(block.getFieldValue('TEXT'));
  } else {
    // External message.
    msg = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  }
  let code = functionName + '(' + msg + ')';
  const toNumber = block.getFieldValue('TYPE') === 'NUMBER';
  if (toNumber) {
    code = 'float(' + code + ')';
  }
  return [code, Order.FUNCTION_CALL];
}

export const text_prompt = text_prompt_ext;

export function text_count(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  const text = generator.valueToCode(block, 'TEXT', Order.MEMBER) || "''";
  const sub = generator.valueToCode(block, 'SUB', Order.NONE) || "''";
  const code = text + '.count(' + sub + ')';
  return [code, Order.FUNCTION_CALL];
}

export function text_replace(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  const text = generator.valueToCode(block, 'TEXT', Order.MEMBER) || "''";
  const from = generator.valueToCode(block, 'FROM', Order.NONE) || "''";
  const to = generator.valueToCode(block, 'TO', Order.NONE) || "''";
  const code = text + '.replace(' + from + ', ' + to + ')';
  return [code, Order.MEMBER];
}

export function text_reverse(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  const text = generator.valueToCode(block, 'TEXT', Order.MEMBER) || "''";
  const code = text + '[::-1]';
  return [code, Order.MEMBER];
}
