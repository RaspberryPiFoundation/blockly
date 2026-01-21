/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Python for list blocks.
 */

// Former goog.module ID: Blockly.Python.lists

import type {CreateWithBlock} from '../../blocks/lists.js';
import type {Block} from '../../core/block.js';
import {NameType} from '../../core/names.js';
import * as stringUtils from '../../core/utils/string.js';
import type {PythonGenerator} from './python_generator.js';
import {Order} from './python_generator.js';

export function lists_create_empty(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Create an empty list.
  return ['[]', Order.ATOMIC];
}

export function lists_create_with(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Create a list with any number of elements of any type.
  const createWithBlock = block as CreateWithBlock;
  const elements = new Array(createWithBlock.itemCount_);
  for (let i = 0; i < createWithBlock.itemCount_; i++) {
    elements[i] = generator.valueToCode(block, 'ADD' + i, Order.NONE) || 'None';
  }
  const code = '[' + elements.join(', ') + ']';
  return [code, Order.ATOMIC];
}

export function lists_repeat(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Create a list with one element repeated.
  const item = generator.valueToCode(block, 'ITEM', Order.NONE) || 'None';
  const times =
    generator.valueToCode(block, 'NUM', Order.MULTIPLICATIVE) || '0';
  const code = '[' + item + '] * ' + times;
  return [code, Order.MULTIPLICATIVE];
}

export function lists_length(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // String or array length.
  const list = generator.valueToCode(block, 'VALUE', Order.NONE) || '[]';
  return ['len(' + list + ')', Order.FUNCTION_CALL];
}

export function lists_isEmpty(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Is the string null or array empty?
  const list = generator.valueToCode(block, 'VALUE', Order.NONE) || '[]';
  const code = 'not len(' + list + ')';
  return [code, Order.LOGICAL_NOT];
}

