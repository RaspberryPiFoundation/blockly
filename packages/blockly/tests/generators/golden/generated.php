function unittest_report() {
  global $unittestResults;
  // Create test report.
  $report = array();
  $summary = array();
  $fails = 0;
  for ($x = 0; $x < count($unittestResults); $x++) {
    if ($unittestResults[$x][0]) {
      array_push($summary, ".");
    } else {
      array_push($summary, "F");
      $fails++;
      array_push($report, "");
      array_push($report, "FAIL: " . $unittestResults[$x][2]);
      array_push($report, $unittestResults[$x][1]);
    }
  }
  array_unshift($report, implode("", $summary));
  array_push($report, "");
  array_push($report, "Number of tests run: " . count($unittestResults));
  array_push($report, "");
  if ($fails) {
    array_push($report, "FAILED (failures=" . $fails . ")");
  } else {
    array_push($report, "OK");
  }
  return implode("\n", $report);
}

function assertEquals($actual, $expected, $message) {
  global $unittestResults;
  // Asserts that a value equals another value.
  if (!is_array($unittestResults)) {
    throw new Exception("Orphaned assert: " . $message);
  }
  if ($actual == $expected) {
    array_push($unittestResults, [true, "OK", $message]);
  } else {
    $expected = is_array($expected) ? implode(" ", $expected) : $expected;
    $actual = is_array($actual) ? implode(" ", $actual) : $actual;
    array_push($unittestResults, [false, "Expected: " . $expected . "\nActual: " . $actual, $message]);
  }
}

function unittest_fail($message) {
  global $unittestResults;
  // Always assert an error.
  if (!$unittestResults) {
    throw new Exception("Orphaned assert fail: " . $message);
  }
  array_push($unittestResults, [false, "Fail.", $message]);
}

// Describe this function...
function test_if() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  if (false) {
    unittest_fail('if false');
  }
  $ok = false;
  if (true) {
    $ok = true;
  }
  assertEquals($ok, true, 'if true');
  $ok = false;
  if (false) {
    unittest_fail('if/else false');
  } else {
    $ok = true;
  }
  assertEquals($ok, true, 'if/else false');
  $ok = false;
  if (true) {
    $ok = true;
  } else {
    unittest_fail('if/else true');
  }
  assertEquals($ok, true, 'if/else true');
  $ok = false;
  if (false) {
    unittest_fail('elseif 1');
  } else if (true) {
    $ok = true;
  } else if (true) {
    unittest_fail('elseif 2');
  } else {
    unittest_fail('elseif 3');
  }
  assertEquals($ok, true, 'elseif 4');
}

// Describe this function...
function test_ifelse() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $ok = false;
  if (true) {
    $ok = true;
  } else {
    unittest_fail('ifelse true');
  }
  assertEquals($ok, true, 'ifelse true');
  $ok = false;
  if (false) {
    unittest_fail('ifelse false');
  } else {
    $ok = true;
  }
  assertEquals($ok, true, 'ifelse false');
}

// Describe this function...
function test_equalities() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
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
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(true && true, true, 'And true/true');
  assertEquals(false && true, false, 'And false/true');
  assertEquals(true && false, false, 'And true/false');
  assertEquals(false && false, false, 'And false/false');
}

// Describe this function...
function test_or() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(true || true, true, 'Or true/true');
  assertEquals(false || true, true, 'Or false/true');
  assertEquals(true || false, true, 'Or true/false');
  assertEquals(false || false, false, 'Or false/false');
}

// Describe this function...
function test_ternary() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(true ? 42 : 99, 42, 'if true');
  assertEquals(false ? 42 : 99, 99, 'if true');
}

// Describe this function...
function test_foreach() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $log = '';
  foreach (array('a', 'b', 'c') as $x) {
    $log .= $x;
  }
  assertEquals($log, 'abc', 'for loop');
}

// Describe this function...
function test_repeat() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $count = 0;
  for ($count2 = 0; $count2 < 10; $count2++) {
    $count += 1;
  }
  assertEquals($count, 10, 'repeat 10');
}

// Describe this function...
function test_while() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  while (false) {
    unittest_fail('while 0');
  }
  while (!true) {
    unittest_fail('until 0');
  }
  $count = 1;
  while ($count != 10) {
    $count += 1;
  }
  assertEquals($count, 10, 'while 10');
  $count = 1;
  while (!($count == 10)) {
    $count += 1;
  }
  assertEquals($count, 10, 'until 10');
}

// Describe this function...
function test_repeat_ext() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $count = 0;
  for ($count3 = 0; $count3 < 10; $count3++) {
    $count += 1;
  }
  assertEquals($count, 10, 'repeat 10');
}

// Describe this function...
function test_count_by() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $log = '';
  for ($x = 1; $x <= 8; $x += 2) {
    $log .= $x;
  }
  assertEquals($log, '1357', 'count up ints');
  $log = '';
  for ($x = 8; $x >= 1; $x -= 2) {
    $log .= $x;
  }
  assertEquals($log, '8642', 'count down ints');
  $loglist = array();
  for ($x = 1; $x <= 8; $x += 1.5) {
    array_push($loglist, $x);
  }
  assertEquals($loglist, array(1, 2.5, 4, 5.5, 7), 'count with floats');
  $loglist = array();
  $_x_start = 1 + 0;
  $_x_end = 8 + 0;
  $_x_inc = abs(1 - 2);
  if ($_x_start > $_x_end) {
    $_x_inc = -$_x_inc;
  }
  for ($x = $_x_start; $_x_inc >= 0 ? $x <= $_x_end : $x >= $_x_end; $x += $_x_inc) {
    array_push($loglist, $x);
  }
  assertEquals($loglist, array(1, 2, 3, 4, 5, 6, 7, 8), 'count up non-trivial ints');
  $loglist = array();
  $_x_start2 = 8 + 0;
  $_x_end2 = 1 + 0;
  $_x_inc2 = 2;
  if ($_x_start2 > $_x_end2) {
    $_x_inc2 = -$_x_inc2;
  }
  for ($x = $_x_start2; $_x_inc2 >= 0 ? $x <= $_x_end2 : $x >= $_x_end2; $x += $_x_inc2) {
    array_push($loglist, $x);
  }
  assertEquals($loglist, array(8, 6, 4, 2), 'count down non-trivial ints');
  $loglist = array();
  $_x_start3 = 5 + 0.5;
  $_x_end3 = 1 + 0;
  $_x_inc3 = abs(1 + 0);
  if ($_x_start3 > $_x_end3) {
    $_x_inc3 = -$_x_inc3;
  }
  for ($x = $_x_start3; $_x_inc3 >= 0 ? $x <= $_x_end3 : $x >= $_x_end3; $x += $_x_inc3) {
    array_push($loglist, $x);
  }
  assertEquals($loglist, array(5.5, 4.5, 3.5, 2.5, 1.5), 'count with floats');
}

// Describe this function...
function test_count_loops() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $log = '';
  for ($x = 1; $x <= 8; $x++) {
    $log .= $x;
  }
  assertEquals($log, '12345678', 'count up');
  $log = '';
  for ($x = 8; $x >= 1; $x--) {
    $log .= $x;
  }
  assertEquals($log, '87654321', 'count down');
  $loglist = array();
  $_x_start4 = 1 + 0;
  $_x_end4 = 4 + 0;
  $_x_inc4 = 1;
  if ($_x_start4 > $_x_end4) {
    $_x_inc4 = -$_x_inc4;
  }
  for ($x = $_x_start4; $_x_inc4 >= 0 ? $x <= $_x_end4 : $x >= $_x_end4; $x += $_x_inc4) {
    array_push($loglist, $x);
  }
  assertEquals($loglist, array(1, 2, 3, 4), 'count up non-trivial');
  $loglist = array();
  $_x_start5 = 3 + 1;
  $_x_end5 = 1 + 0;
  $_x_inc5 = 1;
  if ($_x_start5 > $_x_end5) {
    $_x_inc5 = -$_x_inc5;
  }
  for ($x = $_x_start5; $_x_inc5 >= 0 ? $x <= $_x_end5 : $x >= $_x_end5; $x += $_x_inc5) {
    array_push($loglist, $x);
  }
  assertEquals($loglist, array(4, 3, 2, 1), 'count down non-trivial');
}

