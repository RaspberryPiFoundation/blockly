/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import sinon from 'sinon';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Dialog utilities', function () {
  let workspace: Blockly.WorkspaceSvg;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    workspace = Blockly.inject('blocklyDiv', DEFAULT_INJECT_OPTIONS);
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
    Blockly.dialog.setAlert();
    Blockly.dialog.setPrompt();
    Blockly.dialog.setConfirm();
    Blockly.dialog.setToast();
  });

  test('use the built in alert by default', function (done) {
    const callback = () => {
      done();
    };
    const message = 'test';
    Blockly.dialog.alert(message, callback);
    const dialog = document.querySelector('dialog');
    assert.isNotNull(dialog);
    assert.include(dialog.textContent, 'test');
    dialog.querySelector<HTMLElement>('.blocklyDialogConfirmButton')?.click();
  });

  test('support setting a custom alert handler', function () {
    const alert = sinon.spy();
    Blockly.dialog.setAlert(alert);
    const callback = () => {};
    const message = 'test';
    Blockly.dialog.alert(message, callback);
    assert.isTrue(alert.calledWith('test', callback));
  });

  test('do not call the built in alert if a custom alert handler is set', function () {
    const alert = sinon.spy();
    Blockly.dialog.setAlert(alert);
    Blockly.dialog.alert('test');
    const dialog = document.querySelector('dialog');
    assert.isNull(dialog);
  });

  test('use the built in confirm by default', function (done) {
    const callback = () => {
      done();
    };
    const message = 'test';
    Blockly.dialog.confirm(message, callback);
    const dialog = document.querySelector('dialog');
    assert.isNotNull(dialog);
    assert.include(dialog.textContent, 'test');
    dialog.querySelector<HTMLElement>('.blocklyDialogCancelButton')?.click();
  });

  test('support setting a custom confirm handler', function () {
    const confirm = sinon.spy();
    Blockly.dialog.setConfirm(confirm);
    const callback = () => {};
    const message = 'test';
    Blockly.dialog.confirm(message, callback);
    assert.isTrue(confirm.calledWith('test', callback));
  });

  test('do not call the built in confirm if a custom confirm handler is set', function () {
    const confirm = sinon.spy();
    Blockly.dialog.setConfirm(confirm);
    const callback = () => {};
    const message = 'test';
    Blockly.dialog.confirm(message, callback);
    const dialog = document.querySelector('dialog');
    assert.isNull(dialog);
  });

  test('invokes the provided callback with the confirmation response', function (done) {
    const callback = (result: boolean) => {
      assert.isTrue(result);
      done();
    };
    const message = 'test';
    Blockly.dialog.confirm(message, callback);
    const dialog = document.querySelector('dialog');
    dialog?.querySelector<HTMLElement>('.blocklyDialogConfirmButton')?.click();
  });

  test('use the built in prompt by default', function (done) {
    const callback = () => {
      done();
    };
    const message = 'test';
    const defaultValue = 'default';
    Blockly.dialog.prompt(message, defaultValue, callback);
    const dialog = document.querySelector('dialog');
    assert.isNotNull(dialog);
    assert.include(dialog.textContent, 'test');
    const input = dialog.querySelector('input');
    assert.equal(input?.value, 'default');
    dialog.querySelector<HTMLElement>('.blocklyDialogCancelButton')?.click();
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

  test('do not call the built in prompt if a custom prompt handler is set', function () {
    const prompt = sinon.spy();
    Blockly.dialog.setPrompt(prompt);
    const callback = () => {};
    const message = 'test';
    const defaultValue = 'default';
    Blockly.dialog.prompt(message, defaultValue, callback);
    const dialog = document.querySelector('dialog');
    assert.isNull(dialog);
  });

  test('invokes the provided callback with the prompt response', function (done) {
    const callback = (response: string | null) => {
      assert.equal(response, 'something');
      done();
    };
    const message = 'test';
    const defaultValue = 'default';
    Blockly.dialog.prompt(message, defaultValue, callback);
    const dialog = document.querySelector('dialog');
    assert.isNotNull(dialog);
    assert.include(dialog.textContent, 'test');
    const input = dialog.querySelector('input');
    assert.isNotNull(input);
    input.value = 'something';
    dialog.querySelector<HTMLElement>('.blocklyDialogConfirmButton')?.click();
  });

  test('use the built-in toast by default', function () {
    const message = 'test toast';
    Blockly.dialog.toast(workspace, {message});
    const toast = workspace.getInjectionDiv().querySelector('.blocklyToast');
    assert.isNotNull(toast);
    assert.equal(toast.textContent, message);
  });

  test('support setting a custom toast handler', function () {
    const toast = sinon.spy();
    Blockly.dialog.setToast(toast);
    const message = 'test toast';
    const options = {message};
    Blockly.dialog.toast(workspace, options);
    assert.isTrue(toast.calledWith(workspace, options));
  });

  test('do not use the built-in toast if a custom toast handler is set', function () {
    const builtInToast = sinon.stub(Blockly.Toast, 'show');

    const toast = sinon.spy();
    Blockly.dialog.setToast(toast);
    const message = 'test toast';
    Blockly.dialog.toast(workspace, {message});
    assert.isFalse(builtInToast.called);

    builtInToast.restore();
  });
});
