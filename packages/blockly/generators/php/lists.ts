/**
 * @license
 * Copyright 2015 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating PHP for list blocks.
 */

/**
 * Lists in PHP are known to break when non-variables are passed into blocks
 * that require a list. PHP, unlike other languages, passes arrays as reference
 * value instead of value so we are unable to support it to the extent we can
 * for the other languages.
 * For example, a ternary operator with two arrays will return the array by
 * value and that cannot be passed into any of the built-in array functions for
 * PHP (because only variables can be passed by reference).
 * ex:  end(true ? list1 : list2)
 */

// Former goog.module ID: Blockly.generator.lists

import type {CreateWithBlock} from '../../blocks/lists.js';
import type {Block} from '../../core/block.js';
import {NameType} from '../../core/names.js';
import * as stringUtils from '../../core/utils/string.js';
import type {PhpGenerator} from './php_generator.js';
import {Order} from './php_generator.js';

export function lists_create_empty(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Create an empty list.
  return ['array()', Order.FUNCTION_CALL];
}

export function lists_create_with(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Create a list with any number of elements of any type.
  const createWithBlock = block as CreateWithBlock;
  const elements = new Array(createWithBlock.itemCount_);
  for (let i = 0; i < createWithBlock.itemCount_; i++) {
    elements[i] = generator.valueToCode(block, 'ADD' + i, Order.NONE) || 'null';
  }
  const code = 'array(' + elements.join(', ') + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_repeat(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Create a list with one element repeated.
  const functionName = generator.provideFunction_(
    'lists_repeat',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($value, $count) {
  $array = array();
  for ($index = 0; $index < $count; $index++) {
    $array[] = $value;
  }
  return $array;
}
`,
  );
  const element = generator.valueToCode(block, 'ITEM', Order.NONE) || 'null';
  const repeatCount = generator.valueToCode(block, 'NUM', Order.NONE) || '0';
  const code = functionName + '(' + element + ', ' + repeatCount + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_length(
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
  } else {
    return count($value);
  }
}
`,
  );
  const list = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";
  return [functionName + '(' + list + ')', Order.FUNCTION_CALL];
}

export function lists_isEmpty(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Is the string null or array empty?
  const argument0 =
    generator.valueToCode(block, 'VALUE', Order.FUNCTION_CALL) || 'array()';
  return ['empty(' + argument0 + ')', Order.FUNCTION_CALL];
}

export function lists_indexOf(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Find an item in the list.
  const argument0 = generator.valueToCode(block, 'FIND', Order.NONE) || "''";
  const argument1 = generator.valueToCode(block, 'VALUE', Order.MEMBER) || '[]';
  let errorIndex = ' -1';
  let indexAdjustment = '';
  if (block.workspace.options.oneBasedIndex) {
    errorIndex = ' 0';
    indexAdjustment = ' + 1';
  }
  let functionName;
  if (block.getFieldValue('END') === 'FIRST') {
    // indexOf
    functionName = generator.provideFunction_(
      'indexOf',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($haystack, $needle) {
  for ($index = 0; $index < count($haystack); $index++) {
    if ($haystack[$index] == $needle) return $index${indexAdjustment};
  }
  return ${errorIndex};
}
`,
    );
  } else {
    // lastIndexOf
    functionName = generator.provideFunction_(
      'lastIndexOf',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($haystack, $needle) {
  $last = ${errorIndex};
  for ($index = 0; $index < count($haystack); $index++) {
    if ($haystack[$index] == $needle) $last = $index${indexAdjustment};
  }
  return $last;
}
`,
    );
  }

  const code = functionName + '(' + argument1 + ', ' + argument0 + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_getIndex(
  block: Block,
  generator: PhpGenerator,
): [string, Order] | string {
  // Get element at index.
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  switch (where) {
    case 'FIRST':
      if (mode === 'GET') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.MEMBER) || 'array()';
        const code = list + '[0]';
        return [code, Order.MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.NONE) || 'array()';
        const code = 'array_shift(' + list + ')';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.NONE) || 'array()';
        return 'array_shift(' + list + ');\n';
      }
      break;
    case 'LAST':
      if (mode === 'GET') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.NONE) || 'array()';
        const code = 'end(' + list + ')';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'GET_REMOVE') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.NONE) || 'array()';
        const code = 'array_pop(' + list + ')';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.NONE) || 'array()';
        return 'array_pop(' + list + ');\n';
      }
      break;
    case 'FROM_START': {
      const at = generator.getAdjusted(block, 'AT');
      if (mode === 'GET') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.MEMBER) || 'array()';
        const code = list + '[' + at + ']';
        return [code, Order.MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.NONE) || 'array()';
        const code = 'array_splice(' + list + ', ' + at + ', 1)[0]';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.NONE) || 'array()';
        return 'array_splice(' + list + ', ' + at + ', 1);\n';
      }
      break;
    }
    case 'FROM_END':
      if (mode === 'GET') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.NONE) || 'array()';
        const at = generator.getAdjusted(block, 'AT', 1, true);
        const code = 'array_slice(' + list + ', ' + at + ', 1)[0]';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'GET_REMOVE' || mode === 'REMOVE') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.NONE) || 'array()';
        const at = generator.getAdjusted(
          block,
          'AT',
          1,
          false,
          Order.SUBTRACTION,
        );
        const code =
          'array_splice(' + list + ', count(' + list + ') - ' + at + ', 1)[0]';
        if (mode === 'GET_REMOVE') {
          return [code, Order.FUNCTION_CALL];
        } else if (mode === 'REMOVE') {
          return code + ';\n';
        }
      }
      break;
    case 'RANDOM': {
      const list =
        generator.valueToCode(block, 'VALUE', Order.NONE) || 'array()';
      if (mode === 'GET') {
        const functionName = generator.provideFunction_(
          'lists_get_random_item',
          `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($list) {
  return $list[rand(0,count($list)-1)];
}
`,
        );
        const code = functionName + '(' + list + ')';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'GET_REMOVE') {
        const functionName = generator.provideFunction_(
          'lists_get_remove_random_item',
          `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(&$list) {
  $x = rand(0,count($list)-1);
  unset($list[$x]);
  return array_values($list);
}
`,
        );
        const code = functionName + '(' + list + ')';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        const functionName = generator.provideFunction_(
          'lists_remove_random_item',
          `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(&$list) {
  unset($list[rand(0,count($list)-1)]);
}
`,
        );
        return functionName + '(' + list + ');\n';
      }
      break;
    }
  }
  throw Error('Unhandled combination (lists_getIndex).');
}