export function lists_indexOf(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Find an item in the list.
  const item = generator.valueToCode(block, 'FIND', Order.NONE) || '[]';
  const list = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";
  let errorIndex = ' -1';
  let firstIndexAdjustment = '';
  let lastIndexAdjustment = ' - 1';

  if (block.workspace.options.oneBasedIndex) {
    errorIndex = ' 0';
    firstIndexAdjustment = ' + 1';
    lastIndexAdjustment = '';
  }

  let functionName;
  if (block.getFieldValue('END') === 'FIRST') {
    functionName = generator.provideFunction_(
      'first_index',
      `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(my_list, elem):
  try: index = my_list.index(elem)${firstIndexAdjustment}
  except: index =${errorIndex}
  return index
`,
    );
  } else {
    functionName = generator.provideFunction_(
      'last_index',
      `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(my_list, elem):
  try: index = len(my_list) - my_list[::-1].index(elem)${lastIndexAdjustment}
  except: index =${errorIndex}
  return index
`,
    );
  }
  const code = functionName + '(' + list + ', ' + item + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_getIndex(
  block: Block,
  generator: PythonGenerator,
): [string, Order] | string {
  // Get element at index.
  // Note: Until January 2013 this block did not have MODE or WHERE inputs.
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const listOrder = where === 'RANDOM' ? Order.NONE : Order.MEMBER;
  const list = generator.valueToCode(block, 'VALUE', listOrder) || '[]';

  switch (where) {
    case 'FIRST':
      if (mode === 'GET') {
        const code = list + '[0]';
        return [code, Order.MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const code = list + '.pop(0)';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return list + '.pop(0)\n';
      }
      break;
    case 'LAST':
      if (mode === 'GET') {
        const code = list + '[-1]';
        return [code, Order.MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const code = list + '.pop()';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return list + '.pop()\n';
      }
      break;
    case 'FROM_START': {
      const at = generator.getAdjustedInt(block, 'AT');
      if (mode === 'GET') {
        const code = list + '[' + at + ']';
        return [code, Order.MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const code = list + '.pop(' + at + ')';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return list + '.pop(' + at + ')\n';
      }
      break;
    }
    case 'FROM_END': {
      const at = generator.getAdjustedInt(block, 'AT', 1, true);
      if (mode === 'GET') {
        const code = list + '[' + at + ']';
        return [code, Order.MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const code = list + '.pop(' + at + ')';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return list + '.pop(' + at + ')\n';
      }
      break;
    }
    case 'RANDOM':
      (generator as AnyDuringMigration).definitions_['import_random'] =
        'import random';
      if (mode === 'GET') {
        const code = 'random.choice(' + list + ')';
        return [code, Order.FUNCTION_CALL];
      } else {
        const functionName = generator.provideFunction_(
          'lists_remove_random_item',
          `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(myList):
  x = int(random.random() * len(myList))
  return myList.pop(x)
`,
        );
        const code = functionName + '(' + list + ')';
        if (mode === 'GET_REMOVE') {
          return [code, Order.FUNCTION_CALL];
        } else if (mode === 'REMOVE') {
          return code + '\n';
        }
      }
      break;
  }
  throw Error('Unhandled combination (lists_getIndex).');
}

export function lists_setIndex(block: Block, generator: PythonGenerator) {
  // Set element at index.
  // Note: Until February 2013 this block did not have MODE or WHERE inputs.
  let list = generator.valueToCode(block, 'LIST', Order.MEMBER) || '[]';
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const value = generator.valueToCode(block, 'TO', Order.NONE) || 'None';
  // Cache non-trivial values to variables to prevent repeated look-ups.
  // Closure, which accesses and modifies 'list'.
  function cacheList() {
    if (list.match(/^\w+$/)) {
      return '';
    }
    const listVar = generator.nameDB_!.getDistinctName(
      'tmp_list',
      NameType.VARIABLE,
    );
    const code = listVar + ' = ' + list + '\n';
    list = listVar;
    return code;
  }

  switch (where) {
    case 'FIRST':
      if (mode === 'SET') {
        return list + '[0] = ' + value + '\n';
      } else if (mode === 'INSERT') {
        return list + '.insert(0, ' + value + ')\n';
      }
      break;
    case 'LAST':
      if (mode === 'SET') {
        return list + '[-1] = ' + value + '\n';
      } else if (mode === 'INSERT') {
        return list + '.append(' + value + ')\n';
      }
      break;
    case 'FROM_START': {
      const at = generator.getAdjustedInt(block, 'AT');
      if (mode === 'SET') {
        return list + '[' + at + '] = ' + value + '\n';
      } else if (mode === 'INSERT') {
        return list + '.insert(' + at + ', ' + value + ')\n';
      }
      break;
    }
    case 'FROM_END': {
      const at = generator.getAdjustedInt(block, 'AT', 1, true);
      if (mode === 'SET') {
        return list + '[' + at + '] = ' + value + '\n';
      } else if (mode === 'INSERT') {
        return list + '.insert(' + at + ', ' + value + ')\n';
      }
      break;
    }
    case 'RANDOM': {
      (generator as AnyDuringMigration).definitions_['import_random'] =
        'import random';
      let code = cacheList();
      const xVar = generator.nameDB_!.getDistinctName(
        'tmp_x',
        NameType.VARIABLE,
      );
      code += xVar + ' = int(random.random() * len(' + list + '))\n';
      if (mode === 'SET') {
        code += list + '[' + xVar + '] = ' + value + '\n';
        return code;
      } else if (mode === 'INSERT') {
        code += list + '.insert(' + xVar + ', ' + value + ')\n';
        return code;
      }
      break;
    }
  }
  throw Error('Unhandled combination (lists_setIndex).');
}

export function lists_getSublist(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Get sublist.
  const list = generator.valueToCode(block, 'LIST', Order.MEMBER) || '[]';
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
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
      throw Error('Unhandled option (lists_getSublist)');
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
      throw Error('Unhandled option (lists_getSublist)');
  }
  const code = list + '[' + at1 + ' : ' + at2 + ']';
  return [code, Order.MEMBER];
}

export function lists_sort(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Block for sorting a list.
  const list = generator.valueToCode(block, 'LIST', Order.NONE) || '[]';
  const type = block.getFieldValue('TYPE');
  const reverse = block.getFieldValue('DIRECTION') === '1' ? 'False' : 'True';
  const sortFunctionName = generator.provideFunction_(
    'lists_sort',
    `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(my_list, type, reverse):
  def try_float(s):
    try:
      return float(s)
    except:
      return 0
  key_funcs = {
    "NUMERIC": try_float,
    "TEXT": str,
    "IGNORE_CASE": lambda s: str(s).lower()
  }
  key_func = key_funcs[type]
  list_cpy = list(my_list)
  return sorted(list_cpy, key=key_func, reverse=reverse)
`,
  );

  const code =
    sortFunctionName + '(' + list + ', "' + type + '", ' + reverse + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_split(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Block for splitting text into a list, or joining a list into text.
  const mode = block.getFieldValue('MODE');
  let code;
  if (mode === 'SPLIT') {
    const value_input =
      generator.valueToCode(block, 'INPUT', Order.MEMBER) || "''";
    const value_delim = generator.valueToCode(block, 'DELIM', Order.NONE);
    code = value_input + '.split(' + value_delim + ')';
  } else if (mode === 'JOIN') {
    const value_input =
      generator.valueToCode(block, 'INPUT', Order.NONE) || '[]';
    const value_delim =
      generator.valueToCode(block, 'DELIM', Order.MEMBER) || "''";
    code = value_delim + '.join(' + value_input + ')';
  } else {
    throw Error('Unknown mode: ' + mode);
  }
  return [code, Order.FUNCTION_CALL];
}

export function lists_reverse(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  // Block for reversing a list.
  const list = generator.valueToCode(block, 'LIST', Order.NONE) || '[]';
  const code = 'list(reversed(' + list + '))';
  return [code, Order.FUNCTION_CALL];
}