// Describe this function...
function test_continue() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $log = '';
  $count = 0;
  while ($count != 8) {
    $count += 1;
    if ($count == 5) {
      continue;
    }
    $log .= $count;
  }
  assertEquals($log, '1234678', 'while continue');
  $log = '';
  $count = 0;
  while (!($count == 8)) {
    $count += 1;
    if ($count == 5) {
      continue;
    }
    $log .= $count;
  }
  assertEquals($log, '1234678', 'until continue');
  $log = '';
  for ($x = 1; $x <= 8; $x++) {
    if ($x == 5) {
      continue;
    }
    $log .= $x;
  }
  assertEquals($log, '1234678', 'count continue');
  $log = '';
  foreach (array('a', 'b', 'c', 'd') as $x) {
    if ($x == 'c') {
      continue;
    }
    $log .= $x;
  }
  assertEquals($log, 'abd', 'for continue');
}

// Describe this function...
function test_break() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $count = 1;
  while ($count != 10) {
    if ($count == 5) {
      break;
    }
    $count += 1;
  }
  assertEquals($count, 5, 'while break');
  $count = 1;
  while (!($count == 10)) {
    if ($count == 5) {
      break;
    }
    $count += 1;
  }
  assertEquals($count, 5, 'until break');
  $log = '';
  for ($x = 1; $x <= 8; $x++) {
    if ($x == 5) {
      break;
    }
    $log .= $x;
  }
  assertEquals($log, '1234', 'count break');
  $log = '';
  foreach (array('a', 'b', 'c', 'd') as $x) {
    if ($x == 'c') {
      break;
    }
    $log .= $x;
  }
  assertEquals($log, 'ab', 'for break');
}

// Tests the "single" block.
function test_single() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(sqrt(25), 5, 'sqrt');
  assertEquals(abs(-25), 25, 'abs');
  assertEquals(-(-25), 25, 'negate');
  assertEquals(log(1), 0, 'ln');
  assertEquals(log(100) / log(10), 2, 'log10');
  assertEquals(exp(2), 7.38905609893065, 'exp');
  assertEquals(pow(10,2), 100, 'power10');
}

// Tests the "arithmetic" block for all operations and checks
// parenthesis are properly generated for different orders.
function test_arithmetic() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(1 + 2, 3, 'add');
  assertEquals(1 - 2, -1, 'subtract');
  assertEquals(1 - (0 + 2), -1, 'subtract order with add');
  assertEquals(1 - (0 - 2), 3, 'subtract order with subtract');
  assertEquals(4 * 2.5, 10, 'multiply');
  assertEquals(4 * (0 + 2.5), 10, 'multiply order');
  assertEquals(8.2 / -5, -1.64, 'divide');
  assertEquals(8.2 / (0 + -5), -1.64, 'divide order');
  assertEquals(10 ** 4, 10000, 'power');
  assertEquals(10 ** (0 + 4), 10000, 'power order');
}

// Tests the "trig" block.
function test_trig() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(sin(90 / 180 * pi()), 1, 'sin');
  assertEquals(cos(180 / 180 * pi()), -1, 'cos');
  assertEquals(tan(0 / 180 * pi()), 0, 'tan');
  assertEquals(asin(-1) / pi() * 180, -90, 'asin');
  assertEquals(acos(1) / pi() * 180, 0, 'acos');
  assertEquals(atan(1) / pi() * 180, 45, 'atan');
}

// Tests the "constant" blocks.
function test_constant() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(floor(M_PI * 1000), 3141, 'const pi');
  assertEquals(floor(M_E * 1000), 2718, 'const e');
  assertEquals(floor(((1 + sqrt(5)) / 2) * 1000), 1618, 'const golden');
  assertEquals(floor(M_SQRT2 * 1000), 1414, 'const sqrt 2');
  assertEquals(floor(M_SQRT1_2 * 1000), 707, 'const sqrt 0.5');
  assertEquals(9999 < INF, true, 'const infinity');
}

function math_isPrime($n) {
  // https://en.wikipedia.org/wiki/Primality_test#Naive_methods
  if ($n == 2 || $n == 3) {
    return true;
  }
  // False if n is NaN, negative, is 1, or not whole.
  // And false if n is divisible by 2 or 3.
  if (!is_numeric($n) || $n <= 1 || $n % 1 != 0 || $n % 2 == 0 || $n % 3 == 0) {
    return false;
  }
  // Check all the numbers of form 6k +/- 1, up to sqrt(n).
  for ($x = 6; $x <= sqrt($n) + 1; $x += 6) {
    if ($n % ($x - 1) == 0 || $n % ($x + 1) == 0) {
      return false;
    }
  }
  return true;
}

// Tests the "number property" blocks.
function test_number_properties() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(42 % 2 == 0, true, 'even');
  assertEquals(42.1 % 2 == 1, false, 'odd');
  assertEquals(math_isPrime(5), true, 'prime 5');
  assertEquals(math_isPrime(5 + 2), true, 'prime 5 + 2 (extra parentheses)');
  assertEquals(math_isPrime(25), false, 'prime 25');
  assertEquals(math_isPrime(-31.1), false, 'prime negative');
  assertEquals(is_int(M_PI), false, 'whole');
  assertEquals(INF > 0, true, 'positive');
  assertEquals(5 + 2 > 0, true, '5 + 2 is positive (extra parentheses)');
  assertEquals(-42 < 0, true, 'negative');
  assertEquals(3 + 2 < 0, false, '3 + 2 is negative (extra parentheses)');
  assertEquals(42 % 2 == 0, true, 'divisible');
  assertEquals(!false, true, 'divisible by 0');
}

// Tests the "round" block.
function test_round() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(round(42.42), 42, 'round');
  assertEquals(ceil(-42.42), -42, 'round up');
  assertEquals(floor(42.42), 42, 'round down');
}

// Tests the "change" block.
function test_change() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $varToChange = 100;
  $varToChange += 42;
  assertEquals($varToChange, 142, 'change');
}

function math_mean($myList) {
  return array_sum($myList) / count($myList);
}

function math_median($arr) {
  sort($arr,SORT_NUMERIC);
  return (count($arr) % 2) ? $arr[floor(count($arr) / 2)] :
      ($arr[floor(count($arr) / 2)] + $arr[floor(count($arr) / 2) - 1]) / 2;
}

function math_modes($values) {
  if (empty($values)) return array();
  $counts = array_count_values($values);
  arsort($counts); // Sort counts in descending order
  $modes = array_keys($counts, current($counts), true);
  return $modes;
}

function math_standard_deviation($numbers) {
  $n = count($numbers);
  if (!$n) return null;
  $mean = array_sum($numbers) / count($numbers);
  foreach($numbers as $key => $num) $devs[$key] = pow($num - $mean, 2);
  return sqrt(array_sum($devs) / (count($devs) - 1));
}

function math_random_list($list) {
  $x = rand(0, count($list)-1);
  return $list[$x];
}

function indexOf($haystack, $needle) {
  for ($index = 0; $index < count($haystack); $index++) {
    if ($haystack[$index] == $needle) return $index + 1;
  }
  return  0;
}

