/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Toasts', function () {
  let workspace: Blockly.WorkspaceSvg;
  let clock: sinon.SinonFakeTimers;

  setup(function (this: Mocha.Context) {
    ({clock} = sharedTestSetup.call(this));
    workspace = Blockly.inject('blocklyDiv', DEFAULT_INJECT_OPTIONS);
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  function toastIsVisible(message: string) {
    const toast = workspace.getInjectionDiv().querySelector('.blocklyToast');
    return !!(toast && toast.textContent === message);
  }

  test('can be shown', function () {
    const message = 'texas toast';
    Blockly.Toast.show(workspace, {message});
    assert.isTrue(toastIsVisible(message));
  });

  test('can be shown only once per session', function () {
    const options = {
      message: 'texas toast',
      id: 'test',
      oncePerSession: true,
    };
    Blockly.Toast.show(workspace, options);
    assert.isTrue(toastIsVisible(options.message));
    Blockly.Toast.hide(workspace);
    Blockly.Toast.show(workspace, options);
    assert.isFalse(toastIsVisible(options.message));
  });

  test('oncePerSession is ignored when false', function () {
    const options = {
      message: 'texas toast',
      id: 'some id',
      oncePerSession: true,
    };
    Blockly.Toast.show(workspace, options);
    assert.isTrue(toastIsVisible(options.message));
    Blockly.Toast.hide(workspace);
    options.oncePerSession = false;
    Blockly.Toast.show(workspace, options);
    assert.isTrue(toastIsVisible(options.message));
  });

  test('can be hidden', function () {
    const message = 'texas toast';
    Blockly.Toast.show(workspace, {message});
    assert.isTrue(toastIsVisible(message));
    Blockly.Toast.hide(workspace);
    assert.isFalse(toastIsVisible(message));
  });

  test('can be hidden by ID', function () {
    const message = 'texas toast';
    Blockly.Toast.show(workspace, {message, id: 'test'});
    assert.isTrue(toastIsVisible(message));
    Blockly.Toast.hide(workspace, 'test');
    assert.isFalse(toastIsVisible(message));
  });

  test('hide does not hide toasts with different ID', function () {
    const message = 'texas toast';
    Blockly.Toast.show(workspace, {message, id: 'test'});
    assert.isTrue(toastIsVisible(message));
    Blockly.Toast.hide(workspace, 'test2');
    assert.isTrue(toastIsVisible(message));
  });

  test('are shown for the designated duration', function () {
    const message = 'texas toast';
    Blockly.Toast.show(workspace, {message, duration: 3});
    for (let i = 0; i < 3; i++) {
      assert.isTrue(toastIsVisible(message));
      clock.tick(1000);
    }
    assert.isFalse(toastIsVisible(message));
  });

  test('toast announces message with status role and polite assertiveness', function () {
    const message = 'texas toast';
    Blockly.Toast.show(workspace, {message, id: 'test'});

    clock.tick(11);

    const liveRegion = document.getElementById('blocklyAriaAnnounce');
    assert.include(liveRegion?.textContent, message);
    assert.equal(
      liveRegion?.getAttribute('role'),
      Blockly.utils.aria.Role.STATUS,
    );
    assert.equal(
      liveRegion?.getAttribute('aria-live'),
      Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
    );
  });

  test('respects assertiveness option', function () {
    const message = 'texas toast';
    Blockly.Toast.show(workspace, {
      message,
      id: 'test',
      assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.ASSERTIVE,
    });

    clock.tick(11);

    const liveRegion = document.getElementById('blocklyAriaAnnounce');
    assert.equal(
      liveRegion?.getAttribute('aria-live'),
      Blockly.utils.aria.LiveRegionAssertiveness.ASSERTIVE,
    );
  });

  test('toast is not itself a live region', function () {
    const message = 'texas toast';
    Blockly.Toast.show(workspace, {message, id: 'test'});

    const toast = workspace.getInjectionDiv().querySelector('.blocklyToast');

    assert.isNull(toast?.getAttribute('aria-live'));
    assert.notEqual(
      toast?.getAttribute('role'),
      Blockly.utils.aria.Role.STATUS,
    );
  });

  suite('dismiss focus', function () {
    function closeToast(workspace: Blockly.WorkspaceSvg) {
      const closeButton = workspace
        .getInjectionDiv()
        .querySelector<HTMLElement>('.blocklyToastCloseButton');
      closeButton?.focus();
      closeButton?.click();
    }

    test('restores previously focused node on click', function () {
      const block = workspace.newBlock('text_print');
      block.initSvg();
      block.render();
      Blockly.getFocusManager().focusNode(block);
      Blockly.Toast.show(workspace, {message: 'texas toast'});

      closeToast(workspace);
      assert.isFalse(toastIsVisible('texas toast'));
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
    });

    test('falls back to workspace focus when nothing was previously focused', function () {
      Blockly.Toast.show(workspace, {message: 'texas toast'});

      closeToast(workspace);
      assert.isFalse(toastIsVisible('texas toast'));
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        workspace.getWorkspaceFocusTarget(),
      );
    });
  });
});
