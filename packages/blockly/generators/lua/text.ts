/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Lua for text blocks.
 */

// Former goog.module ID: Blockly.Lua.texts

import type {JoinMutatorBlock} from '../../blocks/text.js';
import type {Block} from '../../core/block.js';
import type {LuaGenerator} from './lua_generator.js';
import {Order} from './lua_generator.js';

export function text(block: Block, generator: LuaGenerator): [string, Order] {
  // Text value.
  const code = generator.quote_(block.getFieldValue('TEXT'));
  return [code, Order.ATOMIC];
}

export function text_join(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  const joinBlock = block as JoinMutatorBlock;
  // Create a string made up of any number of elements of any type.
  if (joinBlock.itemCount_ === 0) {
    return ["''", Order.ATOMIC];
  } else if (joinBlock.itemCount_ === 1) {
    const element = generator.valueToCode(block, 'ADD0', Order.NONE) || "''";
    const code = 'tostring(' + element + ')';
    return [code, Order.HIGH];
  } else if (joinBlock.itemCount_ === 2) {
    const element0 =
      generator.valueToCode(block, 'ADD0', Order.CONCATENATION) || "''";
    const element1 =
      generator.valueToCode(block, 'ADD1', Order.CONCATENATION) || "''";
    const code = element0 + ' .. ' + element1;
    return [code, Order.CONCATENATION];
  } else {
    const elements = [];
    for (let i = 0; i < joinBlock.itemCount_; i++) {
      elements[i] = generator.valueToCode(block, 'ADD' + i, Order.NONE) || "''";
    }
    const code = 'table.concat({' + elements.join(', ') + '})';
    return [code, Order.HIGH];
  }
}

export function text_append(block: Block, generator: LuaGenerator): string {
  // Append to a variable in place.
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value =
    generator.valueToCode(block, 'TEXT', Order.CONCATENATION) || "''";
  return varName + ' = ' + varName + ' .. ' + value + '\n';
}

export function text_length(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // String or array length.
  const text = generator.valueToCode(block, 'VALUE', Order.UNARY) || "''";
  return ['#' + text, Order.UNARY];
}

export function text_isEmpty(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // Is the string null or array empty?
  const text = generator.valueToCode(block, 'VALUE', Order.UNARY) || "''";
  return ['#' + text + ' == 0', Order.RELATIONAL];
}

export function text_indexOf(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // Search the text for a substring.
  const substring = generator.valueToCode(block, 'FIND', Order.NONE) || "''";
  const text = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";
  let functionName;
  if (block.getFieldValue('END') === 'FIRST') {
    functionName = generator.provideFunction_(
      'firstIndexOf',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(str, substr)
  local i = string.find(str, substr, 1, true)
  if i == nil then
    return 0
  end
  return i
end
`,
    );
  } else {
    functionName = generator.provideFunction_(
      'lastIndexOf',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(str, substr)
  local i = string.find(string.reverse(str), string.reverse(substr), 1, true)
  if i then
    return #str + 2 - i - #substr
  end
  return 0
end
`,
    );
  }
  const code = functionName + '(' + text + ', ' + substring + ')';
  return [code, Order.HIGH];
}

