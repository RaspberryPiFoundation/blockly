/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Tests for the rename script.
 */

import {assert} from 'chai';
import {coerce, compare, lte, gt} from '../bin/versions.js';

suite('Version utils', function () {
  suite('Coercion', function () {
    test('develop is not coerced', function () {
      assert.equal(coerce('develop'), 'develop');
    });

    test('latest is not coerced', function () {
      assert.equal(coerce('latest'), 'latest');
    });

    test('semver is coerced', function () {
      assert.equal(coerce('3'), '3.0.0');
    });
  });

  suite('Comparison', function () {
    test('develop is greater than any semver', function () {
      assert.equal(compare('1000.0.0', 'develop'), -1);
      assert.equal(compare('develop', '1000.0.0'), 1);
    });

    test('develop is greater than latest', function () {
      assert.equal(compare('latest', 'develop'), -1);
      assert.equal(compare('develop', 'latest'), 1);
    });

    test('develop equals develop', function () {
      assert.equal(compare('develop', 'develop'), 0);
    });

    test('latest is greater than any semver', function () {
      assert.equal(compare('1000.0.0', 'latest'), -1);
      assert.equal(compare('latest', '1000.0.0'), 1);
    });

    test('latest equals latest', function () {
      assert.equal(compare('latest', 'latest'), 0);
    });
  });

  suite('Less than or equal', function () {
    test('develop is greater than any semver', function () {
      assert.isTrue(lte('1000.0.0', 'develop'));
      assert.isFalse(lte('develop', '1000.0.0'));
    });

    test('develop is greater than latest', function () {
      assert.isTrue(lte('latest', 'develop'));
      assert.isFalse(lte('develop', 'latest'));
    });

    test('develop equals develop', function () {
      assert.isTrue(lte('develop', 'develop'));
    });

    test('latest is greater than any semver', function () {
      assert.isTrue(lte('1000.0.0', 'latest'));
      assert.isFalse(lte('latest', '1000.0.0'));
    });

    test('latest equals latest', function () {
      assert.isTrue(lte('latest', 'latest'));
    });
  });

  suite('Greater than', function () {
    test('develop is greater than any semver', function () {
      assert.isFalse(gt('1000.0.0', 'develop'));
      assert.isTrue(gt('develop', '1000.0.0'));
    });

    test('develop is greater than latest', function () {
      assert.isFalse(gt('latest', 'develop'));
      assert.isTrue(gt('develop', 'latest'));
    });

    test('develop equals develop', function () {
      assert.isFalse(gt('develop', 'develop'));
    });

    test('latest is greater than any semver', function () {
      assert.isFalse(gt('1000.0.0', 'latest'));
      assert.isTrue(gt('latest', '1000.0.0'));
    });

    test('latest equals latest', function () {
      assert.isFalse(gt('latest', 'latest'));
    });

    test('semver is only greater if first non-zero is greater', function () {
      assert.isFalse(gt('7.2.0', '7.0.0'));
      assert.isFalse(gt('7.2.0', '7.1.0'));
    });
  });
});