// Tests the "list operation" blocks.
function test_operations_on_list() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(array_sum((array(3, 4, 5))), 12, 'sum');
  assertEquals(min((array(3, 4, 5))), 3, 'min');
  assertEquals(max((array(3, 4, 5))), 5, 'max');
  assertEquals(math_mean(array(3, 4, 5)), 4, 'average');
  assertEquals(math_median(array(3, 4, 5, 1)), 3.5, 'median');
  assertEquals(math_modes(array(3, 4, 3)), array(3), 'modes');
  assertEquals(math_modes(array(3, 4, 3, 1, 4)), array(3, 4), 'modes multiple');
  assertEquals(math_standard_deviation(array(3, 3, 3)), 0, 'standard dev');
  assertEquals(indexOf(array(3, 4, 5), math_random_list(array(3, 4, 5))) > 0, true, 'random');
}

// Tests the "mod" block.
function test_mod() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(42 % 5, 2, 'mod');
}

// Tests the "constrain" block.
function test_constraint() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(min(max(100, 0), 42), 42, 'constraint');
}

function math_random_int($a, $b) {
  if ($a > $b) {
    return rand($b, $a);
  }
  return rand($a, $b);
}

// Tests the "random integer" block.
function test_random_integer() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $rand = math_random_int(5, 10);
  assertEquals($rand >= 5 && $rand <= 10, true, 'randRange');
  assertEquals(is_int($rand), true, 'randInteger');
}

// Tests the "random fraction" block.
function test_random_fraction() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $rand = (float)rand()/(float)getrandmax();
  assertEquals($rand >= 0 && $rand <= 1, true, 'randFloat');
}

// Describe this function...
function test_atan2() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(atan2(5, -5) / pi() * 180, 135, 'atan2');
  assertEquals(atan2(-12, 0) / pi() * 180, -90, 'atan2');
}

// Checks that the number of calls is one in order
// to confirm that a function was only called once.
function check_number_of_calls($test_name) {
  global $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $test_name .= 'number of calls';
  assertEquals($number_of_calls, 1, $test_name);
}

// Tests the "create text with" block with varying number of inputs.
function test_create_text() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals('', '', 'no text');
  assertEquals('Hello', 'Hello', 'create single');
  assertEquals(-1, '-1', 'create single number');
  assertEquals('K' . 9, 'K9', 'create double text');
  assertEquals(4 . 2, '42', 'create double text numbers');
  assertEquals(implode('', array(1,2,3)), '123', 'create triple');
  assertEquals(implode('', array(1,true ? 0 : null,'M')), '10M', 'create order');
}

// Creates an empty string for use with the empty test.
function get_empty() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  return '';
}

// Tests the "is empty" block".
function test_empty_text() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(empty('Google'), false, 'not empty');
  assertEquals(empty(''), true, 'empty');
  assertEquals(empty(get_empty()), true, 'empty complex');
  assertEquals(empty(true ? '' : null), true, 'empty order');
}

function length($value) {
  if (is_string($value)) {
    return strlen($value);
  }
  return count($value);
}

// Tests the "length" block.
function test_text_length() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(length(''), 0, 'zero length');
  assertEquals(length('Google'), 6, 'non-zero length');
  assertEquals(length(true ? 'car' : null), 3, 'length order');
}

// Tests the "append text" block with different types of parameters.
function test_append() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $item = 'Miserable';
  $item .= 'Failure';
  assertEquals($item, 'MiserableFailure', 'append text');
  $item = 12;
  $item .= 34;
  assertEquals($item, '1234', 'append number');
  $item = 'Something ';
  $item .= true ? 'Positive' : null;
  assertEquals($item, 'Something Positive', 'append order');
}

function text_indexOf($text, $search) {
  $pos = strpos($text, $search);
  return $pos === false ?  0 : $pos + 1;
}

function text_lastIndexOf($text, $search) {
  $pos = strrpos($text, $search);
  return $pos === false ?  0 : $pos + 1;
}

// Tests the "find" block with a variable.
function test_find_text_simple() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $text = 'Banana';
  assertEquals(text_indexOf($text, 'an'), 2, 'find first simple');
  assertEquals(text_lastIndexOf($text, 'an'), 4, 'find last simple');
  assertEquals(text_indexOf($text, 'Peel'), 0, 'find none simple');
}

// Creates a string for use with the find test.
function get_fruit() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $number_of_calls += 1;
  return 'Banana';
}

// Tests the "find" block with a function call.
function test_find_text_complex() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $number_of_calls = 0;
  assertEquals(text_indexOf(get_fruit(), 'an'), 2, 'find first complex');
  check_number_of_calls('find first complex');
  $number_of_calls = 0;
  assertEquals(text_indexOf(true ? get_fruit() : null, 'an'), 2, 'find first order complex');
  check_number_of_calls('find first order complex');
  $number_of_calls = 0;
  assertEquals(text_lastIndexOf(get_fruit(), 'an'), 4, 'find last complex');
  check_number_of_calls('find last complex');
  $number_of_calls = 0;
  assertEquals(text_lastIndexOf(true ? get_fruit() : null, 'an'), 4, 'find last order complex');
  check_number_of_calls('find last order complex');
  $number_of_calls = 0;
  assertEquals(text_indexOf(get_fruit(), 'Peel'), 0, 'find none complex');
  check_number_of_calls('find none complex');
  $number_of_calls = 0;
  assertEquals(text_indexOf(true ? get_fruit() : null, 'Peel'), 0, 'find none order complex');
  check_number_of_calls('find none order complex');
}

function text_random_letter($text) {
  return $text[rand(0, strlen($text) - 1)];
}

// Tests the "get letter" block with a variable.
function test_get_text_simple() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $text = 'Blockly';
  assertEquals(substr($text, 0, 1), 'B', 'get first simple');
  assertEquals(substr($text, -1), 'y', 'get last simple');
  assertEquals(text_indexOf($text, text_random_letter($text)) > 0, true, 'get random simple');
  assertEquals(substr($text, 2, 1), 'o', 'get # simple');
  assertEquals(substr($text, ((true ? 3 : null) - 1), 1), 'o', 'get # order simple');
  assertEquals(substr($text, -3, 1), 'k', 'get #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(substr($text, (-(0 + 3)), 1), 'k', 'get #-end order simple');
}

// Creates a string for use with the get test.
function get_Blockly() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $number_of_calls += 1;
  return 'Blockly';
}

// Tests the "get letter" block with a function call.
function test_get_text_complex() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $text = 'Blockly';
  $number_of_calls = 0;
  assertEquals(substr(get_Blockly(), 0, 1), 'B', 'get first complex');
  check_number_of_calls('get first complex');
  $number_of_calls = 0;
  assertEquals(substr(true ? get_Blockly() : null, 0, 1), 'B', 'get first order complex');
  check_number_of_calls('get first order complex');
  $number_of_calls = 0;
  assertEquals(substr(get_Blockly(), -1), 'y', 'get last complex');
  check_number_of_calls('get last complex');
  $number_of_calls = 0;
  assertEquals(substr(true ? get_Blockly() : null, -1), 'y', 'get last order complex');
  check_number_of_calls('get last order complex');
  $number_of_calls = 0;
  assertEquals(text_indexOf($text, text_random_letter(get_Blockly())) > 0, true, 'get random complex');
  check_number_of_calls('get random complex');
  $number_of_calls = 0;
  assertEquals(text_indexOf($text, text_random_letter(true ? get_Blockly() : null)) > 0, true, 'get random order complex');
  check_number_of_calls('get random order complex');
  $number_of_calls = 0;
  assertEquals(substr(get_Blockly(), 2, 1), 'o', 'get # complex');
  check_number_of_calls('get # complex');
  $number_of_calls = 0;
  assertEquals(substr(true ? get_Blockly() : null, ((true ? 3 : null) - 1), 1), 'o', 'get # order complex');
  check_number_of_calls('get # order complex');
  $number_of_calls = 0;
  assertEquals(substr(get_Blockly(), -3, 1), 'k', 'get #-end complex');
  check_number_of_calls('get #-end complex');
  $number_of_calls = 0;
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(substr(true ? get_Blockly() : null, (-(0 + 3)), 1), 'k', 'get #-end order complex');
  check_number_of_calls('get #-end order complex');
}

