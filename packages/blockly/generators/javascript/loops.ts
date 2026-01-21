/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating JavaScript for loop blocks.
 */

// Former goog.module ID: Blockly.JavaScript.loops

import type {ControlFlowInLoopBlock} from '../../blocks/loops.js';
import type {Block} from '../../core/block.js';
import {NameType} from '../../core/names.js';
import * as stringUtils from '../../core/utils/string.js';
import type {JavascriptGenerator} from './javascript_generator.js';
import {Order} from './javascript_generator.js';

export function controls_repeat_ext(
  block: Block,
  generator: JavascriptGenerator,
) {
  // Repeat n times.
  let repeats;
  if (block.getField('TIMES')) {
    // Internal number.
    repeats = String(Number(block.getFieldValue('TIMES')));
  } else {
    // External number.
    repeats = generator.valueToCode(block, 'TIMES', Order.ASSIGNMENT) || '0';
  }
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  let code = '';
  const loopVar = generator.nameDB_!.getDistinctName(
    'count',
    NameType.VARIABLE,
  );
  let endVar = repeats;
  if (!repeats.match(/^\w+$/) && !stringUtils.isNumber(repeats)) {
    endVar = generator.nameDB_!.getDistinctName(
      'repeat_end',
      NameType.VARIABLE,
    );
    code += 'var ' + endVar + ' = ' + repeats + ';\n';
  }
  code +=
    'for (var ' +
    loopVar +
    ' = 0; ' +
    loopVar +
    ' < ' +
    endVar +
    '; ' +
    loopVar +
    '++) {\n' +
    branch +
    '}\n';
  return code;
}

export const controls_repeat = controls_repeat_ext;

export function controls_whileUntil(
  block: Block,
  generator: JavascriptGenerator,
) {
  // Do while/until loop.
  const until = block.getFieldValue('MODE') === 'UNTIL';
  let argument0 =
    generator.valueToCode(
      block,
      'BOOL',
      until ? Order.LOGICAL_NOT : Order.NONE,
    ) || 'false';
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  if (until) {
    argument0 = '!' + argument0;
  }
  return 'while (' + argument0 + ') {\n' + branch + '}\n';
}

export function controls_for(block: Block, generator: JavascriptGenerator) {
  // For loop.
  const variable0 = generator.getVariableName(block.getFieldValue('VAR'));
  const argument0 =
    generator.valueToCode(block, 'FROM', Order.ASSIGNMENT) || '0';
  const argument1 = generator.valueToCode(block, 'TO', Order.ASSIGNMENT) || '0';
  const increment = generator.valueToCode(block, 'BY', Order.ASSIGNMENT) || '1';
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  let code;
  if (
    stringUtils.isNumber(argument0) &&
    stringUtils.isNumber(argument1) &&
    stringUtils.isNumber(increment)
  ) {
    // All arguments are simple numbers.
    const up = Number(argument0) <= Number(argument1);
    code =
      'for (' +
      variable0 +
      ' = ' +
      argument0 +
      '; ' +
      variable0 +
      (up ? ' <= ' : ' >= ') +
      argument1 +
      '; ' +
      variable0;
    const step = Math.abs(Number(increment));
    if (step === 1) {
      code += up ? '++' : '--';
    } else {
      code += (up ? ' += ' : ' -= ') + step;
    }
    code += ') {\n' + branch + '}\n';
  } else {
    code = '';
    // Cache non-trivial values to variables to prevent repeated look-ups.
    let startVar = argument0;
    if (!argument0.match(/^\w+$/) && !stringUtils.isNumber(argument0)) {
      startVar = generator.nameDB_!.getDistinctName(
        variable0 + '_start',
        NameType.VARIABLE,
      );
      code += 'var ' + startVar + ' = ' + argument0 + ';\n';
    }
    let endVar = argument1;
    if (!argument1.match(/^\w+$/) && !stringUtils.isNumber(argument1)) {
      endVar = generator.nameDB_!.getDistinctName(
        variable0 + '_end',
        NameType.VARIABLE,
      );
      code += 'var ' + endVar + ' = ' + argument1 + ';\n';
    }
    // Determine loop direction at start, in case one of the bounds
    // changes during loop execution.
    const incVar = generator.nameDB_!.getDistinctName(
      variable0 + '_inc',
      NameType.VARIABLE,
    );
    code += 'var ' + incVar + ' = ';
    if (stringUtils.isNumber(increment)) {
      code += Math.abs(Number(increment)) + ';\n';
    } else {
      code += 'Math.abs(' + increment + ');\n';
    }
    code += 'if (' + startVar + ' > ' + endVar + ') {\n';
    code += generator.INDENT + incVar + ' = -' + incVar + ';\n';
    code += '}\n';
    code +=
      'for (' +
      variable0 +
      ' = ' +
      startVar +
      '; ' +
      incVar +
      ' >= 0 ? ' +
      variable0 +
      ' <= ' +
      endVar +
      ' : ' +
      variable0 +
      ' >= ' +
      endVar +
      '; ' +
      variable0 +
      ' += ' +
      incVar +
      ') {\n' +
      branch +
      '}\n';
  }
  return code;
}

export function controls_forEach(block: Block, generator: JavascriptGenerator) {
  // For each loop.
  const variable0 = generator.getVariableName(block.getFieldValue('VAR'));
  const argument0 =
    generator.valueToCode(block, 'LIST', Order.ASSIGNMENT) || '[]';
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  let code = '';
  // Cache non-trivial values to variables to prevent repeated look-ups.
  let listVar = argument0;
  if (!argument0.match(/^\w+$/)) {
    listVar = generator.nameDB_!.getDistinctName(
      variable0 + '_list',
      NameType.VARIABLE,
    );
    code += 'var ' + listVar + ' = ' + argument0 + ';\n';
  }
  const indexVar = generator.nameDB_!.getDistinctName(
    variable0 + '_index',
    NameType.VARIABLE,
  );
  branch =
    generator.INDENT +
    variable0 +
    ' = ' +
    listVar +
    '[' +
    indexVar +
    '];\n' +
    branch;
  code += 'for (var ' + indexVar + ' in ' + listVar + ') {\n' + branch + '}\n';
  return code;
}

export function controls_flow_statements(
  block: Block,
  generator: JavascriptGenerator,
) {
  // Flow statements: continue, break.
  let xfix = '';
  if (generator.STATEMENT_PREFIX) {
    // Automatic prefix insertion is switched off for this block.  Add manually.
    xfix += generator.injectId(generator.STATEMENT_PREFIX, block);
  }
  if (generator.STATEMENT_SUFFIX) {
    // Inject any statement suffix here since the regular one at the end
    // will not get executed if the break/continue is triggered.
    xfix += generator.injectId(generator.STATEMENT_SUFFIX, block);
  }
  if (generator.STATEMENT_PREFIX) {
    const loop = (block as ControlFlowInLoopBlock).getSurroundLoop();
    if (loop && !loop.suppressPrefixSuffix) {
      // Inject loop's statement prefix here since the regular one at the end
      // of the loop will not get executed if 'continue' is triggered.
      // In the case of 'break', a prefix is needed due to the loop's suffix.
      xfix += generator.injectId(generator.STATEMENT_PREFIX, loop);
    }
  }
  switch (block.getFieldValue('FLOW')) {
    case 'BREAK':
      return xfix + 'break;\n';
    case 'CONTINUE':
      return xfix + 'continue;\n';
  }
  throw Error('Unknown flow statement.');
}
