'use strict';

var unittestResults, test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy;

function unittest_report() {
  // Create test report.
  var report = [];
  var summary = [];
  var fails = 0;
  for (var i = 0; i < unittestResults.length; i++) {
    if (unittestResults[i][0]) {
      summary.push(".");
    } else {
      summary.push("F");
      fails++;
      report.push("");
      report.push("FAIL: " + unittestResults[i][2]);
      report.push(unittestResults[i][1]);
    }
  }
  report.unshift(summary.join(""));
  report.push("");
  report.push("Number of tests run: " + unittestResults.length);
  report.push("");
  if (fails) {
    report.push("FAILED (failures=" + fails + ")");
  } else {
    report.push("OK");
  }
  return report.join("\n");
}

function assertEquals(actual, expected, message) {
  // Asserts that a value equals another value.
  if (!unittestResults) {
    throw "Orphaned assert: " + message;
  }
  function equals(a, b) {
    if (a === b) {
      return true;
    } else if ((typeof a === "number") && (typeof b === "number") &&
        (a.toPrecision(15) == b.toPrecision(15))) {
      return true;
    } else if (a instanceof Array && b instanceof Array) {
      if (a.length !== b.length) {
        return false;
      }
      for (var i = 0; i < a.length; i++) {
        if (!equals(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  if (equals(actual, expected)) {
    unittestResults.push([true, "OK", message]);
  } else {
    unittestResults.push([false, "Expected: " + expected + "\nActual: " + actual, message]);
  }
}

function unittest_fail(message) {
  // Always assert an error.
  if (!unittestResults) {
    throw "Orphaned assert fail: " + message;
  }
  unittestResults.push([false, "Fail.", message]);
}

// Describe this function...
function test_if() {
  if (false) {
    unittest_fail('if false');
  }
  ok = false;
  if (true) {
    ok = true;
  }
  assertEquals(ok, true, 'if true');
  ok = false;
  if (false) {
    unittest_fail('if/else false');
  } else {
    ok = true;
  }
  assertEquals(ok, true, 'if/else false');
  ok = false;
  if (true) {
    ok = true;
  } else {
    unittest_fail('if/else true');
  }
  assertEquals(ok, true, 'if/else true');
  ok = false;
  if (false) {
    unittest_fail('elseif 1');
  } else if (true) {
    ok = true;
  } else if (true) {
    unittest_fail('elseif 2');
  } else {
    unittest_fail('elseif 3');
  }
  assertEquals(ok, true, 'elseif 4');
}

// Describe this function...
function test_ifelse() {
  ok = false;
  if (true) {
    ok = true;
  } else {
    unittest_fail('ifelse true');
  }
  assertEquals(ok, true, 'ifelse true');
  ok = false;
  if (false) {
    unittest_fail('ifelse false');
  } else {
    ok = true;
  }
  assertEquals(ok, true, 'ifelse false');
}

// Describe this function...
function test_equalities() {
  assertEquals(2 == 2, true, 'Equal yes');
  assertEquals(3 == 4, false, 'Equal no');
  assertEquals(5 != 6, true, 'Not equal yes');
  assertEquals(3 == 4, false, 'Not equal no');
  assertEquals(5 < 6, true, 'Smaller yes');
  assertEquals(7 < 7, false, 'Smaller no');
  assertEquals(9 > 8, true, 'Greater yes');
  assertEquals(10 > 10, false, 'Greater no');
  assertEquals(11 <= 11, true, 'Smaller-equal yes');
  assertEquals(13 <= 12, false, 'Smaller-equal no');
  assertEquals(14 >= 14, true, 'Greater-equal yes');
  assertEquals(15 >= 16, false, 'Greater-equal no');
}

// Describe this function...
function test_and() {
  assertEquals(true && true, true, 'And true/true');
  assertEquals(false && true, false, 'And false/true');
  assertEquals(true && false, false, 'And true/false');
  assertEquals(false && false, false, 'And false/false');
}

// Describe this function...
function test_or() {
  assertEquals(true || true, true, 'Or true/true');
  assertEquals(false || true, true, 'Or false/true');
  assertEquals(true || false, true, 'Or true/false');
  assertEquals(false || false, false, 'Or false/false');
}

// Describe this function...
function test_ternary() {
  assertEquals(true ? 42 : 99, 42, 'if true');
  assertEquals(false ? 42 : 99, 99, 'if true');
}

// Describe this function...
function test_foreach() {
  log = '';
  var x_list = ['a', 'b', 'c'];
  for (var x_index in x_list) {
    x = x_list[x_index];
    log += String(x);
  }
  assertEquals(log, 'abc', 'for loop');
}

// Describe this function...
function test_repeat() {
  count = 0;
  for (var count2 = 0; count2 < 10; count2++) {
    count = (typeof count === 'number' ? count : 0) + 1;
  }
  assertEquals(count, 10, 'repeat 10');
}

// Describe this function...
function test_while() {
  while (false) {
    unittest_fail('while 0');
  }
  while (!true) {
    unittest_fail('until 0');
  }
  count = 1;
  while (count != 10) {
    count = (typeof count === 'number' ? count : 0) + 1;
  }
  assertEquals(count, 10, 'while 10');
  count = 1;
  while (!(count == 10)) {
    count = (typeof count === 'number' ? count : 0) + 1;
  }
  assertEquals(count, 10, 'until 10');
}

// Describe this function...
function test_repeat_ext() {
  count = 0;
  for (var count3 = 0; count3 < 10; count3++) {
    count = (typeof count === 'number' ? count : 0) + 1;
  }
  assertEquals(count, 10, 'repeat 10');
}

// Describe this function...
function test_count_by() {
  log = '';
  for (x = 1; x <= 8; x += 2) {
    log += String(x);
  }
  assertEquals(log, '1357', 'count up ints');
  log = '';
  for (x = 8; x >= 1; x -= 2) {
    log += String(x);
  }
  assertEquals(log, '8642', 'count down ints');
  loglist = [];
  for (x = 1; x <= 8; x += 1.5) {
    loglist.push(x);
  }
  assertEquals(loglist, [1, 2.5, 4, 5.5, 7], 'count with floats');
  loglist = [];
  var x_start = 1 + 0;
  var x_end = 8 + 0;
  var x_inc = Math.abs(1 - 2);
  if (x_start > x_end) {
    x_inc = -x_inc;
  }
  for (x = x_start; x_inc >= 0 ? x <= x_end : x >= x_end; x += x_inc) {
    loglist.push(x);
  }
  assertEquals(loglist, [1, 2, 3, 4, 5, 6, 7, 8], 'count up non-trivial ints');
  loglist = [];
  var x_start2 = 8 + 0;
  var x_end2 = 1 + 0;
  var x_inc2 = 2;
  if (x_start2 > x_end2) {
    x_inc2 = -x_inc2;
  }
  for (x = x_start2; x_inc2 >= 0 ? x <= x_end2 : x >= x_end2; x += x_inc2) {
    loglist.push(x);
  }
  assertEquals(loglist, [8, 6, 4, 2], 'count down non-trivial ints');
  loglist = [];
  var x_start3 = 5 + 0.5;
  var x_end3 = 1 + 0;
  var x_inc3 = Math.abs(1 + 0);
  if (x_start3 > x_end3) {
    x_inc3 = -x_inc3;
  }
  for (x = x_start3; x_inc3 >= 0 ? x <= x_end3 : x >= x_end3; x += x_inc3) {
    loglist.push(x);
  }
  assertEquals(loglist, [5.5, 4.5, 3.5, 2.5, 1.5], 'count with floats');
}

// Describe this function...
function test_count_loops() {
  log = '';
  for (x = 1; x <= 8; x++) {
    log += String(x);
  }
  assertEquals(log, '12345678', 'count up');
  log = '';
  for (x = 8; x >= 1; x--) {
    log += String(x);
  }
  assertEquals(log, '87654321', 'count down');
  loglist = [];
  var x_start4 = 1 + 0;
  var x_end4 = 4 + 0;
  var x_inc4 = 1;
  if (x_start4 > x_end4) {
    x_inc4 = -x_inc4;
  }
  for (x = x_start4; x_inc4 >= 0 ? x <= x_end4 : x >= x_end4; x += x_inc4) {
    loglist.push(x);
  }
  assertEquals(loglist, [1, 2, 3, 4], 'count up non-trivial');
  loglist = [];
  var x_start5 = 3 + 1;
  var x_end5 = 1 + 0;
  var x_inc5 = 1;
  if (x_start5 > x_end5) {
    x_inc5 = -x_inc5;
  }
  for (x = x_start5; x_inc5 >= 0 ? x <= x_end5 : x >= x_end5; x += x_inc5) {
    loglist.push(x);
  }
  assertEquals(loglist, [4, 3, 2, 1], 'count down non-trivial');
}

// Describe this function...
function test_continue() {
  log = '';
  count = 0;
  while (count != 8) {
    count = (typeof count === 'number' ? count : 0) + 1;
    if (count == 5) {
      continue;
    }
    log += String(count);
  }
  assertEquals(log, '1234678', 'while continue');
  log = '';
  count = 0;
  while (!(count == 8)) {
    count = (typeof count === 'number' ? count : 0) + 1;
    if (count == 5) {
      continue;
    }
    log += String(count);
  }
  assertEquals(log, '1234678', 'until continue');
  log = '';
  for (x = 1; x <= 8; x++) {
    if (x == 5) {
      continue;
    }
    log += String(x);
  }
  assertEquals(log, '1234678', 'count continue');
  log = '';
  var x_list2 = ['a', 'b', 'c', 'd'];
  for (var x_index2 in x_list2) {
    x = x_list2[x_index2];
    if (x == 'c') {
      continue;
    }
    log += String(x);
  }
  assertEquals(log, 'abd', 'for continue');
}

// Describe this function...
function test_break() {
  count = 1;
  while (count != 10) {
    if (count == 5) {
      break;
    }
    count = (typeof count === 'number' ? count : 0) + 1;
  }
  assertEquals(count, 5, 'while break');
  count = 1;
  while (!(count == 10)) {
    if (count == 5) {
      break;
    }
    count = (typeof count === 'number' ? count : 0) + 1;
  }
  assertEquals(count, 5, 'until break');
  log = '';
  for (x = 1; x <= 8; x++) {
    if (x == 5) {
      break;
    }
    log += String(x);
  }
  assertEquals(log, '1234', 'count break');
  log = '';
  var x_list3 = ['a', 'b', 'c', 'd'];
  for (var x_index3 in x_list3) {
    x = x_list3[x_index3];
    if (x == 'c') {
      break;
    }
    log += String(x);
  }
  assertEquals(log, 'ab', 'for break');
}

// Tests the "single" block.
function test_single() {
  assertEquals(Math.sqrt(25), 5, 'sqrt');
  assertEquals(Math.abs(-25), 25, 'abs');
  assertEquals(-(-25), 25, 'negate');
  assertEquals(Math.log(1), 0, 'ln');
  assertEquals(Math.log(100) / Math.log(10), 2, 'log10');
  assertEquals(Math.exp(2), 7.38905609893065, 'exp');
  assertEquals(Math.pow(10,2), 100, 'power10');
}

// Tests the "arithmetic" block for all operations and checks
// parenthesis are properly generated for different orders.
function test_arithmetic() {
  assertEquals(1 + 2, 3, 'add');
  assertEquals(1 - 2, -1, 'subtract');
  assertEquals(1 - (0 + 2), -1, 'subtract order with add');
  assertEquals(1 - (0 - 2), 3, 'subtract order with subtract');
  assertEquals(4 * 2.5, 10, 'multiply');
  assertEquals(4 * (0 + 2.5), 10, 'multiply order');
  assertEquals(8.2 / -5, -1.64, 'divide');
  assertEquals(8.2 / (0 + -5), -1.64, 'divide order');
  assertEquals(Math.pow(10, 4), 10000, 'power');
  assertEquals(Math.pow(10, 0 + 4), 10000, 'power order');
}

// Tests the "trig" block.
function test_trig() {
  assertEquals(Math.sin(90 / 180 * Math.PI), 1, 'sin');
  assertEquals(Math.cos(180 / 180 * Math.PI), -1, 'cos');
  assertEquals(Math.tan(0 / 180 * Math.PI), 0, 'tan');
  assertEquals(Math.asin(-1) / Math.PI * 180, -90, 'asin');
  assertEquals(Math.acos(1) / Math.PI * 180, 0, 'acos');
  assertEquals(Math.atan(1) / Math.PI * 180, 45, 'atan');
}

// Tests the "constant" blocks.
function test_constant() {
  assertEquals(Math.floor(Math.PI * 1000), 3141, 'const pi');
  assertEquals(Math.floor(Math.E * 1000), 2718, 'const e');
  assertEquals(Math.floor(((1 + Math.sqrt(5)) / 2) * 1000), 1618, 'const golden');
  assertEquals(Math.floor(Math.SQRT2 * 1000), 1414, 'const sqrt 2');
  assertEquals(Math.floor(Math.SQRT1_2 * 1000), 707, 'const sqrt 0.5');
  assertEquals(9999 < Infinity, true, 'const infinity');
}

function mathIsPrime(n) {
  // https://en.wikipedia.org/wiki/Primality_test#Naive_methods
  if (n == 2 || n == 3) {
    return true;
  }
  // False if n is NaN, negative, is 1, or not whole.
  // And false if n is divisible by 2 or 3.
  if (isNaN(n) || n <= 1 || n % 1 !== 0 || n % 2 === 0 || n % 3 === 0) {
    return false;
  }
  // Check all the numbers of form 6k +/- 1, up to sqrt(n).
  for (var x = 6; x <= Math.sqrt(n) + 1; x += 6) {
    if (n % (x - 1) === 0 || n % (x + 1) === 0) {
      return false;
    }
  }
  return true;
}

// Tests the "number property" blocks.
function test_number_properties() {
  assertEquals(42 % 2 === 0, true, 'even');
  assertEquals(42.1 % 2 === 1, false, 'odd');
  assertEquals(mathIsPrime(5), true, 'prime 5');
  assertEquals(mathIsPrime(5 + 2), true, 'prime 5 + 2 (extra parentheses)');
  assertEquals(mathIsPrime(25), false, 'prime 25');
  assertEquals(mathIsPrime(-31.1), false, 'prime negative');
  assertEquals(Math.PI % 1 === 0, false, 'whole');
  assertEquals(Infinity > 0, true, 'positive');
  assertEquals(5 + 2 > 0, true, '5 + 2 is positive (extra parentheses)');
  assertEquals(-42 < 0, true, 'negative');
  assertEquals(3 + 2 < 0, false, '3 + 2 is negative (extra parentheses)');
  assertEquals(42 % 2 === 0, true, 'divisible');
  assertEquals(!(42 % 0 === 0), true, 'divisible by 0');
}

// Tests the "round" block.
function test_round() {
  assertEquals(Math.round(42.42), 42, 'round');
  assertEquals(Math.ceil(-42.42), -42, 'round up');
  assertEquals(Math.floor(42.42), 42, 'round down');
}

// Tests the "change" block.
function test_change() {
  varToChange = 100;
  varToChange = (typeof varToChange === 'number' ? varToChange : 0) + 42;
  assertEquals(varToChange, 142, 'change');
}

function mathMean(myList) {
  return myList.reduce(function(x, y) {return x + y;}, 0) / myList.length;
}

function mathMedian(myList) {
  var localList = myList.filter(function (x) {return typeof x === 'number';});
  if (!localList.length) return null;
  localList.sort(function(a, b) {return b - a;});
  if (localList.length % 2 === 0) {
    return (localList[localList.length / 2 - 1] + localList[localList.length / 2]) / 2;
  } else {
    return localList[(localList.length - 1) / 2];
  }
}

function mathModes(values) {
  var modes = [];
  var counts = [];
  var maxCount = 0;
  for (var i = 0; i < values.length; i++) {
    var value = values[i];
    var found = false;
    var thisCount;
    for (var j = 0; j < counts.length; j++) {
      if (counts[j][0] === value) {
        thisCount = ++counts[j][1];
        found = true;
        break;
      }
    }
    if (!found) {
      counts.push([value, 1]);
      thisCount = 1;
    }
    maxCount = Math.max(thisCount, maxCount);
  }
  for (var j = 0; j < counts.length; j++) {
    if (counts[j][1] === maxCount) {
      modes.push(counts[j][0]);
    }
  }
  return modes;
}

function mathStandardDeviation(numbers) {
  var n = numbers.length;
  if (!n) return null;
  var mean = numbers.reduce(function(x, y) {return x + y;}) / n;
  var variance = 0;
  for (var j = 0; j < n; j++) {
    variance += Math.pow(numbers[j] - mean, 2);
  }
  variance /= n;
  return Math.sqrt(variance);
}

function mathRandomList(list) {
  var x = Math.floor(Math.random() * list.length);
  return list[x];
}

// Tests the "list operation" blocks.
function test_operations_on_list() {
  assertEquals([3, 4, 5].reduce(function(x, y) {return x + y;}, 0), 12, 'sum');
  assertEquals(Math.min.apply(null, [3, 4, 5]), 3, 'min');
  assertEquals(Math.max.apply(null, [3, 4, 5]), 5, 'max');
  assertEquals(mathMean([3, 4, 5]), 4, 'average');
  assertEquals(mathMedian([3, 4, 5, 1]), 3.5, 'median');
  assertEquals(mathModes([3, 4, 3]), [3], 'modes');
  assertEquals(mathModes([3, 4, 3, 1, 4]), [3, 4], 'modes multiple');
  assertEquals(mathStandardDeviation([3, 3, 3]), 0, 'standard dev');
  assertEquals([3, 4, 5].indexOf(mathRandomList([3, 4, 5])) + 1 > 0, true, 'random');
}

// Tests the "mod" block.
function test_mod() {
  assertEquals(42 % 5, 2, 'mod');
}

// Tests the "constrain" block.
function test_constraint() {
  assertEquals(Math.min(Math.max(100, 0), 42), 42, 'constraint');
}

function mathRandomInt(a, b) {
  if (a > b) {
    // Swap a and b to ensure a is smaller.
    var c = a;
    a = b;
    b = c;
  }
  return Math.floor(Math.random() * (b - a + 1) + a);
}

// Tests the "random integer" block.
function test_random_integer() {
  rand = mathRandomInt(5, 10);
  assertEquals(rand >= 5 && rand <= 10, true, 'randRange');
  assertEquals(rand % 1 === 0, true, 'randInteger');
}

// Tests the "random fraction" block.
function test_random_fraction() {
  rand = Math.random();
  assertEquals(rand >= 0 && rand <= 1, true, 'randFloat');
}

// Describe this function...
function test_atan2() {
  assertEquals(Math.atan2(5, -5) / Math.PI * 180, 135, 'atan2');
  assertEquals(Math.atan2(-12, 0) / Math.PI * 180, -90, 'atan2');
}

// Checks that the number of calls is one in order
// to confirm that a function was only called once.
function check_number_of_calls(test_name) {
  test_name += 'number of calls';
  assertEquals(number_of_calls, 1, test_name);
}

// Tests the "create text with" block with varying number of inputs.
function test_create_text() {
  assertEquals('', '', 'no text');
  assertEquals('Hello', 'Hello', 'create single');
  assertEquals(String(-1), '-1', 'create single number');
  assertEquals('K' + String(9), 'K9', 'create double text');
  assertEquals(String(4) + String(2), '42', 'create double text numbers');
  assertEquals([1,2,3].join(''), '123', 'create triple');
  assertEquals([1,true ? 0 : null,'M'].join(''), '10M', 'create order');
}

// Creates an empty string for use with the empty test.
function get_empty() {
  return '';
}

// Tests the "is empty" block".
function test_empty_text() {
  assertEquals(!'Google'.length, false, 'not empty');
  assertEquals(!''.length, true, 'empty');
  assertEquals(!get_empty().length, true, 'empty complex');
  assertEquals(!(true ? '' : null).length, true, 'empty order');
}

// Tests the "length" block.
function test_text_length() {
  assertEquals(''.length, 0, 'zero length');
  assertEquals('Google'.length, 6, 'non-zero length');
  assertEquals((true ? 'car' : null).length, 3, 'length order');
}

// Tests the "append text" block with different types of parameters.
function test_append() {
  item = 'Miserable';
  item += 'Failure';
  assertEquals(item, 'MiserableFailure', 'append text');
  item = 12;
  item += String(34);
  assertEquals(item, '1234', 'append number');
  item = 'Something ';
  item += String(true ? 'Positive' : null);
  assertEquals(item, 'Something Positive', 'append order');
}

// Tests the "find" block with a variable.
function test_find_text_simple() {
  text = 'Banana';
  assertEquals(text.indexOf('an') + 1, 2, 'find first simple');
  assertEquals(text.lastIndexOf('an') + 1, 4, 'find last simple');
  assertEquals(text.indexOf('Peel') + 1, 0, 'find none simple');
}

// Creates a string for use with the find test.
function get_fruit() {
  number_of_calls = (typeof number_of_calls === 'number' ? number_of_calls : 0) + 1;
  return 'Banana';
}

// Tests the "find" block with a function call.
function test_find_text_complex() {
  number_of_calls = 0;
  assertEquals(get_fruit().indexOf('an') + 1, 2, 'find first complex');
  check_number_of_calls('find first complex');
  number_of_calls = 0;
  assertEquals((true ? get_fruit() : null).indexOf('an') + 1, 2, 'find first order complex');
  check_number_of_calls('find first order complex');
  number_of_calls = 0;
  assertEquals(get_fruit().lastIndexOf('an') + 1, 4, 'find last complex');
  check_number_of_calls('find last complex');
  number_of_calls = 0;
  assertEquals((true ? get_fruit() : null).lastIndexOf('an') + 1, 4, 'find last order complex');
  check_number_of_calls('find last order complex');
  number_of_calls = 0;
  assertEquals(get_fruit().indexOf('Peel') + 1, 0, 'find none complex');
  check_number_of_calls('find none complex');
  number_of_calls = 0;
  assertEquals((true ? get_fruit() : null).indexOf('Peel') + 1, 0, 'find none order complex');
  check_number_of_calls('find none order complex');
}

function textRandomLetter(text) {
  var x = Math.floor(Math.random() * text.length);
  return text[x];
}

// Tests the "get letter" block with a variable.
function test_get_text_simple() {
  text = 'Blockly';
  assertEquals(text.charAt(0), 'B', 'get first simple');
  assertEquals(text.slice(-1), 'y', 'get last simple');
  assertEquals(text.indexOf(textRandomLetter(text)) + 1 > 0, true, 'get random simple');
  assertEquals(text.charAt(2), 'o', 'get # simple');
  assertEquals(text.charAt(((true ? 3 : null) - 1)), 'o', 'get # order simple');
  assertEquals(text.slice(-3).charAt(0), 'k', 'get #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(text.slice((-(0 + 3))).charAt(0), 'k', 'get #-end order simple');
}

// Creates a string for use with the get test.
function get_Blockly() {
  number_of_calls = (typeof number_of_calls === 'number' ? number_of_calls : 0) + 1;
  return 'Blockly';
}

// Tests the "get letter" block with a function call.
function test_get_text_complex() {
  text = 'Blockly';
  number_of_calls = 0;
  assertEquals(get_Blockly().charAt(0), 'B', 'get first complex');
  check_number_of_calls('get first complex');
  number_of_calls = 0;
  assertEquals((true ? get_Blockly() : null).charAt(0), 'B', 'get first order complex');
  check_number_of_calls('get first order complex');
  number_of_calls = 0;
  assertEquals(get_Blockly().slice(-1), 'y', 'get last complex');
  check_number_of_calls('get last complex');
  number_of_calls = 0;
  assertEquals((true ? get_Blockly() : null).slice(-1), 'y', 'get last order complex');
  check_number_of_calls('get last order complex');
  number_of_calls = 0;
  assertEquals(text.indexOf(textRandomLetter(get_Blockly())) + 1 > 0, true, 'get random complex');
  check_number_of_calls('get random complex');
  number_of_calls = 0;
  assertEquals(text.indexOf(textRandomLetter(true ? get_Blockly() : null)) + 1 > 0, true, 'get random order complex');
  check_number_of_calls('get random order complex');
  number_of_calls = 0;
  assertEquals(get_Blockly().charAt(2), 'o', 'get # complex');
  check_number_of_calls('get # complex');
  number_of_calls = 0;
  assertEquals((true ? get_Blockly() : null).charAt(((true ? 3 : null) - 1)), 'o', 'get # order complex');
  check_number_of_calls('get # order complex');
  number_of_calls = 0;
  assertEquals(get_Blockly().slice(-3).charAt(0), 'k', 'get #-end complex');
  check_number_of_calls('get #-end complex');
  number_of_calls = 0;
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals((true ? get_Blockly() : null).slice((-(0 + 3))).charAt(0), 'k', 'get #-end order complex');
  check_number_of_calls('get #-end order complex');
}

// Creates a string for use with the substring test.
function get_numbers() {
  number_of_calls = (typeof number_of_calls === 'number' ? number_of_calls : 0) + 1;
  return '123456789';
}

// Tests the "get substring" block with a variable.
function test_substring_simple() {
  text = '123456789';
  assertEquals(text.slice(1, 3), '23', 'substring # simple');
  assertEquals(text.slice(((true ? 2 : null) - 1), true ? 3 : null), '23', 'substring # simple order');
  assertEquals(text.slice(text.length - 3, text.length - 1), '78', 'substring #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(text.slice(text.length - (0 + 3), text.length - ((0 + 2) - 1)), '78', 'substring #-end simple order');
  assertEquals(text, text, 'substring first-last simple');
  assertEquals(text.slice(1, text.length - 1), '2345678', 'substring # #-end simple');
  assertEquals(text.slice(text.length - 7, 4), '34', 'substring #-end # simple');
  assertEquals(text.slice(0, 4), '1234', 'substring first # simple');
  assertEquals(text.slice(0, text.length - 1), '12345678', 'substring first #-end simple');
  assertEquals(text.slice(6, text.length), '789', 'substring # last simple');
  assertEquals(text.slice(text.length - 3, text.length), '789', 'substring #-end last simple');
  assertEquals(text.slice(0, text.length - 0), '123456789', 'substring all with # #-end simple');
  assertEquals(text.slice(text.length - 9, 9), '123456789', 'substring all with #-end # simple');
  // Checks that the whole string is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where substring uses [x:length - y] for # #-end.
  assertEquals(text.slice(((0 + 1) - 1), text.length - ((0 + 1) - 1)), '123456789', 'substring all with # #-end math simple');
}

function subsequenceFromEndFromEnd(sequence, at1, at2) {
  var start = sequence.length - 1 - at1;
  var end = sequence.length - 1 - at2 + 1;
  return sequence.slice(start, end);
}

function subsequenceFromStartFromEnd(sequence, at1, at2) {
  var start = at1;
  var end = sequence.length - 1 - at2 + 1;
  return sequence.slice(start, end);
}

function subsequenceFromEndFromStart(sequence, at1, at2) {
  var start = sequence.length - 1 - at1;
  var end = at2 + 1;
  return sequence.slice(start, end);
}

function subsequenceFirstFromEnd(sequence, at2) {
  var start = 0;
  var end = sequence.length - 1 - at2 + 1;
  return sequence.slice(start, end);
}

function subsequenceFromStartLast(sequence, at1) {
  var start = at1;
  var end = sequence.length - 1 + 1;
  return sequence.slice(start, end);
}

function subsequenceFromEndLast(sequence, at1) {
  var start = sequence.length - 1 - at1;
  var end = sequence.length - 1 + 1;
  return sequence.slice(start, end);
}

// Tests the "get substring" block with a function call.
function test_substring_complex() {
  number_of_calls = 0;
  assertEquals(get_numbers().slice(1, 3), '23', 'substring # complex');
  check_number_of_calls('substring # complex');
  number_of_calls = 0;
  assertEquals((true ? get_numbers() : null).slice(((true ? 2 : null) - 1), true ? 3 : null), '23', 'substring # complex order');
  check_number_of_calls('substring # complex order');
  number_of_calls = 0;
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(subsequenceFromEndFromEnd(get_numbers(), 2, 1), '78', 'substring #-end complex');
  check_number_of_calls('substring #-end complex');
  number_of_calls = 0;
  assertEquals(subsequenceFromEndFromEnd(true ? get_numbers() : null, ((0 + 3) - 1), ((0 + 2) - 1)), '78', 'substring #-end order order');
  check_number_of_calls('substring #-end order order');
  number_of_calls = 0;
  assertEquals(get_numbers(), text, 'substring first-last');
  check_number_of_calls('substring first-last');
  number_of_calls = 0;
  assertEquals(subsequenceFromStartFromEnd(get_numbers(), 1, 1), '2345678', 'substring # #-end complex');
  check_number_of_calls('substring # #-end complex');
  number_of_calls = 0;
  assertEquals(subsequenceFromEndFromStart(get_numbers(), 6, 3), '34', 'substring #-end # complex');
  check_number_of_calls('substring #-end # complex');
  number_of_calls = 0;
  assertEquals(get_numbers().slice(0, 4), '1234', 'substring first # complex');
  check_number_of_calls('substring first # complex');
  number_of_calls = 0;
  assertEquals(subsequenceFirstFromEnd(get_numbers(), 1), '12345678', 'substring first #-end complex');
  check_number_of_calls('substring first #-end complex');
  number_of_calls = 0;
  assertEquals(subsequenceFromStartLast(get_numbers(), 6), '789', 'substring # last complex');
  check_number_of_calls('substring # last complex');
  number_of_calls = 0;
  assertEquals(subsequenceFromEndLast(get_numbers(), 2), '789', 'substring #-end last complex');
  check_number_of_calls('substring #-end last complex');
  number_of_calls = 0;
  assertEquals(subsequenceFromStartFromEnd(get_numbers(), 0, 0), '123456789', 'substring all with # #-end complex');
  check_number_of_calls('substring all with # #-end complex');
  number_of_calls = 0;
  assertEquals(subsequenceFromEndFromStart(get_numbers(), 8, 8), '123456789', 'substring all with #-end # complex');
  check_number_of_calls('substring all with #-end # complex');
  number_of_calls = 0;
  // Checks that the whole string is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where substring uses [x:length - y] for # #-end.
  assertEquals(subsequenceFromStartFromEnd(get_numbers(), ((0 + 1) - 1), ((0 + 1) - 1)), '123456789', 'substring all with # #-end math complex');
  check_number_of_calls('substring all with # #-end math complex');
}

function textToTitleCase(str) {
  return str.replace(/\S+/g,
      function(txt) {return txt[0].toUpperCase() + txt.substring(1).toLowerCase();});
}

// Tests the "change casing" block.
function test_case() {
  text = 'Hello World';
  assertEquals(text.toUpperCase(), 'HELLO WORLD', 'uppercase');
  assertEquals((true ? text : null).toUpperCase(), 'HELLO WORLD', 'uppercase order');
  text = 'Hello World';
  assertEquals(text.toLowerCase(), 'hello world', 'lowercase');
  assertEquals((true ? text : null).toLowerCase(), 'hello world', 'lowercase order');
  text = 'heLLo WorlD';
  assertEquals(textToTitleCase(text), 'Hello World', 'titlecase');
  assertEquals(textToTitleCase(true ? text : null), 'Hello World', 'titlecase order');
}

// Tests the "trim" block.
function test_trim() {
  text = '   abc def   ';
  assertEquals(text.trim(), 'abc def', 'trim both');
  assertEquals((true ? text : null).trim(), 'abc def', 'trim both order');
  assertEquals(text.replace(/^[\s\xa0]+/, ''), 'abc def   ', 'trim left');
  assertEquals((true ? text : null).replace(/^[\s\xa0]+/, ''), 'abc def   ', 'trim left order');
  assertEquals(text.replace(/[\s\xa0]+$/, ''), '   abc def', 'trim right');
  assertEquals((true ? text : null).replace(/[\s\xa0]+$/, ''), '   abc def', 'trim right order');
}

function textCount(haystack, needle) {
  if (needle.length === 0) {
    return haystack.length + 1;
  } else {
    return haystack.split(needle).length - 1;
  }
}

// Tests the "trim" block.
function test_count_text() {
  text = 'woolloomooloo';
  assertEquals(textCount(text, 'o'), 8, 'len 1');
  assertEquals(textCount(text, 'oo'), 4, 'len 2');
  assertEquals(textCount(text, 'loo'), 2, 'len 3');
  assertEquals(textCount(text, 'wool'), 1, 'start');
  assertEquals(textCount(text, 'chicken'), 0, 'missing');
  assertEquals(textCount(text, ''), 14, 'empty needle');
  assertEquals(textCount('', 'chicken'), 0, 'empty source');
}

// Tests the "trim" block.
function test_text_reverse() {
  assertEquals(''.split('').reverse().join(''), '', 'empty string');
  assertEquals('a'.split('').reverse().join(''), 'a', 'len 1');
  assertEquals('ab'.split('').reverse().join(''), 'ba', 'len 2');
  assertEquals('woolloomooloo'.split('').reverse().join(''), 'ooloomoolloow', 'longer');
}

function textReplace(haystack, needle, replacement) {
  needle = needle.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1')
                 .replace(/\x08/g, '\\x08');
  return haystack.replace(new RegExp(needle, 'g'), replacement);
}

// Tests the "trim" block.
function test_replace() {
  assertEquals(textReplace('woolloomooloo', 'oo', '123'), 'w123ll123m123l123', 'replace all instances 1');
  assertEquals(textReplace('woolloomooloo', '.oo', 'X'), 'woolloomooloo', 'literal string replacement');
  assertEquals(textReplace('woolloomooloo', 'abc', 'X'), 'woolloomooloo', 'not found');
  assertEquals(textReplace('woolloomooloo', 'o', ''), 'wllml', 'empty replacement 1');
  assertEquals(textReplace('aaaaa', 'aaaaa', ''), '', 'empty replacement 2');
  assertEquals(textReplace('aaaaa', 'a', ''), '', 'empty replacement 3');
  assertEquals(textReplace('', 'a', 'chicken'), '', 'empty source');
}

// Checks that the number of calls is one in order
// to confirm that a function was only called once.
function check_number_of_calls2(test_name) {
  test_name += 'number of calls';
  assertEquals(number_of_calls, 1, test_name);
}

function listsRepeat(value, n) {
  var array = [];
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
}

// Tests the "create list with" and "create empty list" blocks.
function test_create_lists() {
  assertEquals([], [], 'create empty');
  assertEquals([true, 'love'], [true, 'love'], 'create items');
  assertEquals(listsRepeat('Eject', 3), ['Eject', 'Eject', 'Eject'], 'create repeated');
  assertEquals(listsRepeat('Eject', 0 + 3), ['Eject', 'Eject', 'Eject'], 'create repeated order');
}

// Creates an empty list for use with the empty test.
function get_empty_list() {
  return [];
}

// Tests the "is empty" block.
function test_lists_empty() {
  assertEquals(![0].length, false, 'not empty');
  assertEquals(![].length, true, 'empty');
  assertEquals(!get_empty_list().length, true, 'empty complex');
  assertEquals(!(true ? [] : null).length, true, 'empty order');
}

// Tests the "length" block.
function test_lists_length() {
  assertEquals([].length, 0, 'zero length');
  assertEquals(['cat'].length, 1, 'one length');
  assertEquals(['cat', true, []].length, 3, 'three length');
  assertEquals((true ? ['cat', true] : null).length, 2, 'two length order');
}

// Tests the "find" block with a variable.
function test_find_lists_simple() {
  list = ['Alice', 'Eve', 'Bob', 'Eve'];
  assertEquals(list.indexOf('Eve') + 1, 2, 'find first simple');
  assertEquals(list.lastIndexOf('Eve') + 1, 4, 'find last simple');
  assertEquals(list.indexOf('Dave') + 1, 0, 'find none simple');
}

// Creates a list for use with the find test.
function get_names() {
  number_of_calls = (typeof number_of_calls === 'number' ? number_of_calls : 0) + 1;
  return ['Alice', 'Eve', 'Bob', 'Eve'];
}

// Tests the "find" block with a function call.
function test_find_lists_complex() {
  number_of_calls = 0;
  assertEquals(get_names().indexOf('Eve') + 1, 2, 'find first complex');
  check_number_of_calls('find first complex');
  number_of_calls = 0;
  assertEquals((true ? get_names() : null).indexOf('Eve') + 1, 2, 'find first order complex');
  check_number_of_calls('find first order complex');
  number_of_calls = 0;
  assertEquals(get_names().lastIndexOf('Eve') + 1, 4, 'find last complex');
  check_number_of_calls('find last complex');
  number_of_calls = 0;
  assertEquals((true ? get_names() : null).lastIndexOf('Eve') + 1, 4, 'find last order complex');
  check_number_of_calls('find last order complex');
  number_of_calls = 0;
  assertEquals(get_names().indexOf('Dave') + 1, 0, 'find none complex');
  check_number_of_calls('find none complex');
  number_of_calls = 0;
  assertEquals((true ? get_names() : null).indexOf('Dave') + 1, 0, 'find none order complex');
  check_number_of_calls('find none order complex');
}

function listsGetRandomItem(list, remove) {
  var x = Math.floor(Math.random() * list.length);
  if (remove) {
    return list.splice(x, 1)[0];
  } else {
    return list[x];
  }
}

// Tests the "get" block with a variable.
function test_get_lists_simple() {
  list = ['Kirk', 'Spock', 'McCoy'];
  assertEquals(list[0], 'Kirk', 'get first simple');
  assertEquals(list.slice(-1)[0], 'McCoy', 'get last simple');
  assertEquals(list.indexOf(listsGetRandomItem(list, false)) + 1 > 0, true, 'get random simple');
  assertEquals(list[1], 'Spock', 'get # simple');
  assertEquals(list[((true ? 2 : null) - 1)], 'Spock', 'get # order simple');
  assertEquals(list.slice(-3)[0], 'Kirk', 'get #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(list.slice((-(0 + 3)))[0], 'Kirk', 'get #-end order simple');
}

// Tests the "get" block with create list call.
function test_get_lists_create_list() {
  assertEquals(['Kirk', 'Spock', 'McCoy'][0], 'Kirk', 'get first create list');
  assertEquals(['Kirk', 'Spock', 'McCoy'].slice(-1)[0], 'McCoy', 'get last simple');
  assertEquals(['Kirk', 'Spock', 'McCoy'].indexOf(listsGetRandomItem(['Kirk', 'Spock', 'McCoy'], false)) + 1 > 0, true, 'get random simple');
  assertEquals(['Kirk', 'Spock', 'McCoy'][1], 'Spock', 'get # simple');
  assertEquals(['Kirk', 'Spock', 'McCoy'][((true ? 2 : null) - 1)], 'Spock', 'get # order simple');
  assertEquals(['Kirk', 'Spock', 'McCoy'].slice(-3)[0], 'Kirk', 'get #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(['Kirk', 'Spock', 'McCoy'].slice((-(0 + 3)))[0], 'Kirk', 'get #-end order simple');
}

// Creates a list for use with the get test.
function get_star_wars() {
  number_of_calls = (typeof number_of_calls === 'number' ? number_of_calls : 0) + 1;
  return ['Kirk', 'Spock', 'McCoy'];
}

// Tests the "get" block with a function call.
function test_get_lists_complex() {
  list = ['Kirk', 'Spock', 'McCoy'];
  number_of_calls = 0;
  assertEquals(get_star_wars()[0], 'Kirk', 'get first complex');
  check_number_of_calls('get first complex');
  number_of_calls = 0;
  assertEquals((true ? get_star_wars() : null)[0], 'Kirk', 'get first order complex');
  check_number_of_calls('get first order complex');
  number_of_calls = 0;
  assertEquals(get_star_wars().slice(-1)[0], 'McCoy', 'get last complex');
  check_number_of_calls('get last complex');
  number_of_calls = 0;
  assertEquals((true ? get_star_wars() : null).slice(-1)[0], 'McCoy', 'get last order complex');
  check_number_of_calls('get last order complex');
  number_of_calls = 0;
  assertEquals(list.indexOf(listsGetRandomItem(get_star_wars(), false)) + 1 > 0, true, 'get random complex');
  check_number_of_calls('get random complex');
  number_of_calls = 0;
  assertEquals(list.indexOf(listsGetRandomItem(true ? get_star_wars() : null, false)) + 1 > 0, true, 'get random order complex');
  check_number_of_calls('get random order complex');
  number_of_calls = 0;
  assertEquals(get_star_wars()[1], 'Spock', 'get # complex');
  check_number_of_calls('get # complex');
  number_of_calls = 0;
  assertEquals((true ? get_star_wars() : null)[((true ? 2 : null) - 1)], 'Spock', 'get # order complex');
  check_number_of_calls('get # order complex');
  number_of_calls = 0;
  assertEquals(get_star_wars().slice(-3)[0], 'Kirk', 'get #-end complex');
  check_number_of_calls('get #-end complex');
  number_of_calls = 0;
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals((true ? get_star_wars() : null).slice((-(0 + 3)))[0], 'Kirk', 'get #-end order complex');
  check_number_of_calls('get #-end order complex');
}

// Tests the "get and remove" block.
function test_getRemove() {
  list = ['Kirk', 'Spock', 'McCoy'];
  assertEquals(list.shift(), 'Kirk', 'getremove first');
  assertEquals(list, ['Spock', 'McCoy'], 'getremove first list');
  list = ['Kirk', 'Spock', 'McCoy'];
  assertEquals((true ? list : null).shift(), 'Kirk', 'getremove first order');
  assertEquals(list, ['Spock', 'McCoy'], 'getremove first order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  assertEquals(list.pop(), 'McCoy', 'getremove last');
  assertEquals(list, ['Kirk', 'Spock'], 'getremove last list');
  list = ['Kirk', 'Spock', 'McCoy'];
  assertEquals((true ? list : null).pop(), 'McCoy', 'getremove last order');
  assertEquals(list, ['Kirk', 'Spock'], 'getremove last order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  assertEquals(list.indexOf(listsGetRandomItem(list, true)) + 1 == 0, true, 'getremove random');
  assertEquals(list.length, 2, 'getremove random list');
  list = ['Kirk', 'Spock', 'McCoy'];
  assertEquals(list.indexOf(listsGetRandomItem(true ? list : null, true)) + 1 == 0, true, 'getremove random order');
  assertEquals(list.length, 2, 'getremove random order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  assertEquals(list.splice(1, 1)[0], 'Spock', 'getremove #');
  assertEquals(list, ['Kirk', 'McCoy'], 'getremove # list');
  list = ['Kirk', 'Spock', 'McCoy'];
  assertEquals((true ? list : null).splice(((true ? 2 : null) - 1), 1)[0], 'Spock', 'getremove # order');
  assertEquals(list, ['Kirk', 'McCoy'], 'getremove # order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  assertEquals(list.splice(-3, 1)[0], 'Kirk', 'getremove #-end');
  assertEquals(list, ['Spock', 'McCoy'], 'getremove #-end list');
  list = ['Kirk', 'Spock', 'McCoy'];
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals((true ? list : null).splice((-(0 + 3)), 1)[0], 'Kirk', 'getremove #-end order');
  assertEquals(list, ['Spock', 'McCoy'], 'getremove #-end order list');
}

// Tests the "remove" block.
function test_remove() {
  list = ['Kirk', 'Spock', 'McCoy'];
  list.shift();
  assertEquals(list, ['Spock', 'McCoy'], 'remove first list');
  list = ['Kirk', 'Spock', 'McCoy'];
  (true ? list : null).shift();
  assertEquals(list, ['Spock', 'McCoy'], 'remove first order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  list.pop();
  assertEquals(list, ['Kirk', 'Spock'], 'remove last list');
  list = ['Kirk', 'Spock', 'McCoy'];
  (true ? list : null).pop();
  assertEquals(list, ['Kirk', 'Spock'], 'remove last order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  listsGetRandomItem(list, true);
  assertEquals(list.length, 2, 'remove random list');
  list = ['Kirk', 'Spock', 'McCoy'];
  listsGetRandomItem(true ? list : null, true);
  assertEquals(list.length, 2, 'remove random order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  list.splice(1, 1);
  assertEquals(list, ['Kirk', 'McCoy'], 'remove # list');
  list = ['Kirk', 'Spock', 'McCoy'];
  (true ? list : null).splice(((true ? 2 : null) - 1), 1);
  assertEquals(list, ['Kirk', 'McCoy'], 'remove # order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  list.splice(-3, 1);assertEquals(list, ['Spock', 'McCoy'], 'remove #-end list');
  list = ['Kirk', 'Spock', 'McCoy'];
  // The order for index for #-end is addition because this will catch
  // errors in generators where most perform the operation ... - index.
  (true ? list : null).splice((-(0 + 3)), 1);assertEquals(list, ['Spock', 'McCoy'], 'remove #-end order list');
}

// Tests the "set" block.
function test_set() {
  list = ['Picard', 'Riker', 'Crusher'];
  list[0] = 'Jean-Luc';
  assertEquals(list, ['Jean-Luc', 'Riker', 'Crusher'], 'set first list');
  list = ['Picard', 'Riker', 'Crusher'];
  (true ? list : null)[0] = 'Jean-Luc';
  assertEquals(list, ['Jean-Luc', 'Riker', 'Crusher'], 'set first order list');
  list = ['Picard', 'Riker', 'Crusher'];
  list[list.length - 1] = 'Beverly';
  assertEquals(list, ['Picard', 'Riker', 'Beverly'], 'set last list');
  list = ['Picard', 'Riker', 'Crusher'];
  var tmpList = (true ? list : null);
  tmpList[tmpList.length - 1] = 'Beverly';
  assertEquals(list, ['Picard', 'Riker', 'Beverly'], 'set last order list');
  list = ['Picard', 'Riker', 'Crusher'];
  var tmpX = Math.floor(Math.random() * list.length);
  list[tmpX] = 'Data';
  assertEquals(list.length, 3, 'set random list');
  list = ['Picard', 'Riker', 'Crusher'];
  var tmpList2 = (true ? list : null);
  var tmpX2 = Math.floor(Math.random() * tmpList2.length);
  tmpList2[tmpX2] = 'Data';
  assertEquals(list.length, 3, 'set random order list');
  list = ['Picard', 'Riker', 'Crusher'];
  list[2] = 'Pulaski';
  assertEquals(list, ['Picard', 'Riker', 'Pulaski'], 'set # list');
  list = ['Picard', 'Riker', 'Crusher'];
  (true ? list : null)[((true ? 3 : null) - 1)] = 'Pulaski';
  assertEquals(list, ['Picard', 'Riker', 'Pulaski'], 'set # order list');
  list = ['Picard', 'Riker', 'Crusher'];
  list[list.length - 1] = 'Pulaski';
  assertEquals(list, ['Picard', 'Riker', 'Pulaski'], 'set #-end list');
  list = ['Picard', 'Riker', 'Crusher'];
  // The order for index for #-end is addition because this will catch
  // errors in generators where most perform the operation ... - index.
  var tmpList3 = (true ? list : null);
  tmpList3[tmpList3.length - (0 + 2)] = 'Pulaski';
  assertEquals(list, ['Picard', 'Pulaski', 'Crusher'], 'set #-end order list');
}

// Tests the "insert" block.
function test_insert() {
  list = ['Picard', 'Riker', 'Crusher'];
  list.unshift('Data');
  assertEquals(list, ['Data', 'Picard', 'Riker', 'Crusher'], 'insert first list');
  list = ['Picard', 'Riker', 'Crusher'];
  (true ? list : null).unshift('Data');
  assertEquals(list, ['Data', 'Picard', 'Riker', 'Crusher'], 'insert first order list');
  list = ['Picard', 'Riker', 'Crusher'];
  list.push('Data');
  assertEquals(list, ['Picard', 'Riker', 'Crusher', 'Data'], 'insert last list');
  list = ['Picard', 'Riker', 'Crusher'];
  (true ? list : null).push('Data');
  assertEquals(list, ['Picard', 'Riker', 'Crusher', 'Data'], 'insert last order list');
  list = ['Picard', 'Riker', 'Crusher'];
  var tmpX3 = Math.floor(Math.random() * list.length);
  list.splice(tmpX3, 0, 'Data');
  assertEquals(list.length, 4, 'insert random list');
  list = ['Picard', 'Riker', 'Crusher'];
  var tmpList4 = (true ? list : null);
  var tmpX4 = Math.floor(Math.random() * tmpList4.length);
  tmpList4.splice(tmpX4, 0, 'Data');
  assertEquals(list.length, 4, 'insert random order list');
  list = ['Picard', 'Riker', 'Crusher'];
  list.splice(2, 0, 'Data');
  assertEquals(list, ['Picard', 'Riker', 'Data', 'Crusher'], 'insert # list');
  list = ['Picard', 'Riker', 'Crusher'];
  (true ? list : null).splice(((true ? 3 : null) - 1), 0, 'Data');
  assertEquals(list, ['Picard', 'Riker', 'Data', 'Crusher'], 'insert # order list');
  list = ['Picard', 'Riker', 'Crusher'];
  list.splice(list.length - 1, 0, 'Data');
  assertEquals(list, ['Picard', 'Riker', 'Data', 'Crusher'], 'insert #-end list');
  list = ['Picard', 'Riker', 'Crusher'];
  // The order for index for #-end is addition because this will catch
  // errors in generators where most perform the operation ... - index.
  var tmpList5 = (true ? list : null);
  tmpList5.splice(tmpList5.length - (0 + 2), 0, 'Data');
  assertEquals(list, ['Picard', 'Data', 'Riker', 'Crusher'], 'insert #-end order list');
}

// Tests the "get sub-list" block with a variable.
function test_sublist_simple() {
  list = ['Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour'];
  assertEquals(list.slice(1, 3), ['Challenger', 'Discovery'], 'sublist # simple');
  assertEquals(list.slice(((true ? 2 : null) - 1), true ? 3 : null), ['Challenger', 'Discovery'], 'sublist # simple order');
  assertEquals(list.slice(list.length - 3, list.length - 1), ['Discovery', 'Atlantis'], 'sublist #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(list.slice(list.length - (0 + 3), list.length - ((0 + 2) - 1)), ['Discovery', 'Atlantis'], 'sublist #-end simple order');
  assertEquals(list.slice(0), list, 'sublist first-last simple');
  changing_list = ['Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour'];
  list_copy = changing_list.slice(0);
  listsGetRandomItem(changing_list, true);
  assertEquals(list_copy, list, 'sublist first-last simple copy check');
  assertEquals(list.slice(1, list.length - 1), ['Challenger', 'Discovery', 'Atlantis'], 'sublist # #-end simple');
  assertEquals(list.slice(list.length - 3, 4), ['Discovery', 'Atlantis'], 'sublist #-end # simple');
  assertEquals(list.slice(0, 4), ['Columbia', 'Challenger', 'Discovery', 'Atlantis'], 'sublist first # simple');
  assertEquals(list.slice(0, list.length - 3), ['Columbia', 'Challenger'], 'sublist first #-end simple');
  assertEquals(list.slice(3, list.length), ['Atlantis', 'Endeavour'], 'sublist # last simple');
  assertEquals(list.slice(list.length - 4, list.length), ['Challenger', 'Discovery', 'Atlantis', 'Endeavour'], 'sublist #-end last simple');
  assertEquals(list.slice(0, list.length - 0), list, 'sublist all with # #-end simple');
  assertEquals(list.slice(list.length - 5, 5), list, 'sublist all with #-end # simple');
  // Checks that the whole list is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where sublist uses [x:length - y] for # #-end.
  assertEquals(list.slice(((0 + 1) - 1), list.length - ((0 + 1) - 1)), list, 'sublist all with # #-end math simple');
}

// Creates a list for use with the sublist test.
function get_space_shuttles() {
  number_of_calls = (typeof number_of_calls === 'number' ? number_of_calls : 0) + 1;
  return ['Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour'];
}

// Tests the "get sub-list" block with a function call.
function test_sublist_complex() {
  number_of_calls = 0;
  assertEquals(get_space_shuttles().slice(1, 3), ['Challenger', 'Discovery'], 'sublist # start complex');
  check_number_of_calls('sublist # start complex');
  number_of_calls = 0;
  assertEquals((true ? get_space_shuttles() : null).slice(((true ? 2 : null) - 1), true ? 3 : null), ['Challenger', 'Discovery'], 'sublist # start order complex');
  check_number_of_calls('sublist # start order complex');
  number_of_calls = 0;
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(subsequenceFromEndFromEnd(get_space_shuttles(), 2, 1), ['Discovery', 'Atlantis'], 'sublist # end complex');
  assertEquals(number_of_calls, 1, 'sublist # end complex number of calls');
  number_of_calls = 0;
  assertEquals(subsequenceFromEndFromEnd((true ? get_space_shuttles() : null), ((0 + 3) - 1), ((0 + 2) - 1)), ['Discovery', 'Atlantis'], 'sublist # end order complex');
  check_number_of_calls('sublist # end order complex');
  number_of_calls = 0;
  assertEquals(get_space_shuttles().slice(0), list, 'sublist first-last complex');
  check_number_of_calls('sublist first-last complex');
  number_of_calls = 0;
  assertEquals(subsequenceFromStartFromEnd(get_space_shuttles(), 1, 1), ['Challenger', 'Discovery', 'Atlantis'], 'sublist # #-end complex');
  check_number_of_calls('sublist # #-end complex');
  number_of_calls = 0;
  assertEquals(subsequenceFromEndFromStart(get_space_shuttles(), 2, 3), ['Discovery', 'Atlantis'], 'sublist #-end # complex');
  check_number_of_calls('sublist #-end # complex');
  number_of_calls = 0;
  assertEquals(get_space_shuttles().slice(0, 4), ['Columbia', 'Challenger', 'Discovery', 'Atlantis'], 'sublist first # complex');
  check_number_of_calls('sublist first # complex');
  number_of_calls = 0;
  assertEquals(subsequenceFirstFromEnd(get_space_shuttles(), 3), ['Columbia', 'Challenger'], 'sublist first #-end complex');
  check_number_of_calls('sublist first #-end complex');
  number_of_calls = 0;
  assertEquals(subsequenceFromStartLast(get_space_shuttles(), 3), ['Atlantis', 'Endeavour'], 'sublist # last complex');
  check_number_of_calls('sublist # last complex');
  number_of_calls = 0;
  assertEquals(subsequenceFromEndLast(get_space_shuttles(), 3), ['Challenger', 'Discovery', 'Atlantis', 'Endeavour'], 'sublist #-end last simple');
  check_number_of_calls('sublist #-end last simple');
  number_of_calls = 0;
  assertEquals(subsequenceFromStartFromEnd(get_space_shuttles(), 0, 0), list, 'sublist all with # #-end complex');
  check_number_of_calls('sublist all with # #-end complex');
  number_of_calls = 0;
  assertEquals(subsequenceFromEndFromStart(get_space_shuttles(), 4, 4), list, 'sublist all with #-end # complex');
  check_number_of_calls('sublist all with #-end # complex');
  number_of_calls = 0;
  // Checks that the whole list is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where sublist uses [x:length - y] for # #-end.
  assertEquals(subsequenceFromStartFromEnd(get_space_shuttles(), ((0 + 1) - 1), ((0 + 1) - 1)), list, 'sublist all with # #-end math complex');
  check_number_of_calls('sublist all with # #-end math complex');
}

// Tests the "join" block.
function test_join() {
  list = ['Vulcan', 'Klingon', 'Borg'];
  assertEquals(list.join(','), 'Vulcan,Klingon,Borg', 'join');
  assertEquals((true ? list : null).join(','), 'Vulcan,Klingon,Borg', 'join order');
}

// Tests the "split" block.
function test_split() {
  text = 'Vulcan,Klingon,Borg';
  assertEquals(text.split(','), ['Vulcan', 'Klingon', 'Borg'], 'split');
  assertEquals((true ? text : null).split(','), ['Vulcan', 'Klingon', 'Borg'], 'split order');
}

function listsGetSortCompare(type, direction) {
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

// Tests the "alphabetic sort" block.
function test_sort_alphabetic() {
  list = ['Vulcan', 'klingon', 'Borg'];
  assertEquals(list.slice().sort(listsGetSortCompare("TEXT", 1)), ['Borg', 'Vulcan', 'klingon'], 'sort alphabetic ascending');
  assertEquals((true ? list : null).slice().sort(listsGetSortCompare("TEXT", 1)), ['Borg', 'Vulcan', 'klingon'], 'sort alphabetic ascending order');
}

// Tests the "alphabetic sort ignore case" block.
function test_sort_ignoreCase() {
  list = ['Vulcan', 'klingon', 'Borg'];
  assertEquals(list.slice().sort(listsGetSortCompare("IGNORE_CASE", 1)), ['Borg', 'klingon', 'Vulcan'], 'sort ignore case ascending');
  assertEquals((true ? list : null).slice().sort(listsGetSortCompare("IGNORE_CASE", 1)), ['Borg', 'klingon', 'Vulcan'], 'sort ignore case ascending order');
}

// Tests the "numeric sort" block.
function test_sort_numeric() {
  list = [8, 18, -1];
  assertEquals(list.slice().sort(listsGetSortCompare("NUMERIC", -1)), [18, 8, -1], 'sort numeric descending');
  assertEquals((true ? list : null).slice().sort(listsGetSortCompare("NUMERIC", -1)), [18, 8, -1], 'sort numeric descending order');
}

// Tests the "list reverse" block.
function test_lists_reverse() {
  list = [8, 18, -1, 64];
  assertEquals(list.slice().reverse(), [64, -1, 18, 8], 'reverse a copy');
  assertEquals(list, [8, 18, -1, 64], 'reverse a copy original');
  list = [];
  assertEquals(list.slice().reverse(), [], 'empty list');
}

// Describe this function...
function test_procedure() {
  procedure_1(8, 2);
  assertEquals(proc_z, 4, 'procedure with global');
  proc_w = false;
  procedure_2(false);
  assertEquals(proc_w, true, 'procedure no return');
  proc_w = false;
  procedure_2(true);
  assertEquals(proc_w, false, 'procedure return');
}

// Describe this function...
function procedure_1(proc_x, proc_y) {
  proc_z = proc_x / proc_y;
}

// Describe this function...
function procedure_2(proc_x) {
  if (proc_x) {
    return;
  }
  proc_w = true;
}

// Describe this function...
function test_function() {
  assertEquals(function_1(2, 3), -1, 'function with arguments');
  assertEquals(func_z, 'side effect', 'function with side effect');
  func_a = 'unchanged';
  func_c = 'global';
  assertEquals(function_2(2), '3global', 'function with global');
  assertEquals(func_a, 'unchanged', 'function with scope');
  assertEquals(function_3(true), true, 'function return');
  assertEquals(function_3(false), false, 'function no return');
}

// Describe this function...
function function_1(func_x, func_y) {
  func_z = 'side effect';
  return func_x - func_y;
}

// Describe this function...
function function_2(func_a) {
  func_a = (typeof func_a === 'number' ? func_a : 0) + 1;
  return String(func_a) + String(func_c);
}

// Describe this function...
function function_3(func_a) {
  if (func_a) {
    return true;
  }
  return false;
}

// Describe this function...
function recurse(n) {
  if (n > 0) {
    text = [recurse(n - 1),n,recurse(n - 1)].join('');
  } else {
    text = '-';
  }
  return text;
}


unittestResults = [];
console.log('\n====================\n\nRunning suite: Logic')
assertEquals(true, true, 'True');
assertEquals(false, false, 'False');
assertEquals(!false, true, 'Not true');
assertEquals(!true, false, 'Not false');
test_if();
test_ifelse();
test_equalities();
test_and();
test_or();
test_ternary();
console.log(unittest_report());
unittestResults = null;

unittestResults = [];
console.log('\n====================\n\nRunning suite: Loops 1')
test_repeat();
test_repeat_ext();
test_while();
test_foreach();
console.log(unittest_report());
unittestResults = null;

unittestResults = [];
console.log('\n====================\n\nRunning suite: Loops 2')
test_count_loops();
test_count_by();
console.log(unittest_report());
unittestResults = null;

unittestResults = [];
console.log('\n====================\n\nRunning suite: Loops 3')
test_break();
test_continue();
console.log(unittest_report());
unittestResults = null;

unittestResults = [];
console.log('\n====================\n\nRunning suite: Math')
test_arithmetic();
test_single();
test_trig();
test_constant();
test_change();
test_number_properties();
test_round();
test_operations_on_list();
test_constraint();
test_mod();
test_random_integer();
test_random_fraction();
test_atan2();
console.log(unittest_report());
unittestResults = null;

unittestResults = [];
console.log('\n====================\n\nRunning suite: Text')
test_text_length();
test_empty_text();
test_create_text();
test_append();
test_find_text_simple();
test_find_text_complex();
test_get_text_simple();
test_get_text_complex();
test_substring_simple();
test_substring_complex();
test_case();
test_trim();
test_count_text();
test_text_reverse();
test_replace();
console.log(unittest_report());
unittestResults = null;

unittestResults = [];
console.log('\n====================\n\nRunning suite: Lists')
test_create_lists();
test_lists_empty();
test_lists_length();
test_find_lists_simple();
test_find_lists_complex();
test_get_lists_simple();
test_get_lists_create_list();
test_get_lists_complex();
test_getRemove();
test_remove();
test_set();
test_insert();
test_sublist_simple();
test_sublist_complex();
test_join();
test_split();
test_sort_alphabetic();
test_sort_ignoreCase();
test_sort_numeric();
test_lists_reverse();
console.log(unittest_report());
unittestResults = null;

unittestResults = [];
console.log('\n====================\n\nRunning suite: Variables')
item = 123;
assertEquals(item, 123, 'variable');
if2 = 123;
assertEquals(if2, 123, 'reserved variable');
console.log(unittest_report());
unittestResults = null;

// Intentionally non-connected variable.
naked;

unittestResults = [];
console.log('\n====================\n\nRunning suite: Functions')
test_procedure();
test_function();
assertEquals(recurse(3), '-1-2-1-3-1-2-1-', 'test recurse');
console.log(unittest_report());
unittestResults = null;
