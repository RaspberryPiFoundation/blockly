from numbers import Number
import math
import random
import sys

unittestResults = None
test_name = None
naked = None
proc_x = None
proc_y = None
func_x = None
func_y = None
func_a = None
n = None
ok = None
log = None
count = None
varToChange = None
rand = None
item = None
text = None
number_of_calls = None
list2 = None
proc_z = None
func_z = None
x = None
proc_w = None
func_c = None
if2 = None
loglist = None
changing_list = None
list_copy = None

def unittest_report():
  # Create test report.
  report = []
  summary = []
  fails = 0
  for (success, log, message) in unittestResults:
    if success:
      summary.append(".")
    else:
      summary.append("F")
      fails += 1
      report.append("")
      report.append("FAIL: " + message)
      report.append(log)
  report.insert(0, "".join(summary))
  report.append("")
  report.append("Number of tests run: %d" % len(unittestResults))
  report.append("")
  if fails:
    report.append("FAILED (failures=%d)" % fails)
  else:
    report.append("OK")
  return "\n".join(report)

def assertEquals(actual, expected, message):
  # Asserts that a value equals another value.
  if unittestResults == None:
    raise Exception("Orphaned assert equals: " + message)
  if actual == expected:
    unittestResults.append((True, "OK", message))
  else:
    unittestResults.append((False, "Expected: %s\nActual: %s" % (expected, actual), message))

def fail(message):
  # Always assert an error.
  if unittestResults == None:
    raise Exception("Orphaned assert equals: " + message)
  unittestResults.append((False, "Fail.", message))

# Describe this function...
def test_if():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  if False:
    fail('if false')
  ok = False
  if True:
    ok = True
  assertEquals(ok, True, 'if true')
  ok = False
  if False:
    fail('if/else false')
  else:
    ok = True
  assertEquals(ok, True, 'if/else false')
  ok = False
  if True:
    ok = True
  else:
    fail('if/else true')
  assertEquals(ok, True, 'if/else true')
  ok = False
  if False:
    fail('elseif 1')
  elif True:
    ok = True
  elif True:
    fail('elseif 2')
  else:
    fail('elseif 3')
  assertEquals(ok, True, 'elseif 4')

# Describe this function...
def test_ifelse():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  ok = False
  if True:
    ok = True
  else:
    fail('ifelse true')
  assertEquals(ok, True, 'ifelse true')
  ok = False
  if False:
    fail('ifelse false')
  else:
    ok = True
  assertEquals(ok, True, 'ifelse false')

# Describe this function...
def test_equalities():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(2 == 2, True, 'Equal yes')
  assertEquals(3 == 4, False, 'Equal no')
  assertEquals(5 != 6, True, 'Not equal yes')
  assertEquals(3 == 4, False, 'Not equal no')
  assertEquals(5 < 6, True, 'Smaller yes')
  assertEquals(7 < 7, False, 'Smaller no')
  assertEquals(9 > 8, True, 'Greater yes')
  assertEquals(10 > 10, False, 'Greater no')
  assertEquals(11 <= 11, True, 'Smaller-equal yes')
  assertEquals(13 <= 12, False, 'Smaller-equal no')
  assertEquals(14 >= 14, True, 'Greater-equal yes')
  assertEquals(15 >= 16, False, 'Greater-equal no')

# Describe this function...
def test_and():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(True and True, True, 'And true/true')
  assertEquals(False and True, False, 'And false/true')
  assertEquals(True and False, False, 'And true/false')
  assertEquals(False and False, False, 'And false/false')

# Describe this function...
def test_or():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(True or True, True, 'Or true/true')
  assertEquals(False or True, True, 'Or false/true')
  assertEquals(True or False, True, 'Or true/false')
  assertEquals(False or False, False, 'Or false/false')

# Describe this function...
def test_ternary():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(42 if True else 99, 42, 'if true')
  assertEquals(42 if False else 99, 99, 'if true')

# Describe this function...
def test_foreach():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  log = ''
  for x in ['a', 'b', 'c']:
    log = str(log) + str(x)
  assertEquals(log, 'abc', 'for loop')

# Describe this function...
def test_repeat():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  count = 0
  for count2 in range(10):
    count = (count if isinstance(count, Number) else 0) + 1
  assertEquals(count, 10, 'repeat 10')

# Describe this function...
def test_while():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  while False:
    fail('while 0')
  while not True:
    fail('until 0')
  count = 1
  while count != 10:
    count = (count if isinstance(count, Number) else 0) + 1
  assertEquals(count, 10, 'while 10')
  count = 1
  while not count == 10:
    count = (count if isinstance(count, Number) else 0) + 1
  assertEquals(count, 10, 'until 10')

# Describe this function...
def test_repeat_ext():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  count = 0
  for count3 in range(10):
    count = (count if isinstance(count, Number) else 0) + 1
  assertEquals(count, 10, 'repeat 10')

def upRange(start, stop, step):
  while start <= stop:
    yield start
    start += abs(step)

def downRange(start, stop, step):
  while start >= stop:
    yield start
    start -= abs(step)

# Describe this function...
def test_count_by():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  log = ''
  for x in range(1, 9, 2):
    log = str(log) + str(x)
  assertEquals(log, '1357', 'count up ints')
  log = ''
  for x in range(8, 0, -2):
    log = str(log) + str(x)
  assertEquals(log, '8642', 'count down ints')
  loglist = []
  for x in upRange(1, 8, 1.5):
    loglist.append(x)
  assertEquals(loglist, [1, 2.5, 4, 5.5, 7], 'count with floats')
  loglist = []
  x_start = 1 + 0
  x_end = 8 + 0
  x_inc = 1 - 2
  for x in (x_start <= x_end) and upRange(x_start, x_end, x_inc) or downRange(x_start, x_end, x_inc):
    loglist.append(x)
  assertEquals(loglist, [1, 2, 3, 4, 5, 6, 7, 8], 'count up non-trivial ints')
  loglist = []
  x_start2 = 8 + 0
  x_end2 = 1 + 0
  for x in (x_start2 <= x_end2) and upRange(x_start2, x_end2, 2) or downRange(x_start2, x_end2, 2):
    loglist.append(x)
  assertEquals(loglist, [8, 6, 4, 2], 'count down non-trivial ints')
  loglist = []
  x_start3 = 5 + 0.5
  x_end3 = 1 + 0
  x_inc2 = 1 + 0
  for x in (x_start3 <= x_end3) and upRange(x_start3, x_end3, x_inc2) or downRange(x_start3, x_end3, x_inc2):
    loglist.append(x)
  assertEquals(loglist, [5.5, 4.5, 3.5, 2.5, 1.5], 'count with floats')

