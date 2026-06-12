/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Toasts', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = Blockly.inject('blocklyDiv', {});
    this.liveRegion = document.getElementById('blocklyAriaAnnounce');
    this.toastIsVisible = (message) => {
      const toast = this.workspace
        .getInjectionDiv()
        .querySelector('.blocklyToast');
      return !!(toast && toast.textContent === message);
    };
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  test('can be shown', function () {
    const message = 'texas toast';
    Blockly.Toast.show(this.workspace, {message});
    assert.isTrue(this.toastIsVisible(message));
  });

  test('can be shown only once per session', function () {
    const options = {
      message: 'texas toast',
      id: 'test',
      oncePerSession: true,
    };
    Blockly.Toast.show(this.workspace, options);
    assert.isTrue(this.toastIsVisible(options.message));
    Blockly.Toast.hide(this.workspace);
    Blockly.Toast.show(this.workspace, options);
    assert.isFalse(this.toastIsVisible(options.message));
  });

  test('oncePerSession is ignored when false', function () {
    const options = {
      message: 'texas toast',
      id: 'some id',
      oncePerSession: true,
    };
    Blockly.Toast.show(this.workspace, options);
    assert.isTrue(this.toastIsVisible(options.message));
    Blockly.Toast.hide(this.workspace);
    options.oncePerSession = false;
    Blockly.Toast.show(this.workspace, options);
    assert.isTrue(this.toastIsVisible(options.message));
  });

  test('can be hidden', function () {
    const message = 'texas toast';
    Blockly.Toast.show(this.workspace, {message});
    assert.isTrue(this.toastIsVisible(message));
    Blockly.Toast.hide(this.workspace);
    assert.isFalse(this.toastIsVisible(message));
  });

  test('can be hidden by ID', function () {
    const message = 'texas toast';
    Blockly.Toast.show(this.workspace, {message, id: 'test'});
    assert.isTrue(this.toastIsVisible(message));
    Blockly.Toast.hide(this.workspace, 'test');
    assert.isFalse(this.toastIsVisible(message));
  });

  test('hide does not hide toasts with different ID', function () {
    const message = 'texas toast';
    Blockly.Toast.show(this.workspace, {message, id: 'test'});
    assert.isTrue(this.toastIsVisible(message));
    Blockly.Toast.hide(this.workspace, 'test2');
    assert.isTrue(this.toastIsVisible(message));
  });

  test('are shown for the designated duration', function () {
    const clock = sinon.useFakeTimers();

    const message = 'texas toast';
    Blockly.Toast.show(this.workspace, {message, duration: 3});
    for (let i = 0; i < 3; i++) {
      assert.isTrue(this.toastIsVisible(message));
      clock.tick(1000);
    }
    assert.isFalse(this.toastIsVisible(message));

    clock.restore();
  });

  test('toast announces message with status role and polite assertiveness', function () {
    const message = 'texas toast';
    Blockly.Toast.show(this.workspace, {message, id: 'test'});

    this.clock.tick(11);

    assert.include(this.liveRegion.textContent, message);
    assert.equal(
      this.liveRegion.getAttribute('role'),
      Blockly.utils.aria.Role.STATUS,
    );
    assert.equal(
      this.liveRegion.getAttribute('aria-live'),
      Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
    );
  });

  test('respects assertiveness option', function () {
    const message = 'texas toast';
    Blockly.Toast.show(this.workspace, {
      message,
      id: 'test',
      assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.ASSERTIVE,
    });

    this.clock.tick(11);

    assert.equal(
      this.liveRegion.getAttribute('aria-live'),
      Blockly.utils.aria.LiveRegionAssertiveness.ASSERTIVE,
    );
  });

  test('toast is not itself a live region', function () {
    const message = 'texas toast';
    Blockly.Toast.show(this.workspace, {message, id: 'test'});

    const toast = this.workspace
      .getInjectionDiv()
      .querySelector('.blocklyToast');

    assert.isNull(toast.getAttribute('aria-live'));
    assert.notEqual(toast.getAttribute('role'), Blockly.utils.aria.Role.STATUS);
  });
});
