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

  test('default to polite assertiveness', function () {
    const message = 'texas toast';
    Blockly.Toast.show(this.workspace, {message, id: 'test'});
    const toast = this.workspace
      .getInjectionDiv()
      .querySelector('.blocklyToast');

    assert.equal(
      toast.getAttribute('aria-live'),
      Blockly.Toast.Assertiveness.POLITE,
    );
  });

  test('respects assertiveness option', function () {
    const message = 'texas toast';
    Blockly.Toast.show(this.workspace, {
      message,
      id: 'test',
      assertiveness: Blockly.Toast.Assertiveness.ASSERTIVE,
    });
    const toast = this.workspace
      .getInjectionDiv()
      .querySelector('.blocklyToast');

    assert.equal(
      toast.getAttribute('aria-live'),
      Blockly.Toast.Assertiveness.ASSERTIVE,
    );
  });
});