// Creates a string for use with the substring test.
function get_numbers() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $number_of_calls += 1;
  return '123456789';
}

function text_get_substring($text, $where1, $at1, $where2, $at2) {
  if ($where1 == 'FROM_END') {
    $at1 = strlen($text) - 1 - $at1;
  } else if ($where1 == 'FIRST') {
    $at1 = 0;
  } else if ($where1 != 'FROM_START') {
    throw new Exception('Unhandled option (text_get_substring).');
  }
  $length = 0;
  if ($where2 == 'FROM_START') {
    $length = $at2 - $at1 + 1;
  } else if ($where2 == 'FROM_END') {
    $length = strlen($text) - $at1 - $at2;
  } else if ($where2 == 'LAST') {
    $length = strlen($text) - $at1;
  } else {
    throw new Exception('Unhandled option (text_get_substring).');
  }
  return substr($text, $at1, $length);
}

// Tests the "get substring" block with a variable.
function test_substring_simple() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $text = '123456789';
  assertEquals(text_get_substring($text, 'FROM_START', 1, 'FROM_START', 2), '23', 'substring # simple');
  assertEquals(text_get_substring($text, 'FROM_START', ((true ? 2 : null) - 1), 'FROM_START', ((true ? 3 : null) - 1)), '23', 'substring # simple order');
  assertEquals(text_get_substring($text, 'FROM_END', 2, 'FROM_END', 1), '78', 'substring #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(text_get_substring($text, 'FROM_END', ((0 + 3) - 1), 'FROM_END', ((0 + 2) - 1)), '78', 'substring #-end simple order');
  assertEquals($text, $text, 'substring first-last simple');
  assertEquals(text_get_substring($text, 'FROM_START', 1, 'FROM_END', 1), '2345678', 'substring # #-end simple');
  assertEquals(text_get_substring($text, 'FROM_END', 6, 'FROM_START', 3), '34', 'substring #-end # simple');
  assertEquals(text_get_substring($text, 'FIRST', 0, 'FROM_START', 3), '1234', 'substring first # simple');
  assertEquals(text_get_substring($text, 'FIRST', 0, 'FROM_END', 1), '12345678', 'substring first #-end simple');
  assertEquals(text_get_substring($text, 'FROM_START', 6, 'LAST', 0), '789', 'substring # last simple');
  assertEquals(text_get_substring($text, 'FROM_END', 2, 'LAST', 0), '789', 'substring #-end last simple');
  assertEquals(text_get_substring($text, 'FROM_START', 0, 'FROM_END', 0), '123456789', 'substring all with # #-end simple');
  assertEquals(text_get_substring($text, 'FROM_END', 8, 'FROM_START', 8), '123456789', 'substring all with #-end # simple');
  // Checks that the whole string is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where substring uses [x:length - y] for # #-end.
  assertEquals(text_get_substring($text, 'FROM_START', ((0 + 1) - 1), 'FROM_END', ((0 + 1) - 1)), '123456789', 'substring all with # #-end math simple');
}

// Tests the "get substring" block with a function call.
function test_substring_complex() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $number_of_calls = 0;
  assertEquals(text_get_substring(get_numbers(), 'FROM_START', 1, 'FROM_START', 2), '23', 'substring # complex');
  check_number_of_calls('substring # complex');
  $number_of_calls = 0;
  assertEquals(text_get_substring(true ? get_numbers() : null, 'FROM_START', ((true ? 2 : null) - 1), 'FROM_START', ((true ? 3 : null) - 1)), '23', 'substring # complex order');
  check_number_of_calls('substring # complex order');
  $number_of_calls = 0;
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(text_get_substring(get_numbers(), 'FROM_END', 2, 'FROM_END', 1), '78', 'substring #-end complex');
  check_number_of_calls('substring #-end complex');
  $number_of_calls = 0;
  assertEquals(text_get_substring(true ? get_numbers() : null, 'FROM_END', ((0 + 3) - 1), 'FROM_END', ((0 + 2) - 1)), '78', 'substring #-end order order');
  check_number_of_calls('substring #-end order order');
  $number_of_calls = 0;
  assertEquals(get_numbers(), $text, 'substring first-last');
  check_number_of_calls('substring first-last');
  $number_of_calls = 0;
  assertEquals(text_get_substring(get_numbers(), 'FROM_START', 1, 'FROM_END', 1), '2345678', 'substring # #-end complex');
  check_number_of_calls('substring # #-end complex');
  $number_of_calls = 0;
  assertEquals(text_get_substring(get_numbers(), 'FROM_END', 6, 'FROM_START', 3), '34', 'substring #-end # complex');
  check_number_of_calls('substring #-end # complex');
  $number_of_calls = 0;
  assertEquals(text_get_substring(get_numbers(), 'FIRST', 0, 'FROM_START', 3), '1234', 'substring first # complex');
  check_number_of_calls('substring first # complex');
  $number_of_calls = 0;
  assertEquals(text_get_substring(get_numbers(), 'FIRST', 0, 'FROM_END', 1), '12345678', 'substring first #-end complex');
  check_number_of_calls('substring first #-end complex');
  $number_of_calls = 0;
  assertEquals(text_get_substring(get_numbers(), 'FROM_START', 6, 'LAST', 0), '789', 'substring # last complex');
  check_number_of_calls('substring # last complex');
  $number_of_calls = 0;
  assertEquals(text_get_substring(get_numbers(), 'FROM_END', 2, 'LAST', 0), '789', 'substring #-end last complex');
  check_number_of_calls('substring #-end last complex');
  $number_of_calls = 0;
  assertEquals(text_get_substring(get_numbers(), 'FROM_START', 0, 'FROM_END', 0), '123456789', 'substring all with # #-end complex');
  check_number_of_calls('substring all with # #-end complex');
  $number_of_calls = 0;
  assertEquals(text_get_substring(get_numbers(), 'FROM_END', 8, 'FROM_START', 8), '123456789', 'substring all with #-end # complex');
  check_number_of_calls('substring all with #-end # complex');
  $number_of_calls = 0;
  // Checks that the whole string is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where substring uses [x:length - y] for # #-end.
  assertEquals(text_get_substring(get_numbers(), 'FROM_START', ((0 + 1) - 1), 'FROM_END', ((0 + 1) - 1)), '123456789', 'substring all with # #-end math complex');
  check_number_of_calls('substring all with # #-end math complex');
}

// Tests the "change casing" block.
function test_case() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $text = 'Hello World';
  assertEquals(strtoupper($text), 'HELLO WORLD', 'uppercase');
  assertEquals(strtoupper(true ? $text : null), 'HELLO WORLD', 'uppercase order');
  $text = 'Hello World';
  assertEquals(strtolower($text), 'hello world', 'lowercase');
  assertEquals(strtolower(true ? $text : null), 'hello world', 'lowercase order');
  $text = 'heLLo WorlD';
  assertEquals(ucwords(strtolower($text)), 'Hello World', 'titlecase');
  assertEquals(ucwords(strtolower(true ? $text : null)), 'Hello World', 'titlecase order');
}

// Tests the "trim" block.
function test_trim() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $text = '   abc def   ';
  assertEquals(trim($text), 'abc def', 'trim both');
  assertEquals(trim(true ? $text : null), 'abc def', 'trim both order');
  assertEquals(ltrim($text), 'abc def   ', 'trim left');
  assertEquals(ltrim(true ? $text : null), 'abc def   ', 'trim left order');
  assertEquals(rtrim($text), '   abc def', 'trim right');
  assertEquals(rtrim(true ? $text : null), '   abc def', 'trim right order');
}

