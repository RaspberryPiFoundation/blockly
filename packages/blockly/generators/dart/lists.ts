/**
 * @license
 * Copyright 2014 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Dart for list blocks.
 */

// Former goog.module ID: Blockly.Dart.lists

import type {CreateWithBlock} from '../../blocks/lists.js';
import type {Block} from '../../core/block.js';
import {NameType} from '../../core/names.js';
import type {DartGenerator} from './dart_generator.js';
import {Order} from './dart_generator.js';

// RESERVED WORDS: 'Math'

export function lists_create_empty(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Create an empty list.
  return ['[]', Order.ATOMIC];
}

export function lists_create_with(
  block: Block,
  generator: DartGenerator,
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
  generator: DartGenerator,
): [string, Order] {
  // Create a list with one element repeated.
  const element = generator.valueToCode(block, 'ITEM', Order.NONE) || 'null';
  const repeatCount = generator.valueToCode(block, 'NUM', Order.NONE) || '0';
  const code = 'new List.filled(' + repeatCount + ', ' + element + ')';
  return [code, Order.UNARY_POSTFIX];
}

export function lists_length(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // String or array length.
  const list =
    generator.valueToCode(block, 'VALUE', Order.UNARY_POSTFIX) || '[]';
  return [list + '.length', Order.UNARY_POSTFIX];
}

export function lists_isEmpty(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Is the string null or array empty?
  const list =
    generator.valueToCode(block, 'VALUE', Order.UNARY_POSTFIX) || '[]';
  return [list + '.isEmpty', Order.UNARY_POSTFIX];
}

export function lists_indexOf(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Find an item in the list.
  const operator =
    block.getFieldValue('END') === 'FIRST' ? 'indexOf' : 'lastIndexOf';
  const item = generator.valueToCode(block, 'FIND', Order.NONE) || "''";
  const list =
    generator.valueToCode(block, 'VALUE', Order.UNARY_POSTFIX) || '[]';
  const code = list + '.' + operator + '(' + item + ')';
  if (block.workspace.options.oneBasedIndex) {
    return [code + ' + 1', Order.ADDITIVE];
  }
  return [code, Order.UNARY_POSTFIX];
}

