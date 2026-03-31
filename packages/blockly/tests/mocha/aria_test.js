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

suite('Aria', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = Blockly.inject('blocklyDiv', {});
    this.liveRegion = document.getElementById('blocklyAriaAnnounce');
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  test('live region is created', function () {
    assert.isNotNull(this.liveRegion);
  });

  test('live region has polite aria-live', function () {
    assert.equal(this.liveRegion.getAttribute('aria-live'), 'polite');
  });

  test('live region has atomic true', function () {
    assert.equal(this.liveRegion.getAttribute('aria-atomic'), 'true');
  });

  test('live region has status role by default', function () {
    assert.equal(this.liveRegion.getAttribute('role'), 'status');
  });

  test('live region is rendered for screen readers but visually hidden', function () {
    const style = window.getComputedStyle(this.liveRegion);

    // Still rendered for screen readers
    assert.notEqual(style.display, 'none');

    // Visually hidden via hiddenForAria class
    assert.equal(style.position, 'absolute');
    assert.equal(style.left, '-9999px');
    assert.equal(style.width, '1px');
    assert.equal(style.height, '1px');
    assert.equal(style.overflow, 'hidden');
  });

  test('createLiveRegion only creates one region (singleton)', function () {
    // Calling again should not create a duplicate.
    Blockly.utils.aria.initializeGlobalAriaLiveRegion(
      this.workspace.getInjectionDiv(),
    );

    const regions = this.workspace
      .getInjectionDiv()
      .querySelectorAll('#blocklyAriaAnnounce');

    assert.equal(regions.length, 1);
  });

  test('announcement is delayed', function () {
    Blockly.utils.aria.announceDynamicAriaState('Hello world');

    assert.equal(this.liveRegion.textContent, '');

    // Advance past the delay in announceDynamicAriaState.
    this.clock.tick(11);
    assert.include(this.liveRegion.textContent, 'Hello world');
  });

  test('repeated announcements are unique', function () {
    Blockly.utils.aria.announceDynamicAriaState('Block moved');
    this.clock.tick(11);

    const first = this.liveRegion.textContent;

    Blockly.utils.aria.announceDynamicAriaState('Block moved');
    this.clock.tick(11);

    const second = this.liveRegion.textContent;

    assert.notEqual(first, second);
  });

  test('last write wins when called rapidly', function () {
    Blockly.utils.aria.announceDynamicAriaState('First message');
    Blockly.utils.aria.announceDynamicAriaState('Second message');
    Blockly.utils.aria.announceDynamicAriaState('Final message');

    this.clock.tick(11);

    assert.include(this.liveRegion.textContent, 'Final message');
  });

  test('assertive option sets aria-live assertive', function () {
    Blockly.utils.aria.announceDynamicAriaState('Warning', {
      assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.ASSERTIVE,
      role: null,
    });

    this.clock.tick(11);

    assert.equal(this.liveRegion.getAttribute('aria-live'), 'assertive');
  });

  test('role option updates role attribute', function () {
    Blockly.utils.aria.announceDynamicAriaState('Alert message', {
      assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
      role: Blockly.utils.aria.Role.GROUP,
    });

    this.clock.tick(11);

    assert.equal(this.liveRegion.getAttribute('role'), 'group');
  });

  test('role and text update after delay', function () {
    // Initial announcement to establish baseline role + text.
    Blockly.utils.aria.announceDynamicAriaState('Initial message', {
      assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
      role: Blockly.utils.aria.Role.STATUS,
    });
    this.clock.tick(11);

    assert.equal(this.liveRegion.getAttribute('role'), 'status');
    const initialText = this.liveRegion.textContent;

    // Now announce with different role.
    Blockly.utils.aria.announceDynamicAriaState('Group message', {
      assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
      role: Blockly.utils.aria.Role.GROUP,
    });

    // Before delay: role and text should not have changed yet.
    this.clock.tick(5);
    assert.equal(this.liveRegion.getAttribute('role'), 'status');
    assert.equal(this.liveRegion.textContent, initialText);

    // After delay: both should update.
    this.clock.tick(6);
    assert.equal(this.liveRegion.getAttribute('role'), 'group');
    assert.include(this.liveRegion.textContent, 'Group message');
  });
  test('missing role does not clear default status role', function () {
    Blockly.utils.aria.announceDynamicAriaState('Hello world');

    this.clock.tick(11);

    assert.equal(this.liveRegion.getAttribute('role'), 'status');
  });
  test('custom role overrides default status role', function () {
    Blockly.utils.aria.announceDynamicAriaState('Group message', {
      assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
      role: Blockly.utils.aria.Role.GROUP,
    });

    this.clock.tick(11);

    assert.equal(this.liveRegion.getAttribute('role'), 'group');
  });
  test('role reverts to status after custom role when role not provided', function () {
    // First: default
    Blockly.utils.aria.announceDynamicAriaState('Normal message');
    this.clock.tick(11);
    assert.equal(this.liveRegion.getAttribute('role'), 'status');

    // Second: custom role
    Blockly.utils.aria.announceDynamicAriaState('Group message', {
      assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
      role: Blockly.utils.aria.Role.GROUP,
    });
    this.clock.tick(11);
    assert.equal(this.liveRegion.getAttribute('role'), 'group');

    // Third: no role provided should revert to default status.
    Blockly.utils.aria.announceDynamicAriaState('Back to normal');
    this.clock.tick(11);

    assert.equal(this.liveRegion.getAttribute('role'), 'status');
  });
});
