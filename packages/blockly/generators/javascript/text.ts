/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating JavaScript for text blocks.
 */

// Former goog.module ID: Blockly.JavaScript.texts

import type {JoinMutatorBlock} from '../../blocks/text.js';
import type {Block} from '../../core/block.js';
import type {JavascriptGenerator} from './javascript_generator.js';
import {Order} from './javascript_generator.js';

/**
 * Regular expression to detect a single-quoted string literal.
 */
const strRegExp = /^\s*'([^']|\\')*'\s*$/;

/**
 * Enclose the provided value in 'String(...)' function.
 * Leave string literals alone.
 * @param value Code evaluating to a value.
 * @returns Array containing code evaluating to a string
 *     and the order of the returned code.[string, number]
 */
const forceString = function (value: string): [string, Order] {
  if (strRegExp.test(value)) {
    return [value, Order.ATOMIC];
  }
  return ['String(' + value + ')', Order.FUNCTION_CALL];
};

/**
 * Returns an expression calculating the index into a string.
 * @param stringName Name of the string, used to calculate length.
 * @param where The method of indexing, selected by dropdown in Blockly
 * @param opt_at The optional offset when indexing from start/end.
 * @returns Index expression.
 */
const getSubstringIndex = function (
  stringName: string,
  where: string,
  opt_at?: string,
): string | undefined {
  if (where === 'FIRST') {
    return '0';
  } else if (where === 'FROM_END') {
    return stringName + '.length - 1 - ' + opt_at;
  } else if (where === 'LAST') {
    return stringName + '.length - 1';
  } else {
    return opt_at;
  }
};

export function text(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Text value.
  const code = generator.quote_(block.getFieldValue('TEXT'));
  return [code, Order.ATOMIC];
}

export function text_join(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Create a string made up of any number of elements of any type.
  const joinBlock = block as JoinMutatorBlock;
  switch (joinBlock.itemCount_) {
    case 0:
      return ["''", Order.ATOMIC];
    case 1: {
      const element =
        generator.valueToCode(joinBlock, 'ADD0', Order.NONE) || "''";
      const codeAndOrder = forceString(element);
      return codeAndOrder;
    }
    case 2: {
      const element0 =
        generator.valueToCode(joinBlock, 'ADD0', Order.NONE) || "''";
      const element1 =
        generator.valueToCode(joinBlock, 'ADD1', Order.NONE) || "''";
      const code = forceString(element0)[0] + ' + ' + forceString(element1)[0];
      return [code, Order.ADDITION];
    }
    default: {
      const elements = new Array(joinBlock.itemCount_);
      for (let i = 0; i < joinBlock.itemCount_; i++) {
        elements[i] =
          generator.valueToCode(joinBlock, 'ADD' + i, Order.NONE) || "''";
      }
      const code = '[' + elements.join(',') + "].join('')";
      return [code, Order.FUNCTION_CALL];
    }
  }
}

export function text_append(block: Block, generator: JavascriptGenerator) {
  // Append to a variable in place.
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const code = varName + ' += ' + forceString(value)[0] + ';\n';
  return code;
}

export function text_length(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // String or array length.
  const text = generator.valueToCode(block, 'VALUE', Order.MEMBER) || "''";
  return [text + '.length', Order.MEMBER];
}

export function text_isEmpty(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Is the string null or array empty?
  const text = generator.valueToCode(block, 'VALUE', Order.MEMBER) || "''";
  return ['!' + text + '.length', Order.LOGICAL_NOT];
}

export function text_indexOf(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Search the text for a substring.
  const operator =
    block.getFieldValue('END') === 'FIRST' ? 'indexOf' : 'lastIndexOf';
  const substring = generator.valueToCode(block, 'FIND', Order.NONE) || "''";
  const text = generator.valueToCode(block, 'VALUE', Order.MEMBER) || "''";
  const code = text + '.' + operator + '(' + substring + ')';
  // Adjust index if using one-based indices.
  if (block.workspace.options.oneBasedIndex) {
    return [code + ' + 1', Order.ADDITION];
  }
  return [code, Order.FUNCTION_CALL];
}