export function text_charAt(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // Get letter at index.
  // Note: Until January 2013 this block did not have the WHERE input.
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const text = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";
  let code;
  if (where === 'RANDOM') {
    const functionName = generator.provideFunction_(
      'text_random_letter',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(str)
  local index = math.random(string.len(str))
  return string.sub(str, index, index)
end
`,
    );
    code = functionName + '(' + text + ')';
  } else {
    let start;
    if (where === 'FIRST') {
      start = '1';
    } else if (where === 'LAST') {
      start = '-1';
    } else {
      const atOrder = where === 'FROM_END' ? Order.UNARY : Order.NONE;
      const at = generator.valueToCode(block, 'AT', atOrder) || '1';
      if (where === 'FROM_START') {
        start = at;
      } else if (where === 'FROM_END') {
        start = '-' + at;
      } else {
        throw Error('Unhandled option (text_charAt).');
      }
    }
    if (start.match(/^-?\w*$/)) {
      code = 'string.sub(' + text + ', ' + start + ', ' + start + ')';
    } else {
      // use function to avoid reevaluation
      const functionName = generator.provideFunction_(
        'text_char_at',
        `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(str, index)
  return string.sub(str, index, index)
end
`,
      );
      code = functionName + '(' + text + ', ' + start + ')';
    }
  }
  return [code, Order.HIGH];
}

export function text_getSubstring(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // Get substring.
  const text = generator.valueToCode(block, 'STRING', Order.NONE) || "''";

  // Get start index.
  const where1 = block.getFieldValue('WHERE1');
  const at1Order = where1 === 'FROM_END' ? Order.UNARY : Order.NONE;
  const at1 = generator.valueToCode(block, 'AT1', at1Order) || '1';
  let start;
  if (where1 === 'FIRST') {
    start = 1;
  } else if (where1 === 'FROM_START') {
    start = at1;
  } else if (where1 === 'FROM_END') {
    start = '-' + at1;
  } else {
    throw Error('Unhandled option (text_getSubstring)');
  }

  // Get end index.
  const where2 = block.getFieldValue('WHERE2');
  const at2Order = where2 === 'FROM_END' ? Order.UNARY : Order.NONE;
  const at2 = generator.valueToCode(block, 'AT2', at2Order) || '1';
  let end;
  if (where2 === 'LAST') {
    end = -1;
  } else if (where2 === 'FROM_START') {
    end = at2;
  } else if (where2 === 'FROM_END') {
    end = '-' + at2;
  } else {
    throw Error('Unhandled option (text_getSubstring)');
  }
  const code = 'string.sub(' + text + ', ' + start + ', ' + end + ')';
  return [code, Order.HIGH];
}

export function text_changeCase(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // Change capitalization.
  const operator = block.getFieldValue('CASE');
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  let functionName;
  if (operator === 'UPPERCASE') {
    functionName = 'string.upper';
  } else if (operator === 'LOWERCASE') {
    functionName = 'string.lower';
  } else if (operator === 'TITLECASE') {
    // There are shorter versions at
    // http://lua-users.org/wiki/SciteTitleCase
    // that do not preserve whitespace.
    functionName = generator.provideFunction_(
      'text_titlecase',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(str)
  local buf = {}
  local inWord = false
  for i = 1, #str do
    local c = string.sub(str, i, i)
    if inWord then
      table.insert(buf, string.lower(c))
      if string.find(c, "%s") then
        inWord = false
      end
    else
      table.insert(buf, string.upper(c))
      inWord = true
    end
  end
  return table.concat(buf)
end
`,
    );
  }
  const code = functionName + '(' + text + ')';
  return [code, Order.HIGH];
}

export function text_trim(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // Trim spaces.
  const OPERATORS = {LEFT: '^%s*(,-)', RIGHT: '(.-)%s*$', BOTH: '^%s*(.-)%s*$'};
  type OperatorOption = keyof typeof OPERATORS;
  const operator = OPERATORS[block.getFieldValue('MODE') as OperatorOption];
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const code = 'string.gsub(' + text + ', "' + operator + '", "%1")';
  return [code, Order.HIGH];
}

export function text_print(block: Block, generator: LuaGenerator): string {
  // Print statement.
  const msg = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  return 'print(' + msg + ')\n';
}

export function text_prompt_ext(
  block: Block,
  generator: LuaGenerator,
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

  const functionName = generator.provideFunction_(
    'text_prompt',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(msg)
  io.write(msg)
  io.flush()
  return io.read()
end
`,
  );
  let code = functionName + '(' + msg + ')';

  const toNumber = block.getFieldValue('TYPE') === 'NUMBER';
  if (toNumber) {
    code = 'tonumber(' + code + ', 10)';
  }
  return [code, Order.HIGH];
}

export const text_prompt = text_prompt_ext;

export function text_count(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const sub = generator.valueToCode(block, 'SUB', Order.NONE) || "''";
  const functionName = generator.provideFunction_(
    'text_count',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(haystack, needle)
  if #needle == 0 then
    return #haystack + 1
  end
  local i = 1
  local count = 0
  while true do
    i = string.find(haystack, needle, i, true)
    if i == nil then
      break
    end
    count = count + 1
    i = i + #needle
  end
  return count
end
`,
  );
  const code = functionName + '(' + text + ', ' + sub + ')';
  return [code, Order.HIGH];
}

export function text_replace(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const from = generator.valueToCode(block, 'FROM', Order.NONE) || "''";
  const to = generator.valueToCode(block, 'TO', Order.NONE) || "''";
  const functionName = generator.provideFunction_(
    'text_replace',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(haystack, needle, replacement)
  local buf = {}
  local i = 1
  while i <= #haystack do
    if string.sub(haystack, i, i + #needle - 1) == needle then
      for j = 1, #replacement do
        table.insert(buf, string.sub(replacement, j, j))
      end
      i = i + #needle
    else
      table.insert(buf, string.sub(haystack, i, i))
      i = i + 1
    end
  end
  return table.concat(buf)
end
`,
  );
  const code = functionName + '(' + text + ', ' + from + ', ' + to + ')';
  return [code, Order.HIGH];
}

export function text_reverse(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const code = 'string.reverse(' + text + ')';
  return [code, Order.HIGH];
}
