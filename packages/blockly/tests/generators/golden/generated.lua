function unittest_report()
  -- Create test report.
  local report = {}
  local summary = {}
  local fails = 0
  for _, v in pairs(unittestResults) do
    if v["success"] then
      table.insert(summary, ".")
    else
      table.insert(summary, "F")
      fails = fails + 1
      table.insert(report, "FAIL: " .. v["title"])
      table.insert(report, v["log"])
    end
  end
  table.insert(report, 1, table.concat(summary))
  table.insert(report, "")
  table.insert(report, "Number of tests run: " .. #unittestResults)
  table.insert(report, "")
  if fails > 0 then
    table.insert(report, "FAILED (failures=" .. fails .. ")")
  else
    table.insert(report, "OK")
  end
  return table.concat(report, "\n")
end

function assertEquals(actual, expected, message)
  -- Asserts that a value equals another value.
  assert(unittestResults ~= nil, "Orphaned assert equals: " ..  message)
  if type(actual) == "table" and type(expected) == "table" then
    local lists_match = #actual == #expected
    if lists_match then
      for i, v1 in ipairs(actual) do
        local v2 = expected[i]
        if type(v1) == "number" and type(v2) == "number" then
          if math.abs(v1 - v2) > 1e-9 then
            lists_match = false
          end
        elseif v1 ~= v2 then
          lists_match = false
        end
      end
    end
    if lists_match then
      table.insert(unittestResults, {success=true, log="OK", title=message})
      return
    else
      -- produce the non-matching strings for a human-readable error
      expected = "{" .. table.concat(expected, ", ") .. "}"
      actual = "{" .. table.concat(actual, ", ") .. "}"
    end
  end
  if actual == expected or (type(actual) == "number" and type(expected) == "number" and math.abs(actual - expected) < 1e-9) then
    table.insert(unittestResults, {success=true, log="OK", title=message})
  else
    table.insert(unittestResults, {success=false, log=string.format("Expected: %s\nActual: %s", tostring(expected), tostring(actual)), title=message})
  end
end

function unittest_fail(message)
  -- Always assert an error.
  assert(unittestResults ~= nil, "Orphaned assert fail: " .. message)
  table.insert(unittestResults, {success=false, log="Fail.", title=message})
end

-- Describe this function...
function test_if()
  if false then
    unittest_fail('if false')
  end
  ok = false
  if true then
    ok = true
  end
  assertEquals(ok, true, 'if true')
  ok = false
  if false then
    unittest_fail('if/else false')
  else
    ok = true
  end
  assertEquals(ok, true, 'if/else false')
  ok = false
  if true then
    ok = true
  else
    unittest_fail('if/else true')
  end
  assertEquals(ok, true, 'if/else true')
  ok = false
  if false then
    unittest_fail('elseif 1')
  elseif true then
    ok = true
  elseif true then
    unittest_fail('elseif 2')
  else
    unittest_fail('elseif 3')
  end
  assertEquals(ok, true, 'elseif 4')
end


-- Describe this function...
function test_ifelse()
  ok = false
  if true then
    ok = true
  else
    unittest_fail('ifelse true')
  end
  assertEquals(ok, true, 'ifelse true')
  ok = false
  if false then
    unittest_fail('ifelse false')
  else
    ok = true
  end
  assertEquals(ok, true, 'ifelse false')
end


-- Describe this function...
function test_equalities()
  assertEquals(2 == 2, true, 'Equal yes')
  assertEquals(3 == 4, false, 'Equal no')
  assertEquals(5 ~= 6, true, 'Not equal yes')
  assertEquals(3 == 4, false, 'Not equal no')
  assertEquals(5 < 6, true, 'Smaller yes')
  assertEquals(7 < 7, false, 'Smaller no')
  assertEquals(9 > 8, true, 'Greater yes')
  assertEquals(10 > 10, false, 'Greater no')
  assertEquals(11 <= 11, true, 'Smaller-equal yes')
  assertEquals(13 <= 12, false, 'Smaller-equal no')
  assertEquals(14 >= 14, true, 'Greater-equal yes')
  assertEquals(15 >= 16, false, 'Greater-equal no')
end


-- Describe this function...
function test_and()
  assertEquals(true and true, true, 'And true/true')
  assertEquals(false and true, false, 'And false/true')
  assertEquals(true and false, false, 'And true/false')
  assertEquals(false and false, false, 'And false/false')
end


-- Describe this function...
function test_or()
  assertEquals(true or true, true, 'Or true/true')
  assertEquals(false or true, true, 'Or false/true')
  assertEquals(true or false, true, 'Or true/false')
  assertEquals(false or false, false, 'Or false/false')
end


-- Describe this function...
function test_ternary()
  assertEquals(true and 42 or 99, 42, 'if true')
  assertEquals(false and 42 or 99, 99, 'if true')
end


-- Describe this function...
function test_foreach()
  log = ''
  for _, x in ipairs({'a', 'b', 'c'}) do
    log = log .. x
  end
  assertEquals(log, 'abc', 'for loop')
end


-- Describe this function...
function test_repeat()
  count = 0
  for count2 = 1, 10 do
    count = count + 1
  end
  assertEquals(count, 10, 'repeat 10')
end


-- Describe this function...
function test_while()
  while false do
    unittest_fail('while 0')
  end
  while not true do
    unittest_fail('until 0')
  end
  count = 1
  while count ~= 10 do
    count = count + 1
  end
  assertEquals(count, 10, 'while 10')
  count = 1
  while not (count == 10) do
    count = count + 1
  end
  assertEquals(count, 10, 'until 10')
end


-- Describe this function...
function test_repeat_ext()
  count = 0
  for count3 = 1, 10 do
    count = count + 1
  end
  assertEquals(count, 10, 'repeat 10')
end


-- Describe this function...
function test_count_by()
  log = ''
  for x = 1, 8, 2 do
    log = log .. x
  end
  assertEquals(log, '1357', 'count up ints')
  log = ''
  for x = 8, 1, -2 do
    log = log .. x
  end
  assertEquals(log, '8642', 'count down ints')
  loglist = {}
  for x = 1, 8, 1.5 do
    table.insert(loglist, #loglist + 1, x)
  end
  assertEquals(loglist, {1, 2.5, 4, 5.5, 7}, 'count with floats')
  loglist = {}
  x_inc = math.abs(1 - 2)
  if (1 + 0) > (8 + 0) then
    x_inc = -x_inc
  end
  for x = 1 + 0, 8 + 0, x_inc do
    table.insert(loglist, #loglist + 1, x)
  end
  assertEquals(loglist, {1, 2, 3, 4, 5, 6, 7, 8}, 'count up non-trivial ints')
  loglist = {}
  x_inc2 = 2
  if (8 + 0) > (1 + 0) then
    x_inc2 = -x_inc2
  end
  for x = 8 + 0, 1 + 0, x_inc2 do
    table.insert(loglist, #loglist + 1, x)
  end
  assertEquals(loglist, {8, 6, 4, 2}, 'count down non-trivial ints')
  loglist = {}
  x_inc3 = math.abs(1 + 0)
  if (5 + 0.5) > (1 + 0) then
    x_inc3 = -x_inc3
  end
  for x = 5 + 0.5, 1 + 0, x_inc3 do
    table.insert(loglist, #loglist + 1, x)
  end
  assertEquals(loglist, {5.5, 4.5, 3.5, 2.5, 1.5}, 'count with floats')
end


-- Describe this function...
function test_count_loops()
  log = ''
  for x = 1, 8, 1 do
    log = log .. x
  end
  assertEquals(log, '12345678', 'count up')
  log = ''
  for x = 8, 1, -1 do
    log = log .. x
  end
  assertEquals(log, '87654321', 'count down')
  loglist = {}
  x_inc4 = 1
  if (1 + 0) > (4 + 0) then
    x_inc4 = -x_inc4
  end
  for x = 1 + 0, 4 + 0, x_inc4 do
    table.insert(loglist, #loglist + 1, x)
  end
  assertEquals(loglist, {1, 2, 3, 4}, 'count up non-trivial')
  loglist = {}
  x_inc5 = 1
  if (3 + 1) > (1 + 0) then
    x_inc5 = -x_inc5
  end
  for x = 3 + 1, 1 + 0, x_inc5 do
    table.insert(loglist, #loglist + 1, x)
  end
  assertEquals(loglist, {4, 3, 2, 1}, 'count down non-trivial')
end


-- Describe this function...
function test_continue()
  log = ''
  count = 0
  while count ~= 8 do
    count = count + 1
    if count == 5 then
      goto continue
    end
    log = log .. count
    ::continue::
  end
  assertEquals(log, '1234678', 'while continue')
  log = ''
  count = 0
  while not (count == 8) do
    count = count + 1
    if count == 5 then
      goto continue
    end
    log = log .. count
    ::continue::
  end
  assertEquals(log, '1234678', 'until continue')
  log = ''
  for x = 1, 8, 1 do
    if x == 5 then
      goto continue
    end
    log = log .. x
    ::continue::
  end
  assertEquals(log, '1234678', 'count continue')
  log = ''
  for _, x in ipairs({'a', 'b', 'c', 'd'}) do
    if x == 'c' then
      goto continue
    end
    log = log .. x
    ::continue::
  end
  assertEquals(log, 'abd', 'for continue')
end


-- Describe this function...
function test_break()
  count = 1
  while count ~= 10 do
    if count == 5 then
      break
    end
    count = count + 1
  end
  assertEquals(count, 5, 'while break')
  count = 1
  while not (count == 10) do
    if count == 5 then
      break
    end
    count = count + 1
  end
  assertEquals(count, 5, 'until break')
  log = ''
  for x = 1, 8, 1 do
    if x == 5 then
      break
    end
    log = log .. x
  end
  assertEquals(log, '1234', 'count break')
  log = ''
  for _, x in ipairs({'a', 'b', 'c', 'd'}) do
    if x == 'c' then
      break
    end
    log = log .. x
  end
  assertEquals(log, 'ab', 'for break')
end


-- Tests the "single" block.
function test_single()
  assertEquals(math.sqrt(25), 5, 'sqrt')
  assertEquals(math.abs(-25), 25, 'abs')
  assertEquals(-(-25), 25, 'negate')
  assertEquals(math.log(1), 0, 'ln')
  assertEquals(math.log(100, 10), 2, 'log10')
  assertEquals(math.exp(2), 7.38905609893065, 'exp')
  assertEquals(10 ^ 2, 100, 'power10')
end


-- Tests the "arithmetic" block for all operations and checks
-- parenthesis are properly generated for different orders.
function test_arithmetic()
  assertEquals(1 + 2, 3, 'add')
  assertEquals(1 - 2, -1, 'subtract')
  assertEquals(1 - (0 + 2), -1, 'subtract order with add')
  assertEquals(1 - (0 - 2), 3, 'subtract order with subtract')
  assertEquals(4 * 2.5, 10, 'multiply')
  assertEquals(4 * (0 + 2.5), 10, 'multiply order')
  assertEquals(8.2 / -5, -1.64, 'divide')
  assertEquals(8.2 / (0 + -5), -1.64, 'divide order')
  assertEquals(10 ^ 4, 10000, 'power')
  assertEquals(10 ^ (0 + 4), 10000, 'power order')
end


-- Tests the "trig" block.
function test_trig()
  assertEquals(math.sin(math.rad(90)), 1, 'sin')
  assertEquals(math.cos(math.rad(180)), -1, 'cos')
  assertEquals(math.tan(math.rad(0)), 0, 'tan')
  assertEquals(math.deg(math.asin(-1)), -90, 'asin')
  assertEquals(math.deg(math.acos(1)), 0, 'acos')
  assertEquals(math.deg(math.atan(1)), 45, 'atan')
end


-- Tests the "constant" blocks.
function test_constant()
  assertEquals(math.floor(math.pi * 1000), 3141, 'const pi')
  assertEquals(math.floor(math.exp(1) * 1000), 2718, 'const e')
  assertEquals(math.floor(((1 + math.sqrt(5)) / 2) * 1000), 1618, 'const golden')
  assertEquals(math.floor(math.sqrt(2) * 1000), 1414, 'const sqrt 2')
  assertEquals(math.floor(math.sqrt(1 / 2) * 1000), 707, 'const sqrt 0.5')
  assertEquals(9999 < math.huge, true, 'const infinity')
end


function math_isPrime(n)
  -- https://en.wikipedia.org/wiki/Primality_test#Naive_methods
  if n == 2 or n == 3 then
    return true
  end
  -- False if n is NaN, negative, is 1, or not whole.
  -- And false if n is divisible by 2 or 3.
  if not(n > 1) or n % 1 ~= 0 or n % 2 == 0 or n % 3 == 0 then
    return false
  end
  -- Check all the numbers of form 6k +/- 1, up to sqrt(n).
  for x = 6, math.sqrt(n) + 1.5, 6 do
    if n % (x - 1) == 0 or n % (x + 1) == 0 then
      return false
    end
  end
  return true
end

-- Tests the "number property" blocks.
function test_number_properties()
  assertEquals(42 % 2 == 0, true, 'even')
  assertEquals(42.1 % 2 == 1, false, 'odd')
  assertEquals(math_isPrime(5), true, 'prime 5')
  assertEquals(math_isPrime(5 + 2), true, 'prime 5 + 2 (extra parentheses)')
  assertEquals(math_isPrime(25), false, 'prime 25')
  assertEquals(math_isPrime(-31.1), false, 'prime negative')
  assertEquals(math.pi % 1 == 0, false, 'whole')
  assertEquals(math.huge > 0, true, 'positive')
  assertEquals(5 + 2 > 0, true, '5 + 2 is positive (extra parentheses)')
  assertEquals(-42 < 0, true, 'negative')
  assertEquals(3 + 2 < 0, false, '3 + 2 is negative (extra parentheses)')
  assertEquals(42 % 2 == 0, true, 'divisible')
  assertEquals(not nil, true, 'divisible by 0')
end


-- Tests the "round" block.
function test_round()
  assertEquals(math.floor(42.42 + .5), 42, 'round')
  assertEquals(math.ceil(-42.42), -42, 'round up')
  assertEquals(math.floor(42.42), 42, 'round down')
end


-- Tests the "change" block.
function test_change()
  varToChange = 100
  varToChange = varToChange + 42
  assertEquals(varToChange, 142, 'change')
end


function math_sum(t)
  local result = 0
  for _, v in ipairs(t) do
    result = result + v
  end
  return result
end

function math_min(t)
  if #t == 0 then
    return 0
  end
  local result = math.huge
  for _, v in ipairs(t) do
    if v < result then
      result = v
    end
  end
  return result
end

function math_max(t)
  if #t == 0 then
    return 0
  end
  local result = -math.huge
  for _, v in ipairs(t) do
    if v > result then
      result = v
    end
  end
  return result
end

function math_average(t)
  if #t == 0 then
    return 0
  end
  return math_sum(t) / #t
end

function math_median(t)
  -- Source: http://lua-users.org/wiki/SimpleStats
  if #t == 0 then
    return 0
  end
  local temp = {}
  for _, v in ipairs(t) do
    if type(v) == 'number' then
      table.insert(temp, v)
    end
  end
  table.sort(temp)
  if #temp % 2 == 0 then
    return (temp[#temp / 2] + temp[(#temp / 2) + 1]) / 2
  else
    return temp[math.ceil(#temp / 2)]
  end
end

function math_modes(t)
  -- Source: http://lua-users.org/wiki/SimpleStats
  local counts = {}
  for _, v in ipairs(t) do
    if counts[v] == nil then
      counts[v] = 1
    else
      counts[v] = counts[v] + 1
    end
  end
  local biggestCount = 0
  for _, v  in pairs(counts) do
    if v > biggestCount then
      biggestCount = v
    end
  end
  local temp = {}
  for k, v in pairs(counts) do
    if v == biggestCount then
      table.insert(temp, k)
    end
  end
  return temp
end

function math_standard_deviation(t)
  local m
  local vm
  local total = 0
  local count = 0
  local result
  m = #t == 0 and 0 or math_sum(t) / #t
  for _, v in ipairs(t) do
    if type(v) == 'number' then
      vm = v - m
      total = total + (vm * vm)
      count = count + 1
    end
  end
  result = math.sqrt(total / (count-1))
  return result
end

function math_random_list(t)
  if #t == 0 then
    return nil
  end
  return t[math.random(#t)]
end

function first_index(t, elem)
  for k, v in ipairs(t) do
    if v == elem then
      return k
    end
  end
  return 0
end

-- Tests the "list operation" blocks.
function test_operations_on_list()
  assertEquals(math_sum({3, 4, 5}), 12, 'sum')
  assertEquals(math_min({3, 4, 5}), 3, 'min')
  assertEquals(math_max({3, 4, 5}), 5, 'max')
  assertEquals(math_average({3, 4, 5}), 4, 'average')
  assertEquals(math_median({3, 4, 5, 1}), 3.5, 'median')
  assertEquals(math_modes({3, 4, 3}), {3}, 'modes')
  assertEquals(math_modes({3, 4, 3, 1, 4}), {3, 4}, 'modes multiple')
  assertEquals(math_standard_deviation({3, 3, 3}), 0, 'standard dev')
  assertEquals(first_index({3, 4, 5}, math_random_list({3, 4, 5})) > 0, true, 'random')
end


-- Tests the "mod" block.
function test_mod()
  assertEquals(42 % 5, 2, 'mod')
end


-- Tests the "constrain" block.
function test_constraint()
  assertEquals(math.min(math.max(100, 0), 42), 42, 'constraint')
end


-- Tests the "random integer" block.
function test_random_integer()
  rand = math.random(5, 10)
  assertEquals(rand >= 5 and rand <= 10, true, 'randRange')
  assertEquals(rand % 1 == 0, true, 'randInteger')
end


-- Tests the "random fraction" block.
function test_random_fraction()
  rand = math.random()
  assertEquals(rand >= 0 and rand <= 1, true, 'randFloat')
end


-- Describe this function...
function test_atan2()
  assertEquals(math.deg(math.atan2(5, -5)), 135, 'atan2')
  assertEquals(math.deg(math.atan2(-12, 0)), -90, 'atan2')
end


-- Checks that the number of calls is one in order
-- to confirm that a function was only called once.
function check_number_of_calls(test_name)
  test_name = test_name .. 'number of calls'
  assertEquals(number_of_calls, 1, test_name)
end


-- Tests the "create text with" block with varying number of inputs.
function test_create_text()
  assertEquals('', '', 'no text')
  assertEquals(tostring('Hello'), 'Hello', 'create single')
  assertEquals(tostring(-1), '-1', 'create single number')
  assertEquals('K' .. 9, 'K9', 'create double text')
  assertEquals(4 .. 2, '42', 'create double text numbers')
  assertEquals(table.concat({1, 2, 3}), '123', 'create triple')
  assertEquals(table.concat({1, true and 0 or nil, 'M'}), '10M', 'create order')
end


-- Creates an empty string for use with the empty test.
function get_empty()
  return ''
end


-- Tests the "is empty" block".
function test_empty_text()
  assertEquals(#'Google' == 0, false, 'not empty')
  assertEquals(#'' == 0, true, 'empty')
  assertEquals(#get_empty() == 0, true, 'empty complex')
  assertEquals(#(true and '' or nil) == 0, true, 'empty order')
end


-- Tests the "length" block.
function test_text_length()
  assertEquals(#'', 0, 'zero length')
  assertEquals(#'Google', 6, 'non-zero length')
  assertEquals(#(true and 'car' or nil), 3, 'length order')
end


-- Tests the "append text" block with different types of parameters.
function test_append()
  item = 'Miserable'
  item = item .. 'Failure'
  assertEquals(item, 'MiserableFailure', 'append text')
  item = 12
  item = item .. 34
  assertEquals(item, '1234', 'append number')
  item = 'Something '
  item = item .. (true and 'Positive' or nil)
  assertEquals(item, 'Something Positive', 'append order')
end


function firstIndexOf(str, substr)
  local i = string.find(str, substr, 1, true)
  if i == nil then
    return 0
  end
  return i
end

function lastIndexOf(str, substr)
  local i = string.find(string.reverse(str), string.reverse(substr), 1, true)
  if i then
    return #str + 2 - i - #substr
  end
  return 0
end

-- Tests the "find" block with a variable.
function test_find_text_simple()
  text = 'Banana'
  assertEquals(firstIndexOf(text, 'an'), 2, 'find first simple')
  assertEquals(lastIndexOf(text, 'an'), 4, 'find last simple')
  assertEquals(firstIndexOf(text, 'Peel'), 0, 'find none simple')
end


-- Creates a string for use with the find test.
function get_fruit()
  number_of_calls = number_of_calls + 1
  return 'Banana'
end


-- Tests the "find" block with a function call.
function test_find_text_complex()
  number_of_calls = 0
  assertEquals(firstIndexOf(get_fruit(), 'an'), 2, 'find first complex')
  check_number_of_calls('find first complex')
  number_of_calls = 0
  assertEquals(firstIndexOf(true and get_fruit() or nil, 'an'), 2, 'find first order complex')
  check_number_of_calls('find first order complex')
  number_of_calls = 0
  assertEquals(lastIndexOf(get_fruit(), 'an'), 4, 'find last complex')
  check_number_of_calls('find last complex')
  number_of_calls = 0
  assertEquals(lastIndexOf(true and get_fruit() or nil, 'an'), 4, 'find last order complex')
  check_number_of_calls('find last order complex')
  number_of_calls = 0
  assertEquals(firstIndexOf(get_fruit(), 'Peel'), 0, 'find none complex')
  check_number_of_calls('find none complex')
  number_of_calls = 0
  assertEquals(firstIndexOf(true and get_fruit() or nil, 'Peel'), 0, 'find none order complex')
  check_number_of_calls('find none order complex')
end


function text_random_letter(str)
  local index = math.random(string.len(str))
  return string.sub(str, index, index)
end

function text_char_at(str, index)
  return string.sub(str, index, index)
end

-- Tests the "get letter" block with a variable.
function test_get_text_simple()
  text = 'Blockly'
  assertEquals(string.sub(text, 1, 1), 'B', 'get first simple')
  assertEquals(string.sub(text, -1, -1), 'y', 'get last simple')
  assertEquals(firstIndexOf(text, text_random_letter(text)) > 0, true, 'get random simple')
  assertEquals(string.sub(text, 3, 3), 'o', 'get # simple')
  assertEquals(text_char_at(text, true and 3 or nil), 'o', 'get # order simple')
  assertEquals(string.sub(text, -3, -3), 'k', 'get #-end simple')
  -- The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(text_char_at(text, -(0 + 3)), 'k', 'get #-end order simple')
end


-- Creates a string for use with the get test.
function get_Blockly()
  number_of_calls = number_of_calls + 1
  return 'Blockly'
end


-- Tests the "get letter" block with a function call.
function test_get_text_complex()
  text = 'Blockly'
  number_of_calls = 0
  assertEquals(string.sub(get_Blockly(), 1, 1), 'B', 'get first complex')
  check_number_of_calls('get first complex')
  number_of_calls = 0
  assertEquals(string.sub(true and get_Blockly() or nil, 1, 1), 'B', 'get first order complex')
  check_number_of_calls('get first order complex')
  number_of_calls = 0
  assertEquals(string.sub(get_Blockly(), -1, -1), 'y', 'get last complex')
  check_number_of_calls('get last complex')
  number_of_calls = 0
  assertEquals(string.sub(true and get_Blockly() or nil, -1, -1), 'y', 'get last order complex')
  check_number_of_calls('get last order complex')
  number_of_calls = 0
  assertEquals(firstIndexOf(text, text_random_letter(get_Blockly())) > 0, true, 'get random complex')
  check_number_of_calls('get random complex')
  number_of_calls = 0
  assertEquals(firstIndexOf(text, text_random_letter(true and get_Blockly() or nil)) > 0, true, 'get random order complex')
  check_number_of_calls('get random order complex')
  number_of_calls = 0
  assertEquals(string.sub(get_Blockly(), 3, 3), 'o', 'get # complex')
  check_number_of_calls('get # complex')
  number_of_calls = 0
  assertEquals(text_char_at(true and get_Blockly() or nil, true and 3 or nil), 'o', 'get # order complex')
  check_number_of_calls('get # order complex')
  number_of_calls = 0
  assertEquals(string.sub(get_Blockly(), -3, -3), 'k', 'get #-end complex')
  check_number_of_calls('get #-end complex')
  number_of_calls = 0
  -- The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(text_char_at(true and get_Blockly() or nil, -(0 + 3)), 'k', 'get #-end order complex')
  check_number_of_calls('get #-end order complex')
end


-- Creates a string for use with the substring test.
function get_numbers()
  number_of_calls = number_of_calls + 1
  return '123456789'
end


-- Tests the "get substring" block with a variable.
function test_substring_simple()
  text = '123456789'
  assertEquals(string.sub(text, 2, 3), '23', 'substring # simple')
  assertEquals(string.sub(text, true and 2 or nil, true and 3 or nil), '23', 'substring # simple order')
  assertEquals(string.sub(text, -3, -2), '78', 'substring #-end simple')
  -- The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(string.sub(text, -(0 + 3), -(0 + 2)), '78', 'substring #-end simple order')
  assertEquals(string.sub(text, 1, -1), text, 'substring first-last simple')
  assertEquals(string.sub(text, 2, -2), '2345678', 'substring # #-end simple')
  assertEquals(string.sub(text, -7, 4), '34', 'substring #-end # simple')
  assertEquals(string.sub(text, 1, 4), '1234', 'substring first # simple')
  assertEquals(string.sub(text, 1, -2), '12345678', 'substring first #-end simple')
  assertEquals(string.sub(text, 7, -1), '789', 'substring # last simple')
  assertEquals(string.sub(text, -3, -1), '789', 'substring #-end last simple')
  assertEquals(string.sub(text, 1, -1), '123456789', 'substring all with # #-end simple')
  assertEquals(string.sub(text, -9, 9), '123456789', 'substring all with #-end # simple')
  -- Checks that the whole string is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where substring uses [x:length - y] for # #-end.
  assertEquals(string.sub(text, 0 + 1, -(0 + 1)), '123456789', 'substring all with # #-end math simple')
end


-- Tests the "get substring" block with a function call.
function test_substring_complex()
  number_of_calls = 0
  assertEquals(string.sub(get_numbers(), 2, 3), '23', 'substring # complex')
  check_number_of_calls('substring # complex')
  number_of_calls = 0
  assertEquals(string.sub(true and get_numbers() or nil, true and 2 or nil, true and 3 or nil), '23', 'substring # complex order')
  check_number_of_calls('substring # complex order')
  number_of_calls = 0
  -- The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(string.sub(get_numbers(), -3, -2), '78', 'substring #-end complex')
  check_number_of_calls('substring #-end complex')
  number_of_calls = 0
  assertEquals(string.sub(true and get_numbers() or nil, -(0 + 3), -(0 + 2)), '78', 'substring #-end order order')
  check_number_of_calls('substring #-end order order')
  number_of_calls = 0
  assertEquals(string.sub(get_numbers(), 1, -1), text, 'substring first-last')
  check_number_of_calls('substring first-last')
  number_of_calls = 0
  assertEquals(string.sub(get_numbers(), 2, -2), '2345678', 'substring # #-end complex')
  check_number_of_calls('substring # #-end complex')
  number_of_calls = 0
  assertEquals(string.sub(get_numbers(), -7, 4), '34', 'substring #-end # complex')
  check_number_of_calls('substring #-end # complex')
  number_of_calls = 0
  assertEquals(string.sub(get_numbers(), 1, 4), '1234', 'substring first # complex')
  check_number_of_calls('substring first # complex')
  number_of_calls = 0
  assertEquals(string.sub(get_numbers(), 1, -2), '12345678', 'substring first #-end complex')
  check_number_of_calls('substring first #-end complex')
  number_of_calls = 0
  assertEquals(string.sub(get_numbers(), 7, -1), '789', 'substring # last complex')
  check_number_of_calls('substring # last complex')
  number_of_calls = 0
  assertEquals(string.sub(get_numbers(), -3, -1), '789', 'substring #-end last complex')
  check_number_of_calls('substring #-end last complex')
  number_of_calls = 0
  assertEquals(string.sub(get_numbers(), 1, -1), '123456789', 'substring all with # #-end complex')
  check_number_of_calls('substring all with # #-end complex')
  number_of_calls = 0
  assertEquals(string.sub(get_numbers(), -9, 9), '123456789', 'substring all with #-end # complex')
  check_number_of_calls('substring all with #-end # complex')
  number_of_calls = 0
  -- Checks that the whole string is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where substring uses [x:length - y] for # #-end.
  assertEquals(string.sub(get_numbers(), 0 + 1, -(0 + 1)), '123456789', 'substring all with # #-end math complex')
  check_number_of_calls('substring all with # #-end math complex')
end


function text_titlecase(str)
  local buf = {}
  local inWord = false
  for i = 1, #str do
    local c = string.sub(str, i, i)
    if inWord then
      table.insert(buf, string.lower(c))
      if string.find(c, "%s") then
        inWord = false
      end
    else
      table.insert(buf, string.upper(c))
      inWord = true
    end
  end
  return table.concat(buf)
end

-- Tests the "change casing" block.
function test_case()
  text = 'Hello World'
  assertEquals(string.upper(text), 'HELLO WORLD', 'uppercase')
  assertEquals(string.upper(true and text or nil), 'HELLO WORLD', 'uppercase order')
  text = 'Hello World'
  assertEquals(string.lower(text), 'hello world', 'lowercase')
  assertEquals(string.lower(true and text or nil), 'hello world', 'lowercase order')
  text = 'heLLo WorlD'
  assertEquals(text_titlecase(text), 'Hello World', 'titlecase')
  assertEquals(text_titlecase(true and text or nil), 'Hello World', 'titlecase order')
end


-- Tests the "trim" block.
function test_trim()
  text = '   abc def   '
  assertEquals(string.gsub(text, "^%s*(.-)%s*$", "%1"), 'abc def', 'trim both')
  assertEquals(string.gsub(true and text or nil, "^%s*(.-)%s*$", "%1"), 'abc def', 'trim both order')
  assertEquals(string.gsub(text, "^%s*(,-)", "%1"), 'abc def   ', 'trim left')
  assertEquals(string.gsub(true and text or nil, "^%s*(,-)", "%1"), 'abc def   ', 'trim left order')
  assertEquals(string.gsub(text, "(.-)%s*$", "%1"), '   abc def', 'trim right')
  assertEquals(string.gsub(true and text or nil, "(.-)%s*$", "%1"), '   abc def', 'trim right order')
end


function text_count(haystack, needle)
  if #needle == 0 then
    return #haystack + 1
  end
  local i = 1
  local count = 0
  while true do
    i = string.find(haystack, needle, i, true)
    if i == nil then
      break
    end
    count = count + 1
    i = i + #needle
  end
  return count
end

-- Tests the "trim" block.
function test_count_text()
  text = 'woolloomooloo'
  assertEquals(text_count(text, 'o'), 8, 'len 1')
  assertEquals(text_count(text, 'oo'), 4, 'len 2')
  assertEquals(text_count(text, 'loo'), 2, 'len 3')
  assertEquals(text_count(text, 'wool'), 1, 'start')
  assertEquals(text_count(text, 'chicken'), 0, 'missing')
  assertEquals(text_count(text, ''), 14, 'empty needle')
  assertEquals(text_count('', 'chicken'), 0, 'empty source')
end


-- Tests the "trim" block.
function test_text_reverse()
  assertEquals(string.reverse(''), '', 'empty string')
  assertEquals(string.reverse('a'), 'a', 'len 1')
  assertEquals(string.reverse('ab'), 'ba', 'len 2')
  assertEquals(string.reverse('woolloomooloo'), 'ooloomoolloow', 'longer')
end


function text_replace(haystack, needle, replacement)
  local buf = {}
  local i = 1
  while i <= #haystack do
    if string.sub(haystack, i, i + #needle - 1) == needle then
      for j = 1, #replacement do
        table.insert(buf, string.sub(replacement, j, j))
      end
      i = i + #needle
    else
      table.insert(buf, string.sub(haystack, i, i))
      i = i + 1
    end
  end
  return table.concat(buf)
end

-- Tests the "trim" block.
function test_replace()
  assertEquals(text_replace('woolloomooloo', 'oo', '123'), 'w123ll123m123l123', 'replace all instances 1')
  assertEquals(text_replace('woolloomooloo', '.oo', 'X'), 'woolloomooloo', 'literal string replacement')
  assertEquals(text_replace('woolloomooloo', 'abc', 'X'), 'woolloomooloo', 'not found')
  assertEquals(text_replace('woolloomooloo', 'o', ''), 'wllml', 'empty replacement 1')
  assertEquals(text_replace('aaaaa', 'aaaaa', ''), '', 'empty replacement 2')
  assertEquals(text_replace('aaaaa', 'a', ''), '', 'empty replacement 3')
  assertEquals(text_replace('', 'a', 'chicken'), '', 'empty source')
end


-- Checks that the number of calls is one in order
-- to confirm that a function was only called once.
function check_number_of_calls2(test_name)
  test_name = test_name .. 'number of calls'
  assertEquals(number_of_calls, 1, test_name)
end


function create_list_repeated(item, count)
  local t = {}
  for i = 1, count do
    table.insert(t, item)
  end
  return t
end

-- Tests the "create list with" and "create empty list" blocks.
function test_create_lists()
  assertEquals({}, {}, 'create empty')
  assertEquals({true, 'love'}, {true, 'love'}, 'create items')
  assertEquals(create_list_repeated('Eject', 3), {'Eject', 'Eject', 'Eject'}, 'create repeated')
  assertEquals(create_list_repeated('Eject', 0 + 3), {'Eject', 'Eject', 'Eject'}, 'create repeated order')
end


-- Creates an empty list for use with the empty test.
function get_empty_list()
  return {}
end


-- Tests the "is empty" block.
function test_lists_empty()
  assertEquals(#{0} == 0, false, 'not empty')
  assertEquals(#{} == 0, true, 'empty')
  assertEquals(#get_empty_list() == 0, true, 'empty complex')
  assertEquals(#(true and {} or nil) == 0, true, 'empty order')
end


-- Tests the "length" block.
function test_lists_length()
  assertEquals(#{}, 0, 'zero length')
  assertEquals(#{'cat'}, 1, 'one length')
  assertEquals(#{'cat', true, {}}, 3, 'three length')
  assertEquals(#(true and {'cat', true} or nil), 2, 'two length order')
end


function last_index(t, elem)
  for i = #t, 1, -1 do
    if t[i] == elem then
      return i
    end
  end
  return 0
end

-- Tests the "find" block with a variable.
function test_find_lists_simple()
  list = {'Alice', 'Eve', 'Bob', 'Eve'}
  assertEquals(first_index(list, 'Eve'), 2, 'find first simple')
  assertEquals(last_index(list, 'Eve'), 4, 'find last simple')
  assertEquals(first_index(list, 'Dave'), 0, 'find none simple')
end


-- Creates a list for use with the find test.
function get_names()
  number_of_calls = number_of_calls + 1
  return {'Alice', 'Eve', 'Bob', 'Eve'}
end


-- Tests the "find" block with a function call.
function test_find_lists_complex()
  number_of_calls = 0
  assertEquals(first_index(get_names(), 'Eve'), 2, 'find first complex')
  check_number_of_calls('find first complex')
  number_of_calls = 0
  assertEquals(first_index(true and get_names() or nil, 'Eve'), 2, 'find first order complex')
  check_number_of_calls('find first order complex')
  number_of_calls = 0
  assertEquals(last_index(get_names(), 'Eve'), 4, 'find last complex')
  check_number_of_calls('find last complex')
  number_of_calls = 0
  assertEquals(last_index(true and get_names() or nil, 'Eve'), 4, 'find last order complex')
  check_number_of_calls('find last order complex')
  number_of_calls = 0
  assertEquals(first_index(get_names(), 'Dave'), 0, 'find none complex')
  check_number_of_calls('find none complex')
  number_of_calls = 0
  assertEquals(first_index(true and get_names() or nil, 'Dave'), 0, 'find none order complex')
  check_number_of_calls('find none order complex')
end


-- Tests the "get" block with a variable.
function test_get_lists_simple()
  list = {'Kirk', 'Spock', 'McCoy'}
  assertEquals(list[1], 'Kirk', 'get first simple')
  assertEquals(list[#list], 'McCoy', 'get last simple')
  assertEquals(first_index(list, list[math.random(#list)]) > 0, true, 'get random simple')
  assertEquals(list[2], 'Spock', 'get # simple')
  assertEquals(list[true and 2 or nil], 'Spock', 'get # order simple')
  assertEquals(list[#list + 1 - 3], 'Kirk', 'get #-end simple')
  -- The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(list[#list + 1 - (0 + 3)], 'Kirk', 'get #-end order simple')
end


function list_get_last(t)
  return t[#t]
end

function list_get_random(t)
  return t[math.random(#t)]
end

function list_get_from_end(t, at)
  return t[#t + 1 - at]
end

-- Tests the "get" block with create list call.
function test_get_lists_create_list()
  assertEquals(({'Kirk', 'Spock', 'McCoy'})[1], 'Kirk', 'get first create list')
  assertEquals(list_get_last(({'Kirk', 'Spock', 'McCoy'})), 'McCoy', 'get last simple')
  assertEquals(first_index({'Kirk', 'Spock', 'McCoy'}, list_get_random(({'Kirk', 'Spock', 'McCoy'}))) > 0, true, 'get random simple')
  assertEquals(({'Kirk', 'Spock', 'McCoy'})[2], 'Spock', 'get # simple')
  assertEquals(({'Kirk', 'Spock', 'McCoy'})[true and 2 or nil], 'Spock', 'get # order simple')
  assertEquals(list_get_from_end(({'Kirk', 'Spock', 'McCoy'}), 3), 'Kirk', 'get #-end simple')
  -- The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(list_get_from_end(({'Kirk', 'Spock', 'McCoy'}), 0 + 3), 'Kirk', 'get #-end order simple')
end


-- Creates a list for use with the get test.
function get_star_wars()
  number_of_calls = number_of_calls + 1
  return {'Kirk', 'Spock', 'McCoy'}
end


-- Tests the "get" block with a function call.
function test_get_lists_complex()
  list = {'Kirk', 'Spock', 'McCoy'}
  number_of_calls = 0
  assertEquals((get_star_wars())[1], 'Kirk', 'get first complex')
  check_number_of_calls('get first complex')
  number_of_calls = 0
  assertEquals((true and get_star_wars() or nil)[1], 'Kirk', 'get first order complex')
  check_number_of_calls('get first order complex')
  number_of_calls = 0
  assertEquals(list_get_last((get_star_wars())), 'McCoy', 'get last complex')
  check_number_of_calls('get last complex')
  number_of_calls = 0
  assertEquals(list_get_last((true and get_star_wars() or nil)), 'McCoy', 'get last order complex')
  check_number_of_calls('get last order complex')
  number_of_calls = 0
  assertEquals(first_index(list, list_get_random((get_star_wars()))) > 0, true, 'get random complex')
  check_number_of_calls('get random complex')
  number_of_calls = 0
  assertEquals(first_index(list, list_get_random((true and get_star_wars() or nil))) > 0, true, 'get random order complex')
  check_number_of_calls('get random order complex')
  number_of_calls = 0
  assertEquals((get_star_wars())[2], 'Spock', 'get # complex')
  check_number_of_calls('get # complex')
  number_of_calls = 0
  assertEquals((true and get_star_wars() or nil)[true and 2 or nil], 'Spock', 'get # order complex')
  check_number_of_calls('get # order complex')
  number_of_calls = 0
  assertEquals(list_get_from_end((get_star_wars()), 3), 'Kirk', 'get #-end complex')
  check_number_of_calls('get #-end complex')
  number_of_calls = 0
  -- The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(list_get_from_end((true and get_star_wars() or nil), 0 + 3), 'Kirk', 'get #-end order complex')
  check_number_of_calls('get #-end order complex')
end


function list_remove_last(t)
  return table.remove(t, #t)
end

function list_remove_random(t)
  return table.remove(t, math.random(#t))
end

function list_remove_from_end(t, at)
  return table.remove(t, #t + 1 - at)
end

-- Tests the "get and remove" block.
function test_getRemove()
  list = {'Kirk', 'Spock', 'McCoy'}
  assertEquals(table.remove(list, 1), 'Kirk', 'getremove first')
  assertEquals(list, {'Spock', 'McCoy'}, 'getremove first list')
  list = {'Kirk', 'Spock', 'McCoy'}
  assertEquals(table.remove((true and list or nil), 1), 'Kirk', 'getremove first order')
  assertEquals(list, {'Spock', 'McCoy'}, 'getremove first order list')
  list = {'Kirk', 'Spock', 'McCoy'}
  assertEquals(table.remove(list, #list), 'McCoy', 'getremove last')
  assertEquals(list, {'Kirk', 'Spock'}, 'getremove last list')
  list = {'Kirk', 'Spock', 'McCoy'}
  assertEquals(list_remove_last((true and list or nil)), 'McCoy', 'getremove last order')
  assertEquals(list, {'Kirk', 'Spock'}, 'getremove last order list')
  list = {'Kirk', 'Spock', 'McCoy'}
  assertEquals(first_index(list, table.remove(list, math.random(#list))) == 0, true, 'getremove random')
  assertEquals(#list, 2, 'getremove random list')
  list = {'Kirk', 'Spock', 'McCoy'}
  assertEquals(first_index(list, list_remove_random((true and list or nil))) == 0, true, 'getremove random order')
  assertEquals(#list, 2, 'getremove random order list')
  list = {'Kirk', 'Spock', 'McCoy'}
  assertEquals(table.remove(list, 2), 'Spock', 'getremove #')
  assertEquals(list, {'Kirk', 'McCoy'}, 'getremove # list')
  list = {'Kirk', 'Spock', 'McCoy'}
  assertEquals(table.remove((true and list or nil), true and 2 or nil), 'Spock', 'getremove # order')
  assertEquals(list, {'Kirk', 'McCoy'}, 'getremove # order list')
  list = {'Kirk', 'Spock', 'McCoy'}
  assertEquals(table.remove(list, #list + 1 - 3), 'Kirk', 'getremove #-end')
  assertEquals(list, {'Spock', 'McCoy'}, 'getremove #-end list')
  list = {'Kirk', 'Spock', 'McCoy'}
  -- The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(list_remove_from_end((true and list or nil), 0 + 3), 'Kirk', 'getremove #-end order')
  assertEquals(list, {'Spock', 'McCoy'}, 'getremove #-end order list')
end


-- Tests the "remove" block.
function test_remove()
  list = {'Kirk', 'Spock', 'McCoy'}
  table.remove(list, 1)
  assertEquals(list, {'Spock', 'McCoy'}, 'remove first list')
  list = {'Kirk', 'Spock', 'McCoy'}
  table.remove((true and list or nil), 1)
  assertEquals(list, {'Spock', 'McCoy'}, 'remove first order list')
  list = {'Kirk', 'Spock', 'McCoy'}
  table.remove(list, #list)
  assertEquals(list, {'Kirk', 'Spock'}, 'remove last list')
  list = {'Kirk', 'Spock', 'McCoy'}
  tmp_list = (true and list or nil)
  table.remove(tmp_list, #tmp_list)
  assertEquals(list, {'Kirk', 'Spock'}, 'remove last order list')
  list = {'Kirk', 'Spock', 'McCoy'}
  table.remove(list, math.random(#list))
  assertEquals(#list, 2, 'remove random list')
  list = {'Kirk', 'Spock', 'McCoy'}
  tmp_list2 = (true and list or nil)
  table.remove(tmp_list2, math.random(#tmp_list2))
  assertEquals(#list, 2, 'remove random order list')
  list = {'Kirk', 'Spock', 'McCoy'}
  table.remove(list, 2)
  assertEquals(list, {'Kirk', 'McCoy'}, 'remove # list')
  list = {'Kirk', 'Spock', 'McCoy'}
  table.remove((true and list or nil), true and 2 or nil)
  assertEquals(list, {'Kirk', 'McCoy'}, 'remove # order list')
  list = {'Kirk', 'Spock', 'McCoy'}
  table.remove(list, #list + 1 - 3)
  assertEquals(list, {'Spock', 'McCoy'}, 'remove #-end list')
  list = {'Kirk', 'Spock', 'McCoy'}
  -- The order for index for #-end is addition because this will catch
  -- errors in generators where most perform the operation ... - index.
  tmp_list3 = (true and list or nil)
  table.remove(tmp_list3, #tmp_list3 + 1 - (0 + 3))
  assertEquals(list, {'Spock', 'McCoy'}, 'remove #-end order list')
end


-- Tests the "set" block.
function test_set()
  list = {'Picard', 'Riker', 'Crusher'}
  list[1] = 'Jean-Luc'
  assertEquals(list, {'Jean-Luc', 'Riker', 'Crusher'}, 'set first list')
  list = {'Picard', 'Riker', 'Crusher'}
  (true and list or nil)[1] = 'Jean-Luc'
  assertEquals(list, {'Jean-Luc', 'Riker', 'Crusher'}, 'set first order list')
  list = {'Picard', 'Riker', 'Crusher'}
  list[#list] = 'Beverly'
  assertEquals(list, {'Picard', 'Riker', 'Beverly'}, 'set last list')
  list = {'Picard', 'Riker', 'Crusher'}
  tmp_list4 = (true and list or nil)
  tmp_list4[#tmp_list4] = 'Beverly'
  assertEquals(list, {'Picard', 'Riker', 'Beverly'}, 'set last order list')
  list = {'Picard', 'Riker', 'Crusher'}
  list[math.random(#list)] = 'Data'
  assertEquals(#list, 3, 'set random list')
  list = {'Picard', 'Riker', 'Crusher'}
  tmp_list5 = (true and list or nil)
  tmp_list5[math.random(#tmp_list5)] = 'Data'
  assertEquals(#list, 3, 'set random order list')
  list = {'Picard', 'Riker', 'Crusher'}
  list[3] = 'Pulaski'
  assertEquals(list, {'Picard', 'Riker', 'Pulaski'}, 'set # list')
  list = {'Picard', 'Riker', 'Crusher'}
  (true and list or nil)[(true and 3 or nil)] = 'Pulaski'
  assertEquals(list, {'Picard', 'Riker', 'Pulaski'}, 'set # order list')
  list = {'Picard', 'Riker', 'Crusher'}
  list[#list + 1 - 1] = 'Pulaski'
  assertEquals(list, {'Picard', 'Riker', 'Pulaski'}, 'set #-end list')
  list = {'Picard', 'Riker', 'Crusher'}
  -- The order for index for #-end is addition because this will catch
  -- errors in generators where most perform the operation ... - index.
  tmp_list6 = (true and list or nil)
  tmp_list6[#tmp_list6 + 1 - (0 + 2)] = 'Pulaski'
  assertEquals(list, {'Picard', 'Pulaski', 'Crusher'}, 'set #-end order list')
end


-- Tests the "insert" block.
function test_insert()
  list = {'Picard', 'Riker', 'Crusher'}
  table.insert(list, 1, 'Data')
  assertEquals(list, {'Data', 'Picard', 'Riker', 'Crusher'}, 'insert first list')
  list = {'Picard', 'Riker', 'Crusher'}
  table.insert((true and list or nil), 1, 'Data')
  assertEquals(list, {'Data', 'Picard', 'Riker', 'Crusher'}, 'insert first order list')
  list = {'Picard', 'Riker', 'Crusher'}
  table.insert(list, #list + 1, 'Data')
  assertEquals(list, {'Picard', 'Riker', 'Crusher', 'Data'}, 'insert last list')
  list = {'Picard', 'Riker', 'Crusher'}
  tmp_list7 = (true and list or nil)
  table.insert(tmp_list7, #tmp_list7 + 1, 'Data')
  assertEquals(list, {'Picard', 'Riker', 'Crusher', 'Data'}, 'insert last order list')
  list = {'Picard', 'Riker', 'Crusher'}
  table.insert(list, math.random(#list), 'Data')
  assertEquals(#list, 4, 'insert random list')
  list = {'Picard', 'Riker', 'Crusher'}
  tmp_list8 = (true and list or nil)
  table.insert(tmp_list8, math.random(#tmp_list8), 'Data')
  assertEquals(#list, 4, 'insert random order list')
  list = {'Picard', 'Riker', 'Crusher'}
  table.insert(list, 3, 'Data')
  assertEquals(list, {'Picard', 'Riker', 'Data', 'Crusher'}, 'insert # list')
  list = {'Picard', 'Riker', 'Crusher'}
  table.insert((true and list or nil), (true and 3 or nil), 'Data')
  assertEquals(list, {'Picard', 'Riker', 'Data', 'Crusher'}, 'insert # order list')
  list = {'Picard', 'Riker', 'Crusher'}
  table.insert(list, #list + 1 - 1, 'Data')
  assertEquals(list, {'Picard', 'Riker', 'Data', 'Crusher'}, 'insert #-end list')
  list = {'Picard', 'Riker', 'Crusher'}
  -- The order for index for #-end is addition because this will catch
  -- errors in generators where most perform the operation ... - index.
  tmp_list9 = (true and list or nil)
  table.insert(tmp_list9, #tmp_list9 + 1 - (0 + 2), 'Data')
  assertEquals(list, {'Picard', 'Data', 'Riker', 'Crusher'}, 'insert #-end order list')
end


function list_sublist_from_start_from_start(source, at1, at2)
  local t = {}
  local start = at1
  local finish = at2
  for i = start, finish do
    table.insert(t, source[i])
  end
  return t
end

function list_sublist_from_end_from_end(source, at1, at2)
  local t = {}
  local start = #source + 1 - at1
  local finish = #source + 1 - at2
  for i = start, finish do
    table.insert(t, source[i])
  end
  return t
end

function list_sublist_first_last(source)
  local t = {}
  local start = 1
  local finish = #source
  for i = start, finish do
    table.insert(t, source[i])
  end
  return t
end

function list_sublist_from_start_from_end(source, at1, at2)
  local t = {}
  local start = at1
  local finish = #source + 1 - at2
  for i = start, finish do
    table.insert(t, source[i])
  end
  return t
end

function list_sublist_from_end_from_start(source, at1, at2)
  local t = {}
  local start = #source + 1 - at1
  local finish = at2
  for i = start, finish do
    table.insert(t, source[i])
  end
  return t
end

function list_sublist_first_from_start(source, at2)
  local t = {}
  local start = 1
  local finish = at2
  for i = start, finish do
    table.insert(t, source[i])
  end
  return t
end

function list_sublist_first_from_end(source, at2)
  local t = {}
  local start = 1
  local finish = #source + 1 - at2
  for i = start, finish do
    table.insert(t, source[i])
  end
  return t
end

function list_sublist_from_start_last(source, at1)
  local t = {}
  local start = at1
  local finish = #source
  for i = start, finish do
    table.insert(t, source[i])
  end
  return t
end

function list_sublist_from_end_last(source, at1)
  local t = {}
  local start = #source + 1 - at1
  local finish = #source
  for i = start, finish do
    table.insert(t, source[i])
  end
  return t
end

-- Tests the "get sub-list" block with a variable.
function test_sublist_simple()
  list = {'Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour'}
  assertEquals(list_sublist_from_start_from_start(list, 2, 3), {'Challenger', 'Discovery'}, 'sublist # simple')
  assertEquals(list_sublist_from_start_from_start(list, true and 2 or nil, true and 3 or nil), {'Challenger', 'Discovery'}, 'sublist # simple order')
  assertEquals(list_sublist_from_end_from_end(list, 3, 2), {'Discovery', 'Atlantis'}, 'sublist #-end simple')
  -- The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(list_sublist_from_end_from_end(list, 0 + 3, 0 + 2), {'Discovery', 'Atlantis'}, 'sublist #-end simple order')
  assertEquals(list_sublist_first_last(list), list, 'sublist first-last simple')
  changing_list = {'Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour'}
  list_copy = list_sublist_first_last(changing_list)
  table.remove(changing_list, math.random(#changing_list))
  assertEquals(list_copy, list, 'sublist first-last simple copy check')
  assertEquals(list_sublist_from_start_from_end(list, 2, 2), {'Challenger', 'Discovery', 'Atlantis'}, 'sublist # #-end simple')
  assertEquals(list_sublist_from_end_from_start(list, 3, 4), {'Discovery', 'Atlantis'}, 'sublist #-end # simple')
  assertEquals(list_sublist_first_from_start(list, 4), {'Columbia', 'Challenger', 'Discovery', 'Atlantis'}, 'sublist first # simple')
  assertEquals(list_sublist_first_from_end(list, 4), {'Columbia', 'Challenger'}, 'sublist first #-end simple')
  assertEquals(list_sublist_from_start_last(list, 4), {'Atlantis', 'Endeavour'}, 'sublist # last simple')
  assertEquals(list_sublist_from_end_last(list, 4), {'Challenger', 'Discovery', 'Atlantis', 'Endeavour'}, 'sublist #-end last simple')
  assertEquals(list_sublist_from_start_from_end(list, 1, 1), list, 'sublist all with # #-end simple')
  assertEquals(list_sublist_from_end_from_start(list, 5, 5), list, 'sublist all with #-end # simple')
  -- Checks that the whole list is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where sublist uses [x:length - y] for # #-end.
  assertEquals(list_sublist_from_start_from_end(list, 0 + 1, 0 + 1), list, 'sublist all with # #-end math simple')
end


-- Creates a list for use with the sublist test.
function get_space_shuttles()
  number_of_calls = number_of_calls + 1
  return {'Columbia', 'Challenger', 'Discovery', 'Atlantis', 'Endeavour'}
end


-- Tests the "get sub-list" block with a function call.
function test_sublist_complex()
  number_of_calls = 0
  assertEquals(list_sublist_from_start_from_start(get_space_shuttles(), 2, 3), {'Challenger', 'Discovery'}, 'sublist # start complex')
  check_number_of_calls('sublist # start complex')
  number_of_calls = 0
  assertEquals(list_sublist_from_start_from_start(true and get_space_shuttles() or nil, true and 2 or nil, true and 3 or nil), {'Challenger', 'Discovery'}, 'sublist # start order complex')
  check_number_of_calls('sublist # start order complex')
  number_of_calls = 0
  -- The order for index for #-end is addition because this will catch errors in generators where most perform the operation ... - index.
  assertEquals(list_sublist_from_end_from_end(get_space_shuttles(), 3, 2), {'Discovery', 'Atlantis'}, 'sublist # end complex')
  assertEquals(number_of_calls, 1, 'sublist # end complex number of calls')
  number_of_calls = 0
  assertEquals(list_sublist_from_end_from_end(true and get_space_shuttles() or nil, 0 + 3, 0 + 2), {'Discovery', 'Atlantis'}, 'sublist # end order complex')
  check_number_of_calls('sublist # end order complex')
  number_of_calls = 0
  assertEquals(list_sublist_first_last(get_space_shuttles()), list, 'sublist first-last complex')
  check_number_of_calls('sublist first-last complex')
  number_of_calls = 0
  assertEquals(list_sublist_from_start_from_end(get_space_shuttles(), 2, 2), {'Challenger', 'Discovery', 'Atlantis'}, 'sublist # #-end complex')
  check_number_of_calls('sublist # #-end complex')
  number_of_calls = 0
  assertEquals(list_sublist_from_end_from_start(get_space_shuttles(), 3, 4), {'Discovery', 'Atlantis'}, 'sublist #-end # complex')
  check_number_of_calls('sublist #-end # complex')
  number_of_calls = 0
  assertEquals(list_sublist_first_from_start(get_space_shuttles(), 4), {'Columbia', 'Challenger', 'Discovery', 'Atlantis'}, 'sublist first # complex')
  check_number_of_calls('sublist first # complex')
  number_of_calls = 0
  assertEquals(list_sublist_first_from_end(get_space_shuttles(), 4), {'Columbia', 'Challenger'}, 'sublist first #-end complex')
  check_number_of_calls('sublist first #-end complex')
  number_of_calls = 0
  assertEquals(list_sublist_from_start_last(get_space_shuttles(), 4), {'Atlantis', 'Endeavour'}, 'sublist # last complex')
  check_number_of_calls('sublist # last complex')
  number_of_calls = 0
  assertEquals(list_sublist_from_end_last(get_space_shuttles(), 4), {'Challenger', 'Discovery', 'Atlantis', 'Endeavour'}, 'sublist #-end last simple')
  check_number_of_calls('sublist #-end last simple')
  number_of_calls = 0
  assertEquals(list_sublist_from_start_from_end(get_space_shuttles(), 1, 1), list, 'sublist all with # #-end complex')
  check_number_of_calls('sublist all with # #-end complex')
  number_of_calls = 0
  assertEquals(list_sublist_from_end_from_start(get_space_shuttles(), 5, 5), list, 'sublist all with #-end # complex')
  check_number_of_calls('sublist all with #-end # complex')
  number_of_calls = 0
  -- Checks that the whole list is properly retrieved even if the value for start and end is not a simple number. This is especially important in generators where sublist uses [x:length - y] for # #-end.
  assertEquals(list_sublist_from_start_from_end(get_space_shuttles(), 0 + 1, 0 + 1), list, 'sublist all with # #-end math complex')
  check_number_of_calls('sublist all with # #-end math complex')
end


-- Tests the "join" block.
function test_join()
  list = {'Vulcan', 'Klingon', 'Borg'}
  assertEquals(table.concat(list, ','), 'Vulcan,Klingon,Borg', 'join')
  assertEquals(table.concat(true and list or nil, ','), 'Vulcan,Klingon,Borg', 'join order')
end


function list_string_split(input, delim)
  local t = {}
  local pos = 1
  while true do
    next_delim = string.find(input, delim, pos)
    if next_delim == nil then
      table.insert(t, string.sub(input, pos))
      break
    else
      table.insert(t, string.sub(input, pos, next_delim-1))
      pos = next_delim + #delim
    end
  end
  return t
end

-- Tests the "split" block.
function test_split()
  text = 'Vulcan,Klingon,Borg'
  assertEquals(list_string_split(text, ','), {'Vulcan', 'Klingon', 'Borg'}, 'split')
  assertEquals(list_string_split(true and text or nil, ','), {'Vulcan', 'Klingon', 'Borg'}, 'split order')
end


function list_sort(list, typev, direction)
  local t = {}
  for n,v in pairs(list) do table.insert(t, v) end
  local compareFuncs = {
    NUMERIC = function(a, b)
      return (tonumber(tostring(a)) or 0)
          < (tonumber(tostring(b)) or 0) end,
    TEXT = function(a, b)
      return tostring(a) < tostring(b) end,
    IGNORE_CASE = function(a, b)
      return string.lower(tostring(a)) < string.lower(tostring(b)) end
  }
  local compareTemp = compareFuncs[typev]
  local compare = compareTemp
  if direction == -1
  then compare = function(a, b) return compareTemp(b, a) end
  end
  table.sort(t, compare)
  return t
end

-- Tests the "alphabetic sort" block.
function test_sort_alphabetic()
  list = {'Vulcan', 'klingon', 'Borg'}
  assertEquals(list_sort(list,"TEXT", 1), {'Borg', 'Vulcan', 'klingon'}, 'sort alphabetic ascending')
  assertEquals(list_sort(true and list or nil,"TEXT", 1), {'Borg', 'Vulcan', 'klingon'}, 'sort alphabetic ascending order')
end


-- Tests the "alphabetic sort ignore case" block.
function test_sort_ignoreCase()
  list = {'Vulcan', 'klingon', 'Borg'}
  assertEquals(list_sort(list,"IGNORE_CASE", 1), {'Borg', 'klingon', 'Vulcan'}, 'sort ignore case ascending')
  assertEquals(list_sort(true and list or nil,"IGNORE_CASE", 1), {'Borg', 'klingon', 'Vulcan'}, 'sort ignore case ascending order')
end


-- Tests the "numeric sort" block.
function test_sort_numeric()
  list = {8, 18, -1}
  assertEquals(list_sort(list,"NUMERIC", -1), {18, 8, -1}, 'sort numeric descending')
  assertEquals(list_sort(true and list or nil,"NUMERIC", -1), {18, 8, -1}, 'sort numeric descending order')
end


function list_reverse(input)
  local reversed = {}
  for i = #input, 1, -1 do
    table.insert(reversed, input[i])
  end
  return reversed
end

-- Tests the "list reverse" block.
function test_lists_reverse()
  list = {8, 18, -1, 64}
  assertEquals(list_reverse(list), {64, -1, 18, 8}, 'reverse a copy')
  assertEquals(list, {8, 18, -1, 64}, 'reverse a copy original')
  list = {}
  assertEquals(list_reverse(list), {}, 'empty list')
end


-- Describe this function...
function test_procedure()
  procedure_1(8, 2)
  assertEquals(proc_z, 4, 'procedure with global')
  proc_w = false
  procedure_2(false)
  assertEquals(proc_w, true, 'procedure no return')
  proc_w = false
  procedure_2(true)
  assertEquals(proc_w, false, 'procedure return')
end


-- Describe this function...
function procedure_1(proc_x, proc_y)
  proc_z = proc_x / proc_y
end


-- Describe this function...
function procedure_2(proc_x)
  if proc_x then
    return
  end
  proc_w = true
end


-- Describe this function...
function test_function()
  assertEquals(function_1(2, 3), -1, 'function with arguments')
  assertEquals(func_z, 'side effect', 'function with side effect')
  func_a = 'unchanged'
  func_c = 'global'
  assertEquals(function_2(2), '3global', 'function with global')
  assertEquals(func_a, 'unchanged', 'function with scope')
  assertEquals(function_3(true), true, 'function return')
  assertEquals(function_3(false), false, 'function no return')
end


-- Describe this function...
function function_1(func_x, func_y)
  func_z = 'side effect'
  return func_x - func_y
end


-- Describe this function...
function function_2(func_a)
  func_a = func_a + 1
  return func_a .. func_c
end


-- Describe this function...
function function_3(func_a)
  if func_a then
    return true
  end
  return false
end


-- Describe this function...
function recurse(n)
  if n > 0 then
    text = table.concat({recurse(n - 1), n, recurse(n - 1)})
  else
    text = '-'
  end
  return text
end



unittestResults = {}
print('\n====================\n\nRunning suite: Logic')
assertEquals(true, true, 'True')
assertEquals(false, false, 'False')
assertEquals(not false, true, 'Not true')
assertEquals(not true, false, 'Not false')
test_if()
test_ifelse()
test_equalities()
test_and()
test_or()
test_ternary()
print(unittest_report())
unittestResults = nil

unittestResults = {}
print('\n====================\n\nRunning suite: Loops 1')
test_repeat()
test_repeat_ext()
test_while()
test_foreach()
print(unittest_report())
unittestResults = nil

unittestResults = {}
print('\n====================\n\nRunning suite: Loops 2')
test_count_loops()
test_count_by()
print(unittest_report())
unittestResults = nil

unittestResults = {}
print('\n====================\n\nRunning suite: Loops 3')
test_break()
test_continue()
print(unittest_report())
unittestResults = nil

unittestResults = {}
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
unittestResults = nil

unittestResults = {}
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
unittestResults = nil

unittestResults = {}
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
unittestResults = nil

unittestResults = {}
print('\n====================\n\nRunning suite: Variables')
item = 123
assertEquals(item, 123, 'variable')
if2 = 123
assertEquals(if2, 123, 'reserved variable')
print(unittest_report())
unittestResults = nil

local _ = -- Intentionally non-connected variable.
naked

unittestResults = {}
print('\n====================\n\nRunning suite: Functions')
test_procedure()
test_function()
assertEquals(recurse(3), '-1-2-1-3-1-2-1-', 'test recurse')
print(unittest_report())
unittestResults = nil
