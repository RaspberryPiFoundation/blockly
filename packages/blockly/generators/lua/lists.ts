/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Lua for list blocks.
 */

// Former goog.module ID: Blockly.Lua.lists

import type {CreateWithBlock} from '../../blocks/lists.js';
import type {Block} from '../../core/block.js';
import {NameType} from '../../core/names.js';
import type {LuaGenerator} from './lua_generator.js';
import {Order} from './lua_generator.js';

export function lists_create_empty(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // Create an empty list.
  return ['{}', Order.HIGH];
}

export function lists_create_with(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  const createWithBlock = block as CreateWithBlock;
  // Create a list with any number of elements of any type.
  const elements = new Array(createWithBlock.itemCount_);
  for (let i = 0; i < createWithBlock.itemCount_; i++) {
    elements[i] =
      generator.valueToCode(createWithBlock, 'ADD' + i, Order.NONE) || 'nil';
  }
  const code = '{' + elements.join(', ') + '}';
  return [code, Order.HIGH];
}

export function lists_repeat(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // Create a list with one element repeated.
  const functionName = generator.provideFunction_(
    'create_list_repeated',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(item, count)
  local t = {}
  for i = 1, count do
    table.insert(t, item)
  end
  return t
end
  `,
  );
  const element = generator.valueToCode(block, 'ITEM', Order.NONE) || 'nil';
  const repeatCount = generator.valueToCode(block, 'NUM', Order.NONE) || '0';
  const code = functionName + '(' + element + ', ' + repeatCount + ')';
  return [code, Order.HIGH];
}

export function lists_length(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // String or array length.
  const list = generator.valueToCode(block, 'VALUE', Order.UNARY) || '{}';
  return ['#' + list, Order.UNARY];
}

export function lists_isEmpty(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // Is the string null or array empty?
  const list = generator.valueToCode(block, 'VALUE', Order.UNARY) || '{}';
  const code = '#' + list + ' == 0';
  return [code, Order.RELATIONAL];
}

export function lists_indexOf(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // Find an item in the list.
  const item = generator.valueToCode(block, 'FIND', Order.NONE) || "''";
  const list = generator.valueToCode(block, 'VALUE', Order.NONE) || '{}';
  let functionName;
  if (block.getFieldValue('END') === 'FIRST') {
    functionName = generator.provideFunction_(
      'first_index',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(t, elem)
  for k, v in ipairs(t) do
    if v == elem then
      return k
    end
  end
  return 0
end
`,
    );
  } else {
    functionName = generator.provideFunction_(
      'last_index',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(t, elem)
  for i = #t, 1, -1 do
    if t[i] == elem then
      return i
    end
  end
  return 0
end
`,
    );
  }
  const code = functionName + '(' + list + ', ' + item + ')';
  return [code, Order.HIGH];
}

/**
 * Returns an expression calculating the index into a list.
 *
 * @param listName Name of the list, used to calculate length.
 * @param where The method of indexing, selected by dropdown in Blockly
 * @param opt_at The optional offset when indexing from start/end.
 * @returns Index expression.
 */
const getListIndex = function (
  listName: string,
  where: string,
  opt_at: string,
): string {
  if (where === 'FIRST') {
    return '1';
  } else if (where === 'FROM_END') {
    return '#' + listName + ' + 1 - ' + opt_at;
  } else if (where === 'LAST') {
    return '#' + listName;
  } else if (where === 'RANDOM') {
    return 'math.random(#' + listName + ')';
  } else {
    return opt_at;
  }
};

export function lists_getIndex(
  block: Block,
  generator: LuaGenerator,
): [string, Order] | string {
  // Get element at index.
  // Note: Until January 2013 this block did not have MODE or WHERE inputs.
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const list = generator.valueToCode(block, 'VALUE', Order.HIGH) || '({})';

  // If `list` would be evaluated more than once (which is the case for LAST,
  // FROM_END, and RANDOM) and is non-trivial, make sure to access it only once.
  if (
    (where === 'LAST' || where === 'FROM_END' || where === 'RANDOM') &&
    !list.match(/^\w+$/)
  ) {
    // `list` is an expression, so we may not evaluate it more than once.
    if (mode === 'REMOVE') {
      // We can use multiple statements.
      const atOrder = where === 'FROM_END' ? Order.ADDITIVE : Order.NONE;
      let at = generator.valueToCode(block, 'AT', atOrder) || '1';
      const listVar = generator.nameDB_!.getDistinctName(
        'tmp_list',
        NameType.VARIABLE,
      );
      at = getListIndex(listVar, where, at);
      const code =
        listVar +
        ' = ' +
        list +
        '\n' +
        'table.remove(' +
        listVar +
        ', ' +
        at +
        ')\n';
      return code;
    } else {
      // We need to create a procedure to avoid reevaluating values.
      const at = generator.valueToCode(block, 'AT', Order.NONE) || '1';
      let functionName;
      if (mode === 'GET') {
        functionName = generator.provideFunction_(
          'list_get_' + where.toLowerCase(),
          [
            'function ' +
              generator.FUNCTION_NAME_PLACEHOLDER_ +
              '(t' +
              // The value for 'FROM_END' and'FROM_START' depends on `at` so
              // we add it as a parameter.
              (where === 'FROM_END' || where === 'FROM_START' ? ', at)' : ')'),
            '  return t[' + getListIndex('t', where, 'at') + ']',
            'end',
          ],
        );
      } else {
        // `mode` === 'GET_REMOVE'
        functionName = generator.provideFunction_(
          'list_remove_' + where.toLowerCase(),
          [
            'function ' +
              generator.FUNCTION_NAME_PLACEHOLDER_ +
              '(t' +
              // The value for 'FROM_END' and'FROM_START' depends on `at` so
              // we add it as a parameter.
              (where === 'FROM_END' || where === 'FROM_START' ? ', at)' : ')'),
            '  return table.remove(t, ' + getListIndex('t', where, 'at') + ')',
            'end',
          ],
        );
      }
      const code =
        functionName +
        '(' +
        list +
        // The value for 'FROM_END' and 'FROM_START' depends on `at` so we
        // pass it.
        (where === 'FROM_END' || where === 'FROM_START' ? ', ' + at : '') +
        ')';
      return [code, Order.HIGH];
    }
  } else {
    // Either `list` is a simple variable, or we only need to refer to `list`
    // once.
    const atOrder =
      mode === 'GET' && where === 'FROM_END' ? Order.ADDITIVE : Order.NONE;
    let at = generator.valueToCode(block, 'AT', atOrder) || '1';
    at = getListIndex(list, where, at);
    if (mode === 'GET') {
      const code = list + '[' + at + ']';
      return [code, Order.HIGH];
    } else {
      const code = 'table.remove(' + list + ', ' + at + ')';
      if (mode === 'GET_REMOVE') {
        return [code, Order.HIGH];
      } else {
        // `mode` === 'REMOVE'
        return code + '\n';
      }
    }
  }
}

export function lists_setIndex(block: Block, generator: LuaGenerator): string {
  // Set element at index.
  // Note: Until February 2013 this block did not have MODE or WHERE inputs.
  let list = generator.valueToCode(block, 'LIST', Order.HIGH) || '{}';
  const mode = block.getFieldValue('MODE') || 'SET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const at = generator.valueToCode(block, 'AT', Order.ADDITIVE) || '1';
  const value = generator.valueToCode(block, 'TO', Order.NONE) || 'Nil';

  let code = '';
  // If `list` would be evaluated more than once (which is the case for LAST,
  // FROM_END, and RANDOM) and is non-trivial, make sure to access it only once.
  if (
    (where === 'LAST' || where === 'FROM_END' || where === 'RANDOM') &&
    !list.match(/^\w+$/)
  ) {
    // `list` is an expression, so we may not evaluate it more than once.
    // We can use multiple statements.
    const listVar = generator.nameDB_!.getDistinctName(
      'tmp_list',
      NameType.VARIABLE,
    );
    code = listVar + ' = ' + list + '\n';
    list = listVar;
  }
  if (mode === 'SET') {
    code += list + '[' + getListIndex(list, where, at) + '] = ' + value;
  } else {
    // `mode` === 'INSERT'
    // LAST is a special case, because we want to insert
    // *after* not *before*, the existing last element.
    code +=
      'table.insert(' +
      list +
      ', ' +
      (getListIndex(list, where, at) + (where === 'LAST' ? ' + 1' : '')) +
      ', ' +
      value +
      ')';
  }
  return code + '\n';
}

export function lists_getSublist(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // Get sublist.
  const list = generator.valueToCode(block, 'LIST', Order.NONE) || '{}';
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  const at1 = generator.valueToCode(block, 'AT1', Order.NONE) || '1';
  const at2 = generator.valueToCode(block, 'AT2', Order.NONE) || '1';

  // The value for 'FROM_END' and'FROM_START' depends on `at` so
  // we add it as a parameter.
  const at1Param =
    where1 === 'FROM_END' || where1 === 'FROM_START' ? ', at1' : '';
  const at2Param =
    where2 === 'FROM_END' || where2 === 'FROM_START' ? ', at2' : '';
  const functionName = generator.provideFunction_(
    'list_sublist_' + where1.toLowerCase() + '_' + where2.toLowerCase(),
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(source${at1Param}${at2Param})
  local t = {}
  local start = ${getListIndex('source', where1, 'at1')}
  local finish = ${getListIndex('source', where2, 'at2')}
  for i = start, finish do
    table.insert(t, source[i])
  end
  return t
end
`,
  );
  const code =
    functionName +
    '(' +
    list +
    // The value for 'FROM_END' and 'FROM_START' depends on `at` so we
    // pass it.
    (where1 === 'FROM_END' || where1 === 'FROM_START' ? ', ' + at1 : '') +
    (where2 === 'FROM_END' || where2 === 'FROM_START' ? ', ' + at2 : '') +
    ')';
  return [code, Order.HIGH];
}