export function lists_setIndex(block: Block, generator: PhpGenerator) {
  // Set element at index.
  // Note: Until February 2013 this block did not have MODE or WHERE inputs.
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const value = generator.valueToCode(block, 'TO', Order.ASSIGNMENT) || 'null';
  // Cache non-trivial values to variables to prevent repeated look-ups.
  // Closure, which accesses and modifies 'list'.
  let cachedList: string;
  function cacheList() {
    if (cachedList.match(/^\$\w+$/)) {
      return '';
    }
    const listVar = generator.nameDB_!.getDistinctName(
      'tmp_list',
      NameType.VARIABLE,
    );
    const code = listVar + ' = &' + cachedList + ';\n';
    cachedList = listVar;
    return code;
  }
  switch (where) {
    case 'FIRST':
      if (mode === 'SET') {
        const list =
          generator.valueToCode(block, 'LIST', Order.MEMBER) || 'array()';
        return list + '[0] = ' + value + ';\n';
      } else if (mode === 'INSERT') {
        const list =
          generator.valueToCode(block, 'LIST', Order.NONE) || 'array()';
        return 'array_unshift(' + list + ', ' + value + ');\n';
      }
      break;
    case 'LAST': {
      const list =
        generator.valueToCode(block, 'LIST', Order.NONE) || 'array()';
      if (mode === 'SET') {
        const functionName = generator.provideFunction_(
          'lists_set_last_item',
          `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(&$list, $value) {
  $list[count($list) - 1] = $value;
}
`,
        );
        return functionName + '(' + list + ', ' + value + ');\n';
      } else if (mode === 'INSERT') {
        return 'array_push(' + list + ', ' + value + ');\n';
      }
      break;
    }
    case 'FROM_START': {
      const at = generator.getAdjusted(block, 'AT');
      if (mode === 'SET') {
        const list =
          generator.valueToCode(block, 'LIST', Order.MEMBER) || 'array()';
        return list + '[' + at + '] = ' + value + ';\n';
      } else if (mode === 'INSERT') {
        const list =
          generator.valueToCode(block, 'LIST', Order.NONE) || 'array()';
        return 'array_splice(' + list + ', ' + at + ', 0, ' + value + ');\n';
      }
      break;
    }
    case 'FROM_END': {
      const list =
        generator.valueToCode(block, 'LIST', Order.NONE) || 'array()';
      const at = generator.getAdjusted(block, 'AT', 1);
      if (mode === 'SET') {
        const functionName = generator.provideFunction_(
          'lists_set_from_end',
          `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(&$list, $at, $value) {
  $list[count($list) - $at] = $value;
}
`,
        );
        return functionName + '(' + list + ', ' + at + ', ' + value + ');\n';
      } else if (mode === 'INSERT') {
        const functionName = generator.provideFunction_(
          'lists_insert_from_end',
          `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(&$list, $at, $value) {
  return array_splice($list, count($list) - $at, 0, $value);
}
`,
        );
        return functionName + '(' + list + ', ' + at + ', ' + value + ');\n';
      }
      break;
    }
    case 'RANDOM':
      cachedList =
        generator.valueToCode(block, 'LIST', Order.REFERENCE) || 'array()';
      let code = cacheList();
      const list = cachedList;
      const xVar = generator.nameDB_!.getDistinctName(
        'tmp_x',
        NameType.VARIABLE,
      );
      code += xVar + ' = rand(0, count(' + list + ')-1);\n';
      if (mode === 'SET') {
        code += list + '[' + xVar + '] = ' + value + ';\n';
        return code;
      } else if (mode === 'INSERT') {
        code += 'array_splice(' + list + ', ' + xVar + ', 0, ' + value + ');\n';
        return code;
      }
      break;
  }
  throw Error('Unhandled combination (lists_setIndex).');
}