# Describe this function...
def test_count_loops():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  log = ''
  for x in range(1, 9):
    log = str(log) + str(x)
  assertEquals(log, '12345678', 'count up')
  log = ''
  for x in range(8, 0, -1):
    log = str(log) + str(x)
  assertEquals(log, '87654321', 'count down')
  loglist = []
  x_start4 = 1 + 0
  x_end4 = 4 + 0
  for x in (x_start4 <= x_end4) and upRange(x_start4, x_end4, 1) or downRange(x_start4, x_end4, 1):
    loglist.append(x)
  assertEquals(loglist, [1, 2, 3, 4], 'count up non-trivial')
  loglist = []
  x_start5 = 3 + 1
  x_end5 = 1 + 0
  for x in (x_start5 <= x_end5) and upRange(x_start5, x_end5, 1) or downRange(x_start5, x_end5, 1):
    loglist.append(x)
  assertEquals(loglist, [4, 3, 2, 1], 'count down non-trivial')

# Describe this function...
def test_continue():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  log = ''
  count = 0
  while count != 8:
    count = (count if isinstance(count, Number) else 0) + 1
    if count == 5:
      continue
    log = str(log) + str(count)
  assertEquals(log, '1234678', 'while continue')
  log = ''
  count = 0
  while not count == 8:
    count = (count if isinstance(count, Number) else 0) + 1
    if count == 5:
      continue
    log = str(log) + str(count)
  assertEquals(log, '1234678', 'until continue')
  log = ''
  for x in range(1, 9):
    if x == 5:
      continue
    log = str(log) + str(x)
  assertEquals(log, '1234678', 'count continue')
  log = ''
  for x in ['a', 'b', 'c', 'd']:
    if x == 'c':
      continue
    log = str(log) + str(x)
  assertEquals(log, 'abd', 'for continue')

# Describe this function...
def test_break():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  count = 1
  while count != 10:
    if count == 5:
      break
    count = (count if isinstance(count, Number) else 0) + 1
  assertEquals(count, 5, 'while break')
  count = 1
  while not count == 10:
    if count == 5:
      break
    count = (count if isinstance(count, Number) else 0) + 1
  assertEquals(count, 5, 'until break')
  log = ''
  for x in range(1, 9):
    if x == 5:
      break
    log = str(log) + str(x)
  assertEquals(log, '1234', 'count break')
  log = ''
  for x in ['a', 'b', 'c', 'd']:
    if x == 'c':
      break
    log = str(log) + str(x)
  assertEquals(log, 'ab', 'for break')

# Tests the "single" block.
def test_single():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(math.sqrt(25), 5, 'sqrt')
  assertEquals(math.fabs(-25), 25, 'abs')
  assertEquals(-(-25), 25, 'negate')
  assertEquals(math.log(1), 0, 'ln')
  assertEquals(math.log10(100), 2, 'log10')
  assertEquals(math.exp(2), 7.38905609893065, 'exp')
  assertEquals(math.pow(10,2), 100, 'power10')

# Tests the "arithmetic" block for all operations and checks
# parenthesis are properly generated for different orders.
def test_arithmetic():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(1 + 2, 3, 'add')
  assertEquals(1 - 2, -1, 'subtract')
  assertEquals(1 - (0 + 2), -1, 'subtract order with add')
  assertEquals(1 - (0 - 2), 3, 'subtract order with subtract')
  assertEquals(4 * 2.5, 10, 'multiply')
  assertEquals(4 * (0 + 2.5), 10, 'multiply order')
  assertEquals(8.2 / -5, -1.64, 'divide')
  assertEquals(8.2 / (0 + -5), -1.64, 'divide order')
  assertEquals(10 ** 4, 10000, 'power')
  assertEquals(10 ** (0 + 4), 10000, 'power order')

# Tests the "trig" block.
def test_trig():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(math.sin(90 / 180.0 * math.pi), 1, 'sin')
  assertEquals(math.cos(180 / 180.0 * math.pi), -1, 'cos')
  assertEquals(math.tan(0 / 180.0 * math.pi), 0, 'tan')
  assertEquals(math.asin(-1) / math.pi * 180, -90, 'asin')
  assertEquals(math.acos(1) / math.pi * 180, 0, 'acos')
  assertEquals(math.atan(1) / math.pi * 180, 45, 'atan')

# Tests the "constant" blocks.
def test_constant():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(math.floor(math.pi * 1000), 3141, 'const pi')
  assertEquals(math.floor(math.e * 1000), 2718, 'const e')
  assertEquals(math.floor(((1 + math.sqrt(5)) / 2) * 1000), 1618, 'const golden')
  assertEquals(math.floor(math.sqrt(2) * 1000), 1414, 'const sqrt 2')
  assertEquals(math.floor(math.sqrt(1.0 / 2) * 1000), 707, 'const sqrt 0.5')
  assertEquals(9999 < float('inf'), True, 'const infinity')

def math_isPrime(n):
  # https://en.wikipedia.org/wiki/Primality_test#Naive_methods
  # If n is not a number but a string, try parsing it.
  if not isinstance(n, Number):
    try:
      n = float(n)
    except:
      return False
  if n == 2 or n == 3:
    return True
  # False if n is negative, is 1, or not whole, or if n is divisible by 2 or 3.
  if n <= 1 or n % 1 != 0 or n % 2 == 0 or n % 3 == 0:
    return False
  # Check all the numbers of form 6k +/- 1, up to sqrt(n).
  for x in range(6, int(math.sqrt(n)) + 2, 6):
    if n % (x - 1) == 0 or n % (x + 1) == 0:
      return False
  return True

# Tests the "number property" blocks.
def test_number_properties():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(42 % 2 == 0, True, 'even')
  assertEquals(42.1 % 2 == 1, False, 'odd')
  assertEquals(math_isPrime(5), True, 'prime 5')
  assertEquals(math_isPrime(5 + 2), True, 'prime 5 + 2 (extra parentheses)')
  assertEquals(math_isPrime(25), False, 'prime 25')
  assertEquals(math_isPrime(-31.1), False, 'prime negative')
  assertEquals(math.pi % 1 == 0, False, 'whole')
  assertEquals(float('inf') > 0, True, 'positive')
  assertEquals(5 + 2 > 0, True, '5 + 2 is positive (extra parentheses)')
  assertEquals(-42 < 0, True, 'negative')
  assertEquals(3 + 2 < 0, False, '3 + 2 is negative (extra parentheses)')
  assertEquals(42 % 2 == 0, True, 'divisible')
  assertEquals(not False, True, 'divisible by 0')

# Tests the "round" block.
def test_round():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(round(42.42), 42, 'round')
  assertEquals(math.ceil(-42.42), -42, 'round up')
  assertEquals(math.floor(42.42), 42, 'round down')

# Tests the "change" block.
def test_change():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  varToChange = 100
  varToChange = (varToChange if isinstance(varToChange, Number) else 0) + 42
  assertEquals(varToChange, 142, 'change')

def math_mean(myList):
  localList = [e for e in myList if isinstance(e, Number)]
  if not localList: return
  return float(sum(localList)) / len(localList)

