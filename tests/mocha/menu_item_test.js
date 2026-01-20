/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Menu items', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.menuItem = new Blockly.MenuItem('Hello World');
    this.menuItem.createDom();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  test('can be RTL', function () {
    this.menuItem.setRightToLeft(true);
    assert.isTrue(
      this.menuItem.getElement().classList.contains('blocklyMenuItemRtl'),
    );
  });

  test('can be LTR', function () {
    this.menuItem.setRightToLeft(false);
    assert.isFalse(
      this.menuItem.getElement().classList.contains('blocklyMenuItemRtl'),
    );
  });

  test('can be checked', function () {
    this.menuItem.setCheckable(true);
    this.menuItem.setChecked(true);
    assert.isTrue(
      this.menuItem.getElement().classList.contains('blocklyMenuItemSelected'),
    );
    assert.equal(
      this.menuItem.getElement().getAttribute('aria-selected'),
      'true',
    );
  });

  test('cannot be checked when designated as uncheckable', function () {
    this.menuItem.setCheckable(false);
    this.menuItem.setChecked(true);
    assert.isFalse(
      this.menuItem.getElement().classList.contains('blocklyMenuItemSelected'),
    );
    assert.equal(
      this.menuItem.getElement().getAttribute('aria-selected'),
      'false',
    );
  });

  test('can be unchecked', function () {
    this.menuItem.setCheckable(true);
    this.menuItem.setChecked(false);
    assert.isFalse(
      this.menuItem.getElement().classList.contains('blocklyMenuItemSelected'),
    );
    assert.equal(
      this.menuItem.getElement().getAttribute('aria-selected'),
      'false',
    );
  });

  test('uncheck themselves when designated as non-checkable', function () {
    this.menuItem.setChecked(true);
    this.menuItem.setCheckable(false);

    assert.isFalse(
      this.menuItem.getElement().classList.contains('blocklyMenuItemSelected'),
    );
    assert.equal(
      this.menuItem.getElement().getAttribute('aria-selected'),
      'false',
    );
  });

  test('do not check themselves when designated as checkable', function () {
    this.menuItem.setChecked(false);
    this.menuItem.setCheckable(true);

    assert.isFalse(
      this.menuItem.getElement().classList.contains('blocklyMenuItemSelected'),
    );
    assert.equal(
      this.menuItem.getElement().getAttribute('aria-selected'),
      'false',
    );
  });

  test('adds a checkbox when designated as checkable', function () {
    assert.isNull(
      this.menuItem.getElement().querySelector('.blocklyMenuItemCheckbox'),
    );
    this.menuItem.setCheckable(true);
    assert.isNotNull(
      this.menuItem.getElement().querySelector('.blocklyMenuItemCheckbox'),
    );
  });

  test('removes the checkbox when designated as uncheckable', function () {
    this.menuItem.setCheckable(true);
    assert.isNotNull(
      this.menuItem.getElement().querySelector('.blocklyMenuItemCheckbox'),
    );
    this.menuItem.setCheckable(false);
    assert.isNull(
      this.menuItem.getElement().querySelector('.blocklyMenuItemCheckbox'),
    );
  });

  test('can be highlighted', function () {
    this.menuItem.setHighlighted(true);
    assert.isTrue(
      this.menuItem.getElement().classList.contains('blocklyMenuItemHighlight'),
    );
  });

  test('can be unhighlighted', function () {
    this.menuItem.setHighlighted(false);
    assert.isFalse(
      this.menuItem.getElement().classList.contains('blocklyMenuItemHighlight'),
    );
  });

  test('cannot be highlighted if not enabled', function () {
    this.menuItem.setEnabled(false);
    this.menuItem.setHighlighted(true);
    assert.isFalse(
      this.menuItem.getElement().classList.contains('blocklyMenuItemHighlight'),
    );
  });

  test('can be enabled', function () {
    this.menuItem.setEnabled(true);
    assert.isTrue(this.menuItem.isEnabled());
    assert.isFalse(
      this.menuItem.getElement().classList.contains('blocklyMenuItemDisabled'),
    );
    assert.equal(
      this.menuItem.getElement().getAttribute('aria-disabled'),
      'false',
    );
  });

  test('can be disabled', function () {
    this.menuItem.setEnabled(false);
    assert.isFalse(this.menuItem.isEnabled());
    assert.isTrue(
      this.menuItem.getElement().classList.contains('blocklyMenuItemDisabled'),
    );
    assert.equal(
      this.menuItem.getElement().getAttribute('aria-disabled'),
      'true',
    );
  });

  test('invokes its action callback', function () {
    let called = false;
    const callback = () => {
      called = true;
    };
    this.menuItem.onAction(callback, this);
    this.menuItem.performAction(new Event('click'));
    assert.isTrue(called);
  });
});
