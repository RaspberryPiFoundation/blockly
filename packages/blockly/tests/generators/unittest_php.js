/**
 * @license
 * Copyright 2015 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating PHP for unit test blocks.
 */
'use strict';

phpGenerator.forBlock['unittest_main'] = function(block) {
  // Container for unit tests.
  var resultsVar = phpGenerator.nameDB_.getName('unittestResults',
      Blockly.Names.DEVELOPER_VARIABLE_TYPE);
  var functionName = phpGenerator.provideFunction_(
      'unittest_report',
      [ 'function ' + phpGenerator.FUNCTION_NAME_PLACEHOLDER_ + '() {',
          '  global ' + resultsVar + ';',
          '  // Create test report.',
          '  $report = array();',
          '  $summary = array();',
          '  $fails = 0;',
          '  for ($x = 0; $x < count(' + resultsVar + '); $x++) {',
          '    if (' + resultsVar + '[$x][0]) {',
          '      array_push($summary, ".");',
          '    } else {',
          '      array_push($summary, "F");',
          '      $fails++;',
          '      array_push($report, "");',
          '      array_push($report, "FAIL: " . ' + resultsVar + '[$x][2]);',
          '      array_push($report, ' + resultsVar + '[$x][1]);',
          '    }',
          '  }',
          '  array_unshift($report, implode("", $summary));',
          '  array_push($report, "");',
          '  array_push($report, "Number of tests run: " . count(' + resultsVar + '));',
          '  array_push($report, "");',
          '  if ($fails) {',
          '    array_push($report, "FAILED (failures=" . $fails . ")");',
          '  } else {',
          '    array_push($report, "OK");',
          '  }',
          '  return implode("\\n", $report);',
          '}']);
  // Setup global to hold test results.
  var code = resultsVar + ' = array();\n';
  // Say which test suite this is.
  code += 'print("\\n====================\\n\\n' +
      'Running suite: ' +
      block.getFieldValue('SUITE_NAME') +
       '\\n");\n';
  // Run tests (unindented).
  code += phpGenerator.statementToCode(block, 'DO')
      .replace(/^  /, '').replace(/\n  /g, '\n');
  // Send the report to the console (that's where errors will go anyway).
  code += 'print(' + functionName + '());\n';
  // Destroy results.
  code += resultsVar + ' = null;\n';
  return code;
};

function phpDefineAssert() {
  var resultsVar = phpGenerator.nameDB_.getName('unittestResults',
      Blockly.Names.DEVELOPER_VARIABLE_TYPE);
  var functionName = phpGenerator.provideFunction_(
      'assertEquals',
      ['function ' + phpGenerator.FUNCTION_NAME_PLACEHOLDER_ +
      '($actual, $expected, $message) {',
      '  global ' + resultsVar + ';',
      '  // Asserts that a value equals another value.',
      '  if (!is_array(' + resultsVar + ')) {',
      '    throw new Exception("Orphaned assert: " . $message);',
      '  }',
      '  if ($actual == $expected) {',
      '    array_push(' + resultsVar + ', [true, "OK", $message]);',
      '  } else {',
      '    $expected = is_array($expected) ? implode(" ", $expected) : ' +
          '$expected;',
      '    $actual = is_array($actual) ? implode(" ", $actual) : ' +
          '$actual;',
      '    array_push(' + resultsVar + ', [false, ' +
      '"Expected: " . $expected . "\\nActual: " . $actual, $message]);',
      '  }',
      '}']);
  return functionName;
};

phpGenerator.forBlock['unittest_assertequals'] = function(block) {
  // Asserts that a value equals another value.
  var message = phpGenerator.valueToCode(block, 'MESSAGE',
    phpGenerator.ORDER_NONE) || '';
  var actual = phpGenerator.valueToCode(block, 'ACTUAL',
          phpGenerator.ORDER_NONE) || 'null';
  var expected = phpGenerator.valueToCode(block, 'EXPECTED',
          phpGenerator.ORDER_NONE) || 'null';
  return phpDefineAssert() +
      '(' + actual + ', ' + expected + ', ' + message + ');\n';
};

phpGenerator.forBlock['unittest_assertvalue'] = function(block) {
  // Asserts that a value is true, false, or null.
  var message = phpGenerator.valueToCode(block, 'MESSAGE',
    phpGenerator.ORDER_NONE) || '';
  var actual = phpGenerator.valueToCode(block, 'ACTUAL',
          phpGenerator.ORDER_NONE) || 'null';
  var expected = block.getFieldValue('EXPECTED');
  if (expected == 'TRUE') {
      expected = 'true';
  } else if (expected == 'FALSE') {
      expected = 'false';
  } else if (expected == 'NULL') {
      expected = 'null';
  }
  return phpDefineAssert() +
      '(' + actual + ', ' + expected + ', ' + message + ');\n';
};

phpGenerator.forBlock['unittest_fail'] = function(block) {
  // Always assert an error.
  var resultsVar = phpGenerator.nameDB_.getName('unittestResults',
      Blockly.Names.DEVELOPER_VARIABLE_TYPE);
  var message = phpGenerator.quote_(block.getFieldValue('MESSAGE'));
  var functionName = phpGenerator.provideFunction_(
      'unittest_fail',
      [ 'function ' + phpGenerator.FUNCTION_NAME_PLACEHOLDER_ +
      '($message) {',
          '  global ' + resultsVar + ';',
          '  // Always assert an error.',
          '  if (!' + resultsVar + ') {',
          '    throw new Exception("Orphaned assert fail: " . $message);',
          '  }',
          '  array_push(' + resultsVar + ', [false, "Fail.", $message]);',
          '}']);
  return functionName + '(' + message + ');\n';
};

phpGenerator.forBlock['unittest_adjustindex'] = function(block) {
  var index = phpGenerator.valueToCode(block, 'INDEX',
      phpGenerator.ORDER_ADDITION) || '0';
  // Adjust index if using one-based indexing.
  if (block.workspace.options.oneBasedIndex) {
    if (Blockly.utils.string.isNumber(index)) {
      // If the index is a naked number, adjust it right now.
      return [Number(index) + 1, phpGenerator.ORDER_ATOMIC];
    } else {
      // If the index is dynamic, adjust it in code.
      index += ' + 1';
    }
  } else if (Blockly.utils.string.isNumber(index)) {
    return [index, phpGenerator.ORDER_ATOMIC];
  }
  return [index, phpGenerator.ORDER_ADDITION];
};
