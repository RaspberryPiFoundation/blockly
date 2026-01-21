/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Python for unit test blocks.
 */
'use strict';

pythonGenerator.forBlock['unittest_main'] = function(block) {
  // Container for unit tests.
  var resultsVar = pythonGenerator.nameDB_.getName('unittestResults',
      Blockly.Names.DEVELOPER_VARIABLE_TYPE);
  var functionName = pythonGenerator.provideFunction_(
      'unittest_report',
      ['def ' + pythonGenerator.FUNCTION_NAME_PLACEHOLDER_ + '():',
       '  # Create test report.',
       '  report = []',
       '  summary = []',
       '  fails = 0',
       '  for (success, log, message) in ' + resultsVar + ':',
       '    if success:',
       '      summary.append(".")',
       '    else:',
       '      summary.append("F")',
       '      fails += 1',
       '      report.append("")',
       '      report.append("FAIL: " + message)',
       '      report.append(log)',
       '  report.insert(0, "".join(summary))',
       '  report.append("")',
       '  report.append("Number of tests run: %d" % len(' + resultsVar + '))',
       '  report.append("")',
       '  if fails:',
       '    report.append("FAILED (failures=%d)" % fails)',
       '  else:',
       '    report.append("OK")',
       '  return "\\n".join(report)']);

  // Setup global to hold test results.
  var code = resultsVar + ' = []\n';
  // Say which test suite this is.
  code += 'print(\'\\n====================\\n\\n' +
      'Running suite: ' +
      block.getFieldValue('SUITE_NAME') +
       '\')\n';
  // Run tests (unindented).
  code += pythonGenerator.statementToCode(block, 'DO')
      .replace(/^  /, '').replace(/\n  /g, '\n');
  // Print the report.
  code += 'print(' + functionName + '())\n';
  // Destroy results.
  code += resultsVar + ' = None\n';
  return code;
};

function pythonDefineAssert() {
  var resultsVar = pythonGenerator.nameDB_.getName('unittestResults',
      Blockly.Names.DEVELOPER_VARIABLE_TYPE);
  var functionName = pythonGenerator.provideFunction_(
      'assertEquals',
      ['def ' + pythonGenerator.FUNCTION_NAME_PLACEHOLDER_ +
          '(actual, expected, message):',
       '  # Asserts that a value equals another value.',
       '  if ' + resultsVar + ' == None:',
       '    raise Exception("Orphaned assert equals: " + message)',
       '  if actual == expected:',
       '    ' + resultsVar + '.append((True, "OK", message))',
       '  else:',
       '    ' + resultsVar + '.append((False, ' +
           '"Expected: %s\\nActual: %s" % (expected, actual), message))']);
  return functionName;
};

pythonGenerator.forBlock['unittest_assertequals'] = function(block) {
  // Asserts that a value equals another value.
  var message = pythonGenerator.valueToCode(block, 'MESSAGE',
      pythonGenerator.ORDER_NONE) || '';
  var actual = pythonGenerator.valueToCode(block, 'ACTUAL',
      pythonGenerator.ORDER_NONE) || 'None';
  var expected = pythonGenerator.valueToCode(block, 'EXPECTED',
      pythonGenerator.ORDER_NONE) || 'None';
  return pythonDefineAssert() +
      '(' + actual + ', ' + expected + ', ' + message + ')\n';
};

pythonGenerator.forBlock['unittest_assertvalue'] = function(block) {
  // Asserts that a value is true, false, or null.
  var message = pythonGenerator.valueToCode(block, 'MESSAGE',
      pythonGenerator.ORDER_NONE) || '';
  var actual = pythonGenerator.valueToCode(block, 'ACTUAL',
      pythonGenerator.ORDER_NONE) || 'None';
  var expected = block.getFieldValue('EXPECTED');
  if (expected == 'TRUE') {
    expected = 'True';
  } else if (expected == 'FALSE') {
    expected = 'False';
  } else if (expected == 'NULL') {
    expected = 'None';
  }
  return pythonDefineAssert() +
      '(' + actual + ', ' + expected + ', ' + message + ')\n';
};

pythonGenerator.forBlock['unittest_fail'] = function(block) {
  // Always assert an error.
  var resultsVar = pythonGenerator.nameDB_.getName('unittestResults',
      Blockly.Names.DEVELOPER_VARIABLE_TYPE);
  var message = pythonGenerator.quote_(block.getFieldValue('MESSAGE'));
  var functionName = pythonGenerator.provideFunction_(
      'fail',
      ['def ' + pythonGenerator.FUNCTION_NAME_PLACEHOLDER_ + '(message):',
       '  # Always assert an error.',
       '  if ' + resultsVar + ' == None:',
       '    raise Exception("Orphaned assert equals: " + message)',
       '  ' + resultsVar + '.append((False, "Fail.", message))']);
  return functionName + '(' + message + ')\n';
};

pythonGenerator.forBlock['unittest_adjustindex'] = function(block) {
  var index = pythonGenerator.valueToCode(block, 'INDEX',
      pythonGenerator.ORDER_ADDITIVE) || '0';
  // Adjust index if using one-based indexing.
  if (block.workspace.options.oneBasedIndex) {
    if (Blockly.utils.string.isNumber(index)) {
      // If the index is a naked number, adjust it right now.
      return [Number(index) + 1, pythonGenerator.ORDER_ATOMIC];
    } else {
      // If the index is dynamic, adjust it in code.
      index += ' + 1';
    }
  } else if (Blockly.utils.string.isNumber(index)) {
    return [index, pythonGenerator.ORDER_ATOMIC];
  }
  return [index, pythonGenerator.ORDER_ADDITIVE];
};
