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

suite('Names', function () {
  setup(function () {
    sharedTestSetup.call(this);
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });

  test('Safe name', function () {
    const varDB = new Blockly.Names('window,door');
    assert.equal(varDB.safeName(''), 'unnamed', 'SafeName empty.');
    assert.equal(varDB.safeName('foobar'), 'foobar', 'SafeName ok.');
    assert.equal(
      varDB.safeName('9lives'),
      'my_9lives',
      'SafeName number start.',
    );
    assert.equal(varDB.safeName('lives9'), 'lives9', 'SafeName number end.');
    assert.equal(varDB.safeName('!@#$'), '____', 'SafeName special chars.');
    assert.equal(varDB.safeName('door'), 'door', 'SafeName reserved.');
  });

  test('Get name', function () {
    const varDB = new Blockly.Names('window,door');
    assert.equal(varDB.getName('Foo.bar', 'var'), 'Foo_bar', 'Name add #1.');
    assert.equal(varDB.getName('Foo.bar', 'var'), 'Foo_bar', 'Name get #1.');
    assert.equal(varDB.getName('Foo bar', 'var'), 'Foo_bar2', 'Name add #2.');
    assert.equal(varDB.getName('foo BAR', 'var'), 'Foo_bar2', 'Name get #2.');
    assert.equal(varDB.getName('door', 'var'), 'door2', 'Name add #3.');
    assert.equal(varDB.getName('Foo.bar', 'proc'), 'Foo_bar3', 'Name add #4.');
    assert.equal(varDB.getName('Foo.bar', 'var'), 'Foo_bar', 'Name get #1b.');
    assert.equal(varDB.getName('Foo.bar', 'proc'), 'Foo_bar3', 'Name get #4.');

    assert.equal(
      String(varDB.getUserNames('var')),
      'foo.bar,foo bar,door',
      'Get var names.',
    );
    assert.equal(
      String(varDB.getUserNames('proc')),
      'foo.bar',
      'Get proc names.',
    );
  });

  test('Get distinct name', function () {
    const varDB = new Blockly.Names('window,door');
    assert.equal(
      varDB.getDistinctName('Foo.bar', 'var'),
      'Foo_bar',
      'Name distinct #1.',
    );
    assert.equal(
      varDB.getDistinctName('Foo.bar', 'var'),
      'Foo_bar2',
      'Name distinct #2.',
    );
    assert.equal(
      varDB.getDistinctName('Foo.bar', 'proc'),
      'Foo_bar3',
      'Name distinct #3.',
    );
    varDB.reset();
    assert.equal(
      varDB.getDistinctName('Foo.bar', 'var'),
      'Foo_bar',
      'Name distinct #4.',
    );
  });

  test('name equals', function () {
    assert.isTrue(
      Blockly.Names.equals('Foo.bar', 'Foo.bar'),
      'Name equals #1.',
    );
    assert.isFalse(
      Blockly.Names.equals('Foo.bar', 'Foo_bar'),
      'Name equals #2.',
    );
    assert.isTrue(
      Blockly.Names.equals('Foo.bar', 'FOO.BAR'),
      'Name equals #3.',
    );
  });
});