def math_median(myList):
  localList = sorted([e for e in myList if isinstance(e, Number)])
  if not localList: return
  if len(localList) % 2 == 0:
    return (localList[len(localList) // 2 - 1] + localList[len(localList) // 2]) / 2.0
  else:
    return localList[(len(localList) - 1) // 2]

def math_modes(some_list):
  modes = []
  # Using a lists of [item, count] to keep count rather than dict
  # to avoid "unhashable" errors when the counted item is itself a list or dict.
  counts = []
  maxCount = 1
  for item in some_list:
    found = False
    for count in counts:
      if count[0] == item:
        count[1] += 1
        maxCount = max(maxCount, count[1])
        found = True
    if not found:
      counts.append([item, 1])
  for counted_item, item_count in counts:
    if item_count == maxCount:
      modes.append(counted_item)
  return modes

def math_standard_deviation(numbers):
  n = len(numbers)
  if n == 0: return
  mean = float(sum(numbers)) / n
  variance = sum((x - mean) ** 2 for x in numbers) / n
  return math.sqrt(variance)

def first_index(my_list, elem):
  try: index = my_list.index(elem) + 1
  except: index = 0
  return index

# Tests the "list operation" blocks.
def test_operations_on_list():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(sum([3, 4, 5]), 12, 'sum')
  assertEquals(min([3, 4, 5]), 3, 'min')
  assertEquals(max([3, 4, 5]), 5, 'max')
  assertEquals(math_mean([3, 4, 5]), 4, 'average')
  assertEquals(math_median([3, 4, 5, 1]), 3.5, 'median')
  assertEquals(math_modes([3, 4, 3]), [3], 'modes')
  assertEquals(math_modes([3, 4, 3, 1, 4]), [3, 4], 'modes multiple')
  assertEquals(math_standard_deviation([3, 3, 3]), 0, 'standard dev')
  assertEquals(first_index([3, 4, 5], random.choice([3, 4, 5])) > 0, True, 'random')

# Tests the "mod" block.
def test_mod():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(42 % 5, 2, 'mod')

# Tests the "constrain" block.
def test_constraint():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(min(max(100, 0), 42), 42, 'constraint')

# Tests the "random integer" block.
def test_random_integer():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  rand = random.randint(5, 10)
  assertEquals(rand >= 5 and rand <= 10, True, 'randRange')
  assertEquals(rand % 1 == 0, True, 'randInteger')

# Tests the "random fraction" block.
def test_random_fraction():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  rand = random.random()
  assertEquals(rand >= 0 and rand <= 1, True, 'randFloat')

# Describe this function...
def test_atan2():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(math.atan2(5, -5) / math.pi * 180, 135, 'atan2')
  assertEquals(math.atan2(-12, 0) / math.pi * 180, -90, 'atan2')

# Checks that the number of calls is one in order
# to confirm that a function was only called once.
def check_number_of_calls(test_name):
  global naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  test_name = str(test_name) + 'number of calls'
  assertEquals(number_of_calls, 1, test_name)

# Tests the "create text with" block with varying number of inputs.
def test_create_text():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals('', '', 'no text')
  assertEquals('Hello', 'Hello', 'create single')
  assertEquals(str(-1), '-1', 'create single number')
  assertEquals('K' + str(9), 'K9', 'create double text')
  assertEquals(str(4) + str(2), '42', 'create double text numbers')
  assertEquals(''.join([str(x2) for x2 in [1, 2, 3]]), '123', 'create triple')
  assertEquals(''.join([str(x3) for x3 in [1, 0 if True else None, 'M']]), '10M', 'create order')

# Creates an empty string for use with the empty test.
def get_empty():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  return ''

# Tests the "is empty" block".
def test_empty_text():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(not len('Google'), False, 'not empty')
  assertEquals(not len(''), True, 'empty')
  assertEquals(not len(get_empty()), True, 'empty complex')
  assertEquals(not len('' if True else None), True, 'empty order')

# Tests the "length" block.
def test_text_length():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(len(''), 0, 'zero length')
  assertEquals(len('Google'), 6, 'non-zero length')
  assertEquals(len('car' if True else None), 3, 'length order')

# Tests the "append text" block with different types of parameters.
def test_append():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  item = 'Miserable'
  item = str(item) + 'Failure'
  assertEquals(item, 'MiserableFailure', 'append text')
  item = 12
  item = str(item) + str(34)
  assertEquals(item, '1234', 'append number')
  item = 'Something '
  item = str(item) + str('Positive' if True else None)
  assertEquals(item, 'Something Positive', 'append order')

# Tests the "find" block with a variable.
def test_find_text_simple():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  text = 'Banana'
  assertEquals(text.find('an') + 1, 2, 'find first simple')
  assertEquals(text.rfind('an') + 1, 4, 'find last simple')
  assertEquals(text.find('Peel') + 1, 0, 'find none simple')

# Creates a string for use with the find test.
def get_fruit():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  number_of_calls = (number_of_calls if isinstance(number_of_calls, Number) else 0) + 1
  return 'Banana'

# Tests the "find" block with a function call.
def test_find_text_complex():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  number_of_calls = 0
  assertEquals(get_fruit().find('an') + 1, 2, 'find first complex')
  check_number_of_calls('find first complex')
  number_of_calls = 0
  assertEquals((get_fruit() if True else None).find('an') + 1, 2, 'find first order complex')
  check_number_of_calls('find first order complex')
  number_of_calls = 0
  assertEquals(get_fruit().rfind('an') + 1, 4, 'find last complex')
  check_number_of_calls('find last complex')
  number_of_calls = 0
  assertEquals((get_fruit() if True else None).rfind('an') + 1, 4, 'find last order complex')
  check_number_of_calls('find last order complex')
  number_of_calls = 0
  assertEquals(get_fruit().find('Peel') + 1, 0, 'find none complex')
  check_number_of_calls('find none complex')
  number_of_calls = 0
  assertEquals((get_fruit() if True else None).find('Peel') + 1, 0, 'find none order complex')
  check_number_of_calls('find none order complex')

def text_random_letter(text):
  x = int(random.random() * len(text))
  return text[x]

# Tests the "get letter" block with a variable.
def test_get_text_simple():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  text = 'Blockly'
  assertEquals(text[0], 'B', 'get first simple')
  assertEquals(text[-1], 'y', 'get last simple')
  assertEquals(text.find(text_random_letter(text)) + 1 > 0, True, 'get random simple')
  assertEquals(text[2], 'o', 'get # simple')
  assertEquals(text[int((3 if True else None) - 1)], 'o', 'get # order simple')
  assertEquals(text[-3], 'k', 'get #-end simple')
  # The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(text[-int(0 + 3)], 'k', 'get #-end order simple')

# Creates a string for use with the get test.
def get_Blockly():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  number_of_calls = (number_of_calls if isinstance(number_of_calls, Number) else 0) + 1
  return 'Blockly'

# Tests the "get letter" block with a function call.
def test_get_text_complex():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  text = 'Blockly'
  number_of_calls = 0
  assertEquals(get_Blockly()[0], 'B', 'get first complex')
  check_number_of_calls('get first complex')
  number_of_calls = 0
  assertEquals((get_Blockly() if True else None)[0], 'B', 'get first order complex')
  check_number_of_calls('get first order complex')
  number_of_calls = 0
  assertEquals(get_Blockly()[-1], 'y', 'get last complex')
  check_number_of_calls('get last complex')
  number_of_calls = 0
  assertEquals((get_Blockly() if True else None)[-1], 'y', 'get last order complex')
  check_number_of_calls('get last order complex')
  number_of_calls = 0
  assertEquals(text.find(text_random_letter(get_Blockly())) + 1 > 0, True, 'get random complex')
  check_number_of_calls('get random complex')
  number_of_calls = 0
  assertEquals(text.find(text_random_letter(get_Blockly() if True else None)) + 1 > 0, True, 'get random order complex')
  check_number_of_calls('get random order complex')
  number_of_calls = 0
  assertEquals(get_Blockly()[2], 'o', 'get # complex')
  check_number_of_calls('get # complex')
  number_of_calls = 0
  assertEquals((get_Blockly() if True else None)[int((3 if True else None) - 1)], 'o', 'get # order complex')
  check_number_of_calls('get # order complex')
  number_of_calls = 0
  assertEquals(get_Blockly()[-3], 'k', 'get #-end complex')
  check_number_of_calls('get #-end complex')
  number_of_calls = 0
  # The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals((get_Blockly() if True else None)[-int(0 + 3)], 'k', 'get #-end order complex')
  check_number_of_calls('get #-end order complex')

# Creates a string for use with the substring test.
def get_numbers():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  number_of_calls = (number_of_calls if isinstance(number_of_calls, Number) else 0) + 1
  return '123456789'

# Tests the "get substring" block with a variable.
def test_substring_simple():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  text = '123456789'
  assertEquals(text[1 : 3], '23', 'substring # simple')
  assertEquals(text[int((2 if True else None) - 1) : int(3 if True else None)], '23', 'substring # simple order')
  assertEquals(text[-3 : -1], '78', 'substring #-end simple')
  # The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(text[-int(0 + 3) : -int((0 + 2) - 1) or sys.maxsize], '78', 'substring #-end simple order')
  assertEquals(text[ : ], text, 'substring first-last simple')
  assertEquals(text[1 : -1], '2345678', 'substring # #-end simple')
  assertEquals(text[-7 : 4], '34', 'substring #-end # simple')
  assertEquals(text[ : 4], '1234', 'substring first # simple')
  assertEquals(text[ : -1], '12345678', 'substring first #-end simple')
  assertEquals(text[6 : ], '789', 'substring # last simple')
  assertEquals(text[-3 : ], '789', 'substring #-end last simple')
  assertEquals(text[ : ], '123456789', 'substring all with # #-end simple')
  assertEquals(text[-9 : 9], '123456789', 'substring all with #-end # simple')
  # Checks that the whole string is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where substring uses [x:length - y] for # #-end.
  assertEquals(text[int((0 + 1) - 1) : -int((0 + 1) - 1) or sys.maxsize], '123456789', 'substring all with # #-end math simple')

# Tests the "get substring" block with a function call.
def test_substring_complex():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  number_of_calls = 0
  assertEquals(get_numbers()[1 : 3], '23', 'substring # complex')
  check_number_of_calls('substring # complex')
  number_of_calls = 0
  assertEquals((get_numbers() if True else None)[int((2 if True else None) - 1) : int(3 if True else None)], '23', 'substring # complex order')
  check_number_of_calls('substring # complex order')
  number_of_calls = 0
  # The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(get_numbers()[-3 : -1], '78', 'substring #-end complex')
  check_number_of_calls('substring #-end complex')
  number_of_calls = 0
  assertEquals((get_numbers() if True else None)[-int(0 + 3) : -int((0 + 2) - 1) or sys.maxsize], '78', 'substring #-end order order')
  check_number_of_calls('substring #-end order order')
  number_of_calls = 0
  assertEquals(get_numbers()[ : ], text, 'substring first-last')
  check_number_of_calls('substring first-last')
  number_of_calls = 0
  assertEquals(get_numbers()[1 : -1], '2345678', 'substring # #-end complex')
  check_number_of_calls('substring # #-end complex')
  number_of_calls = 0
  assertEquals(get_numbers()[-7 : 4], '34', 'substring #-end # complex')
  check_number_of_calls('substring #-end # complex')
  number_of_calls = 0
  assertEquals(get_numbers()[ : 4], '1234', 'substring first # complex')
  check_number_of_calls('substring first # complex')
  number_of_calls = 0
  assertEquals(get_numbers()[ : -1], '12345678', 'substring first #-end complex')
  check_number_of_calls('substring first #-end complex')
  number_of_calls = 0
  assertEquals(get_numbers()[6 : ], '789', 'substring # last complex')
  check_number_of_calls('substring # last complex')
  number_of_calls = 0
  assertEquals(get_numbers()[-3 : ], '789', 'substring #-end last complex')
  check_number_of_calls('substring #-end last complex')
  number_of_calls = 0
  assertEquals(get_numbers()[ : ], '123456789', 'substring all with # #-end complex')
  check_number_of_calls('substring all with # #-end complex')
  number_of_calls = 0
  assertEquals(get_numbers()[-9 : 9], '123456789', 'substring all with #-end # complex')
  check_number_of_calls('substring all with #-end # complex')
  number_of_calls = 0
  # Checks that the whole string is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where substring uses [x:length - y] for # #-end.
  assertEquals(get_numbers()[int((0 + 1) - 1) : -int((0 + 1) - 1) or sys.maxsize], '123456789', 'substring all with # #-end math complex')
  check_number_of_calls('substring all with # #-end math complex')

# Tests the "change casing" block.
def test_case():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  text = 'Hello World'
  assertEquals(text.upper(), 'HELLO WORLD', 'uppercase')
  assertEquals((text if True else None).upper(), 'HELLO WORLD', 'uppercase order')
  text = 'Hello World'
  assertEquals(text.lower(), 'hello world', 'lowercase')
  assertEquals((text if True else None).lower(), 'hello world', 'lowercase order')
  text = 'heLLo WorlD'
  assertEquals(text.title(), 'Hello World', 'titlecase')
  assertEquals((text if True else None).title(), 'Hello World', 'titlecase order')

# Tests the "trim" block.
def test_trim():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  text = '   abc def   '
  assertEquals(text.strip(), 'abc def', 'trim both')
  assertEquals((text if True else None).strip(), 'abc def', 'trim both order')
  assertEquals(text.lstrip(), 'abc def   ', 'trim left')
  assertEquals((text if True else None).lstrip(), 'abc def   ', 'trim left order')
  assertEquals(text.rstrip(), '   abc def', 'trim right')
  assertEquals((text if True else None).rstrip(), '   abc def', 'trim right order')

# Tests the "trim" block.
def test_count_text():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  text = 'woolloomooloo'
  assertEquals(text.count('o'), 8, 'len 1')
  assertEquals(text.count('oo'), 4, 'len 2')
  assertEquals(text.count('loo'), 2, 'len 3')
  assertEquals(text.count('wool'), 1, 'start')
  assertEquals(text.count('chicken'), 0, 'missing')
  assertEquals(text.count(''), 14, 'empty needle')
  assertEquals(''.count('chicken'), 0, 'empty source')

# Tests the "trim" block.
def test_text_reverse():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(''[::-1], '', 'empty string')
  assertEquals('a'[::-1], 'a', 'len 1')
  assertEquals('ab'[::-1], 'ba', 'len 2')
  assertEquals('woolloomooloo'[::-1], 'ooloomoolloow', 'longer')

# Tests the "trim" block.
def test_replace():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals('woolloomooloo'.replace('oo', '123'), 'w123ll123m123l123', 'replace all instances 1')
  assertEquals('woolloomooloo'.replace('.oo', 'X'), 'woolloomooloo', 'literal string replacement')
  assertEquals('woolloomooloo'.replace('abc', 'X'), 'woolloomooloo', 'not found')
  assertEquals('woolloomooloo'.replace('o', ''), 'wllml', 'empty replacement 1')
  assertEquals('aaaaa'.replace('aaaaa', ''), '', 'empty replacement 2')
  assertEquals('aaaaa'.replace('a', ''), '', 'empty replacement 3')
  assertEquals(''.replace('a', 'chicken'), '', 'empty source')

# Checks that the number of calls is one in order
# to confirm that a function was only called once.
def check_number_of_calls2(test_name):
  global naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  test_name = str(test_name) + 'number of calls'
  assertEquals(number_of_calls, 1, test_name)

# Tests the "create list with" and "create empty list" blocks.
def test_create_lists():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals([], [], 'create empty')
  assertEquals([True, 'love'], [True, 'love'], 'create items')
  assertEquals(['Eject'] * 3, ['Eject', 'Eject', 'Eject'], 'create repeated')
  assertEquals(['Eject'] * (0 + 3), ['Eject', 'Eject', 'Eject'], 'create repeated order')

# Creates an empty list for use with the empty test.
def get_empty_list():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  return []

# Tests the "is empty" block.
def test_lists_empty():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(not len([0]), False, 'not empty')
  assertEquals(not len([]), True, 'empty')
  assertEquals(not len(get_empty_list()), True, 'empty complex')
  assertEquals(not len([] if True else None), True, 'empty order')

# Tests the "length" block.
def test_lists_length():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(len([]), 0, 'zero length')
  assertEquals(len(['cat']), 1, 'one length')
  assertEquals(len(['cat', True, []]), 3, 'three length')
  assertEquals(len(['cat', True] if True else None), 2, 'two length order')

def last_index(my_list, elem):
  try: index = len(my_list) - my_list[::-1].index(elem)
  except: index = 0
  return index

# Tests the "find" block with a variable.
def test_find_lists_simple():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  list2 = ['Alice', 'Eve', 'Bob', 'Eve']
  assertEquals(first_index(list2, 'Eve'), 2, 'find first simple')
  assertEquals(last_index(list2, 'Eve'), 4, 'find last simple')
  assertEquals(first_index(list2, 'Dave'), 0, 'find none simple')

# Creates a list for use with the find test.
def get_names():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  number_of_calls = (number_of_calls if isinstance(number_of_calls, Number) else 0) + 1
  return ['Alice', 'Eve', 'Bob', 'Eve']

# Tests the "find" block with a function call.
def test_find_lists_complex():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  number_of_calls = 0
  assertEquals(first_index(get_names(), 'Eve'), 2, 'find first complex')
  check_number_of_calls('find first complex')
  number_of_calls = 0
  assertEquals(first_index(get_names() if True else None, 'Eve'), 2, 'find first order complex')
  check_number_of_calls('find first order complex')
  number_of_calls = 0
  assertEquals(last_index(get_names(), 'Eve'), 4, 'find last complex')
  check_number_of_calls('find last complex')
  number_of_calls = 0
  assertEquals(last_index(get_names() if True else None, 'Eve'), 4, 'find last order complex')
  check_number_of_calls('find last order complex')
  number_of_calls = 0
  assertEquals(first_index(get_names(), 'Dave'), 0, 'find none complex')
  check_number_of_calls('find none complex')
  number_of_calls = 0
  assertEquals(first_index(get_names() if True else None, 'Dave'), 0, 'find none order complex')
  check_number_of_calls('find none order complex')

# Tests the "get" block with a variable.
def test_get_lists_simple():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  list2 = ['Kirk', 'Spock', 'McCoy']
  assertEquals(list2[0], 'Kirk', 'get first simple')
  assertEquals(list2[-1], 'McCoy', 'get last simple')
  assertEquals(first_index(list2, random.choice(list2)) > 0, True, 'get random simple')
  assertEquals(list2[1], 'Spock', 'get # simple')
  assertEquals(list2[int((2 if True else None) - 1)], 'Spock', 'get # order simple')
  assertEquals(list2[-3], 'Kirk', 'get #-end simple')
  # The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(list2[-int(0 + 3)], 'Kirk', 'get #-end order simple')

# Tests the "get" block with create list call.
def test_get_lists_create_list():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(['Kirk', 'Spock', 'McCoy'][0], 'Kirk', 'get first create list')
  assertEquals(['Kirk', 'Spock', 'McCoy'][-1], 'McCoy', 'get last simple')
  assertEquals(first_index(['Kirk', 'Spock', 'McCoy'], random.choice(['Kirk', 'Spock', 'McCoy'])) > 0, True, 'get random simple')
  assertEquals(['Kirk', 'Spock', 'McCoy'][1], 'Spock', 'get # simple')
  assertEquals(['Kirk', 'Spock', 'McCoy'][int((2 if True else None) - 1)], 'Spock', 'get # order simple')
  assertEquals(['Kirk', 'Spock', 'McCoy'][-3], 'Kirk', 'get #-end simple')
  # The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(['Kirk', 'Spock', 'McCoy'][-int(0 + 3)], 'Kirk', 'get #-end order simple')

# Creates a list for use with the get test.
def get_star_wars():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  number_of_calls = (number_of_calls if isinstance(number_of_calls, Number) else 0) + 1
  return ['Kirk', 'Spock', 'McCoy']

# Tests the "get" block with a function call.
def test_get_lists_complex():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  list2 = ['Kirk', 'Spock', 'McCoy']
  number_of_calls = 0
  assertEquals(get_star_wars()[0], 'Kirk', 'get first complex')
  check_number_of_calls('get first complex')
  number_of_calls = 0
  assertEquals((get_star_wars() if True else None)[0], 'Kirk', 'get first order complex')
  check_number_of_calls('get first order complex')
  number_of_calls = 0
  assertEquals(get_star_wars()[-1], 'McCoy', 'get last complex')
  check_number_of_calls('get last complex')
  number_of_calls = 0
  assertEquals((get_star_wars() if True else None)[-1], 'McCoy', 'get last order complex')
  check_number_of_calls('get last order complex')
  number_of_calls = 0
  assertEquals(first_index(list2, random.choice(get_star_wars())) > 0, True, 'get random complex')
  check_number_of_calls('get random complex')
  number_of_calls = 0
  assertEquals(first_index(list2, random.choice(get_star_wars() if True else None)) > 0, True, 'get random order complex')
  check_number_of_calls('get random order complex')
  number_of_calls = 0
  assertEquals(get_star_wars()[1], 'Spock', 'get # complex')
  check_number_of_calls('get # complex')
  number_of_calls = 0
  assertEquals((get_star_wars() if True else None)[int((2 if True else None) - 1)], 'Spock', 'get # order complex')
  check_number_of_calls('get # order complex')
  number_of_calls = 0
  assertEquals(get_star_wars()[-3], 'Kirk', 'get #-end complex')
  check_number_of_calls('get #-end complex')
  number_of_calls = 0
  # The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals((get_star_wars() if True else None)[-int(0 + 3)], 'Kirk', 'get #-end order complex')
  check_number_of_calls('get #-end order complex')

def lists_remove_random_item(myList):
  x = int(random.random() * len(myList))
  return myList.pop(x)

# Tests the "get and remove" block.
def test_getRemove():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  list2 = ['Kirk', 'Spock', 'McCoy']
  assertEquals(list2.pop(0), 'Kirk', 'getremove first')
  assertEquals(list2, ['Spock', 'McCoy'], 'getremove first list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  assertEquals((list2 if True else None).pop(0), 'Kirk', 'getremove first order')
  assertEquals(list2, ['Spock', 'McCoy'], 'getremove first order list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  assertEquals(list2.pop(), 'McCoy', 'getremove last')
  assertEquals(list2, ['Kirk', 'Spock'], 'getremove last list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  assertEquals((list2 if True else None).pop(), 'McCoy', 'getremove last order')
  assertEquals(list2, ['Kirk', 'Spock'], 'getremove last order list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  assertEquals(first_index(list2, lists_remove_random_item(list2)) == 0, True, 'getremove random')
  assertEquals(len(list2), 2, 'getremove random list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  assertEquals(first_index(list2, lists_remove_random_item(list2 if True else None)) == 0, True, 'getremove random order')
  assertEquals(len(list2), 2, 'getremove random order list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  assertEquals(list2.pop(1), 'Spock', 'getremove #')
  assertEquals(list2, ['Kirk', 'McCoy'], 'getremove # list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  assertEquals((list2 if True else None).pop(int((2 if True else None) - 1)), 'Spock', 'getremove # order')
  assertEquals(list2, ['Kirk', 'McCoy'], 'getremove # order list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  assertEquals(list2.pop(-3), 'Kirk', 'getremove #-end')
  assertEquals(list2, ['Spock', 'McCoy'], 'getremove #-end list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  # The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals((list2 if True else None).pop(-int(0 + 3)), 'Kirk', 'getremove #-end order')
  assertEquals(list2, ['Spock', 'McCoy'], 'getremove #-end order list')

# Tests the "remove" block.
def test_remove():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  list2 = ['Kirk', 'Spock', 'McCoy']
  list2.pop(0)
  assertEquals(list2, ['Spock', 'McCoy'], 'remove first list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  (list2 if True else None).pop(0)
  assertEquals(list2, ['Spock', 'McCoy'], 'remove first order list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  list2.pop()
  assertEquals(list2, ['Kirk', 'Spock'], 'remove last list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  (list2 if True else None).pop()
  assertEquals(list2, ['Kirk', 'Spock'], 'remove last order list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  lists_remove_random_item(list2)
  assertEquals(len(list2), 2, 'remove random list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  lists_remove_random_item(list2 if True else None)
  assertEquals(len(list2), 2, 'remove random order list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  list2.pop(1)
  assertEquals(list2, ['Kirk', 'McCoy'], 'remove # list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  (list2 if True else None).pop(int((2 if True else None) - 1))
  assertEquals(list2, ['Kirk', 'McCoy'], 'remove # order list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  list2.pop(-3)
  assertEquals(list2, ['Spock', 'McCoy'], 'remove #-end list')
  list2 = ['Kirk', 'Spock', 'McCoy']
  # The order for index for #-end is addition because this will catch
  # errors in generators where most perform the operation ... - index.
  (list2 if True else None).pop(-int(0 + 3))
  assertEquals(list2, ['Spock', 'McCoy'], 'remove #-end order list')

# Tests the "set" block.
def test_set():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  list2 = ['Picard', 'Riker', 'Crusher']
  list2[0] = 'Jean-Luc'
  assertEquals(list2, ['Jean-Luc', 'Riker', 'Crusher'], 'set first list')
  list2 = ['Picard', 'Riker', 'Crusher']
  (list2 if True else None)[0] = 'Jean-Luc'
  assertEquals(list2, ['Jean-Luc', 'Riker', 'Crusher'], 'set first order list')
  list2 = ['Picard', 'Riker', 'Crusher']
  list2[-1] = 'Beverly'
  assertEquals(list2, ['Picard', 'Riker', 'Beverly'], 'set last list')
  list2 = ['Picard', 'Riker', 'Crusher']
  (list2 if True else None)[-1] = 'Beverly'
  assertEquals(list2, ['Picard', 'Riker', 'Beverly'], 'set last order list')
  list2 = ['Picard', 'Riker', 'Crusher']
  tmp_x = int(random.random() * len(list2))
  list2[tmp_x] = 'Data'
  assertEquals(len(list2), 3, 'set random list')
  list2 = ['Picard', 'Riker', 'Crusher']
  tmp_list = (list2 if True else None)
  tmp_x2 = int(random.random() * len(tmp_list))
  tmp_list[tmp_x2] = 'Data'
  assertEquals(len(list2), 3, 'set random order list')
  list2 = ['Picard', 'Riker', 'Crusher']
  list2[2] = 'Pulaski'
  assertEquals(list2, ['Picard', 'Riker', 'Pulaski'], 'set # list')
  list2 = ['Picard', 'Riker', 'Crusher']
  (list2 if True else None)[int((3 if True else None) - 1)] = 'Pulaski'
  assertEquals(list2, ['Picard', 'Riker', 'Pulaski'], 'set # order list')
  list2 = ['Picard', 'Riker', 'Crusher']
  list2[-1] = 'Pulaski'
  assertEquals(list2, ['Picard', 'Riker', 'Pulaski'], 'set #-end list')
  list2 = ['Picard', 'Riker', 'Crusher']
  # The order for index for #-end is addition because this will catch
  # errors in generators where most perform the operation ... - index.
  (list2 if True else None)[-int(0 + 2)] = 'Pulaski'
  assertEquals(list2, ['Picard', 'Pulaski', 'Crusher'], 'set #-end order list')

# Tests the "insert" block.
def test_insert():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  list2 = ['Picard', 'Riker', 'Crusher']
  list2.insert(0, 'Data')
  assertEquals(list2, ['Data', 'Picard', 'Riker', 'Crusher'], 'insert first list')
  list2 = ['Picard', 'Riker', 'Crusher']
  (list2 if True else None).insert(0, 'Data')
  assertEquals(list2, ['Data', 'Picard', 'Riker', 'Crusher'], 'insert first order list')
  list2 = ['Picard', 'Riker', 'Crusher']
  list2.append('Data')
  assertEquals(list2, ['Picard', 'Riker', 'Crusher', 'Data'], 'insert last list')
  list2 = ['Picard', 'Riker', 'Crusher']
  (list2 if True else None).append('Data')
  assertEquals(list2, ['Picard', 'Riker', 'Crusher', 'Data'], 'insert last order list')
  list2 = ['Picard', 'Riker', 'Crusher']
  tmp_x3 = int(random.random() * len(list2))
  list2.insert(tmp_x3, 'Data')
  assertEquals(len(list2), 4, 'insert random list')
  list2 = ['Picard', 'Riker', 'Crusher']
  tmp_list2 = (list2 if True else None)
  tmp_x4 = int(random.random() * len(tmp_list2))
  tmp_list2.insert(tmp_x4, 'Data')
  assertEquals(len(list2), 4, 'insert random order list')
  list2 = ['Picard', 'Riker', 'Crusher']
  list2.insert(2, 'Data')
  assertEquals(list2, ['Picard', 'Riker', 'Data', 'Crusher'], 'insert # list')
  list2 = ['Picard', 'Riker', 'Crusher']
  (list2 if True else None).insert(int((3 if True else None) - 1), 'Data')
  assertEquals(list2, ['Picard', 'Riker', 'Data', 'Crusher'], 'insert # order list')
  list2 = ['Picard', 'Riker', 'Crusher']
  list2.insert(-1, 'Data')
  assertEquals(list2, ['Picard', 'Riker', 'Data', 'Crusher'], 'insert #-end list')
  list2 = ['Picard', 'Riker', 'Crusher']
  # The order for index for #-end is addition because this will catch
  # errors in generators where most perform the operation ... - index.
  (list2 if True else None).insert(-int(0 + 2), 'Data')
  assertEquals(list2, ['Picard', 'Data', 'Riker', 'Crusher'], 'insert #-end order list')

# Tests the "get sub-list" block with a variable.
def test_sublist_simple():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  list2 = ['Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour']
  assertEquals(list2[1 : 3], ['Challenger', 'Discovery'], 'sublist # simple')
  assertEquals(list2[int((2 if True else None) - 1) : int(3 if True else None)], ['Challenger', 'Discovery'], 'sublist # simple order')
  assertEquals(list2[-3 : -1], ['Discovery', 'Atlantis'], 'sublist #-end simple')
  # The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(list2[-int(0 + 3) : -int((0 + 2) - 1) or sys.maxsize], ['Discovery', 'Atlantis'], 'sublist #-end simple order')
  assertEquals(list2[ : ], list2, 'sublist first-last simple')
  changing_list = ['Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour']
  list_copy = changing_list[ : ]
  lists_remove_random_item(changing_list)
  assertEquals(list_copy, list2, 'sublist first-last simple copy check')
  assertEquals(list2[1 : -1], ['Challenger', 'Discovery', 'Atlantis'], 'sublist # #-end simple')
  assertEquals(list2[-3 : 4], ['Discovery', 'Atlantis'], 'sublist #-end # simple')
  assertEquals(list2[ : 4], ['Columbia', 'Challenger', 'Discovery', 'Atlantis'], 'sublist first # simple')
  assertEquals(list2[ : -3], ['Columbia', 'Challenger'], 'sublist first #-end simple')
  assertEquals(list2[3 : ], ['Atlantis', 'Endeavour'], 'sublist # last simple')
  assertEquals(list2[-4 : ], ['Challenger', 'Discovery', 'Atlantis', 'Endeavour'], 'sublist #-end last simple')
  assertEquals(list2[ : ], list2, 'sublist all with # #-end simple')
  assertEquals(list2[-5 : 5], list2, 'sublist all with #-end # simple')
  # Checks that the whole list is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where sublist uses [x:length - y] for # #-end.
  assertEquals(list2[int((0 + 1) - 1) : -int((0 + 1) - 1) or sys.maxsize], list2, 'sublist all with # #-end math simple')

# Creates a list for use with the sublist test.
def get_space_shuttles():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  number_of_calls = (number_of_calls if isinstance(number_of_calls, Number) else 0) + 1
  return ['Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour']

# Tests the "get sub-list" block with a function call.
def test_sublist_complex():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  number_of_calls = 0
  assertEquals(get_space_shuttles()[1 : 3], ['Challenger', 'Discovery'], 'sublist # start complex')
  check_number_of_calls('sublist # start complex')
  number_of_calls = 0
  assertEquals((get_space_shuttles() if True else None)[int((2 if True else None) - 1) : int(3 if True else None)], ['Challenger', 'Discovery'], 'sublist # start order complex')
  check_number_of_calls('sublist # start order complex')
  number_of_calls = 0
  # The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(get_space_shuttles()[-3 : -1], ['Discovery', 'Atlantis'], 'sublist # end complex')
  assertEquals(number_of_calls, 1, 'sublist # end complex number of calls')
  number_of_calls = 0
  assertEquals((get_space_shuttles() if True else None)[-int(0 + 3) : -int((0 + 2) - 1) or sys.maxsize], ['Discovery', 'Atlantis'], 'sublist # end order complex')
  check_number_of_calls('sublist # end order complex')
  number_of_calls = 0
  assertEquals(get_space_shuttles()[ : ], list2, 'sublist first-last complex')
  check_number_of_calls('sublist first-last complex')
  number_of_calls = 0
  assertEquals(get_space_shuttles()[1 : -1], ['Challenger', 'Discovery', 'Atlantis'], 'sublist # #-end complex')
  check_number_of_calls('sublist # #-end complex')
  number_of_calls = 0
  assertEquals(get_space_shuttles()[-3 : 4], ['Discovery', 'Atlantis'], 'sublist #-end # complex')
  check_number_of_calls('sublist #-end # complex')
  number_of_calls = 0
  assertEquals(get_space_shuttles()[ : 4], ['Columbia', 'Challenger', 'Discovery', 'Atlantis'], 'sublist first # complex')
  check_number_of_calls('sublist first # complex')
  number_of_calls = 0
  assertEquals(get_space_shuttles()[ : -3], ['Columbia', 'Challenger'], 'sublist first #-end complex')
  check_number_of_calls('sublist first #-end complex')
  number_of_calls = 0
  assertEquals(get_space_shuttles()[3 : ], ['Atlantis', 'Endeavour'], 'sublist # last complex')
  check_number_of_calls('sublist # last complex')
  number_of_calls = 0
  assertEquals(get_space_shuttles()[-4 : ], ['Challenger', 'Discovery', 'Atlantis', 'Endeavour'], 'sublist #-end last simple')
  check_number_of_calls('sublist #-end last simple')
  number_of_calls = 0
  assertEquals(get_space_shuttles()[ : ], list2, 'sublist all with # #-end complex')
  check_number_of_calls('sublist all with # #-end complex')
  number_of_calls = 0
  assertEquals(get_space_shuttles()[-5 : 5], list2, 'sublist all with #-end # complex')
  check_number_of_calls('sublist all with #-end # complex')
  number_of_calls = 0
  # Checks that the whole list is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where sublist uses [x:length - y] for # #-end.
  assertEquals(get_space_shuttles()[int((0 + 1) - 1) : -int((0 + 1) - 1) or sys.maxsize], list2, 'sublist all with # #-end math complex')
  check_number_of_calls('sublist all with # #-end math complex')

# Tests the "join" block.
def test_join():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  list2 = ['Vulcan', 'Klingon', 'Borg']
  assertEquals(','.join(list2), 'Vulcan,Klingon,Borg', 'join')
  assertEquals(','.join(list2 if True else None), 'Vulcan,Klingon,Borg', 'join order')

# Tests the "split" block.
def test_split():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  text = 'Vulcan,Klingon,Borg'
  assertEquals(text.split(','), ['Vulcan', 'Klingon', 'Borg'], 'split')
  assertEquals((text if True else None).split(','), ['Vulcan', 'Klingon', 'Borg'], 'split order')

def lists_sort(my_list, type, reverse):
  def try_float(s):
    try:
      return float(s)
    except:
      return 0
  key_funcs = {
    "NUMERIC": try_float,
    "TEXT": str,
    "IGNORE_CASE": lambda s: str(s).lower()
  }
  key_func = key_funcs[type]
  list_cpy = list(my_list)
  return sorted(list_cpy, key=key_func, reverse=reverse)

# Tests the "alphabetic sort" block.
def test_sort_alphabetic():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  list2 = ['Vulcan', 'klingon', 'Borg']
  assertEquals(lists_sort(list2, "TEXT", False), ['Borg', 'Vulcan', 'klingon'], 'sort alphabetic ascending')
  assertEquals(lists_sort(list2 if True else None, "TEXT", False), ['Borg', 'Vulcan', 'klingon'], 'sort alphabetic ascending order')

# Tests the "alphabetic sort ignore case" block.
def test_sort_ignoreCase():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  list2 = ['Vulcan', 'klingon', 'Borg']
  assertEquals(lists_sort(list2, "IGNORE_CASE", False), ['Borg', 'klingon', 'Vulcan'], 'sort ignore case ascending')
  assertEquals(lists_sort(list2 if True else None, "IGNORE_CASE", False), ['Borg', 'klingon', 'Vulcan'], 'sort ignore case ascending order')

# Tests the "numeric sort" block.
def test_sort_numeric():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  list2 = [8, 18, -1]
  assertEquals(lists_sort(list2, "NUMERIC", True), [18, 8, -1], 'sort numeric descending')
  assertEquals(lists_sort(list2 if True else None, "NUMERIC", True), [18, 8, -1], 'sort numeric descending order')

# Tests the "list reverse" block.
def test_lists_reverse():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  list2 = [8, 18, -1, 64]
  assertEquals(list(reversed(list2)), [64, -1, 18, 8], 'reverse a copy')
  assertEquals(list2, [8, 18, -1, 64], 'reverse a copy original')
  list2 = []
  assertEquals(list(reversed(list2)), [], 'empty list')

# Describe this function...
def test_procedure():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  procedure_1(8, 2)
  assertEquals(proc_z, 4, 'procedure with global')
  proc_w = False
  procedure_2(False)
  assertEquals(proc_w, True, 'procedure no return')
  proc_w = False
  procedure_2(True)
  assertEquals(proc_w, False, 'procedure return')

# Describe this function...
def procedure_1(proc_x, proc_y):
  global test_name, naked, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  proc_z = proc_x / proc_y

# Describe this function...
def procedure_2(proc_x):
  global test_name, naked, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  if proc_x:
    return
  proc_w = True

# Describe this function...
def test_function():
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  assertEquals(function_1(2, 3), -1, 'function with arguments')
  assertEquals(func_z, 'side effect', 'function with side effect')
  func_a = 'unchanged'
  func_c = 'global'
  assertEquals(function_2(2), '3global', 'function with global')
  assertEquals(func_a, 'unchanged', 'function with scope')
  assertEquals(function_3(True), True, 'function return')
  assertEquals(function_3(False), False, 'function no return')

# Describe this function...
def function_1(func_x, func_y):
  global test_name, naked, proc_x, proc_y, func_a, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  func_z = 'side effect'
  return func_x - func_y

# Describe this function...
def function_2(func_a):
  global test_name, naked, proc_x, proc_y, func_x, func_y, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  func_a = (func_a if isinstance(func_a, Number) else 0) + 1
  return str(func_a) + str(func_c)

# Describe this function...
def function_3(func_a):
  global test_name, naked, proc_x, proc_y, func_x, func_y, n, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  if func_a:
    return True
  return False

# Describe this function...
def recurse(n):
  global test_name, naked, proc_x, proc_y, func_x, func_y, func_a, ok, log, count, varToChange, rand, item, text, number_of_calls, list2, proc_z, func_z, x, proc_w, func_c, if2, loglist, changing_list, list_copy, unittestResults
  if n > 0:
    text = ''.join([str(x4) for x4 in [recurse(n - 1), n, recurse(n - 1)]])
  else:
    text = '-'
  return text


unittestResults = []
print('\n====================\n\nRunning suite: Logic')
assertEquals(True, True, 'True')
assertEquals(False, False, 'False')
assertEquals(not False, True, 'Not true')
assertEquals(not True, False, 'Not false')
test_if()
test_ifelse()
test_equalities()
test_and()
test_or()
test_ternary()
print(unittest_report())
unittestResults = None

unittestResults = []
print('\n====================\n\nRunning suite: Loops 1')
test_repeat()
test_repeat_ext()
test_while()
test_foreach()
print(unittest_report())
unittestResults = None

unittestResults = []
print('\n====================\n\nRunning suite: Loops 2')
test_count_loops()
test_count_by()
print(unittest_report())
unittestResults = None

unittestResults = []
print('\n====================\n\nRunning suite: Loops 3')
test_break()
test_continue()
print(unittest_report())
unittestResults = None

unittestResults = []
print('\n====================\n\nRunning suite: Math')
test_arithmetic()
test_single()
test_trig()
test_constant()
test_change()
test_number_properties()
test_round()
test_operations_on_list()
test_constraint()
test_mod()
test_random_integer()
test_random_fraction()
test_atan2()
print(unittest_report())
unittestResults = None

unittestResults = []
print('\n====================\n\nRunning suite: Text')
test_text_length()
test_empty_text()
test_create_text()
test_append()
test_find_text_simple()
test_find_text_complex()
test_get_text_simple()
test_get_text_complex()
test_substring_simple()
test_substring_complex()
test_case()
test_trim()
test_count_text()
test_text_reverse()
test_replace()
print(unittest_report())
unittestResults = None

unittestResults = []
print('\n====================\n\nRunning suite: Lists')
test_create_lists()
test_lists_empty()
test_lists_length()
test_find_lists_simple()
test_find_lists_complex()
test_get_lists_simple()
test_get_lists_create_list()
test_get_lists_complex()
test_getRemove()
test_remove()
test_set()
test_insert()
test_sublist_simple()
test_sublist_complex()
test_join()
test_split()
test_sort_alphabetic()
test_sort_ignoreCase()
test_sort_numeric()
test_lists_reverse()
print(unittest_report())
unittestResults = None

unittestResults = []
print('\n====================\n\nRunning suite: Variables')
item = 123
assertEquals(item, 123, 'variable')
if2 = 123
assertEquals(if2, 123, 'reserved variable')
print(unittest_report())
unittestResults = None

# Intentionally non-connected variable.
naked

unittestResults = []
print('\n====================\n\nRunning suite: Functions')
test_procedure()
test_function()
assertEquals(recurse(3), '-1-2-1-3-1-2-1-', 'test recurse')
print(unittest_report())
unittestResults = None
