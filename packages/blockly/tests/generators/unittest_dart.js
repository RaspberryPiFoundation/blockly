/**
 * @license
 * Copyright 2014 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Dart for unit test blocks.
 */
'use strict';

dartGenerator.forBlock['unittest_main'] = function(block) {
  // Container for unit tests.
  var resultsVar = dartGenerator.nameDB_.getName('unittestResults',
      Blockly.Names.DEVELOPER_VARIABLE_TYPE);
  var functionName = dartGenerator.provideFunction_(
      'unittest_report',
      [ 'String ' + dartGenerator.FUNCTION_NAME_PLACEHOLDER_ + '() {',
        '  // Create test report.',
        '  List report = [];',
        '  StringBuffer summary = new StringBuffer();',
        '  int fails = 0;',
        '  for (int x = 0; x < ' + resultsVar + '.length; x++) {',
        '    if (' + resultsVar + '[x][0]) {',
        '      summary.write(".");',
        '    } else {',
        '      summary.write("F");',
        '      fails++;',
        '      report.add("");',
        '      report.add("FAIL: ${' + resultsVar + '[x][2]}");',
        '      report.add(' + resultsVar + '[x][1]);',
        '    }',
        '  }',
        '  report.insert(0, summary.toString());',
        '  report.add("");',
        '  report.add("Ran ${' + resultsVar + '.length} tests.");',
        '  report.add("");',
        '  if (fails != 0) {',
        '    report.add("FAILED (failures=$fails)");',
        '  } else {',
        '    report.add("OK");',
        '  }',
        '  return report.join("\\n");',
        '}']);
  // Setup global to hold test results.
  var code = resultsVar + ' = [];\n';
  // Say which test suite this is.
  code += 'print(\'\\n====================\\n\\n' +
      'Running suite: ' +
      block.getFieldValue('SUITE_NAME') +
       '\');\n';
  // Run tests (unindented).
  code += dartGenerator.statementToCode(block, 'DO')
      .replace(/^  /, '').replace(/\n  /g, '\n');
  // Print the report to the console (that's where errors will go anyway).
  code += 'print(' + functionName + '());\n';
  // Destroy results.
  code += resultsVar + ' = null;\n';
  return code;
};

function dartDefineAssert() {
  var resultsVar = dartGenerator.nameDB_.getName('unittestResults',
      Blockly.Names.DEVELOPER_VARIABLE_TYPE);
  var functionName = dartGenerator.provideFunction_(
      'unittest_assertequals',
      [ 'void ' + dartGenerator.FUNCTION_NAME_PLACEHOLDER_ +
          '(dynamic actual, dynamic expected, String message) {',
        '  // Asserts that a value equals another value.',
        '  if (' + resultsVar + ' == null) {',
        '    throw "Orphaned assert: ${message}";',
        '  }',
        '  bool equals(a, b) {',
        '    if (a == b) {',
        '      return true;',
        '    } else if (a is List && b is List) {',
        '      if (a.length != b.length) {',
        '        return false;',
        '      }',
        '      for (num i = 0; i < a.length; i++) {',
        '        if (!equals(a[i], b[i])) {',
        '          return false;',
        '        }',
        '      }',
        '      return true;',
        '    }',
        '    return false;',
        '  }',
        '  if (equals(actual, expected)) {',
        '    ' + resultsVar + '.add([true, "OK", message]);',
        '  } else {',
        '    ' + resultsVar + '.add([false, ' +
          '"Expected: $expected\\nActual: $actual", message]);',
        '  }',
        '}']);
  return functionName;
};

dartGenerator.forBlock['unittest_assertequals'] = function(block) {
  // Asserts that a value equals another value.
  var message = dartGenerator.valueToCode(block, 'MESSAGE',
      dartGenerator.ORDER_NONE) || '';
  var actual = dartGenerator.valueToCode(block, 'ACTUAL',
      dartGenerator.ORDER_NONE) || 'null';
  var expected = dartGenerator.valueToCode(block, 'EXPECTED',
      dartGenerator.ORDER_NONE) || 'null';
  return dartDefineAssert() +
      '(' + actual + ', ' + expected + ', ' + message + ');\n';
};

dartGenerator.forBlock['unittest_assertvalue'] = function(block) {
  // Asserts that a value is true, false, or null.
  var message = dartGenerator.valueToCode(block, 'MESSAGE',
      dartGenerator.ORDER_NONE) || '';
  var actual = dartGenerator.valueToCode(block, 'ACTUAL',
      dartGenerator.ORDER_NONE) || 'null';
  var expected = block.getFieldValue('EXPECTED');
  if (expected === 'TRUE') {
    expected = 'true';
  } else if (expected === 'FALSE') {
    expected = 'false';
  } else if (expected === 'NULL') {
    expected = 'null';
  }
  return dartDefineAssert() +
      '(' + actual + ', ' + expected + ', ' + message + ');\n';
};

dartGenerator.forBlock['unittest_fail'] = function(block) {
  // Always assert an error.
  var resultsVar = dartGenerator.nameDB_.getName('unittestResults',
      Blockly.Names.DEVELOPER_VARIABLE_TYPE);
  var message = dartGenerator.quote_(block.getFieldValue('MESSAGE'));
  var functionName = dartGenerator.provideFunction_(
      'unittest_fail',
      [ 'void ' + dartGenerator.FUNCTION_NAME_PLACEHOLDER_ +
          '(String message) {',
        '  // Always assert an error.',
        '  if (' + resultsVar + ' == null) {',
        '    throw "Orphaned assert fail: ${message}";',
        '  }',
        '  ' + resultsVar + '.add([false, "Fail.", message]);',
        '}']);
  return functionName + '(' + message + ');\n';
};

dartGenerator.forBlock['unittest_adjustindex'] = function(block) {
  var index = dartGenerator.valueToCode(block, 'INDEX',
      dartGenerator.ORDER_ADDITIVE) || '0';
  // Adjust index if using one-based indexing.
  if (block.workspace.options.oneBasedIndex) {
    if (Blockly.utils.string.isNumber(index)) {
      // If the index is a naked number, adjust it right now.
      return [Number(index) + 1, dartGenerator.ORDER_ATOMIC];
    } else {
      // If the index is dynamic, adjust it in code.
      index += ' + 1';
    }
  } else if (Blockly.utils.string.isNumber(index)) {
    return [index, dartGenerator.ORDER_ATOMIC];
  }
  return [index, dartGenerator.ORDER_ADDITIVE];
};
