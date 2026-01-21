/**
 * @license
 * Copyright 2015 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating PHP for text blocks.
 */

// Former goog.module ID: Blockly.PHP.texts

import type {JoinMutatorBlock} from '../../blocks/text.js';
import type {Block} from '../../core/block.js';
import type {PhpGenerator} from './php_generator.js';
import {Order} from './php_generator.js';

export function text(block: Block, generator: PhpGenerator): [string, Order] {
  // Text value.
  const code = generator.quote_(block.getFieldValue('TEXT'));
  return [code, Order.ATOMIC];
}

export function text_join(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Create a string made up of any number of elements of any type.
  const joinBlock = block as JoinMutatorBlock;
  if (joinBlock.itemCount_ === 0) {
    return ["''", Order.ATOMIC];
  } else if (joinBlock.itemCount_ === 1) {
    const element = generator.valueToCode(block, 'ADD0', Order.NONE) || "''";
    const code = element;
    return [code, Order.NONE];
  } else if (joinBlock.itemCount_ === 2) {
    const element0 =
      generator.valueToCode(block, 'ADD0', Order.STRING_CONCAT) || "''";
    const element1 =
      generator.valueToCode(block, 'ADD1', Order.STRING_CONCAT) || "''";
    const code = element0 + ' . ' + element1;
    return [code, Order.STRING_CONCAT];
  } else {
    const elements = new Array(joinBlock.itemCount_);
    for (let i = 0; i < joinBlock.itemCount_; i++) {
      elements[i] = generator.valueToCode(block, 'ADD' + i, Order.NONE) || "''";
    }
    const code = "implode('', array(" + elements.join(',') + '))';
    return [code, Order.FUNCTION_CALL];
  }
}

export function text_append(block: Block, generator: PhpGenerator) {
  // Append to a variable in place.
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'TEXT', Order.ASSIGNMENT) || "''";
  return varName + ' .= ' + value + ';\n';
}

export function text_length(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // String or array length.
  const functionName = generator.provideFunction_(
    'length',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($value) {
  if (is_string($value)) {
    return strlen($value);
  }
  return count($value);
}
`,
  );
  const text = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";
  return [functionName + '(' + text + ')', Order.FUNCTION_CALL];
}

export function text_isEmpty(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Is the string null or array empty?
  const text = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";
  return ['empty(' + text + ')', Order.FUNCTION_CALL];
}

export function text_indexOf(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Search the text for a substring.
  const operator =
    block.getFieldValue('END') === 'FIRST' ? 'strpos' : 'strrpos';
  const substring = generator.valueToCode(block, 'FIND', Order.NONE) || "''";
  const text = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";
  let errorIndex = ' -1';
  let indexAdjustment = '';
  if (block.workspace.options.oneBasedIndex) {
    errorIndex = ' 0';
    indexAdjustment = ' + 1';
  }
  const functionName = generator.provideFunction_(
    block.getFieldValue('END') === 'FIRST'
      ? 'text_indexOf'
      : 'text_lastIndexOf',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($text, $search) {
  $pos = ${operator}($text, $search);
  return $pos === false ? ${errorIndex} : $pos${indexAdjustment};
}
`,
  );
  const code = functionName + '(' + text + ', ' + substring + ')';
  return [code, Order.FUNCTION_CALL];
}

