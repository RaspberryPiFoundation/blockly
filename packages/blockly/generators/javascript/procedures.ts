/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating JavaScript for procedure blocks.
 */

// Former goog.module ID: Blockly.JavaScript.procedures

import type {IfReturnBlock} from '../../blocks/procedures.js';
import type {Block} from '../../core/block.js';
import type {JavascriptGenerator} from './javascript_generator.js';
import {Order} from './javascript_generator.js';

export function procedures_defreturn(
  block: Block,
  generator: JavascriptGenerator,
) {
  // Define a procedure with a return value.
  const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
  let xfix1 = '';
  if (generator.STATEMENT_PREFIX) {
    xfix1 += generator.injectId(generator.STATEMENT_PREFIX, block);
  }
  if (generator.STATEMENT_SUFFIX) {
    xfix1 += generator.injectId(generator.STATEMENT_SUFFIX, block);
  }
  if (xfix1) {
    xfix1 = generator.prefixLines(xfix1, generator.INDENT);
  }
  let loopTrap = '';
  if (generator.INFINITE_LOOP_TRAP) {
    loopTrap = generator.prefixLines(
      generator.injectId(generator.INFINITE_LOOP_TRAP, block),
      generator.INDENT,
    );
  }
  let branch = '';
  if (block.getInput('STACK')) {
    // The 'procedures_defreturn' block might not have a STACK input.
    branch = generator.statementToCode(block, 'STACK');
  }
  let returnValue = '';
  if (block.getInput('RETURN')) {
    // The 'procedures_defnoreturn' block (which shares this code)
    // does not have a RETURN input.
    returnValue = generator.valueToCode(block, 'RETURN', Order.NONE) || '';
  }
  let xfix2 = '';
  if (branch && returnValue) {
    // After executing the function body, revisit this block for the return.
    xfix2 = xfix1;
  }
  if (returnValue) {
    returnValue = generator.INDENT + 'return ' + returnValue + ';\n';
  }
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = generator.getVariableName(variables[i]);
  }
  let code =
    'function ' +
    funcName +
    '(' +
    args.join(', ') +
    ') {\n' +
    xfix1 +
    loopTrap +
    branch +
    xfix2 +
    returnValue +
    '}';
  code = generator.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  // TODO(#7600): find better approach than casting to any to override
  // CodeGenerator declaring .definitions protected.
  (generator as AnyDuringMigration).definitions_['%' + funcName] = code;
  return null;
}

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
export const procedures_defnoreturn = procedures_defreturn;

export function procedures_callreturn(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Call a procedure with a return value.
  const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = generator.valueToCode(block, 'ARG' + i, Order.NONE) || 'null';
  }
  const code = funcName + '(' + args.join(', ') + ')';
  return [code, Order.FUNCTION_CALL];
}

export function procedures_callnoreturn(
  block: Block,
  generator: JavascriptGenerator,
) {
  // Call a procedure with no return value.
  // Generated code is for a function call as a statement is the same as a
  // function call as a value, with the addition of line ending.
  const tuple = generator.forBlock['procedures_callreturn'](
    block,
    generator,
  ) as [string, Order];
  return tuple[0] + ';\n';
}

export function procedures_ifreturn(
  block: Block,
  generator: JavascriptGenerator,
) {
  // Conditionally return value from a procedure.
  const condition =
    generator.valueToCode(block, 'CONDITION', Order.NONE) || 'false';
  let code = 'if (' + condition + ') {\n';
  if (generator.STATEMENT_SUFFIX) {
    // Inject any statement suffix here since the regular one at the end
    // will not get executed if the return is triggered.
    code += generator.prefixLines(
      generator.injectId(generator.STATEMENT_SUFFIX, block),
      generator.INDENT,
    );
  }
  if ((block as IfReturnBlock).hasReturnValue_) {
    const value = generator.valueToCode(block, 'VALUE', Order.NONE) || 'null';
    code += generator.INDENT + 'return ' + value + ';\n';
  } else {
    code += generator.INDENT + 'return;\n';
  }
  code += '}\n';
  return code;
}
