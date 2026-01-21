/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating JavaScript for list blocks.
 */

// Former goog.module ID: Blockly.JavaScript.lists

import type {CreateWithBlock} from '../../blocks/lists.js';
import type {Block} from '../../core/block.js';
import {NameType} from '../../core/names.js';
import type {JavascriptGenerator} from './javascript_generator.js';
import {Order} from './javascript_generator.js';

export function lists_create_empty(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Create an empty list.
  return ['[]', Order.ATOMIC];
}

export function lists_create_with(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Create a list with any number of elements of any type.
  const createWithBlock = block as CreateWithBlock;
  const elements = new Array(createWithBlock.itemCount_);
  for (let i = 0; i < createWithBlock.itemCount_; i++) {
    elements[i] = generator.valueToCode(block, 'ADD' + i, Order.NONE) || 'null';
  }
  const code = '[' + elements.join(', ') + ']';
  return [code, Order.ATOMIC];
}

export function lists_repeat(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Create a list with one element repeated.
  const functionName = generator.provideFunction_(
    'listsRepeat',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(value, n) {
  var array = [];
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
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
  generator: JavascriptGenerator,
): [string, Order] {
  // String or array length.
  const list = generator.valueToCode(block, 'VALUE', Order.MEMBER) || '[]';
  return [list + '.length', Order.MEMBER];
}

export function lists_isEmpty(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Is the string null or array empty?
  const list = generator.valueToCode(block, 'VALUE', Order.MEMBER) || '[]';
  return ['!' + list + '.length', Order.LOGICAL_NOT];
}

export function lists_indexOf(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Find an item in the list.
  const operator =
    block.getFieldValue('END') === 'FIRST' ? 'indexOf' : 'lastIndexOf';
  const item = generator.valueToCode(block, 'FIND', Order.NONE) || "''";
  const list = generator.valueToCode(block, 'VALUE', Order.MEMBER) || '[]';
  const code = list + '.' + operator + '(' + item + ')';
  if (block.workspace.options.oneBasedIndex) {
    return [code + ' + 1', Order.ADDITION];
  }
  return [code, Order.FUNCTION_CALL];
}

export function lists_getIndex(
  block: Block,
  generator: JavascriptGenerator,
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
        const code = list + '.shift()';
        return [code, Order.MEMBER];
      } else if (mode === 'REMOVE') {
        return list + '.shift();\n';
      }
      break;
    case 'LAST':
      if (mode === 'GET') {
        const code = list + '.slice(-1)[0]';
        return [code, Order.MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const code = list + '.pop()';
        return [code, Order.MEMBER];
      } else if (mode === 'REMOVE') {
        return list + '.pop();\n';
      }
      break;
    case 'FROM_START': {
      const at = generator.getAdjusted(block, 'AT');
      if (mode === 'GET') {
        const code = list + '[' + at + ']';
        return [code, Order.MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const code = list + '.splice(' + at + ', 1)[0]';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return list + '.splice(' + at + ', 1);\n';
      }
      break;
    }
    case 'FROM_END': {
      const at = generator.getAdjusted(block, 'AT', 1, true);
      if (mode === 'GET') {
        const code = list + '.slice(' + at + ')[0]';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'GET_REMOVE') {
        const code = list + '.splice(' + at + ', 1)[0]';
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return list + '.splice(' + at + ', 1);';
      }
      break;
    }
    case 'RANDOM': {
      const functionName = generator.provideFunction_(
        'listsGetRandomItem',
        `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(list, remove) {
  var x = Math.floor(Math.random() * list.length);
  if (remove) {
    return list.splice(x, 1)[0];
  } else {
    return list[x];
  }
}
`,
      );
      const code = functionName + '(' + list + ', ' + (mode !== 'GET') + ')';
      if (mode === 'GET' || mode === 'GET_REMOVE') {
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return code + ';\n';
      }
      break;
    }
  }
  throw Error('Unhandled combination (lists_getIndex).');
}

export function lists_setIndex(block: Block, generator: JavascriptGenerator) {
  // Set element at index.
  // Note: Until February 2013 this block did not have MODE or WHERE inputs.
  let list = generator.valueToCode(block, 'LIST', Order.MEMBER) || '[]';
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const value = generator.valueToCode(block, 'TO', Order.ASSIGNMENT) || 'null';
  // Cache non-trivial values to variables to prevent repeated look-ups.
  // Closure, which accesses and modifies 'list'.
  function cacheList() {
    if (list.match(/^\w+$/)) {
      return '';
    }
    const listVar = generator.nameDB_!.getDistinctName(
      'tmpList',
      NameType.VARIABLE,
    )!;
    const code = 'var ' + listVar + ' = ' + list + ';\n';
    list = listVar;
    return code;
  }
  switch (where) {
    case 'FIRST':
      if (mode === 'SET') {
        return list + '[0] = ' + value + ';\n';
      } else if (mode === 'INSERT') {
        return list + '.unshift(' + value + ');\n';
      }
      break;
    case 'LAST':
      if (mode === 'SET') {
        let code = cacheList();
        code += list + '[' + list + '.length - 1] = ' + value + ';\n';
        return code;
      } else if (mode === 'INSERT') {
        return list + '.push(' + value + ');\n';
      }
      break;
    case 'FROM_START': {
      const at = generator.getAdjusted(block, 'AT');
      if (mode === 'SET') {
        return list + '[' + at + '] = ' + value + ';\n';
      } else if (mode === 'INSERT') {
        return list + '.splice(' + at + ', 0, ' + value + ');\n';
      }
      break;
    }
    case 'FROM_END': {
      const at = generator.getAdjusted(
        block,
        'AT',
        1,
        false,
        Order.SUBTRACTION,
      );
      let code = cacheList();
      if (mode === 'SET') {
        code += list + '[' + list + '.length - ' + at + '] = ' + value + ';\n';
        return code;
      } else if (mode === 'INSERT') {
        code +=
          list +
          '.splice(' +
          list +
          '.length - ' +
          at +
          ', 0, ' +
          value +
          ');\n';
        return code;
      }
      break;
    }
    case 'RANDOM': {
      let code = cacheList();
      const xVar = generator.nameDB_!.getDistinctName(
        'tmpX',
        NameType.VARIABLE,
      );
      code +=
        'var ' + xVar + ' = Math.floor(Math.random() * ' + list + '.length);\n';
      if (mode === 'SET') {
        code += list + '[' + xVar + '] = ' + value + ';\n';
        return code;
      } else if (mode === 'INSERT') {
        code += list + '.splice(' + xVar + ', 0, ' + value + ');\n';
        return code;
      }
      break;
    }
  }
  throw Error('Unhandled combination (lists_setIndex).');
}

/**
 * Returns an expression calculating the index into a list.
 * @param listName Name of the list, used to calculate length.
 * @param where The method of indexing, selected by dropdown in Blockly
 * @param opt_at The optional offset when indexing from start/end.
 * @returns Index expression.
 */
const getSubstringIndex = function (
  listName: string,
  where: string,
  opt_at?: string,
): string | undefined {
  if (where === 'FIRST') {
    return '0';
  } else if (where === 'FROM_END') {
    return listName + '.length - 1 - ' + opt_at;
  } else if (where === 'LAST') {
    return listName + '.length - 1';
  } else {
    return opt_at;
  }
};

export function lists_getSublist(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Get sublist.
  // Dictionary of WHEREn field choices and their CamelCase equivalents.
  const wherePascalCase = {
    'FIRST': 'First',
    'LAST': 'Last',
    'FROM_START': 'FromStart',
    'FROM_END': 'FromEnd',
  };
  type WhereOption = keyof typeof wherePascalCase;
  const list = generator.valueToCode(block, 'LIST', Order.MEMBER) || '[]';
  const where1 = block.getFieldValue('WHERE1') as WhereOption;
  const where2 = block.getFieldValue('WHERE2') as WhereOption;
  let code;
  if (where1 === 'FIRST' && where2 === 'LAST') {
    code = list + '.slice(0)';
  } else if (
    list.match(/^\w+$/) ||
    (where1 !== 'FROM_END' && where2 === 'FROM_START')
  ) {
    // If the list is a variable or doesn't require a call for length, don't
    // generate a helper function.
    let at1;
    switch (where1) {
      case 'FROM_START':
        at1 = generator.getAdjusted(block, 'AT1');
        break;
      case 'FROM_END':
        at1 = generator.getAdjusted(block, 'AT1', 1, false, Order.SUBTRACTION);
        at1 = list + '.length - ' + at1;
        break;
      case 'FIRST':
        at1 = '0';
        break;
      default:
        throw Error('Unhandled option (lists_getSublist).');
    }
    let at2;
    switch (where2) {
      case 'FROM_START':
        at2 = generator.getAdjusted(block, 'AT2', 1);
        break;
      case 'FROM_END':
        at2 = generator.getAdjusted(block, 'AT2', 0, false, Order.SUBTRACTION);
        at2 = list + '.length - ' + at2;
        break;
      case 'LAST':
        at2 = list + '.length';
        break;
      default:
        throw Error('Unhandled option (lists_getSublist).');
    }
    code = list + '.slice(' + at1 + ', ' + at2 + ')';
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
      list +
      // The value for 'FROM_END' and 'FROM_START' depends on `at` so we
      // pass it.
      (where1 === 'FROM_END' || where1 === 'FROM_START' ? ', ' + at1 : '') +
      (where2 === 'FROM_END' || where2 === 'FROM_START' ? ', ' + at2 : '') +
      ')';
  }
  return [code, Order.FUNCTION_CALL];
}

export function lists_sort(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Block for sorting a list.
  const list =
    generator.valueToCode(block, 'LIST', Order.FUNCTION_CALL) || '[]';
  const direction = block.getFieldValue('DIRECTION') === '1' ? 1 : -1;
  const type = block.getFieldValue('TYPE');
  const getCompareFunctionName = generator.provideFunction_(
    'listsGetSortCompare',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(type, direction) {
  var compareFuncs = {
    'NUMERIC': function(a, b) {
        return Number(a) - Number(b); },
    'TEXT': function(a, b) {
        return String(a) > String(b) ? 1 : -1; },
    'IGNORE_CASE': function(a, b) {
        return String(a).toLowerCase() > String(b).toLowerCase() ? 1 : -1; },
  };
  var compare = compareFuncs[type];
  return function(a, b) { return compare(a, b) * direction; };
}
      `,
  );
  return [
    list +
      '.slice().sort(' +
      getCompareFunctionName +
      '("' +
      type +
      '", ' +
      direction +
      '))',
    Order.FUNCTION_CALL,
  ];
}

export function lists_split(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Block for splitting text into a list, or joining a list into text.
  let input = generator.valueToCode(block, 'INPUT', Order.MEMBER);
  const delimiter = generator.valueToCode(block, 'DELIM', Order.NONE) || "''";
  const mode = block.getFieldValue('MODE');
  let functionName;
  if (mode === 'SPLIT') {
    if (!input) {
      input = "''";
    }
    functionName = 'split';
  } else if (mode === 'JOIN') {
    if (!input) {
      input = '[]';
    }
    functionName = 'join';
  } else {
    throw Error('Unknown mode: ' + mode);
  }
  const code = input + '.' + functionName + '(' + delimiter + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_reverse(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Block for reversing a list.
  const list =
    generator.valueToCode(block, 'LIST', Order.FUNCTION_CALL) || '[]';
  const code = list + '.slice().reverse()';
  return [code, Order.FUNCTION_CALL];
}