// Tests the "trim" block.
function test_count_text() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $text = 'woolloomooloo';
  assertEquals(strlen('o') === 0 ? strlen($text) + 1 : substr_count($text, 'o'), 8, 'len 1');
  assertEquals(strlen('oo') === 0 ? strlen($text) + 1 : substr_count($text, 'oo'), 4, 'len 2');
  assertEquals(strlen('loo') === 0 ? strlen($text) + 1 : substr_count($text, 'loo'), 2, 'len 3');
  assertEquals(strlen('wool') === 0 ? strlen($text) + 1 : substr_count($text, 'wool'), 1, 'start');
  assertEquals(strlen('chicken') === 0 ? strlen($text) + 1 : substr_count($text, 'chicken'), 0, 'missing');
  assertEquals(strlen('') === 0 ? strlen($text) + 1 : substr_count($text, ''), 14, 'empty needle');
  assertEquals(strlen('chicken') === 0 ? strlen('') + 1 : substr_count('', 'chicken'), 0, 'empty source');
}

// Tests the "trim" block.
function test_text_reverse() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(strrev(''), '', 'empty string');
  assertEquals(strrev('a'), 'a', 'len 1');
  assertEquals(strrev('ab'), 'ba', 'len 2');
  assertEquals(strrev('woolloomooloo'), 'ooloomoolloow', 'longer');
}

// Tests the "trim" block.
function test_replace() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(str_replace('oo', '123', 'woolloomooloo'), 'w123ll123m123l123', 'replace all instances 1');
  assertEquals(str_replace('.oo', 'X', 'woolloomooloo'), 'woolloomooloo', 'literal string replacement');
  assertEquals(str_replace('abc', 'X', 'woolloomooloo'), 'woolloomooloo', 'not found');
  assertEquals(str_replace('o', '', 'woolloomooloo'), 'wllml', 'empty replacement 1');
  assertEquals(str_replace('aaaaa', '', 'aaaaa'), '', 'empty replacement 2');
  assertEquals(str_replace('a', '', 'aaaaa'), '', 'empty replacement 3');
  assertEquals(str_replace('a', 'chicken', ''), '', 'empty source');
}

// Checks that the number of calls is one in order
// to confirm that a function was only called once.
function check_number_of_calls2($test_name) {
  global $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $test_name .= 'number of calls';
  assertEquals($number_of_calls, 1, $test_name);
}

function lists_repeat($value, $count) {
  $array = array();
  for ($index = 0; $index < $count; $index++) {
    $array[] = $value;
  }
  return $array;
}

// Tests the "create list with" and "create empty list" blocks.
function test_create_lists() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(array(), array(), 'create empty');
  assertEquals(array(true, 'love'), array(true, 'love'), 'create items');
  assertEquals(lists_repeat('Eject', 3), array('Eject', 'Eject', 'Eject'), 'create repeated');
  assertEquals(lists_repeat('Eject', 0 + 3), array('Eject', 'Eject', 'Eject'), 'create repeated order');
}

// Creates an empty list for use with the empty test.
function get_empty_list() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  return array();
}

// Tests the "is empty" block.
function test_lists_empty() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(empty((array(0))), false, 'not empty');
  assertEquals(empty((array())), true, 'empty');
  assertEquals(empty((get_empty_list())), true, 'empty complex');
  assertEquals(empty((true ? array() : null)), true, 'empty order');
}

// Tests the "length" block.
function test_lists_length() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(length(array()), 0, 'zero length');
  assertEquals(length(array('cat')), 1, 'one length');
  assertEquals(length(array('cat', true, array())), 3, 'three length');
  assertEquals(length(true ? array('cat', true) : null), 2, 'two length order');
}

function lastIndexOf($haystack, $needle) {
  $last =  0;
  for ($index = 0; $index < count($haystack); $index++) {
    if ($haystack[$index] == $needle) $last = $index + 1;
  }
  return $last;
}

// Tests the "find" block with a variable.
function test_find_lists_simple() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $list2 = array('Alice', 'Eve', 'Bob', 'Eve');
  assertEquals(indexOf($list2, 'Eve'), 2, 'find first simple');
  assertEquals(lastIndexOf($list2, 'Eve'), 4, 'find last simple');
  assertEquals(indexOf($list2, 'Dave'), 0, 'find none simple');
}

// Creates a list for use with the find test.
function get_names() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $number_of_calls += 1;
  return array('Alice', 'Eve', 'Bob', 'Eve');
}

// Tests the "find" block with a function call.
function test_find_lists_complex() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $number_of_calls = 0;
  assertEquals(indexOf(get_names(), 'Eve'), 2, 'find first complex');
  check_number_of_calls('find first complex');
  $number_of_calls = 0;
  assertEquals(indexOf((true ? get_names() : null), 'Eve'), 2, 'find first order complex');
  check_number_of_calls('find first order complex');
  $number_of_calls = 0;
  assertEquals(lastIndexOf(get_names(), 'Eve'), 4, 'find last complex');
  check_number_of_calls('find last complex');
  $number_of_calls = 0;
  assertEquals(lastIndexOf((true ? get_names() : null), 'Eve'), 4, 'find last order complex');
  check_number_of_calls('find last order complex');
  $number_of_calls = 0;
  assertEquals(indexOf(get_names(), 'Dave'), 0, 'find none complex');
  check_number_of_calls('find none complex');
  $number_of_calls = 0;
  assertEquals(indexOf((true ? get_names() : null), 'Dave'), 0, 'find none order complex');
  check_number_of_calls('find none order complex');
}

function lists_get_random_item($list) {
  return $list[rand(0,count($list)-1)];
}

// Tests the "get" block with a variable.
function test_get_lists_simple() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $list2 = array('Kirk', 'Spock', 'McCoy');
  assertEquals($list2[0], 'Kirk', 'get first simple');
  assertEquals(end($list2), 'McCoy', 'get last simple');
  assertEquals(indexOf($list2, lists_get_random_item($list2)) > 0, true, 'get random simple');
  assertEquals($list2[1], 'Spock', 'get # simple');
  assertEquals($list2[((true ? 2 : null) - 1)], 'Spock', 'get # order simple');
  assertEquals(array_slice($list2, -3, 1)[0], 'Kirk', 'get #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(array_slice($list2, (-(0 + 3)), 1)[0], 'Kirk', 'get #-end order simple');
}

// Tests the "get" block with create list call.
function test_get_lists_create_list() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(array('Kirk', 'Spock', 'McCoy')[0], 'Kirk', 'get first create list');
  assertEquals(end(array('Kirk', 'Spock', 'McCoy')), 'McCoy', 'get last simple');
  assertEquals(indexOf(array('Kirk', 'Spock', 'McCoy'), lists_get_random_item(array('Kirk', 'Spock', 'McCoy'))) > 0, true, 'get random simple');
  assertEquals(array('Kirk', 'Spock', 'McCoy')[1], 'Spock', 'get # simple');
  assertEquals(array('Kirk', 'Spock', 'McCoy')[((true ? 2 : null) - 1)], 'Spock', 'get # order simple');
  assertEquals(array_slice(array('Kirk', 'Spock', 'McCoy'), -3, 1)[0], 'Kirk', 'get #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(array_slice(array('Kirk', 'Spock', 'McCoy'), (-(0 + 3)), 1)[0], 'Kirk', 'get #-end order simple');
}

// Creates a list for use with the get test.
function get_star_wars() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $number_of_calls += 1;
  return array('Kirk', 'Spock', 'McCoy');
}