export function lists_sort(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // Block for sorting a list.
  const list = generator.valueToCode(block, 'LIST', Order.NONE) || '{}';
  const direction = block.getFieldValue('DIRECTION') === '1' ? 1 : -1;
  const type = block.getFieldValue('TYPE');

  const functionName = generator.provideFunction_(
    'list_sort',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(list, typev, direction)
  local t = {}
  for n,v in pairs(list) do table.insert(t, v) end
  local compareFuncs = {
    NUMERIC = function(a, b)
      return (tonumber(tostring(a)) or 0)
          < (tonumber(tostring(b)) or 0) end,
    TEXT = function(a, b)
      return tostring(a) < tostring(b) end,
    IGNORE_CASE = function(a, b)
      return string.lower(tostring(a)) < string.lower(tostring(b)) end
  }
  local compareTemp = compareFuncs[typev]
  local compare = compareTemp
  if direction == -1
  then compare = function(a, b) return compareTemp(b, a) end
  end
  table.sort(t, compare)
  return t
end
`,
  );

  const code =
    functionName + '(' + list + ',"' + type + '", ' + direction + ')';
  return [code, Order.HIGH];
}

export function lists_split(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // Block for splitting text into a list, or joining a list into text.
  let input = generator.valueToCode(block, 'INPUT', Order.NONE);
  const delimiter = generator.valueToCode(block, 'DELIM', Order.NONE) || "''";
  const mode = block.getFieldValue('MODE');
  let functionName;
  if (mode === 'SPLIT') {
    if (!input) {
      input = "''";
    }
    functionName = generator.provideFunction_(
      'list_string_split',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(input, delim)
  local t = {}
  local pos = 1
  while true do
    next_delim = string.find(input, delim, pos)
    if next_delim == nil then
      table.insert(t, string.sub(input, pos))
      break
    else
      table.insert(t, string.sub(input, pos, next_delim-1))
      pos = next_delim + #delim
    end
  end
  return t
end
`,
    );
  } else if (mode === 'JOIN') {
    if (!input) {
      input = '{}';
    }
    functionName = 'table.concat';
  } else {
    throw Error('Unknown mode: ' + mode);
  }
  const code = functionName + '(' + input + ', ' + delimiter + ')';
  return [code, Order.HIGH];
}

export function lists_reverse(
  block: Block,
  generator: LuaGenerator,
): [string, Order] {
  // Block for reversing a list.
  const list = generator.valueToCode(block, 'LIST', Order.NONE) || '{}';
  const functionName = generator.provideFunction_(
    'list_reverse',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(input)
  local reversed = {}
  for i = #input, 1, -1 do
    table.insert(reversed, input[i])
  end
  return reversed
end
`,
  );
  const code = functionName + '(' + list + ')';
  return [code, Order.HIGH];
}