export function text_charAt(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Get letter at index.
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const textOrder = where === 'RANDOM' ? Order.NONE : Order.NONE;
  const text = generator.valueToCode(block, 'VALUE', textOrder) || "''";
  switch (where) {
    case 'FIRST': {
      const code = 'substr(' + text + ', 0, 1)';
      return [code, Order.FUNCTION_CALL];
    }
    case 'LAST': {
      const code = 'substr(' + text + ', -1)';
      return [code, Order.FUNCTION_CALL];
    }
    case 'FROM_START': {
      const at = generator.getAdjusted(block, 'AT');
      const code = 'substr(' + text + ', ' + at + ', 1)';
      return [code, Order.FUNCTION_CALL];
    }
    case 'FROM_END': {
      const at = generator.getAdjusted(block, 'AT', 1, true);
      const code = 'substr(' + text + ', ' + at + ', 1)';
      return [code, Order.FUNCTION_CALL];
    }
    case 'RANDOM': {
      const functionName = generator.provideFunction_(
        'text_random_letter',
        `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($text) {
  return $text[rand(0, strlen($text) - 1)];
}
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
  generator: PhpGenerator,
): [string, Order] {
  // Get substring.
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  const text = generator.valueToCode(block, 'STRING', Order.NONE) || "''";
  if (where1 === 'FIRST' && where2 === 'LAST') {
    const code = text;
    return [code, Order.NONE];
  } else {
    const at1 = generator.getAdjusted(block, 'AT1');
    const at2 = generator.getAdjusted(block, 'AT2');
    const functionName = generator.provideFunction_(
      'text_get_substring',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($text, $where1, $at1, $where2, $at2) {
  if ($where1 == 'FROM_END') {
    $at1 = strlen($text) - 1 - $at1;
  } else if ($where1 == 'FIRST') {
    $at1 = 0;
  } else if ($where1 != 'FROM_START') {
    throw new Exception('Unhandled option (text_get_substring).');
  }
  $length = 0;
  if ($where2 == 'FROM_START') {
    $length = $at2 - $at1 + 1;
  } else if ($where2 == 'FROM_END') {
    $length = strlen($text) - $at1 - $at2;
  } else if ($where2 == 'LAST') {
    $length = strlen($text) - $at1;
  } else {
    throw new Exception('Unhandled option (text_get_substring).');
  }
  return substr($text, $at1, $length);
}
`,
    );
    const code =
      functionName +
      '(' +
      text +
      ", '" +
      where1 +
      "', " +
      at1 +
      ", '" +
      where2 +
      "', " +
      at2 +
      ')';
    return [code, Order.FUNCTION_CALL];
  }
}

export function text_changeCase(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Change capitalization.
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  let code;
  if (block.getFieldValue('CASE') === 'UPPERCASE') {
    code = 'strtoupper(' + text + ')';
  } else if (block.getFieldValue('CASE') === 'LOWERCASE') {
    code = 'strtolower(' + text + ')';
  } else if (block.getFieldValue('CASE') === 'TITLECASE') {
    code = 'ucwords(strtolower(' + text + '))';
  }
  return [code as string, Order.FUNCTION_CALL];
}

export function text_trim(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Trim spaces.
  const OPERATORS = {'LEFT': 'ltrim', 'RIGHT': 'rtrim', 'BOTH': 'trim'};
  type OperatorOption = keyof typeof OPERATORS;
  const operator = OPERATORS[block.getFieldValue('MODE') as OperatorOption];
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  return [operator + '(' + text + ')', Order.FUNCTION_CALL];
}

export function text_print(block: Block, generator: PhpGenerator) {
  // Print statement.
  const msg = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  return 'print(' + msg + ');\n';
}

export function text_prompt_ext(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Prompt function.
  let msg;
  if (block.getField('TEXT')) {
    // Internal message.
    msg = generator.quote_(block.getFieldValue('TEXT'));
  } else {
    // External message.
    msg = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  }
  let code = 'readline(' + msg + ')';
  const toNumber = block.getFieldValue('TYPE') === 'NUMBER';
  if (toNumber) {
    code = 'floatval(' + code + ')';
  }
  return [code, Order.FUNCTION_CALL];
}

export const text_prompt = text_prompt_ext;

export function text_count(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const sub = generator.valueToCode(block, 'SUB', Order.NONE) || "''";
  const code =
    'strlen(' +
    sub +
    ') === 0' +
    ' ? strlen(' +
    text +
    ') + 1' +
    ' : substr_count(' +
    text +
    ', ' +
    sub +
    ')';
  return [code, Order.CONDITIONAL];
}

export function text_replace(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const from = generator.valueToCode(block, 'FROM', Order.NONE) || "''";
  const to = generator.valueToCode(block, 'TO', Order.NONE) || "''";
  const code = 'str_replace(' + from + ', ' + to + ', ' + text + ')';
  return [code, Order.FUNCTION_CALL];
}

export function text_reverse(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const code = 'strrev(' + text + ')';
  return [code, Order.FUNCTION_CALL];
}