export function lists_getIndex(
  block: Block,
  generator: DartGenerator,
): [string, Order] | string {
  // Get element at index.
  // Note: Until January 2013 this block did not have MODE or WHERE inputs.
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const listOrder =
    where === 'RANDOM' || where === 'FROM_END'
      ? Order.NONE
      : Order.UNARY_POSTFIX;
  let list = generator.valueToCode(block, 'VALUE', listOrder) || '[]';
  // Cache non-trivial values to variables to prevent repeated look-ups.
  // Closure, which accesses and modifies 'list'.
  function cacheList() {
    const listVar = generator.nameDB_!.getDistinctName(
      'tmp_list',
      NameType.VARIABLE,
    );
    const code = 'List ' + listVar + ' = ' + list + ';\n';
    list = listVar;
    return code;
  }
  // If `list` would be evaluated more than once (which is the case for
  // RANDOM REMOVE and FROM_END) and is non-trivial, make sure to access it
  // only once.
  if (
    ((where === 'RANDOM' && mode === 'REMOVE') || where === 'FROM_END') &&
    !list.match(/^\w+$/)
  ) {
    // `list` is an expression, so we may not evaluate it more than once.
    if (where === 'RANDOM') {
      // TODO(#7600): find better approach than casting to any to override
      // CodeGenerator declaring .definitions protected.
      (generator as AnyDuringMigration).definitions_['import_dart_math'] =
        "import 'dart:math' as Math;";
      // We can use multiple statements.
      let code = cacheList();
      const xVar = generator.nameDB_!.getDistinctName(
        'tmp_x',
        NameType.VARIABLE,
      );
      code +=
        'int ' + xVar + ' = new Math.Random().nextInt(' + list + '.length);\n';
      code += list + '.removeAt(' + xVar + ');\n';
      return code;
    } else {
      // where === 'FROM_END'
      if (mode === 'REMOVE') {
        // We can use multiple statements.
        const at = generator.getAdjusted(block, 'AT', 1, false, Order.ADDITIVE);
        let code = cacheList();
        code += list + '.removeAt(' + list + '.length' + ' - ' + at + ');\n';
        return code;
      } else if (mode === 'GET') {
        const at = generator.getAdjusted(block, 'AT', 1);
        // We need to create a procedure to avoid reevaluating values.
        const functionName = generator.provideFunction_(
          'lists_get_from_end',
          `
dynamic ${generator.FUNCTION_NAME_PLACEHOLDER_}(List my_list, num x) {
  x = my_list.length - x;
  return my_list[x];
}
`,
        );
        const code = functionName + '(' + list + ', ' + at + ')';
        return [code, Order.UNARY_POSTFIX];
      } else if (mode === 'GET_REMOVE') {
        const at = generator.getAdjusted(block, 'AT', 1);
        // We need to create a procedure to avoid reevaluating values.
        const functionName = generator.provideFunction_(
          'lists_remove_from_end',
          `
dynamic ${generator.FUNCTION_NAME_PLACEHOLDER_}(List my_list, num x) {
  x = my_list.length - x;
  return my_list.removeAt(x);
}
`,
        );
        const code = functionName + '(' + list + ', ' + at + ')';
        return [code, Order.UNARY_POSTFIX];
      }
    }
  } else {
    // Either `list` is a simple variable, or we only need to refer to `list`
    // once.
    switch (where) {
      case 'FIRST':
        if (mode === 'GET') {
          const code = list + '.first';
          return [code, Order.UNARY_POSTFIX];
        } else if (mode === 'GET_REMOVE') {
          const code = list + '.removeAt(0)';
          return [code, Order.UNARY_POSTFIX];
        } else if (mode === 'REMOVE') {
          return list + '.removeAt(0);\n';
        }
        break;
      case 'LAST':
        if (mode === 'GET') {
          const code = list + '.last';
          return [code, Order.UNARY_POSTFIX];
        } else if (mode === 'GET_REMOVE') {
          const code = list + '.removeLast()';
          return [code, Order.UNARY_POSTFIX];
        } else if (mode === 'REMOVE') {
          return list + '.removeLast();\n';
        }
        break;
      case 'FROM_START': {
        const at = generator.getAdjusted(block, 'AT');
        if (mode === 'GET') {
          const code = list + '[' + at + ']';
          return [code, Order.UNARY_POSTFIX];
        } else if (mode === 'GET_REMOVE') {
          const code = list + '.removeAt(' + at + ')';
          return [code, Order.UNARY_POSTFIX];
        } else if (mode === 'REMOVE') {
          return list + '.removeAt(' + at + ');\n';
        }
        break;
      }
      case 'FROM_END': {
        const at = generator.getAdjusted(block, 'AT', 1, false, Order.ADDITIVE);
        if (mode === 'GET') {
          const code = list + '[' + list + '.length - ' + at + ']';
          return [code, Order.UNARY_POSTFIX];
        } else if (mode === 'GET_REMOVE' || mode === 'REMOVE') {
          const code = list + '.removeAt(' + list + '.length - ' + at + ')';
          if (mode === 'GET_REMOVE') {
            return [code, Order.UNARY_POSTFIX];
          } else if (mode === 'REMOVE') {
            return code + ';\n';
          }
        }
        break;
      }
      case 'RANDOM':
        // TODO(#7600): find better approach than casting to any to override
        // CodeGenerator declaring .definitions protected.
        (generator as AnyDuringMigration).definitions_['import_dart_math'] =
          "import 'dart:math' as Math;";
        if (mode === 'REMOVE') {
          // We can use multiple statements.
          const xVar = generator.nameDB_!.getDistinctName(
            'tmp_x',
            NameType.VARIABLE,
          );
          let code =
            'int ' +
            xVar +
            ' = new Math.Random().nextInt(' +
            list +
            '.length);\n';
          code += list + '.removeAt(' + xVar + ');\n';
          return code;
        } else if (mode === 'GET') {
          const functionName = generator.provideFunction_(
            'lists_get_random_item',
            `
dynamic ${generator.FUNCTION_NAME_PLACEHOLDER_}(List my_list) {
  int x = new Math.Random().nextInt(my_list.length);
  return my_list[x];
}
`,
          );
          const code = functionName + '(' + list + ')';
          return [code, Order.UNARY_POSTFIX];
        } else if (mode === 'GET_REMOVE') {
          const functionName = generator.provideFunction_(
            'lists_remove_random_item',
            `
dynamic ${generator.FUNCTION_NAME_PLACEHOLDER_}(List my_list) {
  int x = new Math.Random().nextInt(my_list.length);
  return my_list.removeAt(x);
}
`,
          );
          const code = functionName + '(' + list + ')';
          return [code, Order.UNARY_POSTFIX];
        }
        break;
    }
  }
  throw Error('Unhandled combination (lists_getIndex).');
}