export function text_charAt(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Get letter at index.
  // Note: Until January 2013 this block did not have the WHERE input.
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const textOrder = where === 'RANDOM' ? Order.NONE : Order.MEMBER;
  const text = generator.valueToCode(block, 'VALUE', textOrder) || "''";
  switch (where) {
    case 'FIRST': {
      const code = text + '.charAt(0)';
      return [code, Order.FUNCTION_CALL];
    }
    case 'LAST': {
      const code = text + '.slice(-1)';
      return [code, Order.FUNCTION_CALL];
    }
    case 'FROM_START': {
      const at = generator.getAdjusted(block, 'AT');
      // Adjust index if using one-based indices.
      const code = text + '.charAt(' + at + ')';
      return [code, Order.FUNCTION_CALL];
    }
    case 'FROM_END': {
      const at = generator.getAdjusted(block, 'AT', 1, true);
      const code = text + '.slice(' + at + ').charAt(0)';
      return [code, Order.FUNCTION_CALL];
    }
    case 'RANDOM': {
      const functionName = generator.provideFunction_(
        'textRandomLetter',
        `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(text) {
  var x = Math.floor(Math.random() * text.length);
  return text[x];
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
  generator: JavascriptGenerator,
): [string, Order] {
  // Dictionary of WHEREn field choices and their CamelCase equivalents. */
  const wherePascalCase = {
    'FIRST': 'First',
    'LAST': 'Last',
    'FROM_START': 'FromStart',
    'FROM_END': 'FromEnd',
  };
  type WhereOption = keyof typeof wherePascalCase;
  // Get substring.
  const where1 = block.getFieldValue('WHERE1') as WhereOption;
  const where2 = block.getFieldValue('WHERE2') as WhereOption;
  const requiresLengthCall =
    where1 !== 'FROM_END' &&
    where1 !== 'LAST' &&
    where2 !== 'FROM_END' &&
    where2 !== 'LAST';
  const textOrder = requiresLengthCall ? Order.MEMBER : Order.NONE;
  const text = generator.valueToCode(block, 'STRING', textOrder) || "''";
  let code;
  if (where1 === 'FIRST' && where2 === 'LAST') {
    code = text;
    return [code, Order.NONE];
  } else if (text.match(/^'?\w+'?$/) || requiresLengthCall) {
    // If the text is a variable or literal or doesn't require a call for
    // length, don't generate a helper function.
    let at1;
    switch (where1) {
      case 'FROM_START':
        at1 = generator.getAdjusted(block, 'AT1');
        break;
      case 'FROM_END':
        at1 = generator.getAdjusted(block, 'AT1', 1, false, Order.SUBTRACTION);
        at1 = text + '.length - ' + at1;
        break;
      case 'FIRST':
        at1 = '0';
        break;
      default:
        throw Error('Unhandled option (text_getSubstring).');
    }
    let at2;
    switch (where2) {
      case 'FROM_START':
        at2 = generator.getAdjusted(block, 'AT2', 1);
        break;
      case 'FROM_END':
        at2 = generator.getAdjusted(block, 'AT2', 0, false, Order.SUBTRACTION);
        at2 = text + '.length - ' + at2;
        break;
      case 'LAST':
        at2 = text + '.length';
        break;
      default:
        throw Error('Unhandled option (text_getSubstring).');
    }
    code = text + '.slice(' + at1 + ', ' + at2 + ')';
  } else {
    const at1 = generator.getAdjusted(block, 'AT1');
    const at2 = generator.getAdjusted(block, 'AT2');
    // The value for 'FROM_END' and'FROM_START' depends on `at` so
    // we add it as a parameter.
    const at1Param =
      where1 === 'FROM_END' || where1 === 'FROM_START' ? ', at1' : '';
    const at2Param =
      where2 === 'FROM_END' || where2 === 'FROM_START' ? ', at2' : '';
    const functionName = generator.provideFunction_(
      'subsequence' + wherePascalCase[where1] + wherePascalCase[where2],
      `
function ${
        generator.FUNCTION_NAME_PLACEHOLDER_
      }(sequence${at1Param}${at2Param}) {
  var start = ${getSubstringIndex('sequence', where1, 'at1')};
  var end = ${getSubstringIndex('sequence', where2, 'at2')} + 1;
  return sequence.slice(start, end);
}
`,
    );
    code =
      functionName +
      '(' +
      text +
      // The value for 'FROM_END' and 'FROM_START' depends on `at` so we
      // pass it.
      (where1 === 'FROM_END' || where1 === 'FROM_START' ? ', ' + at1 : '') +
      (where2 === 'FROM_END' || where2 === 'FROM_START' ? ', ' + at2 : '') +
      ')';
  }
  return [code, Order.FUNCTION_CALL];
}

export function text_changeCase(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Change capitalization.
  const OPERATORS = {
    'UPPERCASE': '.toUpperCase()',
    'LOWERCASE': '.toLowerCase()',
    'TITLECASE': null,
  };
  type OperatorOption = keyof typeof OPERATORS;
  const operator = OPERATORS[block.getFieldValue('CASE') as OperatorOption];
  const textOrder = operator ? Order.MEMBER : Order.NONE;
  const text = generator.valueToCode(block, 'TEXT', textOrder) || "''";
  let code;
  if (operator) {
    // Upper and lower case are functions built into generator.
    code = text + operator;
  } else {
    // Title case is not a native JavaScript function.  Define one.
    const functionName = generator.provideFunction_(
      'textToTitleCase',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(str) {
  return str.replace(/\\S+/g,
      function(txt) {return txt[0].toUpperCase() + txt.substring(1).toLowerCase();});
}
`,
    );
    code = functionName + '(' + text + ')';
  }
  return [code, Order.FUNCTION_CALL];
}

export function text_trim(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Trim spaces.
  const OPERATORS = {
    'LEFT': ".replace(/^[\\s\\xa0]+/, '')",
    'RIGHT': ".replace(/[\\s\\xa0]+$/, '')",
    'BOTH': '.trim()',
  };
  type OperatorOption = keyof typeof OPERATORS;
  const operator = OPERATORS[block.getFieldValue('MODE') as OperatorOption];
  const text = generator.valueToCode(block, 'TEXT', Order.MEMBER) || "''";
  return [text + operator, Order.FUNCTION_CALL];
}

export function text_print(block: Block, generator: JavascriptGenerator) {
  // Print statement.
  const msg = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  return 'window.alert(' + msg + ');\n';
}

export function text_prompt_ext(
  block: Block,
  generator: JavascriptGenerator,
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
  let code = 'window.prompt(' + msg + ')';
  const toNumber = block.getFieldValue('TYPE') === 'NUMBER';
  if (toNumber) {
    code = 'Number(' + code + ')';
  }
  return [code, Order.FUNCTION_CALL];
}

export const text_prompt = text_prompt_ext;

export function text_count(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const sub = generator.valueToCode(block, 'SUB', Order.NONE) || "''";
  const functionName = generator.provideFunction_(
    'textCount',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(haystack, needle) {
  if (needle.length === 0) {
    return haystack.length + 1;
  } else {
    return haystack.split(needle).length - 1;
  }
}
`,
  );
  const code = functionName + '(' + text + ', ' + sub + ')';
  return [code, Order.FUNCTION_CALL];
}

export function text_replace(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const from = generator.valueToCode(block, 'FROM', Order.NONE) || "''";
  const to = generator.valueToCode(block, 'TO', Order.NONE) || "''";
  // The regex escaping code below is taken from the implementation of
  // goog.string.regExpEscape.
  const functionName = generator.provideFunction_(
    'textReplace',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(haystack, needle, replacement) {
  needle = needle.replace(/([-()\\[\\]{}+?*.$\\^|,:#<!\\\\])/g, '\\\\$1')
                 .replace(/\\x08/g, '\\\\x08');
  return haystack.replace(new RegExp(needle, 'g'), replacement);
}
`,
  );
  const code = functionName + '(' + text + ', ' + from + ', ' + to + ')';
  return [code, Order.FUNCTION_CALL];
}

export function text_reverse(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  const text = generator.valueToCode(block, 'TEXT', Order.MEMBER) || "''";
  const code = text + ".split('').reverse().join('')";
  return [code, Order.FUNCTION_CALL];
}
