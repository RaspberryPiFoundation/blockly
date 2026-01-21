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

suite('Dialog utilities', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = Blockly.inject('blocklyDiv', {});
  });

  teardown(function () {
    sharedTestTeardown.call(this);
    Blockly.dialog.setAlert();
    Blockly.dialog.setPrompt();
    Blockly.dialog.setConfirm();
    Blockly.dialog.setToast();
  });

  test('use the browser alert by default', function () {
    const alert = sinon.stub(window, 'alert');
    Blockly.dialog.alert('test');
    assert.isTrue(alert.calledWith('test'));
    alert.restore();
  });

  test('support setting a custom alert handler', function () {
    const alert = sinon.spy();
    Blockly.dialog.setAlert(alert);
    const callback = () => {};
    const message = 'test';
    Blockly.dialog.alert(message, callback);
    assert.isTrue(alert.calledWith('test', callback));
  });

  test('do not call the browser alert if a custom alert handler is set', function () {
    const browserAlert = sinon.stub(window, 'alert');

    const alert = sinon.spy();
    Blockly.dialog.setAlert(alert);
    Blockly.dialog.alert(test);
    assert.isFalse(browserAlert.called);

    browserAlert.restore();
  });

  test('use the browser confirm by default', function () {
    const confirm = sinon.stub(window, 'confirm');
    const callback = () => {};
    const message = 'test';
    Blockly.dialog.confirm(message, callback);
    assert.isTrue(confirm.calledWith(message));
    confirm.restore();
  });

  test('support setting a custom confirm handler', function () {
    const confirm = sinon.spy();
    Blockly.dialog.setConfirm(confirm);
    const callback = () => {};
    const message = 'test';
    Blockly.dialog.confirm(message, callback);
    assert.isTrue(confirm.calledWith('test', callback));
  });

  test('do not call the browser confirm if a custom confirm handler is set', function () {
    const browserConfirm = sinon.stub(window, 'confirm');

    const confirm = sinon.spy();
    Blockly.dialog.setConfirm(confirm);
    const callback = () => {};
    const message = 'test';
    Blockly.dialog.confirm(message, callback);
    assert.isFalse(browserConfirm.called);

    browserConfirm.restore();
  });

  test('invokes the provided callback with the confirmation response', function () {
    const confirm = sinon.stub(window, 'confirm').returns(true);
    const callback = sinon.spy();
    const message = 'test';
    Blockly.dialog.confirm(message, callback);
    assert.isTrue(callback.calledWith(true));
    confirm.restore();
  });

  test('use the browser prompt by default', function () {
    const prompt = sinon.stub(window, 'prompt');
    const callback = () => {};
    const message = 'test';
    const defaultValue = 'default';
    Blockly.dialog.prompt(message, defaultValue, callback);
    assert.isTrue(prompt.calledWith(message, defaultValue));
    prompt.restore();
  });

  test('support setting a custom prompt handler', function () {
    const prompt = sinon.spy();
    Blockly.dialog.setPrompt(prompt);
    const callback = () => {};
    const message = 'test';
    const defaultValue = 'default';
    Blockly.dialog.prompt(message, defaultValue, callback);
    assert.isTrue(prompt.calledWith('test', defaultValue, callback));
  });

  test('do not call the browser prompt if a custom prompt handler is set', function () {
    const browserPrompt = sinon.stub(window, 'prompt');

    const prompt = sinon.spy();
    Blockly.dialog.setPrompt(prompt);
    const callback = () => {};
    const message = 'test';
    const defaultValue = 'default';
    Blockly.dialog.prompt(message, defaultValue, callback);
    assert.isFalse(browserPrompt.called);

    browserPrompt.restore();
  });

  test('invokes the provided callback with the prompt response', function () {
    const prompt = sinon.stub(window, 'prompt').returns('something');
    const callback = sinon.spy();
    const message = 'test';
    const defaultValue = 'default';
    Blockly.dialog.prompt(message, defaultValue, callback);
    assert.isTrue(callback.calledWith('something'));
    prompt.restore();
  });

  test('use the built-in toast by default', function () {
    const message = 'test toast';
    Blockly.dialog.toast(this.workspace, {message});
    const toast = this.workspace
      .getInjectionDiv()
      .querySelector('.blocklyToast');
    assert.isNotNull(toast);
    assert.equal(toast.textContent, message);
  });

  test('support setting a custom toast handler', function () {
    const toast = sinon.spy();
    Blockly.dialog.setToast(toast);
    const message = 'test toast';
    const options = {message};
    Blockly.dialog.toast(this.workspace, options);
    assert.isTrue(toast.calledWith(this.workspace, options));
  });

  test('do not use the built-in toast if a custom toast handler is set', function () {
    const builtInToast = sinon.stub(Blockly.Toast, 'show');

    const toast = sinon.spy();
    Blockly.dialog.setToast(toast);
    const message = 'test toast';
    Blockly.dialog.toast(this.workspace, {message});
    assert.isFalse(builtInToast.called);

    builtInToast.restore();
  });
});