export function lists_setIndex(block: Block, generator: DartGenerator) {
  // Set element at index.
  // Note: Until February 2013 this block did not have MODE or WHERE inputs.
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  let list = generator.valueToCode(block, 'LIST', Order.UNARY_POSTFIX) || '[]';
  const value = generator.valueToCode(block, 'TO', Order.ASSIGNMENT) || 'null';
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
    const code = 'List ' + listVar + ' = ' + list + ';\n';
    list = listVar;
    return code;
  }
  switch (where) {
    case 'FIRST':
      if (mode === 'SET') {
        return list + '[0] = ' + value + ';\n';
      } else if (mode === 'INSERT') {
        return list + '.insert(0, ' + value + ');\n';
      }
      break;
    case 'LAST':
      if (mode === 'SET') {
        let code = cacheList();
        code += list + '[' + list + '.length - 1] = ' + value + ';\n';
        return code;
      } else if (mode === 'INSERT') {
        return list + '.add(' + value + ');\n';
      }
      break;
    case 'FROM_START': {
      const at = generator.getAdjusted(block, 'AT');
      if (mode === 'SET') {
        return list + '[' + at + '] = ' + value + ';\n';
      } else if (mode === 'INSERT') {
        return list + '.insert(' + at + ', ' + value + ');\n';
      }
      break;
    }
    case 'FROM_END': {
      const at = generator.getAdjusted(block, 'AT', 1, false, Order.ADDITIVE);
      let code = cacheList();
      if (mode === 'SET') {
        code += list + '[' + list + '.length - ' + at + '] = ' + value + ';\n';
        return code;
      } else if (mode === 'INSERT') {
        code +=
          list + '.insert(' + list + '.length - ' + at + ', ' + value + ');\n';
        return code;
      }
      break;
    }
    case 'RANDOM': {
      // TODO(#7600): find better approach than casting to any to override
      // CodeGenerator declaring .definitions protected.
      (generator as AnyDuringMigration).definitions_['import_dart_math'] =
        "import 'dart:math' as Math;";
      let code = cacheList();
      const xVar = generator.nameDB_!.getDistinctName(
        'tmp_x',
        NameType.VARIABLE,
      );
      code +=
        'int ' + xVar + ' = new Math.Random().nextInt(' + list + '.length);\n';
      if (mode === 'SET') {
        code += list + '[' + xVar + '] = ' + value + ';\n';
        return code;
      } else if (mode === 'INSERT') {
        code += list + '.insert(' + xVar + ', ' + value + ');\n';
        return code;
      }
      break;
    }
  }
  throw Error('Unhandled combination (lists_setIndex).');
}

export function lists_getSublist(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Get sublist.
  const list =
    generator.valueToCode(block, 'LIST', Order.UNARY_POSTFIX) || '[]';
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  let code;
  if (
    list.match(/^\w+$/) ||
    (where1 !== 'FROM_END' && where2 === 'FROM_START')
  ) {
    // If the list is a is a variable or doesn't require a call for length,
    // don't generate a helper function.
    let at1;
    switch (where1) {
      case 'FROM_START':
        at1 = generator.getAdjusted(block, 'AT1');
        break;
      case 'FROM_END':
        at1 = generator.getAdjusted(block, 'AT1', 1, false, Order.ADDITIVE);
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
        at2 = generator.getAdjusted(block, 'AT2', 0, false, Order.ADDITIVE);
        at2 = list + '.length - ' + at2;
        break;
      case 'LAST':
        // There is no second index if LAST option is chosen.
        break;
      default:
        throw Error('Unhandled option (lists_getSublist).');
    }
    if (where2 === 'LAST') {
      code = list + '.sublist(' + at1 + ')';
    } else {
      code = list + '.sublist(' + at1 + ', ' + at2 + ')';
    }
  } else {
    const at1 = generator.getAdjusted(block, 'AT1');
    const at2 = generator.getAdjusted(block, 'AT2');
    const functionName = generator.provideFunction_(
      'lists_get_sublist',
      `
List ${generator.FUNCTION_NAME_PLACEHOLDER_}(List list, String where1, num at1, String where2, num at2) {
  int getAt(String where, num at) {
    if (where == 'FROM_END') {
      at = list.length - 1 - at;
    } else if (where == 'FIRST') {
      at = 0;
    } else if (where == 'LAST') {
      at = list.length - 1;
    } else if (where != 'FROM_START') {
      throw 'Unhandled option (lists_getSublist).';
    }
    return at;
  }
  at1 = getAt(where1, at1);
  at2 = getAt(where2, at2) + 1;
  return list.sublist(at1, at2);
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
  return [code, Order.UNARY_POSTFIX];
}

export function lists_sort(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Block for sorting a list.
  const list = generator.valueToCode(block, 'LIST', Order.NONE) || '[]';
  const direction = block.getFieldValue('DIRECTION') === '1' ? 1 : -1;
  const type = block.getFieldValue('TYPE');
  const sortFunctionName = generator.provideFunction_(
    'lists_sort',
    `
List ${generator.FUNCTION_NAME_PLACEHOLDER_}(List list, String type, int direction) {
  var compareFuncs = {
    'NUMERIC': (a, b) => (direction * a.compareTo(b)).toInt(),
    'TEXT': (a, b) => direction * a.toString().compareTo(b.toString()),
    'IGNORE_CASE':
      (a, b) => direction *
      a.toString().toLowerCase().compareTo(b.toString().toLowerCase())
  };
  list = new List.from(list);
  var compare = compareFuncs[type];
  list.sort(compare);
  return list;
}
`,
  );
  return [
    sortFunctionName + '(' + list + ', ' + '"' + type + '", ' + direction + ')',
    Order.UNARY_POSTFIX,
  ];
}

export function lists_split(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Block for splitting text into a list, or joining a list into text.
  let input = generator.valueToCode(block, 'INPUT', Order.UNARY_POSTFIX);
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
  return [code, Order.UNARY_POSTFIX];
}

export function lists_reverse(
  block: Block,
  generator: DartGenerator,
): [string, Order] {
  // Block for reversing a list.
  const list = generator.valueToCode(block, 'LIST', Order.NONE) || '[]';
  // XXX What should the operator precedence be for a `new`?
  const code = 'new List.from(' + list + '.reversed)';
  return [code, Order.UNARY_POSTFIX];
}
