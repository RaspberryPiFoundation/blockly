/**
 * @license
 * Copyright 2014 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Dart for text blocks.
 */

// Former goog.module ID: Blockly.Dart.texts

import type {JoinMutatorBlock} from '../../blocks/text.js';
import type {Block} from '../../core/block.js';
import type {DartGenerator} from './dart_generator.js';
import {Order} from './dart_generator.js';

// RESERVED WORDS: 'Html,Math'

export function text(block: Block, generator: DartGenerator): [string, Order] {
  // Text value.
  const code = generator.quote_(block.getFieldValue('TEXT'));
  return [code, Order.ATOMIC];
}

export function text_join(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Create a string made up of any number of elements of any type.
  const joinBlock = block as JoinMutatorBlock;
  switch (joinBlock.itemCount_) {
    case 0:
      return ["''", Order.ATOMIC];
    case 1: {
      const element =
        generator.valueToCode(block, 'ADD0', Order.UNARY_POSTFIX) || "''";
      const code = element + '.toString()';
      return [code, Order.UNARY_POSTFIX];
    }
    default: {
      const elements = new Array(joinBlock.itemCount_);
      for (let i = 0; i < joinBlock.itemCount_; i++) {
        elements[i] =
          generator.valueToCode(block, 'ADD' + i, Order.NONE) || "''";
      }
      const code = '[' + elements.join(',') + '].join()';
      return [code, Order.UNARY_POSTFIX];
    }
  }
}

export function text_append(block: Block, generator: DartGenerator) {
  // Append to a variable in place.
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  return varName + ' = [' + varName + ', ' + value + '].join();\n';
}

export function text_length(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // String or array length.
  const text =
    generator.valueToCode(block, 'VALUE', Order.UNARY_POSTFIX) || "''";
  return [text + '.length', Order.UNARY_POSTFIX];
}

export function text_isEmpty(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Is the string null or array empty?
  const text =
    generator.valueToCode(block, 'VALUE', Order.UNARY_POSTFIX) || "''";
  return [text + '.isEmpty', Order.UNARY_POSTFIX];
}

export function text_indexOf(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Search the text for a substring.
  const operator =
    block.getFieldValue('END') === 'FIRST' ? 'indexOf' : 'lastIndexOf';
  const substring = generator.valueToCode(block, 'FIND', Order.NONE) || "''";
  const text =
    generator.valueToCode(block, 'VALUE', Order.UNARY_POSTFIX) || "''";
  const code = text + '.' + operator + '(' + substring + ')';
  if (block.workspace.options.oneBasedIndex) {
    return [code + ' + 1', Order.ADDITIVE];
  }
  return [code, Order.UNARY_POSTFIX];
}

export function text_charAt(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Get letter at index.
  // Note: Until January 2013 this block did not have the WHERE input.
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const textOrder =
    where === 'FIRST' || where === 'FROM_START'
      ? Order.UNARY_POSTFIX
      : Order.NONE;
  const text = generator.valueToCode(block, 'VALUE', textOrder) || "''";
  let at;
  switch (where) {
    case 'FIRST': {
      const code = text + '[0]';
      return [code, Order.UNARY_POSTFIX];
    }
    case 'FROM_START': {
      at = generator.getAdjusted(block, 'AT');
      const code = text + '[' + at + ']';
      return [code, Order.UNARY_POSTFIX];
    }
    case 'LAST':
    case 'FROM_END': {
      if (where === 'LAST') {
        at = 1;
      } else {
        at = generator.getAdjusted(block, 'AT', 1);
      }
      const functionName = generator.provideFunction_(
        'text_get_from_end',
        `
String ${generator.FUNCTION_NAME_PLACEHOLDER_}(String text, num x) {
  return text[text.length - x];
}
`,
      );
      const code = `${functionName}(${text}, ${at})`;
      return [code, Order.UNARY_POSTFIX];
    }
    case 'RANDOM': {
      // TODO(#7600): find better approach than casting to any to override
      // CodeGenerator declaring .definitions protected.
      (generator as AnyDuringMigration).definitions_['import_dart_math'] =
        "import 'dart:math' as Math;";
      const functionName = generator.provideFunction_(
        'text_random_letter',
        `
String ${generator.FUNCTION_NAME_PLACEHOLDER_}(String text) {
  int x = new Math.Random().nextInt(text.length);
  return text[x];
}
`,
      );
      const code = functionName + '(' + text + ')';
      return [code, Order.UNARY_POSTFIX];
    }
  }
  throw Error('Unhandled option (text_charAt).');
}

export function text_getSubstring(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Get substring.
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  const requiresLengthCall = where1 !== 'FROM_END' && where2 === 'FROM_START';
  const textOrder = requiresLengthCall ? Order.UNARY_POSTFIX : Order.NONE;
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
        at1 = generator.getAdjusted(block, 'AT1', 1, false, Order.ADDITIVE);
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
        at2 = generator.getAdjusted(block, 'AT2', 0, false, Order.ADDITIVE);
        at2 = text + '.length - ' + at2;
        break;
      case 'LAST':
        break;
      default:
        throw Error('Unhandled option (text_getSubstring).');
    }

    if (where2 === 'LAST') {
      code = text + '.substring(' + at1 + ')';
    } else {
      code = text + '.substring(' + at1 + ', ' + at2 + ')';
    }
  } else {
    const at1 = generator.getAdjusted(block, 'AT1');
    const at2 = generator.getAdjusted(block, 'AT2');
    const functionName = generator.provideFunction_(
      'text_get_substring',
      `
String ${generator.FUNCTION_NAME_PLACEHOLDER_}(String text, String where1, num at1, String where2, num at2) {
  int getAt(String where, num at) {
    if (where == 'FROM_END') {
      at = text.length - 1 - at;
    } else if (where == 'FIRST') {
      at = 0;
    } else if (where == 'LAST') {
      at = text.length - 1;
    } else if (where != 'FROM_START') {
      throw 'Unhandled option (text_getSubstring).';
    }
    return at;
  }
  at1 = getAt(where1, at1);
  at2 = getAt(where2, at2) + 1;
  return text.substring(at1, at2);
}
`,
    );
    code =
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
  }
  return [code, Order.UNARY_POSTFIX];
}

