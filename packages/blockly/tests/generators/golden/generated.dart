import 'dart:math' as Math;

var unittestResults, test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy;

String unittest_report() {
  // Create test report.
  List report = [];
  StringBuffer summary = new StringBuffer();
  int fails = 0;
  for (int x = 0; x < unittestResults.length; x++) {
    if (unittestResults[x][0]) {
      summary.write(".");
    } else {
      summary.write("F");
      fails++;
      report.add("");
      report.add("FAIL: ${unittestResults[x][2]}");
      report.add(unittestResults[x][1]);
    }
  }
  report.insert(0, summary.toString());
  report.add("");
  report.add("Ran ${unittestResults.length} tests.");
  report.add("");
  if (fails != 0) {
    report.add("FAILED (failures=$fails)");
  } else {
    report.add("OK");
  }
  return report.join("\n");
}

void unittest_assertequals(dynamic actual, dynamic expected, String message) {
  // Asserts that a value equals another value.
  if (unittestResults == null) {
    throw "Orphaned assert: ${message}";
  }
  bool equals(a, b) {
    if (a == b) {
      return true;
    } else if (a is List && b is List) {
      if (a.length != b.length) {
        return false;
      }
      for (num i = 0; i < a.length; i++) {
        if (!equals(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  if (equals(actual, expected)) {
    unittestResults.add([true, "OK", message]);
  } else {
    unittestResults.add([false, "Expected: $expected\nActual: $actual", message]);
  }
}

void unittest_fail(String message) {
  // Always assert an error.
  if (unittestResults == null) {
    throw "Orphaned assert fail: ${message}";
  }
  unittestResults.add([false, "Fail.", message]);
}

/// Describe this function...
void test_if() {
  if (false) {
    unittest_fail('if false');
  }
  ok = false;
  if (true) {
    ok = true;
  }
  unittest_assertequals(ok, true, 'if true');
  ok = false;
  if (false) {
    unittest_fail('if/else false');
  } else {
    ok = true;
  }
  unittest_assertequals(ok, true, 'if/else false');
  ok = false;
  if (true) {
    ok = true;
  } else {
    unittest_fail('if/else true');
  }
  unittest_assertequals(ok, true, 'if/else true');
  ok = false;
  if (false) {
    unittest_fail('elseif 1');
  }else if (true) {
    ok = true;
  }else if (true) {
    unittest_fail('elseif 2');
  } else {
    unittest_fail('elseif 3');
  }
  unittest_assertequals(ok, true, 'elseif 4');
}

/// Describe this function...
void test_ifelse() {
  ok = false;
  if (true) {
    ok = true;
  } else {
    unittest_fail('ifelse true');
  }
  unittest_assertequals(ok, true, 'ifelse true');
  ok = false;
  if (false) {
    unittest_fail('ifelse false');
  } else {
    ok = true;
  }
  unittest_assertequals(ok, true, 'ifelse false');
}

/// Describe this function...
void test_equalities() {
  unittest_assertequals(2 == 2, true, 'Equal yes');
  unittest_assertequals(3 == 4, false, 'Equal no');
  unittest_assertequals(5 != 6, true, 'Not equal yes');
  unittest_assertequals(3 == 4, false, 'Not equal no');
  unittest_assertequals(5 < 6, true, 'Smaller yes');
  unittest_assertequals(7 < 7, false, 'Smaller no');
  unittest_assertequals(9 > 8, true, 'Greater yes');
  unittest_assertequals(10 > 10, false, 'Greater no');
  unittest_assertequals(11 <= 11, true, 'Smaller-equal yes');
  unittest_assertequals(13 <= 12, false, 'Smaller-equal no');
  unittest_assertequals(14 >= 14, true, 'Greater-equal yes');
  unittest_assertequals(15 >= 16, false, 'Greater-equal no');
}

/// Describe this function...
void test_and() {
  unittest_assertequals(true && true, true, 'And true/true');
  unittest_assertequals(false && true, false, 'And false/true');
  unittest_assertequals(true && false, false, 'And true/false');
  unittest_assertequals(false && false, false, 'And false/false');
}

/// Describe this function...
void test_or() {
  unittest_assertequals(true || true, true, 'Or true/true');
  unittest_assertequals(false || true, true, 'Or false/true');
  unittest_assertequals(true || false, true, 'Or true/false');
  unittest_assertequals(false || false, false, 'Or false/false');
}

/// Describe this function...
void test_ternary() {
  unittest_assertequals(true ? 42 : 99, 42, 'if true');
  unittest_assertequals(false ? 42 : 99, 99, 'if true');
}

/// Describe this function...
void test_foreach() {
  log = '';
  for (var x in ['a', 'b', 'c']) {
    log = [log, x].join();
  }
  unittest_assertequals(log, 'abc', 'for loop');
}

/// Describe this function...
void test_repeat() {
  count = 0;
  for (int count2 = 0; count2 < 10; count2++) {
    count = (count is num ? count : 0) + 1;
  }
  unittest_assertequals(count, 10, 'repeat 10');
}

/// Describe this function...
void test_while() {
  while (false) {
    unittest_fail('while 0');
  }
  while (!true) {
    unittest_fail('until 0');
  }
  count = 1;
  while (count != 10) {
    count = (count is num ? count : 0) + 1;
  }
  unittest_assertequals(count, 10, 'while 10');
  count = 1;
  while (!(count == 10)) {
    count = (count is num ? count : 0) + 1;
  }
  unittest_assertequals(count, 10, 'until 10');
}

/// Describe this function...
void test_repeat_ext() {
  count = 0;
  for (int count3 = 0; count3 < 10; count3++) {
    count = (count is num ? count : 0) + 1;
  }
  unittest_assertequals(count, 10, 'repeat 10');
}

/// Describe this function...
void test_count_by() {
  log = '';
  for (x = 1; x <= 8; x += 2) {
    log = [log, x].join();
  }
  unittest_assertequals(log, '1357', 'count up ints');
  log = '';
  for (x = 8; x >= 1; x -= 2) {
    log = [log, x].join();
  }
  unittest_assertequals(log, '8642', 'count down ints');
  loglist = [];
  for (x = 1; x <= 8; x += 1.5) {
    loglist.add(x);
  }
  unittest_assertequals(loglist, [1, 2.5, 4, 5.5, 7], 'count with floats');
  loglist = [];
  var x_start = 1 + 0;
  var x_end = 8 + 0;
  num x_inc = (1 - 2).abs();
  if (x_start > x_end) {
    x_inc = -x_inc;
  }
  for (x = x_start; x_inc >= 0 ? x <= x_end : x >= x_end; x += x_inc) {
    loglist.add(x);
  }
  unittest_assertequals(loglist, [1, 2, 3, 4, 5, 6, 7, 8], 'count up non-trivial ints');
  loglist = [];
  var x_start2 = 8 + 0;
  var x_end2 = 1 + 0;
  num x_inc2 = 2;
  if (x_start2 > x_end2) {
    x_inc2 = -x_inc2;
  }
  for (x = x_start2; x_inc2 >= 0 ? x <= x_end2 : x >= x_end2; x += x_inc2) {
    loglist.add(x);
  }
  unittest_assertequals(loglist, [8, 6, 4, 2], 'count down non-trivial ints');
  loglist = [];
  var x_start3 = 5 + 0.5;
  var x_end3 = 1 + 0;
  num x_inc3 = (1 + 0).abs();
  if (x_start3 > x_end3) {
    x_inc3 = -x_inc3;
  }
  for (x = x_start3; x_inc3 >= 0 ? x <= x_end3 : x >= x_end3; x += x_inc3) {
    loglist.add(x);
  }
  unittest_assertequals(loglist, [5.5, 4.5, 3.5, 2.5, 1.5], 'count with floats');
}

/// Describe this function...
void test_count_loops() {
  log = '';
  for (x = 1; x <= 8; x++) {
    log = [log, x].join();
  }
  unittest_assertequals(log, '12345678', 'count up');
  log = '';
  for (x = 8; x >= 1; x--) {
    log = [log, x].join();
  }
  unittest_assertequals(log, '87654321', 'count down');
  loglist = [];
  var x_start4 = 1 + 0;
  var x_end4 = 4 + 0;
  num x_inc4 = 1;
  if (x_start4 > x_end4) {
    x_inc4 = -x_inc4;
  }
  for (x = x_start4; x_inc4 >= 0 ? x <= x_end4 : x >= x_end4; x += x_inc4) {
    loglist.add(x);
  }
  unittest_assertequals(loglist, [1, 2, 3, 4], 'count up non-trivial');
  loglist = [];
  var x_start5 = 3 + 1;
  var x_end5 = 1 + 0;
  num x_inc5 = 1;
  if (x_start5 > x_end5) {
    x_inc5 = -x_inc5;
  }
  for (x = x_start5; x_inc5 >= 0 ? x <= x_end5 : x >= x_end5; x += x_inc5) {
    loglist.add(x);
  }
  unittest_assertequals(loglist, [4, 3, 2, 1], 'count down non-trivial');
}

/// Describe this function...
void test_continue() {
  log = '';
  count = 0;
  while (count != 8) {
    count = (count is num ? count : 0) + 1;
    if (count == 5) {
      continue;
    }
    log = [log, count].join();
  }
  unittest_assertequals(log, '1234678', 'while continue');
  log = '';
  count = 0;
  while (!(count == 8)) {
    count = (count is num ? count : 0) + 1;
    if (count == 5) {
      continue;
    }
    log = [log, count].join();
  }
  unittest_assertequals(log, '1234678', 'until continue');
  log = '';
  for (x = 1; x <= 8; x++) {
    if (x == 5) {
      continue;
    }
    log = [log, x].join();
  }
  unittest_assertequals(log, '1234678', 'count continue');
  log = '';
  for (var x in ['a', 'b', 'c', 'd']) {
    if (x == 'c') {
      continue;
    }
    log = [log, x].join();
  }
  unittest_assertequals(log, 'abd', 'for continue');
}

/// Describe this function...
void test_break() {
  count = 1;
  while (count != 10) {
    if (count == 5) {
      break;
    }
    count = (count is num ? count : 0) + 1;
  }
  unittest_assertequals(count, 5, 'while break');
  count = 1;
  while (!(count == 10)) {
    if (count == 5) {
      break;
    }
    count = (count is num ? count : 0) + 1;
  }
  unittest_assertequals(count, 5, 'until break');
  log = '';
  for (x = 1; x <= 8; x++) {
    if (x == 5) {
      break;
    }
    log = [log, x].join();
  }
  unittest_assertequals(log, '1234', 'count break');
  log = '';
  for (var x in ['a', 'b', 'c', 'd']) {
    if (x == 'c') {
      break;
    }
    log = [log, x].join();
  }
  unittest_assertequals(log, 'ab', 'for break');
}

/// Tests the "single" block.
void test_single() {
  unittest_assertequals(Math.sqrt(25), 5, 'sqrt');
  unittest_assertequals((-25).abs(), 25, 'abs');
  unittest_assertequals(-(-25), 25, 'negate');
  unittest_assertequals(Math.log(1), 0, 'ln');
  unittest_assertequals(Math.log(100) / Math.log(10), 2, 'log10');
  unittest_assertequals(Math.exp(2), 7.38905609893065, 'exp');
  unittest_assertequals(Math.pow(10,2), 100, 'power10');
}

/// Tests the "arithmetic" block for all operations and checks
/// parenthesis are properly generated for different orders.
void test_arithmetic() {
  unittest_assertequals(1 + 2, 3, 'add');
  unittest_assertequals(1 - 2, -1, 'subtract');
  unittest_assertequals(1 - (0 + 2), -1, 'subtract order with add');
  unittest_assertequals(1 - (0 - 2), 3, 'subtract order with subtract');
  unittest_assertequals(4 * 2.5, 10, 'multiply');
  unittest_assertequals(4 * (0 + 2.5), 10, 'multiply order');
  unittest_assertequals(8.2 / -5, -1.64, 'divide');
  unittest_assertequals(8.2 / (0 + -5), -1.64, 'divide order');
  unittest_assertequals(Math.pow(10, 4), 10000, 'power');
  unittest_assertequals(Math.pow(10, 0 + 4), 10000, 'power order');
}

/// Tests the "trig" block.
void test_trig() {
  unittest_assertequals(Math.sin(90 / 180 * Math.pi), 1, 'sin');
  unittest_assertequals(Math.cos(180 / 180 * Math.pi), -1, 'cos');
  unittest_assertequals(Math.tan(0 / 180 * Math.pi), 0, 'tan');
  unittest_assertequals(Math.asin(-1) / Math.pi * 180, -90, 'asin');
  unittest_assertequals(Math.acos(1) / Math.pi * 180, 0, 'acos');
  unittest_assertequals(Math.atan(1) / Math.pi * 180, 45, 'atan');
}

/// Tests the "constant" blocks.
void test_constant() {
  unittest_assertequals((Math.pi * 1000).floor(), 3141, 'const pi');
  unittest_assertequals((Math.e * 1000).floor(), 2718, 'const e');
  unittest_assertequals((((1 + Math.sqrt(5)) / 2) * 1000).floor(), 1618, 'const golden');
  unittest_assertequals((Math.sqrt2 * 1000).floor(), 1414, 'const sqrt 2');
  unittest_assertequals((Math.sqrt1_2 * 1000).floor(), 707, 'const sqrt 0.5');
  unittest_assertequals(9999 < double.infinity, true, 'const infinity');
}

bool math_isPrime(n) {
  // https://en.wikipedia.org/wiki/Primality_test#Naive_methods
  if (n == 2 || n == 3) {
    return true;
  }
  // False if n is null, negative, is 1, or not whole.
  // And false if n is divisible by 2 or 3.
  if (n == null || n <= 1 || n % 1 != 0 || n % 2 == 0 || n % 3 == 0) {
    return false;
  }
  // Check all the numbers of form 6k +/- 1, up to sqrt(n).
  for (var x = 6; x <= Math.sqrt(n) + 1; x += 6) {
    if (n % (x - 1) == 0 || n % (x + 1) == 0) {
      return false;
    }
  }
  return true;
}

/// Tests the "number property" blocks.
void test_number_properties() {
  unittest_assertequals(42 % 2 == 0, true, 'even');
  unittest_assertequals(42.1 % 2 == 1, false, 'odd');
  unittest_assertequals(math_isPrime(5), true, 'prime 5');
  unittest_assertequals(math_isPrime(5 + 2), true, 'prime 5 + 2 (extra parentheses)');
  unittest_assertequals(math_isPrime(25), false, 'prime 25');
  unittest_assertequals(math_isPrime(-31.1), false, 'prime negative');
  unittest_assertequals(Math.pi % 1 == 0, false, 'whole');
  unittest_assertequals(double.infinity > 0, true, 'positive');
  unittest_assertequals(5 + 2 > 0, true, '5 + 2 is positive (extra parentheses)');
  unittest_assertequals(-42 < 0, true, 'negative');
  unittest_assertequals(3 + 2 < 0, false, '3 + 2 is negative (extra parentheses)');
  unittest_assertequals(42 % 2 == 0, true, 'divisible');
  unittest_assertequals(!false, true, 'divisible by 0');
}

/// Tests the "round" block.
void test_round() {
  unittest_assertequals(42.42.round(), 42, 'round');
  unittest_assertequals((-42.42).ceil(), -42, 'round up');
  unittest_assertequals(42.42.floor(), 42, 'round down');
}

/// Tests the "change" block.
void test_change() {
  varToChange = 100;
  varToChange = (varToChange is num ? varToChange : 0) + 42;
  unittest_assertequals(varToChange, 142, 'change');
}

num math_sum(List<num> myList) {
  num sumVal = 0;
  myList.forEach((num entry) {sumVal += entry;});
  return sumVal;
}

num math_min(List<num> myList) {
  if (myList.isEmpty) return null;
  num minVal = myList[0];
  myList.forEach((num entry) {minVal = Math.min(minVal, entry);});
  return minVal;
}

num math_max(List<num> myList) {
  if (myList.isEmpty) return null;
  num maxVal = myList[0];
  myList.forEach((num entry) {maxVal = Math.max(maxVal, entry);});
  return maxVal;
}

num math_mean(List myList) {
  // First filter list for numbers only.
  List localList = new List.from(myList);
  localList.removeWhere((a) => a is! num);
  if (localList.isEmpty) return null;
  num sumVal = 0;
  localList.forEach((var entry) {sumVal += entry;});
  return sumVal / localList.length;
}

num math_median(List myList) {
  // First filter list for numbers only, then sort, then return middle value
  // or the average of two middle values if list has an even number of elements.
  List localList = new List.from(myList);
  localList.removeWhere((a) => a is! num);
  if (localList.isEmpty) return null;
  localList.sort((a, b) => (a - b));
  int index = localList.length ~/ 2;
  if (localList.length % 2 == 1) {
    return localList[index];
  } else {
    return (localList[index - 1] + localList[index]) / 2;
  }
}

List math_modes(List values) {
  List modes = [];
  List counts = [];
  int maxCount = 0;
  for (int i = 0; i < values.length; i++) {
    var value = values[i];
    bool found = false;
    int thisCount;
    for (int j = 0; j < counts.length; j++) {
      if (counts[j][0] == value) {
        thisCount = ++counts[j][1];
        found = true;
        break;
      }
    }
    if (!found) {
      counts.add([value, 1]);
      thisCount = 1;
    }
    maxCount = Math.max(thisCount, maxCount);
  }
  for (int j = 0; j < counts.length; j++) {
    if (counts[j][1] == maxCount) {
        modes.add(counts[j][0]);
    }
  }
  return modes;
}

num math_standard_deviation(List myList) {
  // First filter list for numbers only.
  List numbers = new List.from(myList);
  numbers.removeWhere((a) => a is! num);
  if (numbers.isEmpty) return null;
  num n = numbers.length;
  num sum = 0;
  numbers.forEach((x) => sum += x);
  num mean = sum / n;
  num sumSquare = 0;
  numbers.forEach((x) => sumSquare += Math.pow(x - mean, 2));
  return Math.sqrt(sumSquare / n);
}

dynamic math_random_item(List myList) {
  int x = new Math.Random().nextInt(myList.length);
  return myList[x];
}

/// Tests the "list operation" blocks.
void test_operations_on_list() {
  unittest_assertequals(math_sum([3, 4, 5]), 12, 'sum');
  unittest_assertequals(math_min([3, 4, 5]), 3, 'min');
  unittest_assertequals(math_max([3, 4, 5]), 5, 'max');
  unittest_assertequals(math_mean([3, 4, 5]), 4, 'average');
  unittest_assertequals(math_median([3, 4, 5, 1]), 3.5, 'median');
  unittest_assertequals(math_modes([3, 4, 3]), [3], 'modes');
  unittest_assertequals(math_modes([3, 4, 3, 1, 4]), [3, 4], 'modes multiple');
  unittest_assertequals(math_standard_deviation([3, 3, 3]), 0, 'standard dev');
  unittest_assertequals([3, 4, 5].indexOf(math_random_item([3, 4, 5])) + 1 > 0, true, 'random');
}

/// Tests the "mod" block.
void test_mod() {
  unittest_assertequals(42 % 5, 2, 'mod');
}

/// Tests the "constrain" block.
void test_constraint() {
  unittest_assertequals(Math.min(Math.max(100, 0), 42), 42, 'constraint');
}

int math_random_int(num a, num b) {
  if (a > b) {
    // Swap a and b to ensure a is smaller.
    num c = a;
    a = b;
    b = c;
  }
  return new Math.Random().nextInt(b - a + 1) + a;
}

/// Tests the "random integer" block.
void test_random_integer() {
  rand = math_random_int(5, 10);
  unittest_assertequals(rand >= 5 && rand <= 10, true, 'randRange');
  unittest_assertequals(rand % 1 == 0, true, 'randInteger');
}

/// Tests the "random fraction" block.
void test_random_fraction() {
  rand = new Math.Random().nextDouble();
  unittest_assertequals(rand >= 0 && rand <= 1, true, 'randFloat');
}

/// Describe this function...
void test_atan2() {
  unittest_assertequals(Math.atan2(5, -5) / Math.pi * 180, 135, 'atan2');
  unittest_assertequals(Math.atan2(-12, 0) / Math.pi * 180, -90, 'atan2');
}

/// Checks that the number of calls is one in order
/// to confirm that a function was only called once.
void check_number_of_calls(test_name) {
  test_name = [test_name, 'number of calls'].join();
  unittest_assertequals(number_of_calls, 1, test_name);
}

/// Tests the "create text with" block with varying number of inputs.
void test_create_text() {
  unittest_assertequals('', '', 'no text');
  unittest_assertequals('Hello'.toString(), 'Hello', 'create single');
  unittest_assertequals((-1).toString(), '-1', 'create single number');
  unittest_assertequals(['K',9].join(), 'K9', 'create double text');
  unittest_assertequals([4,2].join(), '42', 'create double text numbers');
  unittest_assertequals([1,2,3].join(), '123', 'create triple');
  unittest_assertequals([1,true ? 0 : null,'M'].join(), '10M', 'create order');
}

/// Creates an empty string for use with the empty test.
dynamic get_empty() {
  return '';
}

/// Tests the "is empty" block".
void test_empty_text() {
  unittest_assertequals('Google'.isEmpty, false, 'not empty');
  unittest_assertequals(''.isEmpty, true, 'empty');
  unittest_assertequals((get_empty()).isEmpty, true, 'empty complex');
  unittest_assertequals((true ? '' : null).isEmpty, true, 'empty order');
}

/// Tests the "length" block.
void test_text_length() {
  unittest_assertequals(''.length, 0, 'zero length');
  unittest_assertequals('Google'.length, 6, 'non-zero length');
  unittest_assertequals((true ? 'car' : null).length, 3, 'length order');
}

/// Tests the "append text" block with different types of parameters.
void test_append() {
  item = 'Miserable';
  item = [item, 'Failure'].join();
  unittest_assertequals(item, 'MiserableFailure', 'append text');
  item = 12;
  item = [item, 34].join();
  unittest_assertequals(item, '1234', 'append number');
  item = 'Something ';
  item = [item, true ? 'Positive' : null].join();
  unittest_assertequals(item, 'Something Positive', 'append order');
}

/// Tests the "find" block with a variable.
void test_find_text_simple() {
  text = 'Banana';
  unittest_assertequals(text.indexOf('an') + 1, 2, 'find first simple');
  unittest_assertequals(text.lastIndexOf('an') + 1, 4, 'find last simple');
  unittest_assertequals(text.indexOf('Peel') + 1, 0, 'find none simple');
}

/// Creates a string for use with the find test.
dynamic get_fruit() {
  number_of_calls = (number_of_calls is num ? number_of_calls : 0) + 1;
  return 'Banana';
}

/// Tests the "find" block with a function call.
void test_find_text_complex() {
  number_of_calls = 0;
  unittest_assertequals((get_fruit()).indexOf('an') + 1, 2, 'find first complex');
  check_number_of_calls('find first complex');
  number_of_calls = 0;
  unittest_assertequals((true ? get_fruit() : null).indexOf('an') + 1, 2, 'find first order complex');
  check_number_of_calls('find first order complex');
  number_of_calls = 0;
  unittest_assertequals((get_fruit()).lastIndexOf('an') + 1, 4, 'find last complex');
  check_number_of_calls('find last complex');
  number_of_calls = 0;
  unittest_assertequals((true ? get_fruit() : null).lastIndexOf('an') + 1, 4, 'find last order complex');
  check_number_of_calls('find last order complex');
  number_of_calls = 0;
  unittest_assertequals((get_fruit()).indexOf('Peel') + 1, 0, 'find none complex');
  check_number_of_calls('find none complex');
  number_of_calls = 0;
  unittest_assertequals((true ? get_fruit() : null).indexOf('Peel') + 1, 0, 'find none order complex');
  check_number_of_calls('find none order complex');
}

String text_get_from_end(String text, num x) {
  return text[text.length - x];
}

String text_random_letter(String text) {
  int x = new Math.Random().nextInt(text.length);
  return text[x];
}

/// Tests the "get letter" block with a variable.
void test_get_text_simple() {
  text = 'Blockly';
  unittest_assertequals(text[0], 'B', 'get first simple');
  unittest_assertequals(text_get_from_end(text, 1), 'y', 'get last simple');
  unittest_assertequals(text.indexOf(text_random_letter(text)) + 1 > 0, true, 'get random simple');
  unittest_assertequals(text[2], 'o', 'get # simple');
  unittest_assertequals(text[((true ? 3 : null) - 1)], 'o', 'get # order simple');
  unittest_assertequals(text_get_from_end(text, 3), 'k', 'get #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  unittest_assertequals(text_get_from_end(text, 0 + 3), 'k', 'get #-end order simple');
}

/// Creates a string for use with the get test.
dynamic get_Blockly() {
  number_of_calls = (number_of_calls is num ? number_of_calls : 0) + 1;
  return 'Blockly';
}

/// Tests the "get letter" block with a function call.
void test_get_text_complex() {
  text = 'Blockly';
  number_of_calls = 0;
  unittest_assertequals((get_Blockly())[0], 'B', 'get first complex');
  check_number_of_calls('get first complex');
  number_of_calls = 0;
  unittest_assertequals((true ? get_Blockly() : null)[0], 'B', 'get first order complex');
  check_number_of_calls('get first order complex');
  number_of_calls = 0;
  unittest_assertequals(text_get_from_end(get_Blockly(), 1), 'y', 'get last complex');
  check_number_of_calls('get last complex');
  number_of_calls = 0;
  unittest_assertequals(text_get_from_end(true ? get_Blockly() : null, 1), 'y', 'get last order complex');
  check_number_of_calls('get last order complex');
  number_of_calls = 0;
  unittest_assertequals(text.indexOf(text_random_letter(get_Blockly())) + 1 > 0, true, 'get random complex');
  check_number_of_calls('get random complex');
  number_of_calls = 0;
  unittest_assertequals(text.indexOf(text_random_letter(true ? get_Blockly() : null)) + 1 > 0, true, 'get random order complex');
  check_number_of_calls('get random order complex');
  number_of_calls = 0;
  unittest_assertequals((get_Blockly())[2], 'o', 'get # complex');
  check_number_of_calls('get # complex');
  number_of_calls = 0;
  unittest_assertequals((true ? get_Blockly() : null)[((true ? 3 : null) - 1)], 'o', 'get # order complex');
  check_number_of_calls('get # order complex');
  number_of_calls = 0;
  unittest_assertequals(text_get_from_end(get_Blockly(), 3), 'k', 'get #-end complex');
  check_number_of_calls('get #-end complex');
  number_of_calls = 0;
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  unittest_assertequals(text_get_from_end(true ? get_Blockly() : null, 0 + 3), 'k', 'get #-end order complex');
  check_number_of_calls('get #-end order complex');
}

/// Creates a string for use with the substring test.
dynamic get_numbers() {
  number_of_calls = (number_of_calls is num ? number_of_calls : 0) + 1;
  return '123456789';
}

/// Tests the "get substring" block with a variable.
void test_substring_simple() {
  text = '123456789';
  unittest_assertequals(text.substring(1, 3), '23', 'substring # simple');
  unittest_assertequals(text.substring(((true ? 2 : null) - 1), true ? 3 : null), '23', 'substring # simple order');
  unittest_assertequals(text.substring(text.length - 3, text.length - 1), '78', 'substring #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  unittest_assertequals(text.substring(text.length - (0 + 3), text.length - ((0 + 2) - 1)), '78', 'substring #-end simple order');
  unittest_assertequals(text, text, 'substring first-last simple');
  unittest_assertequals(text.substring(1, text.length - 1), '2345678', 'substring # #-end simple');
  unittest_assertequals(text.substring(text.length - 7, 4), '34', 'substring #-end # simple');
  unittest_assertequals(text.substring(0, 4), '1234', 'substring first # simple');
  unittest_assertequals(text.substring(0, text.length - 1), '12345678', 'substring first #-end simple');
  unittest_assertequals(text.substring(6), '789', 'substring # last simple');
  unittest_assertequals(text.substring(text.length - 3), '789', 'substring #-end last simple');
  unittest_assertequals(text.substring(0, text.length - 0), '123456789', 'substring all with # #-end simple');
  unittest_assertequals(text.substring(text.length - 9, 9), '123456789', 'substring all with #-end # simple');
  // Checks that the whole string is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where substring uses [x:length - y] for # #-end.
  unittest_assertequals(text.substring(((0 + 1) - 1), text.length - ((0 + 1) - 1)), '123456789', 'substring all with # #-end math simple');
}

String text_get_substring(String text, String where1, num at1, String where2, num at2) {
  int getAt(String where, num at) {
    if (where == 'FROM_END') {
      at = text.length - 1 - at;
    } else if (where == 'FIRST') {
      at = 0;
    } else if (where == 'LAST') {
      at = text.length - 1;
    } else if (where != 'FROM_START') {
      throw 'Unhandled option (text_getSubstring).';
    }
    return at;
  }
  at1 = getAt(where1, at1);
  at2 = getAt(where2, at2) + 1;
  return text.substring(at1, at2);
}

/// Tests the "get substring" block with a function call.
void test_substring_complex() {
  number_of_calls = 0;
  unittest_assertequals((get_numbers()).substring(1, 3), '23', 'substring # complex');
  check_number_of_calls('substring # complex');
  number_of_calls = 0;
  unittest_assertequals((true ? get_numbers() : null).substring(((true ? 2 : null) - 1), true ? 3 : null), '23', 'substring # complex order');
  check_number_of_calls('substring # complex order');
  number_of_calls = 0;
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  unittest_assertequals(text_get_substring(get_numbers(), 'FROM_END', 2, 'FROM_END', 1), '78', 'substring #-end complex');
  check_number_of_calls('substring #-end complex');
  number_of_calls = 0;
  unittest_assertequals(text_get_substring(true ? get_numbers() : null, 'FROM_END', ((0 + 3) - 1), 'FROM_END', ((0 + 2) - 1)), '78', 'substring #-end order order');
  check_number_of_calls('substring #-end order order');
  number_of_calls = 0;
  unittest_assertequals(get_numbers(), text, 'substring first-last');
  check_number_of_calls('substring first-last');
  number_of_calls = 0;
  unittest_assertequals(text_get_substring(get_numbers(), 'FROM_START', 1, 'FROM_END', 1), '2345678', 'substring # #-end complex');
  check_number_of_calls('substring # #-end complex');
  number_of_calls = 0;
  unittest_assertequals(text_get_substring(get_numbers(), 'FROM_END', 6, 'FROM_START', 3), '34', 'substring #-end # complex');
  check_number_of_calls('substring #-end # complex');
  number_of_calls = 0;
  unittest_assertequals((get_numbers()).substring(0, 4), '1234', 'substring first # complex');
  check_number_of_calls('substring first # complex');
  number_of_calls = 0;
  unittest_assertequals(text_get_substring(get_numbers(), 'FIRST', 0, 'FROM_END', 1), '12345678', 'substring first #-end complex');
  check_number_of_calls('substring first #-end complex');
  number_of_calls = 0;
  unittest_assertequals(text_get_substring(get_numbers(), 'FROM_START', 6, 'LAST', 0), '789', 'substring # last complex');
  check_number_of_calls('substring # last complex');
  number_of_calls = 0;
  unittest_assertequals(text_get_substring(get_numbers(), 'FROM_END', 2, 'LAST', 0), '789', 'substring #-end last complex');
  check_number_of_calls('substring #-end last complex');
  number_of_calls = 0;
  unittest_assertequals(text_get_substring(get_numbers(), 'FROM_START', 0, 'FROM_END', 0), '123456789', 'substring all with # #-end complex');
  check_number_of_calls('substring all with # #-end complex');
  number_of_calls = 0;
  unittest_assertequals(text_get_substring(get_numbers(), 'FROM_END', 8, 'FROM_START', 8), '123456789', 'substring all with #-end # complex');
  check_number_of_calls('substring all with #-end # complex');
  number_of_calls = 0;
  // Checks that the whole string is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where substring uses [x:length - y] for # #-end.
  unittest_assertequals(text_get_substring(get_numbers(), 'FROM_START', ((0 + 1) - 1), 'FROM_END', ((0 + 1) - 1)), '123456789', 'substring all with # #-end math complex');
  check_number_of_calls('substring all with # #-end math complex');
}

String text_toTitleCase(String str) {
  RegExp exp = new RegExp(r'\b');
  List<String> list = str.split(exp);
  final title = new StringBuffer();
  for (String part in list) {
    if (part.length > 0) {
      title.write(part[0].toUpperCase());
      if (part.length > 0) {
        title.write(part.substring(1).toLowerCase());
      }
    }
  }
  return title.toString();
}

/// Tests the "change casing" block.
void test_case() {
  text = 'Hello World';
  unittest_assertequals(text.toUpperCase(), 'HELLO WORLD', 'uppercase');
  unittest_assertequals((true ? text : null).toUpperCase(), 'HELLO WORLD', 'uppercase order');
  text = 'Hello World';
  unittest_assertequals(text.toLowerCase(), 'hello world', 'lowercase');
  unittest_assertequals((true ? text : null).toLowerCase(), 'hello world', 'lowercase order');
  text = 'heLLo WorlD';
  unittest_assertequals(text_toTitleCase(text), 'Hello World', 'titlecase');
  unittest_assertequals(text_toTitleCase(true ? text : null), 'Hello World', 'titlecase order');
}

/// Tests the "trim" block.
void test_trim() {
  text = '   abc def   ';
  unittest_assertequals(text.trim(), 'abc def', 'trim both');
  unittest_assertequals((true ? text : null).trim(), 'abc def', 'trim both order');
  unittest_assertequals(text.replaceFirst(new RegExp(r'^\s+'), ''), 'abc def   ', 'trim left');
  unittest_assertequals((true ? text : null).replaceFirst(new RegExp(r'^\s+'), ''), 'abc def   ', 'trim left order');
  unittest_assertequals(text.replaceFirst(new RegExp(r'\s+$'), ''), '   abc def', 'trim right');
  unittest_assertequals((true ? text : null).replaceFirst(new RegExp(r'\s+$'), ''), '   abc def', 'trim right order');
}

int text_count(String haystack, String needle) {
  if (needle.length == 0) {
    return haystack.length + 1;
  }
  int index = 0;
  int count = 0;
  while (index != -1) {
    index = haystack.indexOf(needle, index);
    if (index != -1) {
      count++;
     index += needle.length;
    }
  }
  return count;
}

/// Tests the "trim" block.
void test_count_text() {
  text = 'woolloomooloo';
  unittest_assertequals(text_count(text, 'o'), 8, 'len 1');
  unittest_assertequals(text_count(text, 'oo'), 4, 'len 2');
  unittest_assertequals(text_count(text, 'loo'), 2, 'len 3');
  unittest_assertequals(text_count(text, 'wool'), 1, 'start');
  unittest_assertequals(text_count(text, 'chicken'), 0, 'missing');
  unittest_assertequals(text_count(text, ''), 14, 'empty needle');
  unittest_assertequals(text_count('', 'chicken'), 0, 'empty source');
}

/// Tests the "trim" block.
void test_text_reverse() {
  unittest_assertequals(new String.fromCharCodes(''.runes.toList().reversed), '', 'empty string');
  unittest_assertequals(new String.fromCharCodes('a'.runes.toList().reversed), 'a', 'len 1');
  unittest_assertequals(new String.fromCharCodes('ab'.runes.toList().reversed), 'ba', 'len 2');
  unittest_assertequals(new String.fromCharCodes('woolloomooloo'.runes.toList().reversed), 'ooloomoolloow', 'longer');
}

/// Tests the "trim" block.
void test_replace() {
  unittest_assertequals('woolloomooloo'.replaceAll('oo', '123'), 'w123ll123m123l123', 'replace all instances 1');
  unittest_assertequals('woolloomooloo'.replaceAll('.oo', 'X'), 'woolloomooloo', 'literal string replacement');
  unittest_assertequals('woolloomooloo'.replaceAll('abc', 'X'), 'woolloomooloo', 'not found');
  unittest_assertequals('woolloomooloo'.replaceAll('o', ''), 'wllml', 'empty replacement 1');
  unittest_assertequals('aaaaa'.replaceAll('aaaaa', ''), '', 'empty replacement 2');
  unittest_assertequals('aaaaa'.replaceAll('a', ''), '', 'empty replacement 3');
  unittest_assertequals(''.replaceAll('a', 'chicken'), '', 'empty source');
}

/// Checks that the number of calls is one in order
/// to confirm that a function was only called once.
void check_number_of_calls2(test_name) {
  test_name = [test_name, 'number of calls'].join();
  unittest_assertequals(number_of_calls, 1, test_name);
}

/// Tests the "create list with" and "create empty list" blocks.
void test_create_lists() {
  unittest_assertequals([], [], 'create empty');
  unittest_assertequals([true, 'love'], [true, 'love'], 'create items');
  unittest_assertequals(new List.filled(3, 'Eject'), ['Eject', 'Eject', 'Eject'], 'create repeated');
  unittest_assertequals(new List.filled(0 + 3, 'Eject'), ['Eject', 'Eject', 'Eject'], 'create repeated order');
}

/// Creates an empty list for use with the empty test.
dynamic get_empty_list() {
  return [];
}

/// Tests the "is empty" block.
void test_lists_empty() {
  unittest_assertequals([0].isEmpty, false, 'not empty');
  unittest_assertequals([].isEmpty, true, 'empty');
  unittest_assertequals((get_empty_list()).isEmpty, true, 'empty complex');
  unittest_assertequals((true ? [] : null).isEmpty, true, 'empty order');
}

/// Tests the "length" block.
void test_lists_length() {
  unittest_assertequals([].length, 0, 'zero length');
  unittest_assertequals(['cat'].length, 1, 'one length');
  unittest_assertequals(['cat', true, []].length, 3, 'three length');
  unittest_assertequals((true ? ['cat', true] : null).length, 2, 'two length order');
}

/// Tests the "find" block with a variable.
void test_find_lists_simple() {
  list = ['Alice', 'Eve', 'Bob', 'Eve'];
  unittest_assertequals(list.indexOf('Eve') + 1, 2, 'find first simple');
  unittest_assertequals(list.lastIndexOf('Eve') + 1, 4, 'find last simple');
  unittest_assertequals(list.indexOf('Dave') + 1, 0, 'find none simple');
}

/// Creates a list for use with the find test.
dynamic get_names() {
  number_of_calls = (number_of_calls is num ? number_of_calls : 0) + 1;
  return ['Alice', 'Eve', 'Bob', 'Eve'];
}

/// Tests the "find" block with a function call.
void test_find_lists_complex() {
  number_of_calls = 0;
  unittest_assertequals((get_names()).indexOf('Eve') + 1, 2, 'find first complex');
  check_number_of_calls('find first complex');
  number_of_calls = 0;
  unittest_assertequals((true ? get_names() : null).indexOf('Eve') + 1, 2, 'find first order complex');
  check_number_of_calls('find first order complex');
  number_of_calls = 0;
  unittest_assertequals((get_names()).lastIndexOf('Eve') + 1, 4, 'find last complex');
  check_number_of_calls('find last complex');
  number_of_calls = 0;
  unittest_assertequals((true ? get_names() : null).lastIndexOf('Eve') + 1, 4, 'find last order complex');
  check_number_of_calls('find last order complex');
  number_of_calls = 0;
  unittest_assertequals((get_names()).indexOf('Dave') + 1, 0, 'find none complex');
  check_number_of_calls('find none complex');
  number_of_calls = 0;
  unittest_assertequals((true ? get_names() : null).indexOf('Dave') + 1, 0, 'find none order complex');
  check_number_of_calls('find none order complex');
}

dynamic lists_get_random_item(List my_list) {
  int x = new Math.Random().nextInt(my_list.length);
  return my_list[x];
}

/// Tests the "get" block with a variable.
void test_get_lists_simple() {
  list = ['Kirk', 'Spock', 'McCoy'];
  unittest_assertequals(list.first, 'Kirk', 'get first simple');
  unittest_assertequals(list.last, 'McCoy', 'get last simple');
  unittest_assertequals(list.indexOf(lists_get_random_item(list)) + 1 > 0, true, 'get random simple');
  unittest_assertequals(list[1], 'Spock', 'get # simple');
  unittest_assertequals(list[((true ? 2 : null) - 1)], 'Spock', 'get # order simple');
  unittest_assertequals(list[list.length - 3], 'Kirk', 'get #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  unittest_assertequals(list[list.length - (0 + 3)], 'Kirk', 'get #-end order simple');
}

dynamic lists_get_from_end(List my_list, num x) {
  x = my_list.length - x;
  return my_list[x];
}

/// Tests the "get" block with create list call.
void test_get_lists_create_list() {
  unittest_assertequals(['Kirk', 'Spock', 'McCoy'].first, 'Kirk', 'get first create list');
  unittest_assertequals(['Kirk', 'Spock', 'McCoy'].last, 'McCoy', 'get last simple');
  unittest_assertequals(['Kirk', 'Spock', 'McCoy'].indexOf(lists_get_random_item(['Kirk', 'Spock', 'McCoy'])) + 1 > 0, true, 'get random simple');
  unittest_assertequals(['Kirk', 'Spock', 'McCoy'][1], 'Spock', 'get # simple');
  unittest_assertequals(['Kirk', 'Spock', 'McCoy'][((true ? 2 : null) - 1)], 'Spock', 'get # order simple');
  unittest_assertequals(lists_get_from_end(['Kirk', 'Spock', 'McCoy'], 3), 'Kirk', 'get #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  unittest_assertequals(lists_get_from_end(['Kirk', 'Spock', 'McCoy'], 0 + 3), 'Kirk', 'get #-end order simple');
}

/// Creates a list for use with the get test.
dynamic get_star_wars() {
  number_of_calls = (number_of_calls is num ? number_of_calls : 0) + 1;
  return ['Kirk', 'Spock', 'McCoy'];
}

/// Tests the "get" block with a function call.
void test_get_lists_complex() {
  list = ['Kirk', 'Spock', 'McCoy'];
  number_of_calls = 0;
  unittest_assertequals((get_star_wars()).first, 'Kirk', 'get first complex');
  check_number_of_calls('get first complex');
  number_of_calls = 0;
  unittest_assertequals((true ? get_star_wars() : null).first, 'Kirk', 'get first order complex');
  check_number_of_calls('get first order complex');
  number_of_calls = 0;
  unittest_assertequals((get_star_wars()).last, 'McCoy', 'get last complex');
  check_number_of_calls('get last complex');
  number_of_calls = 0;
  unittest_assertequals((true ? get_star_wars() : null).last, 'McCoy', 'get last order complex');
  check_number_of_calls('get last order complex');
  number_of_calls = 0;
  unittest_assertequals(list.indexOf(lists_get_random_item(get_star_wars())) + 1 > 0, true, 'get random complex');
  check_number_of_calls('get random complex');
  number_of_calls = 0;
  unittest_assertequals(list.indexOf(lists_get_random_item(true ? get_star_wars() : null)) + 1 > 0, true, 'get random order complex');
  check_number_of_calls('get random order complex');
  number_of_calls = 0;
  unittest_assertequals((get_star_wars())[1], 'Spock', 'get # complex');
  check_number_of_calls('get # complex');
  number_of_calls = 0;
  unittest_assertequals((true ? get_star_wars() : null)[((true ? 2 : null) - 1)], 'Spock', 'get # order complex');
  check_number_of_calls('get # order complex');
  number_of_calls = 0;
  unittest_assertequals(lists_get_from_end(get_star_wars(), 3), 'Kirk', 'get #-end complex');
  check_number_of_calls('get #-end complex');
  number_of_calls = 0;
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  unittest_assertequals(lists_get_from_end(true ? get_star_wars() : null, 0 + 3), 'Kirk', 'get #-end order complex');
  check_number_of_calls('get #-end order complex');
}

dynamic lists_remove_random_item(List my_list) {
  int x = new Math.Random().nextInt(my_list.length);
  return my_list.removeAt(x);
}

dynamic lists_remove_from_end(List my_list, num x) {
  x = my_list.length - x;
  return my_list.removeAt(x);
}

/// Tests the "get and remove" block.
void test_getRemove() {
  list = ['Kirk', 'Spock', 'McCoy'];
  unittest_assertequals(list.removeAt(0), 'Kirk', 'getremove first');
  unittest_assertequals(list, ['Spock', 'McCoy'], 'getremove first list');
  list = ['Kirk', 'Spock', 'McCoy'];
  unittest_assertequals((true ? list : null).removeAt(0), 'Kirk', 'getremove first order');
  unittest_assertequals(list, ['Spock', 'McCoy'], 'getremove first order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  unittest_assertequals(list.removeLast(), 'McCoy', 'getremove last');
  unittest_assertequals(list, ['Kirk', 'Spock'], 'getremove last list');
  list = ['Kirk', 'Spock', 'McCoy'];
  unittest_assertequals((true ? list : null).removeLast(), 'McCoy', 'getremove last order');
  unittest_assertequals(list, ['Kirk', 'Spock'], 'getremove last order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  unittest_assertequals(list.indexOf(lists_remove_random_item(list)) + 1 == 0, true, 'getremove random');
  unittest_assertequals(list.length, 2, 'getremove random list');
  list = ['Kirk', 'Spock', 'McCoy'];
  unittest_assertequals(list.indexOf(lists_remove_random_item(true ? list : null)) + 1 == 0, true, 'getremove random order');
  unittest_assertequals(list.length, 2, 'getremove random order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  unittest_assertequals(list.removeAt(1), 'Spock', 'getremove #');
  unittest_assertequals(list, ['Kirk', 'McCoy'], 'getremove # list');
  list = ['Kirk', 'Spock', 'McCoy'];
  unittest_assertequals((true ? list : null).removeAt(((true ? 2 : null) - 1)), 'Spock', 'getremove # order');
  unittest_assertequals(list, ['Kirk', 'McCoy'], 'getremove # order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  unittest_assertequals(list.removeAt(list.length - 3), 'Kirk', 'getremove #-end');
  unittest_assertequals(list, ['Spock', 'McCoy'], 'getremove #-end list');
  list = ['Kirk', 'Spock', 'McCoy'];
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  unittest_assertequals(lists_remove_from_end(true ? list : null, 0 + 3), 'Kirk', 'getremove #-end order');
  unittest_assertequals(list, ['Spock', 'McCoy'], 'getremove #-end order list');
}

/// Tests the "remove" block.
void test_remove() {
  list = ['Kirk', 'Spock', 'McCoy'];
  list.removeAt(0);
  unittest_assertequals(list, ['Spock', 'McCoy'], 'remove first list');
  list = ['Kirk', 'Spock', 'McCoy'];
  (true ? list : null).removeAt(0);
  unittest_assertequals(list, ['Spock', 'McCoy'], 'remove first order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  list.removeLast();
  unittest_assertequals(list, ['Kirk', 'Spock'], 'remove last list');
  list = ['Kirk', 'Spock', 'McCoy'];
  (true ? list : null).removeLast();
  unittest_assertequals(list, ['Kirk', 'Spock'], 'remove last order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  int tmp_x = new Math.Random().nextInt(list.length);
  list.removeAt(tmp_x);
  unittest_assertequals(list.length, 2, 'remove random list');
  list = ['Kirk', 'Spock', 'McCoy'];
  List tmp_list = true ? list : null;
  int tmp_x2 = new Math.Random().nextInt(tmp_list.length);
  tmp_list.removeAt(tmp_x2);
  unittest_assertequals(list.length, 2, 'remove random order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  list.removeAt(1);
  unittest_assertequals(list, ['Kirk', 'McCoy'], 'remove # list');
  list = ['Kirk', 'Spock', 'McCoy'];
  (true ? list : null).removeAt(((true ? 2 : null) - 1));
  unittest_assertequals(list, ['Kirk', 'McCoy'], 'remove # order list');
  list = ['Kirk', 'Spock', 'McCoy'];
  list.removeAt(list.length - 3);
  unittest_assertequals(list, ['Spock', 'McCoy'], 'remove #-end list');
  list = ['Kirk', 'Spock', 'McCoy'];
  // The order for index for #-end is addition because this will catch
  // errors in generators where most perform the operation ... - index.
  List tmp_list2 = true ? list : null;
  tmp_list2.removeAt(tmp_list2.length - (0 + 3));
  unittest_assertequals(list, ['Spock', 'McCoy'], 'remove #-end order list');
}

/// Tests the "set" block.
void test_set() {
  list = ['Picard', 'Riker', 'Crusher'];
  list[0] = 'Jean-Luc';
  unittest_assertequals(list, ['Jean-Luc', 'Riker', 'Crusher'], 'set first list');
  list = ['Picard', 'Riker', 'Crusher'];
  (true ? list : null)[0] = 'Jean-Luc';
  unittest_assertequals(list, ['Jean-Luc', 'Riker', 'Crusher'], 'set first order list');
  list = ['Picard', 'Riker', 'Crusher'];
  list[list.length - 1] = 'Beverly';
  unittest_assertequals(list, ['Picard', 'Riker', 'Beverly'], 'set last list');
  list = ['Picard', 'Riker', 'Crusher'];
  List tmp_list3 = (true ? list : null);
  tmp_list3[tmp_list3.length - 1] = 'Beverly';
  unittest_assertequals(list, ['Picard', 'Riker', 'Beverly'], 'set last order list');
  list = ['Picard', 'Riker', 'Crusher'];
  int tmp_x3 = new Math.Random().nextInt(list.length);
  list[tmp_x3] = 'Data';
  unittest_assertequals(list.length, 3, 'set random list');
  list = ['Picard', 'Riker', 'Crusher'];
  List tmp_list4 = (true ? list : null);
  int tmp_x4 = new Math.Random().nextInt(tmp_list4.length);
  tmp_list4[tmp_x4] = 'Data';
  unittest_assertequals(list.length, 3, 'set random order list');
  list = ['Picard', 'Riker', 'Crusher'];
  list[2] = 'Pulaski';
  unittest_assertequals(list, ['Picard', 'Riker', 'Pulaski'], 'set # list');
  list = ['Picard', 'Riker', 'Crusher'];
  (true ? list : null)[((true ? 3 : null) - 1)] = 'Pulaski';
  unittest_assertequals(list, ['Picard', 'Riker', 'Pulaski'], 'set # order list');
  list = ['Picard', 'Riker', 'Crusher'];
  list[list.length - 1] = 'Pulaski';
  unittest_assertequals(list, ['Picard', 'Riker', 'Pulaski'], 'set #-end list');
  list = ['Picard', 'Riker', 'Crusher'];
  // The order for index for #-end is addition because this will catch
  // errors in generators where most perform the operation ... - index.
  List tmp_list5 = (true ? list : null);
  tmp_list5[tmp_list5.length - (0 + 2)] = 'Pulaski';
  unittest_assertequals(list, ['Picard', 'Pulaski', 'Crusher'], 'set #-end order list');
}

/// Tests the "insert" block.
void test_insert() {
  list = ['Picard', 'Riker', 'Crusher'];
  list.insert(0, 'Data');
  unittest_assertequals(list, ['Data', 'Picard', 'Riker', 'Crusher'], 'insert first list');
  list = ['Picard', 'Riker', 'Crusher'];
  (true ? list : null).insert(0, 'Data');
  unittest_assertequals(list, ['Data', 'Picard', 'Riker', 'Crusher'], 'insert first order list');
  list = ['Picard', 'Riker', 'Crusher'];
  list.add('Data');
  unittest_assertequals(list, ['Picard', 'Riker', 'Crusher', 'Data'], 'insert last list');
  list = ['Picard', 'Riker', 'Crusher'];
  (true ? list : null).add('Data');
  unittest_assertequals(list, ['Picard', 'Riker', 'Crusher', 'Data'], 'insert last order list');
  list = ['Picard', 'Riker', 'Crusher'];
  int tmp_x5 = new Math.Random().nextInt(list.length);
  list.insert(tmp_x5, 'Data');
  unittest_assertequals(list.length, 4, 'insert random list');
  list = ['Picard', 'Riker', 'Crusher'];
  List tmp_list6 = (true ? list : null);
  int tmp_x6 = new Math.Random().nextInt(tmp_list6.length);
  tmp_list6.insert(tmp_x6, 'Data');
  unittest_assertequals(list.length, 4, 'insert random order list');
  list = ['Picard', 'Riker', 'Crusher'];
  list.insert(2, 'Data');
  unittest_assertequals(list, ['Picard', 'Riker', 'Data', 'Crusher'], 'insert # list');
  list = ['Picard', 'Riker', 'Crusher'];
  (true ? list : null).insert(((true ? 3 : null) - 1), 'Data');
  unittest_assertequals(list, ['Picard', 'Riker', 'Data', 'Crusher'], 'insert # order list');
  list = ['Picard', 'Riker', 'Crusher'];
  list.insert(list.length - 1, 'Data');
  unittest_assertequals(list, ['Picard', 'Riker', 'Data', 'Crusher'], 'insert #-end list');
  list = ['Picard', 'Riker', 'Crusher'];
  // The order for index for #-end is addition because this will catch
  // errors in generators where most perform the operation ... - index.
  List tmp_list7 = (true ? list : null);
  tmp_list7.insert(tmp_list7.length - (0 + 2), 'Data');
  unittest_assertequals(list, ['Picard', 'Data', 'Riker', 'Crusher'], 'insert #-end order list');
}

/// Tests the "get sub-list" block with a variable.
void test_sublist_simple() {
  list = ['Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour'];
  unittest_assertequals(list.sublist(1, 3), ['Challenger', 'Discovery'], 'sublist # simple');
  unittest_assertequals(list.sublist(((true ? 2 : null) - 1), true ? 3 : null), ['Challenger', 'Discovery'], 'sublist # simple order');
  unittest_assertequals(list.sublist(list.length - 3, list.length - 1), ['Discovery', 'Atlantis'], 'sublist #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  unittest_assertequals(list.sublist(list.length - (0 + 3), list.length - ((0 + 2) - 1)), ['Discovery', 'Atlantis'], 'sublist #-end simple order');
  unittest_assertequals(list.sublist(0), list, 'sublist first-last simple');
  changing_list = ['Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour'];
  list_copy = changing_list.sublist(0);
  int tmp_x7 = new Math.Random().nextInt(changing_list.length);
  changing_list.removeAt(tmp_x7);
  unittest_assertequals(list_copy, list, 'sublist first-last simple copy check');
  unittest_assertequals(list.sublist(1, list.length - 1), ['Challenger', 'Discovery', 'Atlantis'], 'sublist # #-end simple');
  unittest_assertequals(list.sublist(list.length - 3, 4), ['Discovery', 'Atlantis'], 'sublist #-end # simple');
  unittest_assertequals(list.sublist(0, 4), ['Columbia', 'Challenger', 'Discovery', 'Atlantis'], 'sublist first # simple');
  unittest_assertequals(list.sublist(0, list.length - 3), ['Columbia', 'Challenger'], 'sublist first #-end simple');
  unittest_assertequals(list.sublist(3), ['Atlantis', 'Endeavour'], 'sublist # last simple');
  unittest_assertequals(list.sublist(list.length - 4), ['Challenger', 'Discovery', 'Atlantis', 'Endeavour'], 'sublist #-end last simple');
  unittest_assertequals(list.sublist(0, list.length - 0), list, 'sublist all with # #-end simple');
  unittest_assertequals(list.sublist(list.length - 5, 5), list, 'sublist all with #-end # simple');
  // Checks that the whole list is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where sublist uses [x:length - y] for # #-end.
  unittest_assertequals(list.sublist(((0 + 1) - 1), list.length - ((0 + 1) - 1)), list, 'sublist all with # #-end math simple');
}

/// Creates a list for use with the sublist test.
dynamic get_space_shuttles() {
  number_of_calls = (number_of_calls is num ? number_of_calls : 0) + 1;
  return ['Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour'];
}

List lists_get_sublist(List list, String where1, num at1, String where2, num at2) {
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

/// Tests the "get sub-list" block with a function call.
void test_sublist_complex() {
  number_of_calls = 0;
  unittest_assertequals((get_space_shuttles()).sublist(1, 3), ['Challenger', 'Discovery'], 'sublist # start complex');
  check_number_of_calls('sublist # start complex');
  number_of_calls = 0;
  unittest_assertequals((true ? get_space_shuttles() : null).sublist(((true ? 2 : null) - 1), true ? 3 : null), ['Challenger', 'Discovery'], 'sublist # start order complex');
  check_number_of_calls('sublist # start order complex');
  number_of_calls = 0;
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  unittest_assertequals(lists_get_sublist((get_space_shuttles()), 'FROM_END', 2, 'FROM_END', 1), ['Discovery', 'Atlantis'], 'sublist # end complex');
  unittest_assertequals(number_of_calls, 1, 'sublist # end complex number of calls');
  number_of_calls = 0;
  unittest_assertequals(lists_get_sublist((true ? get_space_shuttles() : null), 'FROM_END', ((0 + 3) - 1), 'FROM_END', ((0 + 2) - 1)), ['Discovery', 'Atlantis'], 'sublist # end order complex');
  check_number_of_calls('sublist # end order complex');
  number_of_calls = 0;
  unittest_assertequals(lists_get_sublist((get_space_shuttles()), 'FIRST', 0, 'LAST', 0), list, 'sublist first-last complex');
  check_number_of_calls('sublist first-last complex');
  number_of_calls = 0;
  unittest_assertequals(lists_get_sublist((get_space_shuttles()), 'FROM_START', 1, 'FROM_END', 1), ['Challenger', 'Discovery', 'Atlantis'], 'sublist # #-end complex');
  check_number_of_calls('sublist # #-end complex');
  number_of_calls = 0;
  unittest_assertequals(lists_get_sublist((get_space_shuttles()), 'FROM_END', 2, 'FROM_START', 3), ['Discovery', 'Atlantis'], 'sublist #-end # complex');
  check_number_of_calls('sublist #-end # complex');
  number_of_calls = 0;
  unittest_assertequals((get_space_shuttles()).sublist(0, 4), ['Columbia', 'Challenger', 'Discovery', 'Atlantis'], 'sublist first # complex');
  check_number_of_calls('sublist first # complex');
  number_of_calls = 0;
  unittest_assertequals(lists_get_sublist((get_space_shuttles()), 'FIRST', 0, 'FROM_END', 3), ['Columbia', 'Challenger'], 'sublist first #-end complex');
  check_number_of_calls('sublist first #-end complex');
  number_of_calls = 0;
  unittest_assertequals(lists_get_sublist((get_space_shuttles()), 'FROM_START', 3, 'LAST', 0), ['Atlantis', 'Endeavour'], 'sublist # last complex');
  check_number_of_calls('sublist # last complex');
  number_of_calls = 0;
  unittest_assertequals(lists_get_sublist((get_space_shuttles()), 'FROM_END', 3, 'LAST', 0), ['Challenger', 'Discovery', 'Atlantis', 'Endeavour'], 'sublist #-end last simple');
  check_number_of_calls('sublist #-end last simple');
  number_of_calls = 0;
  unittest_assertequals(lists_get_sublist((get_space_shuttles()), 'FROM_START', 0, 'FROM_END', 0), list, 'sublist all with # #-end complex');
  check_number_of_calls('sublist all with # #-end complex');
  number_of_calls = 0;
  unittest_assertequals(lists_get_sublist((get_space_shuttles()), 'FROM_END', 4, 'FROM_START', 4), list, 'sublist all with #-end # complex');
  check_number_of_calls('sublist all with #-end # complex');
  number_of_calls = 0;
  // Checks that the whole list is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where sublist uses [x:length - y] for # #-end.
  unittest_assertequals(lists_get_sublist((get_space_shuttles()), 'FROM_START', ((0 + 1) - 1), 'FROM_END', ((0 + 1) - 1)), list, 'sublist all with # #-end math complex');
  check_number_of_calls('sublist all with # #-end math complex');
}

/// Tests the "join" block.
void test_join() {
  list = ['Vulcan', 'Klingon', 'Borg'];
  unittest_assertequals(list.join(','), 'Vulcan,Klingon,Borg', 'join');
  unittest_assertequals((true ? list : null).join(','), 'Vulcan,Klingon,Borg', 'join order');
}

/// Tests the "split" block.
void test_split() {
  text = 'Vulcan,Klingon,Borg';
  unittest_assertequals(text.split(','), ['Vulcan', 'Klingon', 'Borg'], 'split');
  unittest_assertequals((true ? text : null).split(','), ['Vulcan', 'Klingon', 'Borg'], 'split order');
}

List lists_sort(List list, String type, int direction) {
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

/// Tests the "alphabetic sort" block.
void test_sort_alphabetic() {
  list = ['Vulcan', 'klingon', 'Borg'];
  unittest_assertequals(lists_sort(list, "TEXT", 1), ['Borg', 'Vulcan', 'klingon'], 'sort alphabetic ascending');
  unittest_assertequals(lists_sort(true ? list : null, "TEXT", 1), ['Borg', 'Vulcan', 'klingon'], 'sort alphabetic ascending order');
}

/// Tests the "alphabetic sort ignore case" block.
void test_sort_ignoreCase() {
  list = ['Vulcan', 'klingon', 'Borg'];
  unittest_assertequals(lists_sort(list, "IGNORE_CASE", 1), ['Borg', 'klingon', 'Vulcan'], 'sort ignore case ascending');
  unittest_assertequals(lists_sort(true ? list : null, "IGNORE_CASE", 1), ['Borg', 'klingon', 'Vulcan'], 'sort ignore case ascending order');
}

/// Tests the "numeric sort" block.
void test_sort_numeric() {
  list = [8, 18, -1];
  unittest_assertequals(lists_sort(list, "NUMERIC", -1), [18, 8, -1], 'sort numeric descending');
  unittest_assertequals(lists_sort(true ? list : null, "NUMERIC", -1), [18, 8, -1], 'sort numeric descending order');
}

/// Tests the "list reverse" block.
void test_lists_reverse() {
  list = [8, 18, -1, 64];
  unittest_assertequals(new List.from(list.reversed), [64, -1, 18, 8], 'reverse a copy');
  unittest_assertequals(list, [8, 18, -1, 64], 'reverse a copy original');
  list = [];
  unittest_assertequals(new List.from(list.reversed), [], 'empty list');
}

/// Describe this function...
void test_procedure() {
  procedure_1(8, 2);
  unittest_assertequals(proc_z, 4, 'procedure with global');
  proc_w = false;
  procedure_2(false);
  unittest_assertequals(proc_w, true, 'procedure no return');
  proc_w = false;
  procedure_2(true);
  unittest_assertequals(proc_w, false, 'procedure return');
}

/// Describe this function...
void procedure_1(proc_x, proc_y) {
  proc_z = proc_x / proc_y;
}

/// Describe this function...
void procedure_2(proc_x) {
  if (proc_x) {
    return;
  }
  proc_w = true;
}

/// Describe this function...
void test_function() {
  unittest_assertequals(function_1(2, 3), -1, 'function with arguments');
  unittest_assertequals(func_z, 'side effect', 'function with side effect');
  func_a = 'unchanged';
  func_c = 'global';
  unittest_assertequals(function_2(2), '3global', 'function with global');
  unittest_assertequals(func_a, 'unchanged', 'function with scope');
  unittest_assertequals(function_3(true), true, 'function return');
  unittest_assertequals(function_3(false), false, 'function no return');
}

/// Describe this function...
dynamic function_1(func_x, func_y) {
  func_z = 'side effect';
  return func_x - func_y;
}

/// Describe this function...
dynamic function_2(func_a) {
  func_a = (func_a is num ? func_a : 0) + 1;
  return [func_a,func_c].join();
}

/// Describe this function...
dynamic function_3(func_a) {
  if (func_a) {
    return true;
  }
  return false;
}

/// Describe this function...
dynamic recurse(n) {
  if (n > 0) {
    text = [recurse(n - 1),n,recurse(n - 1)].join();
  } else {
    text = '-';
  }
  return text;
}


main() {
  unittestResults = [];
  print('\n====================\n\nRunning suite: Logic');
  unittest_assertequals(true, true, 'True');
  unittest_assertequals(false, false, 'False');
  unittest_assertequals(!false, true, 'Not true');
  unittest_assertequals(!true, false, 'Not false');
  test_if();
  test_ifelse();
  test_equalities();
  test_and();
  test_or();
  test_ternary();
  print(unittest_report());
  unittestResults = null;

  unittestResults = [];
  print('\n====================\n\nRunning suite: Loops 1');
  test_repeat();
  test_repeat_ext();
  test_while();
  test_foreach();
  print(unittest_report());
  unittestResults = null;

  unittestResults = [];
  print('\n====================\n\nRunning suite: Loops 2');
  test_count_loops();
  test_count_by();
  print(unittest_report());
  unittestResults = null;

  unittestResults = [];
  print('\n====================\n\nRunning suite: Loops 3');
  test_break();
  test_continue();
  print(unittest_report());
  unittestResults = null;

  unittestResults = [];
  print('\n====================\n\nRunning suite: Math');
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
  print(unittest_report());
  unittestResults = null;

  unittestResults = [];
  print('\n====================\n\nRunning suite: Text');
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
  print(unittest_report());
  unittestResults = null;

  unittestResults = [];
  print('\n====================\n\nRunning suite: Lists');
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
  print(unittest_report());
  unittestResults = null;

  unittestResults = [];
  print('\n====================\n\nRunning suite: Variables');
  item = 123;
  unittest_assertequals(item, 123, 'variable');
  if2 = 123;
  unittest_assertequals(if2, 123, 'reserved variable');
  print(unittest_report());
  unittestResults = null;

  // Intentionally non-connected variable.
  naked;

  unittestResults = [];
  print('\n====================\n\nRunning suite: Functions');
  test_procedure();
  test_function();
  unittest_assertequals(recurse(3), '-1-2-1-3-1-2-1-', 'test recurse');
  print(unittest_report());
  unittestResults = null;
}