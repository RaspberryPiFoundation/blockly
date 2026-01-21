/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Utils', function () {
  setup(function () {
    sharedTestSetup.call(this);
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });

  test('genUid', function () {
    const uuids = {};
    assert.equal([1, 2, 3].indexOf(4), -1);
    for (let i = 0; i < 1000; i++) {
      const uuid = Blockly.utils.idGenerator.genUid();
      assert.isFalse(uuid in uuids, 'UUID different: ' + uuid);
      uuids[uuid] = true;
    }
  });

  suite('tokenizeInterpolation', function () {
    suite('Basic', function () {
      test('Empty string', function () {
        assert.deepEqual(Blockly.utils.parsing.tokenizeInterpolation(''), []);
      });

      test('No interpolation', function () {
        assert.deepEqual(Blockly.utils.parsing.tokenizeInterpolation('Hello'), [
          'Hello',
        ]);
      });

      test('Unescaped %', function () {
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('Hello%World'),
          ['Hello%World'],
        );
      });

      test('Escaped %', function () {
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('Hello%%World'),
          ['Hello%World'],
        );
      });

      test('Newlines are tokenized', function () {
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('Hello\nWorld'),
          ['Hello', '\n', 'World'],
        );
      });
    });

    suite('Number interpolation', function () {
      test('Single-digit number interpolation', function () {
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('Hello%1World'),
          ['Hello', 1, 'World'],
        );
      });

      test('Multi-digit number interpolation', function () {
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('%123Hello%456World%789'),
          [123, 'Hello', 456, 'World', 789],
        );
      });

      test('Escaped number', function () {
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('Hello %%1 World'),
          ['Hello %1 World'],
        );
      });

      test('Crazy interpolation', function () {
        // No idea what this is supposed to tell you if it breaks. But might
        // as well keep it.
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('%%%x%%0%00%01%'),
          ['%%x%0', 0, 1, '%'],
        );
      });
    });

    suite('String table interpolation', function () {
      test('Simple interpolation', function () {
        Blockly.Msg.STRING_REF = 'test string';
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('%{bky_string_ref}'),
          ['test string'],
        );
      });

      test('Case', function () {
        Blockly.Msg.STRING_REF = 'test string';
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('%{BkY_StRiNg_ReF}'),
          ['test string'],
        );
      });

      test('Surrounding text', function () {
        Blockly.Msg.STRING_REF = 'test string';
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation(
            'before %{bky_string_ref} after',
          ),
          ['before test string after'],
        );
      });

      test('With param', function () {
        Blockly.Msg.WITH_PARAM = 'before %1 after';
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('%{bky_with_param}'),
          ['before ', 1, ' after'],
        );
      });

      test('Recursive reference', function () {
        Blockly.Msg.STRING_REF = 'test string';
        Blockly.Msg.RECURSE = 'before %{bky_string_ref} after';
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('%{bky_recurse}'),
          ['before test string after'],
        );
      });

      test('Number reference', function () {
        Blockly.Msg['1'] = 'test string';
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('%{bky_1}'),
          ['test string'],
        );
      });

      test('Undefined reference', function () {
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('%{bky_undefined}'),
          ['%{bky_undefined}'],
        );
      });

      test('Not prefixed', function () {
        Blockly.Msg.STRING_REF = 'test string';
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('%{string_ref}'),
          ['%{string_ref}'],
        );
      });

      test('Not prefixed, number', function () {
        Blockly.Msg['1'] = 'test string';
        assert.deepEqual(Blockly.utils.parsing.tokenizeInterpolation('%{1}'), [
          '%{1}',
        ]);
      });

      test('Space in ref', function () {
        Blockly.Msg['string ref'] = 'test string';
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('%{bky_string ref}'),
          ['%{bky_string ref}'],
        );
      });

      test('Dash in ref', function () {
        Blockly.Msg['string-ref'] = 'test string';
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('%{bky_string-ref}'),
          ['%{bky_string-ref}'],
        );
      });

      test('Period in ref', function () {
        Blockly.Msg['string.ref'] = 'test string';
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('%{bky_string.ref}'),
          ['%{bky_string.ref}'],
        );
      });

      test('Ampersand in ref', function () {
        Blockly.Msg['string&ref'] = 'test string';
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('%{bky_string&ref}'),
          ['%{bky_string&ref}'],
        );
      });

      test('Unclosed reference', function () {
        Blockly.Msg.UNCLOSED = 'test string';
        assert.deepEqual(
          Blockly.utils.parsing.tokenizeInterpolation('%{bky_unclosed'),
          ['%{bky_unclosed'],
        );
      });
    });
  });

  test('replaceMessageReferences', function () {
    Blockly.Msg.STRING_REF = 'test string';
    Blockly.Msg.SUBREF = 'subref';
    Blockly.Msg.STRING_REF_WITH_ARG = 'test %1 string';
    Blockly.Msg.STRING_REF_WITH_SUBREF = 'test %{bky_subref} string';

    let resultString = Blockly.utils.parsing.replaceMessageReferences('');
    assert.equal(resultString, '', 'Empty string produces empty string');

    resultString = Blockly.utils.parsing.replaceMessageReferences('%%');
    assert.equal(resultString, '%', 'Escaped %');
    resultString =
      Blockly.utils.parsing.replaceMessageReferences('%%{bky_string_ref}');
    assert.equal(resultString, '%{bky_string_ref}', 'Escaped %');

    resultString = Blockly.utils.parsing.replaceMessageReferences('%a');
    assert.equal(
      resultString,
      '%a',
      'Unrecognized % escape code treated as literal',
    );

    resultString =
      Blockly.utils.parsing.replaceMessageReferences('Hello\nWorld');
    assert.equal(resultString, 'Hello\nWorld', 'Newlines are not tokenized');

    resultString = Blockly.utils.parsing.replaceMessageReferences('%1');
    assert.equal(resultString, '%1', 'Interpolation tokens ignored.');
    resultString = Blockly.utils.parsing.replaceMessageReferences('%1 %2');
    assert.equal(resultString, '%1 %2', 'Interpolation tokens ignored.');
    resultString =
      Blockly.utils.parsing.replaceMessageReferences('before %1 after');
    assert.equal(
      resultString,
      'before %1 after',
      'Interpolation tokens ignored.',
    );

    // Blockly.Msg.STRING_REF cases:
    resultString =
      Blockly.utils.parsing.replaceMessageReferences('%{bky_string_ref}');
    assert.equal(resultString, 'test string', 'Message ref dereferenced.');
    resultString = Blockly.utils.parsing.replaceMessageReferences(
      'before %{bky_string_ref} after',
    );
    assert.equal(
      resultString,
      'before test string after',
      'Message ref dereferenced.',
    );

    // Blockly.Msg.STRING_REF_WITH_ARG cases:
    resultString = Blockly.utils.parsing.replaceMessageReferences(
      '%{bky_string_ref_with_arg}',
    );
    assert.equal(
      resultString,
      'test %1 string',
      'Message ref dereferenced with argument preserved.',
    );
    resultString = Blockly.utils.parsing.replaceMessageReferences(
      'before %{bky_string_ref_with_arg} after',
    );
    assert.equal(
      resultString,
      'before test %1 string after',
      'Message ref dereferenced with argument preserved.',
    );

    // Blockly.Msg.STRING_REF_WITH_SUBREF cases:
    resultString = Blockly.utils.parsing.replaceMessageReferences(
      '%{bky_string_ref_with_subref}',
    );
    assert.equal(
      resultString,
      'test subref string',
      'Message ref and subref dereferenced.',
    );
    resultString = Blockly.utils.parsing.replaceMessageReferences(
      'before %{bky_string_ref_with_subref} after',
    );
    assert.equal(
      resultString,
      'before test subref string after',
      'Message ref and subref dereferenced.',
    );
  });

  test('XY_REGEX_', function () {
    const regex = Blockly.utils.svgMath.TEST_ONLY.XY_REGEX;
    let m;
    m = 'INVALID'.match(regex);
    assert.isNull(m);

    m = 'translate(10)'.match(regex);
    assert.equal(m[1], '10', 'translate(10), x');
    assert.isUndefined(m[3], 'translate(10), y');

    m = 'translate(11, 12)'.match(regex);
    assert.equal(m[1], '11', 'translate(11, 12), x');
    assert.equal(m[3], '12', 'translate(11, 12), y');

    m = 'translate(13,14)'.match(regex);
    assert.equal(m[1], '13', 'translate(13,14), x');
    assert.equal(m[3], '14', 'translate(13,14), y');

    m = 'translate(15 16)'.match(regex);
    assert.equal(m[1], '15', 'translate(15 16), x');
    assert.equal(m[3], '16', 'translate(15 16), y');

    m = 'translate(1.23456e+42 0.123456e-42)'.match(regex);
    assert.equal(m[1], '1.23456e+42', 'translate(1.23456e+42 0.123456e-42), x');
    assert.equal(
      m[3],
      '0.123456e-42',
      'translate(1.23456e+42 0.123456e-42), y',
    );
  });

  test('XY_STYLE_REGEX_', function () {
    const regex = Blockly.utils.svgMath.TEST_ONLY.XY_STYLE_REGEX;
    let m;
    m = 'INVALID'.match(regex);
    assert.isNull(m);

    m = 'transform:translate(9px)'.match(regex);
    assert.equal(m[1], '9', 'transform:translate(9px), x');
    assert.isUndefined(m[3], 'transform:translate(9px), y');

    m = 'transform:translate3d(10px)'.match(regex);
    assert.equal(m[1], '10', 'transform:translate3d(10px), x');
    assert.isUndefined(m[3], 'transform:translate(10px), y');

    m = 'transform: translate(11px, 12px)'.match(regex);
    assert.equal(m[1], '11', 'transform: translate(11px, 12px), x');
    assert.equal(m[3], '12', 'transform: translate(11px, 12px), y');

    m = 'transform: translate(13px,14px)'.match(regex);
    assert.equal(m[1], '13', 'transform: translate(13px,14px), x');
    assert.equal(m[3], '14', 'transform: translate(13px,14px), y');

    m = 'transform: translate(15px 16px)'.match(regex);
    assert.equal(m[1], '15', 'transform: translate(15px 16px), x');
    assert.equal(m[3], '16', 'transform: translate(15px 16px), y');

    m = 'transform: translate(1.23456e+42px 0.123456e-42px)'.match(regex);
    assert.equal(
      m[1],
      '1.23456e+42',
      'transform: translate(1.23456e+42px 0.123456e-42px), x',
    );
    assert.equal(
      m[3],
      '0.123456e-42',
      'transform: translate(1.23456e+42px 0.123456e-42px), y',
    );

    m = 'transform:translate3d(20px, 21px, 22px)'.match(regex);
    assert.equal(m[1], '20', 'transform:translate3d(20px, 21px, 22px), x');
    assert.equal(m[3], '21', 'transform:translate3d(20px, 21px, 22px), y');

    m = 'transform:translate3d(23px,24px,25px)'.match(regex);
    assert.equal(m[1], '23', 'transform:translate3d(23px,24px,25px), x');
    assert.equal(m[3], '24', 'transform:translate3d(23px,24px,25px), y');

    m = 'transform:translate3d(26px 27px 28px)'.match(regex);
    assert.equal(m[1], '26', 'transform:translate3d(26px 27px 28px), x');
    assert.equal(m[3], '27', 'transform:translate3d(26px 27px 28px), y');

    m = 'transform:translate3d(1.23456e+42px 0.123456e-42px 42px)'.match(regex);
    assert.equal(
      m[1],
      '1.23456e+42',
      'transform:translate3d(1.23456e+42px 0.123456e-42px 42px), x',
    );
    assert.equal(
      m[3],
      '0.123456e-42',
      'transform:translate3d(1.23456e+42px 0.123456e-42px 42px), y',
    );
  });

  suite('DOM', function () {
    test('addClass', function () {
      const p = document.createElement('p');
      Blockly.utils.dom.addClass(p, 'one');
      assert.equal(p.className, 'one', 'Adding "one"');
      Blockly.utils.dom.addClass(p, 'one');
      assert.equal(p.className, 'one', 'Adding duplicate "one"');
      Blockly.utils.dom.addClass(p, 'two');
      assert.equal(p.className, 'one two', 'Adding "two"');
      Blockly.utils.dom.addClass(p, 'two');
      assert.equal(p.className, 'one two', 'Adding duplicate "two"');
      Blockly.utils.dom.addClass(p, 'three');
      assert.equal(p.className, 'one two three', 'Adding "three"');
    });

    test('hasClass', function () {
      const p = document.createElement('p');
      p.className = ' one three  two three  ';
      assert.isTrue(Blockly.utils.dom.hasClass(p, 'one'), 'Has "one"');
      assert.isTrue(Blockly.utils.dom.hasClass(p, 'two'), 'Has "two"');
      assert.isTrue(Blockly.utils.dom.hasClass(p, 'three'), 'Has "three"');
      assert.isFalse(Blockly.utils.dom.hasClass(p, 'four'), 'Has no "four"');
      assert.isFalse(Blockly.utils.dom.hasClass(p, 't'), 'Has no "t"');
    });

    test('removeClass', function () {
      const p = document.createElement('p');
      p.className = ' one three  two three  ';
      Blockly.utils.dom.removeClass(p, 'two');
      assert.equal(p.className, 'one three', 'Removing "two"');
      Blockly.utils.dom.removeClass(p, 'four');
      assert.equal(p.className, 'one three', 'Removing "four"');
      Blockly.utils.dom.removeClass(p, 'three');
      assert.equal(p.className, 'one', 'Removing "three"');
      Blockly.utils.dom.removeClass(p, 'ne');
      assert.equal(p.className, 'one', 'Removing "ne"');
      Blockly.utils.dom.removeClass(p, 'one');
      assert.equal(p.className, '', 'Removing "one"');
      Blockly.utils.dom.removeClass(p, 'zero');
      assert.equal(p.className, '', 'Removing "zero"');
    });
  });

  suite('String', function () {
    test('shortest string length', function () {
      let len = Blockly.utils.string.shortestStringLength(
        'one,two,three,four,five'.split(','),
      );
      assert.equal(len, 3, 'Length of "one"');
      len = Blockly.utils.string.shortestStringLength(
        'one,two,three,four,five,'.split(','),
      );
      assert.equal(len, 0, 'Length of ""');
      len = Blockly.utils.string.shortestStringLength(['Hello World']);
      assert.equal(len, 11, 'List of one');
      len = Blockly.utils.string.shortestStringLength([]);
      assert.equal(len, 0, 'Empty list');
    });

    test('comment word prefix', function () {
      let len = Blockly.utils.string.commonWordPrefix(
        'one,two,three,four,five'.split(','),
      );
      assert.equal(len, 0, 'No prefix');
      len = Blockly.utils.string.commonWordPrefix(
        'Xone,Xtwo,Xthree,Xfour,Xfive'.split(','),
      );
      assert.equal(len, 0, 'No word prefix');
      len = Blockly.utils.string.commonWordPrefix(
        'abc de,abc de,abc de,abc de'.split(','),
      );
      assert.equal(len, 6, 'Full equality');
      len = Blockly.utils.string.commonWordPrefix('abc deX,abc deY'.split(','));
      assert.equal(len, 4, 'One word prefix');
      len = Blockly.utils.string.commonWordPrefix('abc de,abc deY'.split(','));
      assert.equal(len, 4, 'Overflow no');
      len = Blockly.utils.string.commonWordPrefix('abc de,abc de Y'.split(','));
      assert.equal(len, 6, 'Overflow yes');
      len = Blockly.utils.string.commonWordPrefix(['Hello World']);
      assert.equal(len, 11, 'List of one');
      len = Blockly.utils.string.commonWordPrefix([]);
      assert.equal(len, 0, 'Empty list');
      len = Blockly.utils.string.commonWordPrefix(
        'turn&nbsp;left,turn&nbsp;right'.split(','),
      );
      assert.equal(len, 0, 'No prefix due to &amp;nbsp;');
      len = Blockly.utils.string.commonWordPrefix(
        'turn\u00A0left,turn\u00A0right'.split(','),
      );
      assert.equal(len, 0, 'No prefix due to \\u00A0');
    });

    test('comment word suffix', function () {
      let len = Blockly.utils.string.commonWordSuffix(
        'one,two,three,four,five'.split(','),
      );
      assert.equal(len, 0, 'No suffix');
      len = Blockly.utils.string.commonWordSuffix(
        'oneX,twoX,threeX,fourX,fiveX'.split(','),
      );
      assert.equal(len, 0, 'No word suffix');
      len = Blockly.utils.string.commonWordSuffix(
        'abc de,abc de,abc de,abc de'.split(','),
      );
      assert.equal(len, 6, 'Full equality');
      len = Blockly.utils.string.commonWordSuffix('Xabc de,Yabc de'.split(','));
      assert.equal(len, 3, 'One word suffix');
      len = Blockly.utils.string.commonWordSuffix('abc de,Yabc de'.split(','));
      assert.equal(len, 3, 'Overflow no');
      len = Blockly.utils.string.commonWordSuffix('abc de,Y abc de'.split(','));
      assert.equal(len, 6, 'Overflow yes');
      len = Blockly.utils.string.commonWordSuffix(['Hello World']);
      assert.equal(len, 11, 'List of one');
      len = Blockly.utils.string.commonWordSuffix([]);
      assert.equal(len, 0, 'Empty list');
    });
  });

  suite('Math', function () {
    test('toRadians', function () {
      const quarter = Math.PI / 2;
      assert.equal(Blockly.utils.math.toRadians(-90), -quarter, '-90');
      assert.equal(Blockly.utils.math.toRadians(0), 0, '0');
      assert.equal(Blockly.utils.math.toRadians(90), quarter, '90');
      assert.equal(Blockly.utils.math.toRadians(180), 2 * quarter, '180');
      assert.equal(Blockly.utils.math.toRadians(270), 3 * quarter, '270');
      assert.equal(Blockly.utils.math.toRadians(360), 4 * quarter, '360');
      assert.equal(Blockly.utils.math.toRadians(360 + 90), 5 * quarter, '450');
    });

    test('toDegrees', function () {
      const quarter = Math.PI / 2;
      assert.equal(Blockly.utils.math.toDegrees(-quarter), -90, '-90');
      assert.equal(Blockly.utils.math.toDegrees(0), 0, '0');
      assert.equal(Blockly.utils.math.toDegrees(quarter), 90, '90');
      assert.equal(Blockly.utils.math.toDegrees(2 * quarter), 180, '180');
      assert.equal(Blockly.utils.math.toDegrees(3 * quarter), 270, '270');
      assert.equal(Blockly.utils.math.toDegrees(4 * quarter), 360, '360');
      assert.equal(Blockly.utils.math.toDegrees(5 * quarter), 360 + 90, '450');
    });
  });

  suite('deepMerge', function () {
    test('Merges two objects', function () {
      const target = {a: 1, b: '2', shared: 'this should be overwritten'};
      const source = {c: {deeplyNested: true}, shared: 'I overwrote it'};

      const expected = {...target, ...source};
      const actual = Blockly.utils.object.deepMerge(target, source);

      assert.deepEqual(expected, actual);
    });
    test('Merges objects with arrays', function () {
      const target = {a: 1};
      const source = {b: ['orange', 'lime']};

      const expected = {...target, ...source};
      const actual = Blockly.utils.object.deepMerge(target, source);

      assert.deepEqual(expected, actual);
    });
  });
});