// Tests the "get" block with a function call.
function test_get_lists_complex() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $list2 = array('Kirk', 'Spock', 'McCoy');
  $number_of_calls = 0;
  assertEquals(get_star_wars()[0], 'Kirk', 'get first complex');
  check_number_of_calls('get first complex');
  $number_of_calls = 0;
  assertEquals((true ? get_star_wars() : null)[0], 'Kirk', 'get first order complex');
  check_number_of_calls('get first order complex');
  $number_of_calls = 0;
  assertEquals(end(get_star_wars()), 'McCoy', 'get last complex');
  check_number_of_calls('get last complex');
  $number_of_calls = 0;
  assertEquals(end(true ? get_star_wars() : null), 'McCoy', 'get last order complex');
  check_number_of_calls('get last order complex');
  $number_of_calls = 0;
  assertEquals(indexOf($list2, lists_get_random_item(get_star_wars())) > 0, true, 'get random complex');
  check_number_of_calls('get random complex');
  $number_of_calls = 0;
  assertEquals(indexOf($list2, lists_get_random_item(true ? get_star_wars() : null)) > 0, true, 'get random order complex');
  check_number_of_calls('get random order complex');
  $number_of_calls = 0;
  assertEquals(get_star_wars()[1], 'Spock', 'get # complex');
  check_number_of_calls('get # complex');
  $number_of_calls = 0;
  assertEquals((true ? get_star_wars() : null)[((true ? 2 : null) - 1)], 'Spock', 'get # order complex');
  check_number_of_calls('get # order complex');
  $number_of_calls = 0;
  assertEquals(array_slice(get_star_wars(), -3, 1)[0], 'Kirk', 'get #-end complex');
  check_number_of_calls('get #-end complex');
  $number_of_calls = 0;
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(array_slice(true ? get_star_wars() : null, (-(0 + 3)), 1)[0], 'Kirk', 'get #-end order complex');
  check_number_of_calls('get #-end order complex');
}

function lists_get_remove_random_item(&$list) {
  $x = rand(0,count($list)-1);
  unset($list[$x]);
  return array_values($list);
}