export function text_changeCase(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Change capitalization.
  const OPERATORS = {
    'UPPERCASE': '.toUpperCase()',
    'LOWERCASE': '.toLowerCase()',
    'TITLECASE': null,
  };
  type OperatorOption = keyof typeof OPERATORS;
  const operator = OPERATORS[block.getFieldValue('CASE') as OperatorOption];
  const textOrder = operator ? Order.UNARY_POSTFIX : Order.NONE;
  const text = generator.valueToCode(block, 'TEXT', textOrder) || "''";
  let code;
  if (operator) {
    // Upper and lower case are functions built into generator.
    code = text + operator;
  } else {
    // Title case is not a native generator function.  Define one.
    const functionName = generator.provideFunction_(
      'text_toTitleCase',
      `
String ${generator.FUNCTION_NAME_PLACEHOLDER_}(String str) {
  RegExp exp = new RegExp(r'\\b');
  List<String> list = str.split(exp);
  final title = new StringBuffer();
  for (String part in list) {
    if (part.length > 0) {
      title.write(part[0].toUpperCase());
      if (part.length > 0) {
        title.write(part.substring(1).toLowerCase());
      }
    }
  }
  return title.toString();
}
`,
    );
    code = functionName + '(' + text + ')';
  }
  return [code, Order.UNARY_POSTFIX];
}

export function text_trim(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Trim spaces.
  const OPERATORS = {
    'LEFT': ".replaceFirst(new RegExp(r'^\\s+'), '')",
    'RIGHT': ".replaceFirst(new RegExp(r'\\s+$'), '')",
    'BOTH': '.trim()',
  };
  type OperatorOption = keyof typeof OPERATORS;
  const operator = OPERATORS[block.getFieldValue('MODE') as OperatorOption];
  const text =
    generator.valueToCode(block, 'TEXT', Order.UNARY_POSTFIX) || "''";
  return [text + operator, Order.UNARY_POSTFIX];
}

export function text_print(block: Block, generator: DartGenerator) {
  // Print statement.
  const msg = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  return 'print(' + msg + ');\n';
}

export function text_prompt_ext(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Prompt function.
  // TODO(#7600): find better approach than casting to any to override
  // CodeGenerator declaring .definitions protected.
  (generator as AnyDuringMigration).definitions_['import_dart_html'] =
    "import 'dart:html' as Html;";
  let msg;
  if (block.getField('TEXT')) {
    // Internal message.
    msg = generator.quote_(block.getFieldValue('TEXT'));
  } else {
    // External message.
    msg = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  }
  let code = 'Html.window.prompt(' + msg + ", '')";
  const toNumber = block.getFieldValue('TYPE') === 'NUMBER';
  if (toNumber) {
    // TODO(#7600): find better approach than casting to any to override
    // CodeGenerator declaring .definitions protected.
    (generator as AnyDuringMigration).definitions_['import_dart_math'] =
      "import 'dart:math' as Math;";
    code = 'Math.parseDouble(' + code + ')';
  }
  return [code, Order.UNARY_POSTFIX];
}

export const text_prompt = text_prompt_ext;

export function text_count(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const sub = generator.valueToCode(block, 'SUB', Order.NONE) || "''";
  // Substring count is not a native generator function.  Define one.
  const functionName = generator.provideFunction_(
    'text_count',
    `
int ${generator.FUNCTION_NAME_PLACEHOLDER_}(String haystack, String needle) {
  if (needle.length == 0) {
    return haystack.length + 1;
  }
  int index = 0;
  int count = 0;
  while (index != -1) {
    index = haystack.indexOf(needle, index);
    if (index != -1) {
      count++;
     index += needle.length;
    }
  }
  return count;
}
`,
  );
  const code = functionName + '(' + text + ', ' + sub + ')';
  return [code, Order.UNARY_POSTFIX];
}

export function text_replace(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  const text =
    generator.valueToCode(block, 'TEXT', Order.UNARY_POSTFIX) || "''";
  const from = generator.valueToCode(block, 'FROM', Order.NONE) || "''";
  const to = generator.valueToCode(block, 'TO', Order.NONE) || "''";
  const code = text + '.replaceAll(' + from + ', ' + to + ')';
  return [code, Order.UNARY_POSTFIX];
}

export function text_reverse(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // There isn't a sensible way to do this in generator. See:
  // http://stackoverflow.com/a/21613700/3529104
  // Implementing something is possibly better than not implementing anything?
  const text =
    generator.valueToCode(block, 'TEXT', Order.UNARY_POSTFIX) || "''";
  const code = 'new String.fromCharCodes(' + text + '.runes.toList().reversed)';
  return [code, Order.UNARY_PREFIX];
}
