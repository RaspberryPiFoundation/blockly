/**
 * @license
 * Copyright 2015 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating PHP for list blocks.
 */

// Former goog.module ID: Blockly.generator.lists

import type {CreateWithBlock} from '../../blocks/lists.js';
import type {Block} from '../../core/block.js';
import {NameType} from '../../core/names.js';
import type {PhpGenerator} from './php_generator.js';
import {Order} from './php_generator.js';

export function lists_create_empty(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  generator.provideListObject();
  // Create an empty list.
  return ['new ListObject()', Order.NEW];
}

export function lists_create_with(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  generator.provideListObject();
  // Create a list with any number of elements of any type.
  const createWithBlock = block as CreateWithBlock;
  const elements = new Array(createWithBlock.itemCount_);
  for (let i = 0; i < createWithBlock.itemCount_; i++) {
    elements[i] = generator.valueToCode(block, 'ADD' + i, Order.NONE) || 'null';
  }
  const code = 'new ListObject(array(' + elements.join(', ') + '))';
  return [code, Order.NEW];
}

export function lists_repeat(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  generator.provideListObject();
  // Create a list with one element repeated.
  const functionName = generator.provideFunction_(
    'lists_repeat',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($value, $count) {
  $array = new ListObject();
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

function provideLengthCheck(generator: PhpGenerator) {
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

  return functionName;
}

export function lists_length(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  const list = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";
  return [
    provideLengthCheck(generator) + '(' + list + ')',
    Order.FUNCTION_CALL,
  ];
}

export function lists_isEmpty(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  generator.provideListObject();
  // Is the string null or array empty?
  const argument0 =
    generator.valueToCode(block, 'VALUE', Order.NONE) || '(new ListObject())';
  return [
    provideLengthCheck(generator) + '(' + argument0 + ') == 0',
    Order.EQUALITY,
  ];
}

export function lists_indexOf(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  // Find an item in the list.
  const argument0 = generator.valueToCode(block, 'FIND', Order.NONE) || "''";
  const argument1 = generator.valueToCode(block, 'VALUE', Order.NONE) || '[]';
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
  generator.provideListObject();
  // Get element at index.
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  switch (where) {
    case 'FIRST':
      if (mode === 'GET') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.MEMBER) ||
          '(new ListObject())';
        const code = list + '->slice(0, 1)[0]';
        return [code, Order.MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.FUNCTION_CALL) ||
          '(new ListObject())';
        const code = list + '->shift()';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.FUNCTION_CALL) ||
          '(new ListObject())';
        return list + '->shift();\n';
      }
      break;
    case 'LAST':
      if (mode === 'GET') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.FUNCTION_CALL) ||
          '(new ListObject())';
        const code = list + '->slice(-1)[0]';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'GET_REMOVE') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.FUNCTION_CALL) ||
          '(new ListObject())';
        const code = list + '->pop()';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.FUNCTION_CALL) ||
          '(new ListObject())';
        return list + '->pop();\n';
      }
      break;
    case 'FROM_START': {
      const at = generator.getAdjusted(block, 'AT');
      if (mode === 'GET') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.MEMBER) ||
          '(new ListObject())';
        const code = list + '[' + at + ']';
        return [code, Order.MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.FUNCTION_CALL) ||
          '(new ListObject())';
        const code = list + '->splice(' + at + ', 1)[0]';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.FUNCTION_CALL) ||
          '(new ListObject())';
        return list + '->splice(' + at + ', 1);\n';
      }
      break;
    }
    case 'FROM_END':
      if (mode === 'GET') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.FUNCTION_CALL) ||
          '(new ListObject())';
        const at = generator.getAdjusted(block, 'AT', 1, true);
        const code = list + '->slice(' + at + ', 1)[0]';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'GET_REMOVE' || mode === 'REMOVE') {
        const list =
          generator.valueToCode(block, 'VALUE', Order.NONE) ||
          '(new ListObject())';
        const at = generator.getAdjusted(block, 'AT', 1, false, Order.NONE);

        const functionName = generator.provideFunction_(
          'lists_get_remove',
          `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($list, $at) {
  return $list->splice(count($list) - $at, 1)[0];
}
`,
        );
        const code = functionName + '(' + list + ', ' + at + ')';
        if (mode === 'GET_REMOVE') {
          return [code, Order.FUNCTION_CALL];
        } else if (mode === 'REMOVE') {
          return code + ';\n';
        }
      }
      break;
    case 'RANDOM': {
      const list =
        generator.valueToCode(block, 'VALUE', Order.NONE) ||
        '(new ListObject())';
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
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($list) {
  $x = rand(0,count($list)-1);
  return $list->splice($x, 1)[0];
}
`,
        );
        const code = functionName + '(' + list + ')';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        const functionName = generator.provideFunction_(
          'lists_remove_random_item',
          `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($list) {
  $list->offsetUnset(rand(0,count($list)-1));
  $list->exchangeArray(array_values($list->getArrayCopy()));
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
  generator.provideListObject();
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
    const code = listVar + ' = ' + cachedList + ';\n';
    cachedList = listVar;
    return code;
  }
  switch (where) {
    case 'FIRST':
      if (mode === 'SET') {
        const list =
          generator.valueToCode(block, 'LIST', Order.MEMBER) ||
          '(new ListObject())';
        return list + '->splice(0, 1, [' + value + ']);\n';
      } else if (mode === 'INSERT') {
        const list =
          generator.valueToCode(block, 'LIST', Order.FUNCTION_CALL) ||
          '(new ListObject())';
        return list + '->unshift(' + value + ');\n';
      }
      break;
    case 'LAST': {
      const list =
        generator.valueToCode(block, 'LIST', Order.FUNCTION_CALL) ||
        '(new ListObject())';
      if (mode === 'SET') {
        return list + '->splice(-1, 1, [' + value + ']);\n';
      } else if (mode === 'INSERT') {
        return list + '->append(' + value + ');\n';
      }
      break;
    }
    case 'FROM_START': {
      const at = generator.getAdjusted(block, 'AT');
      if (mode === 'SET') {
        const list =
          generator.valueToCode(block, 'LIST', Order.MEMBER) ||
          '(new ListObject())';
        return list + '->splice(' + at + ', 1, [' + value + ']);\n';
      } else if (mode === 'INSERT') {
        const list =
          generator.valueToCode(block, 'LIST', Order.FUNCTION_CALL) ||
          '(new ListObject())';
        return list + '->splice(' + at + ', 0, [' + value + ']);\n';
      }
      break;
    }
    case 'FROM_END': {
      const list =
        generator.valueToCode(block, 'LIST', Order.NONE) ||
        '(new ListObject())';
      const at = generator.getAdjusted(block, 'AT', 1, false, Order.NONE);
      if (mode === 'SET') {
        const functionName = generator.provideFunction_(
          'lists_set_from_end',
          `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($list, $at, $value) {
  $list[count($list) - $at] = $value;
}
`,
        );
        return functionName + '(' + list + ', ' + at + ', ' + value + ');\n';
      } else if (mode === 'INSERT') {
        const functionName = generator.provideFunction_(
          'lists_insert_from_end',
          `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($list, $at, $value) {
  return $list->splice(count($list) - $at, 0, [$value]);
}
`,
        );
        return functionName + '(' + list + ', ' + at + ', ' + value + ');\n';
      }
      break;
    }
    case 'RANDOM':
      cachedList =
        generator.valueToCode(block, 'LIST', Order.ASSIGNMENT) ||
        '(new ListObject())';
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
        code += list + '->splice(' + xVar + ', 0, [' + value + ']);\n';

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
  generator.provideListObject();
  // Get sublist.
  const list =
    generator.valueToCode(block, 'LIST', Order.FUNCTION_CALL) ||
    '(new ListObject())';
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  let code;
  if (where1 === 'FIRST' && where2 === 'LAST') {
    return ['clone ' + list, Order.CLONE];
  } else if (
    list.match(/^\$\w+$/) ||
    (where1 !== 'FROM_END' && where2 === 'FROM_START')
  ) {
    // If the list is a simple value or doesn't require a call for length, don't
    // generate a helper function.
    let at1;
    switch (where1) {
      case 'FROM_START':
        at1 = generator.getAdjusted(block, 'AT1', 0, false, Order.SUBTRACTION);
        break;
      case 'FROM_END':
        at1 = generator.getAdjusted(block, 'AT1', 1, false, Order.SUBTRACTION);
        at1 = '(count(' + list + ') - ' + at1 + ')';
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
        length = at2 + ' - ' + at1 + ' + 1';
        break;
      case 'FROM_END':
        at2 = generator.getAdjusted(block, 'AT2', 0, false, Order.SUBTRACTION);
        length = 'count(' + list + ') - ' + at2 + ' - ' + at1;
        break;
      case 'LAST':
        length = 'count(' + list + ') - ' + at1;
        break;
      default:
        throw Error('Unhandled option (lists_getSublist).');
    }
    code = list + '->slice(' + at1 + ', ' + length + ')';
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
  return $list->slice($at1, $length);
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
  generator.provideListObject();
  // Block for sorting a list.
  const listCode =
    generator.valueToCode(block, 'LIST', Order.NONE) || '(new ListObject())';
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
  $list2 = $list->getArrayCopy();
  usort($list2, $sortCmp);
  if ($direction == -1) {
    $list2 = array_reverse($list2);
  }
  return new ListObject($list2);
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
  generator.provideListObject();
  // Block for splitting text into a list, or joining a list into text.
  const value_delim = generator.valueToCode(block, 'DELIM', Order.NONE) || "''";
  const mode = block.getFieldValue('MODE');
  if (mode === 'SPLIT') {
    let value_input = generator.valueToCode(block, 'INPUT', Order.NONE);
    if (!value_input) {
      value_input = "''";
    }
    return [
      'new ListObject(explode(' + value_delim + ', ' + value_input + '))',
      Order.NEW,
    ];
  } else if (mode === 'JOIN') {
    let value_input =
      generator.valueToCode(block, 'INPUT', Order.FUNCTION_CALL) ||
      '(new ListObject())';
    value_input = `${value_input}->getArrayCopy()`;
    return [
      'implode(' + value_delim + ', ' + value_input + ')',
      Order.FUNCTION_CALL,
    ];
  } else {
    throw Error('Unknown mode: ' + mode);
  }
}

export function lists_reverse(
  block: Block,
  generator: PhpGenerator,
): [string, Order] {
  generator.provideListObject();
  // Block for reversing a list.
  const list =
    generator.valueToCode(block, 'LIST', Order.FUNCTION_CALL) ||
    '(new ListObject())';
  const code = 'new ListObject(array_reverse(' + list + '->getArrayCopy()))';
  return [code, Order.NEW];
}