// Tests the "get and remove" block.
function test_getRemove() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $list2 = array('Kirk', 'Spock', 'McCoy');
  assertEquals(array_shift($list2), 'Kirk', 'getremove first');
  assertEquals($list2, array('Spock', 'McCoy'), 'getremove first list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  assertEquals(array_shift(true ? $list2 : null), 'Kirk', 'getremove first order');
  assertEquals($list2, array('Spock', 'McCoy'), 'getremove first order list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  assertEquals(array_pop($list2), 'McCoy', 'getremove last');
  assertEquals($list2, array('Kirk', 'Spock'), 'getremove last list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  assertEquals(array_pop(true ? $list2 : null), 'McCoy', 'getremove last order');
  assertEquals($list2, array('Kirk', 'Spock'), 'getremove last order list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  assertEquals(indexOf($list2, lists_get_remove_random_item($list2)) == 0, true, 'getremove random');
  assertEquals(length($list2), 2, 'getremove random list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  assertEquals(indexOf($list2, lists_get_remove_random_item(true ? $list2 : null)) == 0, true, 'getremove random order');
  assertEquals(length($list2), 2, 'getremove random order list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  assertEquals(array_splice($list2, 1, 1)[0], 'Spock', 'getremove #');
  assertEquals($list2, array('Kirk', 'McCoy'), 'getremove # list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  assertEquals(array_splice(true ? $list2 : null, ((true ? 2 : null) - 1), 1)[0], 'Spock', 'getremove # order');
  assertEquals($list2, array('Kirk', 'McCoy'), 'getremove # order list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  assertEquals(array_splice($list2, count($list2) - 3, 1)[0], 'Kirk', 'getremove #-end');
  assertEquals($list2, array('Spock', 'McCoy'), 'getremove #-end list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(array_splice(true ? $list2 : null, count(true ? $list2 : null) - (0 + 3), 1)[0], 'Kirk', 'getremove #-end order');
  assertEquals($list2, array('Spock', 'McCoy'), 'getremove #-end order list');
}

function lists_remove_random_item(&$list) {
  unset($list[rand(0,count($list)-1)]);
}

// Tests the "remove" block.
function test_remove() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $list2 = array('Kirk', 'Spock', 'McCoy');
  array_shift($list2);
  assertEquals($list2, array('Spock', 'McCoy'), 'remove first list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  array_shift(true ? $list2 : null);
  assertEquals($list2, array('Spock', 'McCoy'), 'remove first order list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  array_pop($list2);
  assertEquals($list2, array('Kirk', 'Spock'), 'remove last list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  array_pop(true ? $list2 : null);
  assertEquals($list2, array('Kirk', 'Spock'), 'remove last order list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  lists_remove_random_item($list2);
  assertEquals(length($list2), 2, 'remove random list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  lists_remove_random_item(true ? $list2 : null);
  assertEquals(length($list2), 2, 'remove random order list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  array_splice($list2, 1, 1);
  assertEquals($list2, array('Kirk', 'McCoy'), 'remove # list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  array_splice(true ? $list2 : null, ((true ? 2 : null) - 1), 1);
  assertEquals($list2, array('Kirk', 'McCoy'), 'remove # order list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  array_splice($list2, count($list2) - 3, 1)[0];
  assertEquals($list2, array('Spock', 'McCoy'), 'remove #-end list');
  $list2 = array('Kirk', 'Spock', 'McCoy');
  // The order for index for #-end is addition because this will catch
  // errors in generators where most perform the operation ... - index.
  array_splice(true ? $list2 : null, count(true ? $list2 : null) - (0 + 3), 1)[0];
  assertEquals($list2, array('Spock', 'McCoy'), 'remove #-end order list');
}

function lists_set_last_item(&$list, $value) {
  $list[count($list) - 1] = $value;
}

function lists_set_from_end(&$list, $at, $value) {
  $list[count($list) - $at] = $value;
}

// Tests the "set" block.
function test_set() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $list2 = array('Picard', 'Riker', 'Crusher');
  $list2[0] = 'Jean-Luc';
  assertEquals($list2, array('Jean-Luc', 'Riker', 'Crusher'), 'set first list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  (true ? $list2 : null)[0] = 'Jean-Luc';
  assertEquals($list2, array('Jean-Luc', 'Riker', 'Crusher'), 'set first order list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  lists_set_last_item($list2, 'Beverly');
  assertEquals($list2, array('Picard', 'Riker', 'Beverly'), 'set last list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  lists_set_last_item(true ? $list2 : null, 'Beverly');
  assertEquals($list2, array('Picard', 'Riker', 'Beverly'), 'set last order list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  $tmp_x = rand(0, count($list2)-1);
  $list2[$tmp_x] = 'Data';
  assertEquals(length($list2), 3, 'set random list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  $tmp_list = &(true ? $list2 : null);
  $tmp_x2 = rand(0, count($tmp_list)-1);
  $tmp_list[$tmp_x2] = 'Data';
  assertEquals(length($list2), 3, 'set random order list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  $list2[2] = 'Pulaski';
  assertEquals($list2, array('Picard', 'Riker', 'Pulaski'), 'set # list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  (true ? $list2 : null)[((true ? 3 : null) - 1)] = 'Pulaski';
  assertEquals($list2, array('Picard', 'Riker', 'Pulaski'), 'set # order list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  lists_set_from_end($list2, 1, 'Pulaski');
  assertEquals($list2, array('Picard', 'Riker', 'Pulaski'), 'set #-end list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  // The order for index for #-end is addition because this will catch
  // errors in generators where most perform the operation ... - index.
  lists_set_from_end(true ? $list2 : null, 0 + 2, 'Pulaski');
  assertEquals($list2, array('Picard', 'Pulaski', 'Crusher'), 'set #-end order list');
}

function lists_insert_from_end(&$list, $at, $value) {
  return array_splice($list, count($list) - $at, 0, $value);
}

// Tests the "insert" block.
function test_insert() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $list2 = array('Picard', 'Riker', 'Crusher');
  array_unshift($list2, 'Data');
  assertEquals($list2, array('Data', 'Picard', 'Riker', 'Crusher'), 'insert first list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  array_unshift(true ? $list2 : null, 'Data');
  assertEquals($list2, array('Data', 'Picard', 'Riker', 'Crusher'), 'insert first order list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  array_push($list2, 'Data');
  assertEquals($list2, array('Picard', 'Riker', 'Crusher', 'Data'), 'insert last list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  array_push(true ? $list2 : null, 'Data');
  assertEquals($list2, array('Picard', 'Riker', 'Crusher', 'Data'), 'insert last order list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  $tmp_x3 = rand(0, count($list2)-1);
  array_splice($list2, $tmp_x3, 0, 'Data');
  assertEquals(length($list2), 4, 'insert random list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  $tmp_list2 = &(true ? $list2 : null);
  $tmp_x4 = rand(0, count($tmp_list2)-1);
  array_splice($tmp_list2, $tmp_x4, 0, 'Data');
  assertEquals(length($list2), 4, 'insert random order list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  array_splice($list2, 2, 0, 'Data');
  assertEquals($list2, array('Picard', 'Riker', 'Data', 'Crusher'), 'insert # list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  array_splice(true ? $list2 : null, ((true ? 3 : null) - 1), 0, 'Data');
  assertEquals($list2, array('Picard', 'Riker', 'Data', 'Crusher'), 'insert # order list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  lists_insert_from_end($list2, 1, 'Data');
  assertEquals($list2, array('Picard', 'Riker', 'Data', 'Crusher'), 'insert #-end list');
  $list2 = array('Picard', 'Riker', 'Crusher');
  // The order for index for #-end is addition because this will catch
  // errors in generators where most perform the operation ... - index.
  lists_insert_from_end(true ? $list2 : null, 0 + 2, 'Data');
  assertEquals($list2, array('Picard', 'Data', 'Riker', 'Crusher'), 'insert #-end order list');
}

// Tests the "get sub-list" block with a variable.
function test_sublist_simple() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $list2 = array('Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour');
  assertEquals(array_slice($list2, 1, 2 - 1 + 1), array('Challenger', 'Discovery'), 'sublist # simple');
  assertEquals(array_slice($list2, ((true ? 2 : null) - 1), ((true ? 3 : null) - 1) - ((true ? 2 : null) - 1) + 1), array('Challenger', 'Discovery'), 'sublist # simple order');
  assertEquals(array_slice($list2, count($list2) - 3, count($list2) - 1 - (count($list2) - 3)), array('Discovery', 'Atlantis'), 'sublist #-end simple');
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(array_slice($list2, count($list2) - (0 + 3), count($list2) - ((0 + 2) - 1) - (count($list2) - (0 + 3))), array('Discovery', 'Atlantis'), 'sublist #-end simple order');
  assertEquals($list2, $list2, 'sublist first-last simple');
  $changing_list = array('Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour');
  $list_copy = $changing_list;
  lists_remove_random_item($changing_list);
  assertEquals($list_copy, $list2, 'sublist first-last simple copy check');
  assertEquals(array_slice($list2, 1, count($list2) - 1 - 1), array('Challenger', 'Discovery', 'Atlantis'), 'sublist # #-end simple');
  assertEquals(array_slice($list2, count($list2) - 3, 3 - (count($list2) - 3) + 1), array('Discovery', 'Atlantis'), 'sublist #-end # simple');
  assertEquals(array_slice($list2, 0, 3 - 0 + 1), array('Columbia', 'Challenger', 'Discovery', 'Atlantis'), 'sublist first # simple');
  assertEquals(array_slice($list2, 0, count($list2) - 3 - 0), array('Columbia', 'Challenger'), 'sublist first #-end simple');
  assertEquals(array_slice($list2, 3, count($list2) - 3), array('Atlantis', 'Endeavour'), 'sublist # last simple');
  assertEquals(array_slice($list2, count($list2) - 4, count($list2) - (count($list2) - 4)), array('Challenger', 'Discovery', 'Atlantis', 'Endeavour'), 'sublist #-end last simple');
  assertEquals(array_slice($list2, 0, count($list2) - 0 - 0), $list2, 'sublist all with # #-end simple');
  assertEquals(array_slice($list2, count($list2) - 5, 4 - (count($list2) - 5) + 1), $list2, 'sublist all with #-end # simple');
  // Checks that the whole list is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where sublist uses [x:length - y] for # #-end.
  assertEquals(array_slice($list2, ((0 + 1) - 1), count($list2) - ((0 + 1) - 1) - ((0 + 1) - 1)), $list2, 'sublist all with # #-end math simple');
}

// Creates a list for use with the sublist test.
function get_space_shuttles() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $number_of_calls += 1;
  return array('Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour');
}

function lists_get_sublist($list, $where1, $at1, $where2, $at2) {
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
  return array_slice($list, $at1, $length);
}

// Tests the "get sub-list" block with a function call.
function test_sublist_complex() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $number_of_calls = 0;
  assertEquals(array_slice(get_space_shuttles(), 1, 2 - 1 + 1), array('Challenger', 'Discovery'), 'sublist # start complex');
  check_number_of_calls('sublist # start complex');
  $number_of_calls = 0;
  assertEquals(array_slice(true ? get_space_shuttles() : null, ((true ? 2 : null) - 1), ((true ? 3 : null) - 1) - ((true ? 2 : null) - 1) + 1), array('Challenger', 'Discovery'), 'sublist # start order complex');
  check_number_of_calls('sublist # start order complex');
  $number_of_calls = 0;
  // The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(lists_get_sublist(get_space_shuttles(), 'FROM_END', 2, 'FROM_END', 1), array('Discovery', 'Atlantis'), 'sublist # end complex');
  assertEquals($number_of_calls, 1, 'sublist # end complex number of calls');
  $number_of_calls = 0;
  assertEquals(lists_get_sublist(true ? get_space_shuttles() : null, 'FROM_END', ((0 + 3) - 1), 'FROM_END', ((0 + 2) - 1)), array('Discovery', 'Atlantis'), 'sublist # end order complex');
  check_number_of_calls('sublist # end order complex');
  $number_of_calls = 0;
  assertEquals(get_space_shuttles(), $list2, 'sublist first-last complex');
  check_number_of_calls('sublist first-last complex');
  $number_of_calls = 0;
  assertEquals(lists_get_sublist(get_space_shuttles(), 'FROM_START', 1, 'FROM_END', 1), array('Challenger', 'Discovery', 'Atlantis'), 'sublist # #-end complex');
  check_number_of_calls('sublist # #-end complex');
  $number_of_calls = 0;
  assertEquals(lists_get_sublist(get_space_shuttles(), 'FROM_END', 2, 'FROM_START', 3), array('Discovery', 'Atlantis'), 'sublist #-end # complex');
  check_number_of_calls('sublist #-end # complex');
  $number_of_calls = 0;
  assertEquals(array_slice(get_space_shuttles(), 0, 3 - 0 + 1), array('Columbia', 'Challenger', 'Discovery', 'Atlantis'), 'sublist first # complex');
  check_number_of_calls('sublist first # complex');
  $number_of_calls = 0;
  assertEquals(lists_get_sublist(get_space_shuttles(), 'FIRST', 0, 'FROM_END', 3), array('Columbia', 'Challenger'), 'sublist first #-end complex');
  check_number_of_calls('sublist first #-end complex');
  $number_of_calls = 0;
  assertEquals(lists_get_sublist(get_space_shuttles(), 'FROM_START', 3, 'LAST', 0), array('Atlantis', 'Endeavour'), 'sublist # last complex');
  check_number_of_calls('sublist # last complex');
  $number_of_calls = 0;
  assertEquals(lists_get_sublist(get_space_shuttles(), 'FROM_END', 3, 'LAST', 0), array('Challenger', 'Discovery', 'Atlantis', 'Endeavour'), 'sublist #-end last simple');
  check_number_of_calls('sublist #-end last simple');
  $number_of_calls = 0;
  assertEquals(lists_get_sublist(get_space_shuttles(), 'FROM_START', 0, 'FROM_END', 0), $list2, 'sublist all with # #-end complex');
  check_number_of_calls('sublist all with # #-end complex');
  $number_of_calls = 0;
  assertEquals(lists_get_sublist(get_space_shuttles(), 'FROM_END', 4, 'FROM_START', 4), $list2, 'sublist all with #-end # complex');
  check_number_of_calls('sublist all with #-end # complex');
  $number_of_calls = 0;
  // Checks that the whole list is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where sublist uses [x:length - y] for # #-end.
  assertEquals(lists_get_sublist(get_space_shuttles(), 'FROM_START', ((0 + 1) - 1), 'FROM_END', ((0 + 1) - 1)), $list2, 'sublist all with # #-end math complex');
  check_number_of_calls('sublist all with # #-end math complex');
}

// Tests the "join" block.
function test_join() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $list2 = array('Vulcan', 'Klingon', 'Borg');
  assertEquals(implode(',', $list2), 'Vulcan,Klingon,Borg', 'join');
  assertEquals(implode(',', true ? $list2 : null), 'Vulcan,Klingon,Borg', 'join order');
}

// Tests the "split" block.
function test_split() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $text = 'Vulcan,Klingon,Borg';
  assertEquals(explode(',', $text), array('Vulcan', 'Klingon', 'Borg'), 'split');
  assertEquals(explode(',', true ? $text : null), array('Vulcan', 'Klingon', 'Borg'), 'split order');
}

function lists_sort($list, $type, $direction) {
  $sortCmpFuncs = array(
    'NUMERIC' => 'strnatcasecmp',
    'TEXT' => 'strcmp',
    'IGNORE_CASE' => 'strcasecmp'
  );
  $sortCmp = $sortCmpFuncs[$type];
  $list2 = $list;
  usort($list2, $sortCmp);
  if ($direction == -1) {
    $list2 = array_reverse($list2);
  }
  return $list2;
}

// Tests the "alphabetic sort" block.
function test_sort_alphabetic() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $list2 = array('Vulcan', 'klingon', 'Borg');
  assertEquals(lists_sort($list2, "TEXT", 1), array('Borg', 'Vulcan', 'klingon'), 'sort alphabetic ascending');
  assertEquals(lists_sort(true ? $list2 : null, "TEXT", 1), array('Borg', 'Vulcan', 'klingon'), 'sort alphabetic ascending order');
}

// Tests the "alphabetic sort ignore case" block.
function test_sort_ignoreCase() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $list2 = array('Vulcan', 'klingon', 'Borg');
  assertEquals(lists_sort($list2, "IGNORE_CASE", 1), array('Borg', 'klingon', 'Vulcan'), 'sort ignore case ascending');
  assertEquals(lists_sort(true ? $list2 : null, "IGNORE_CASE", 1), array('Borg', 'klingon', 'Vulcan'), 'sort ignore case ascending order');
}

// Tests the "numeric sort" block.
function test_sort_numeric() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $list2 = array(8, 18, -1);
  assertEquals(lists_sort($list2, "NUMERIC", -1), array(18, 8, -1), 'sort numeric descending');
  assertEquals(lists_sort(true ? $list2 : null, "NUMERIC", -1), array(18, 8, -1), 'sort numeric descending order');
}

// Tests the "list reverse" block.
function test_lists_reverse() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $list2 = array(8, 18, -1, 64);
  assertEquals(array_reverse($list2), array(64, -1, 18, 8), 'reverse a copy');
  assertEquals($list2, array(8, 18, -1, 64), 'reverse a copy original');
  $list2 = array();
  assertEquals(array_reverse($list2), array(), 'empty list');
}

// Describe this function...
function test_procedure() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  procedure_1(8, 2);
  assertEquals($proc_z, 4, 'procedure with global');
  $proc_w = false;
  procedure_2(false);
  assertEquals($proc_w, true, 'procedure no return');
  $proc_w = false;
  procedure_2(true);
  assertEquals($proc_w, false, 'procedure return');
}

// Describe this function...
function procedure_1($proc_x, $proc_y) {
  global $test_name, $naked, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $proc_z = $proc_x / $proc_y;
}

// Describe this function...
function procedure_2($proc_x) {
  global $test_name, $naked, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  if ($proc_x) {
    return;
  }
  $proc_w = true;
}

// Describe this function...
function test_function() {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  assertEquals(function_1(2, 3), -1, 'function with arguments');
  assertEquals($func_z, 'side effect', 'function with side effect');
  $func_a = 'unchanged';
  $func_c = 'global';
  assertEquals(function_2(2), '3global', 'function with global');
  assertEquals($func_a, 'unchanged', 'function with scope');
  assertEquals(function_3(true), true, 'function return');
  assertEquals(function_3(false), false, 'function no return');
}

// Describe this function...
function function_1($func_x, $func_y) {
  global $test_name, $naked, $proc_x, $proc_y, $func_a, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $func_z = 'side effect';
  return $func_x - $func_y;
}

// Describe this function...
function function_2($func_a) {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  $func_a += 1;
  return $func_a . $func_c;
}

// Describe this function...
function function_3($func_a) {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $n, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  if ($func_a) {
    return true;
  }
  return false;
}

// Describe this function...
function recurse($n) {
  global $test_name, $naked, $proc_x, $proc_y, $func_x, $func_y, $func_a, $ok, $log, $count, $varToChange, $rand, $item, $text, $number_of_calls, $list2, $proc_z, $func_z, $x, $proc_w, $func_c, $if2, $loglist, $changing_list, $list_copy, $unittestResults;
  if ($n > 0) {
    $text = implode('', array(recurse($n - 1),$n,recurse($n - 1)));
  } else {
    $text = '-';
  }
  return $text;
}


$unittestResults = array();
print("\n====================\n\nRunning suite: Logic\n");
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
print(unittest_report());
$unittestResults = null;

$unittestResults = array();
print("\n====================\n\nRunning suite: Loops 1\n");
test_repeat();
test_repeat_ext();
test_while();
test_foreach();
print(unittest_report());
$unittestResults = null;

$unittestResults = array();
print("\n====================\n\nRunning suite: Loops 2\n");
test_count_loops();
test_count_by();
print(unittest_report());
$unittestResults = null;

$unittestResults = array();
print("\n====================\n\nRunning suite: Loops 3\n");
test_break();
test_continue();
print(unittest_report());
$unittestResults = null;

$unittestResults = array();
print("\n====================\n\nRunning suite: Math\n");
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
$unittestResults = null;

$unittestResults = array();
print("\n====================\n\nRunning suite: Text\n");
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
$unittestResults = null;

$unittestResults = array();
print("\n====================\n\nRunning suite: Lists\n");
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
$unittestResults = null;

$unittestResults = array();
print("\n====================\n\nRunning suite: Variables\n");
$item = 123;
assertEquals($item, 123, 'variable');
$if2 = 123;
assertEquals($if2, 123, 'reserved variable');
print(unittest_report());
$unittestResults = null;

// Intentionally non-connected variable.
$naked;

$unittestResults = array();
print("\n====================\n\nRunning suite: Functions\n");
test_procedure();
test_function();
assertEquals(recurse(3), '-1-2-1-3-1-2-1-', 'test recurse');
print(unittest_report());
$unittestResults = null;