export function lists_getSublist(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Get sublist.
  const list = generator.valueToCode(block, 'LIST', Order.NONE) || 'array()';
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  let code;
  if (where1 === 'FIRST' && where2 === 'LAST') {
    code = list;
  } else if (
    list.match(/^\$\w+$/) ||
    (where1 !== 'FROM_END' && where2 === 'FROM_START')
  ) {
    // If the list is a simple value or doesn't require a call for length, don't
    // generate a helper function.
    let at1;
    switch (where1) {
      case 'FROM_START':
        at1 = generator.getAdjusted(block, 'AT1');
        break;
      case 'FROM_END':
        at1 = generator.getAdjusted(block, 'AT1', 1, false, Order.SUBTRACTION);
        at1 = 'count(' + list + ') - ' + at1;
        break;
      case 'FIRST':
        at1 = '0';
        break;
      default:
        throw Error('Unhandled option (lists_getSublist).');
    }
    let at2;
    let length;
    switch (where2) {
      case 'FROM_START':
        at2 = generator.getAdjusted(block, 'AT2', 0, false, Order.SUBTRACTION);
        length = at2 + ' - ';
        if (
          stringUtils.isNumber(String(at1)) ||
          String(at1).match(/^\(.+\)$/)
        ) {
          length += at1;
        } else {
          length += '(' + at1 + ')';
        }
        length += ' + 1';
        break;
      case 'FROM_END':
        at2 = generator.getAdjusted(block, 'AT2', 0, false, Order.SUBTRACTION);
        length = 'count(' + list + ') - ' + at2 + ' - ';
        if (
          stringUtils.isNumber(String(at1)) ||
          String(at1).match(/^\(.+\)$/)
        ) {
          length += at1;
        } else {
          length += '(' + at1 + ')';
        }
        break;
      case 'LAST':
        length = 'count(' + list + ') - ';
        if (
          stringUtils.isNumber(String(at1)) ||
          String(at1).match(/^\(.+\)$/)
        ) {
          length += at1;
        } else {
          length += '(' + at1 + ')';
        }
        break;
      default:
        throw Error('Unhandled option (lists_getSublist).');
    }
    code = 'array_slice(' + list + ', ' + at1 + ', ' + length + ')';
  } else {
    const at1 = generator.getAdjusted(block, 'AT1');
    const at2 = generator.getAdjusted(block, 'AT2');
    const functionName = generator.provideFunction_(
      'lists_get_sublist',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($list, $where1, $at1, $where2, $at2) {
  if ($where1 == 'FROM_END') {
    $at1 = count($list) - 1 - $at1;
  } else if ($where1 == 'FIRST') {
    $at1 = 0;
  } else if ($where1 != 'FROM_START') {
    throw new Exception('Unhandled option (lists_get_sublist).');
  }
  $length = 0;
  if ($where2 == 'FROM_START') {
    $length = $at2 - $at1 + 1;
  } else if ($where2 == 'FROM_END') {
    $length = count($list) - $at1 - $at2;
  } else if ($where2 == 'LAST') {
    $length = count($list) - $at1;
  } else {
    throw new Exception('Unhandled option (lists_get_sublist).');
  }
  return array_slice($list, $at1, $length);
}
`,
    );
    code =
      functionName +
      '(' +
      list +
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
  return [code, Order.FUNCTION_CALL];
}

export function lists_sort(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Block for sorting a list.
  const listCode =
    generator.valueToCode(block, 'LIST', Order.NONE) || 'array()';
  const direction = block.getFieldValue('DIRECTION') === '1' ? 1 : -1;
  const type = block.getFieldValue('TYPE');
  const functionName = generator.provideFunction_(
    'lists_sort',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($list, $type, $direction) {
  $sortCmpFuncs = array(
    'NUMERIC' => 'strnatcasecmp',
    'TEXT' => 'strcmp',
    'IGNORE_CASE' => 'strcasecmp'
  );
  $sortCmp = $sortCmpFuncs[$type];
  $list2 = $list;
  usort($list2, $sortCmp);
  if ($direction == -1) {
    $list2 = array_reverse($list2);
  }
  return $list2;
}
`,
  );
  const sortCode =
    functionName + '(' + listCode + ', "' + type + '", ' + direction + ')';
  return [sortCode, Order.FUNCTION_CALL];
}

export function lists_split(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Block for splitting text into a list, or joining a list into text.
  let value_input = generator.valueToCode(block, 'INPUT', Order.NONE);
  const value_delim = generator.valueToCode(block, 'DELIM', Order.NONE) || "''";
  const mode = block.getFieldValue('MODE');
  let functionName;
  if (mode === 'SPLIT') {
    if (!value_input) {
      value_input = "''";
    }
    functionName = 'explode';
  } else if (mode === 'JOIN') {
    if (!value_input) {
      value_input = 'array()';
    }
    functionName = 'implode';
  } else {
    throw Error('Unknown mode: ' + mode);
  }
  const code = functionName + '(' + value_delim + ', ' + value_input + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_reverse(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Block for reversing a list.
  const list = generator.valueToCode(block, 'LIST', Order.NONE) || '[]';
  const code = 'array_reverse(' + list + ')';
  return [code, Order.FUNCTION_CALL];
}
