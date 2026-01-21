/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Touch', function () {
  setup(function () {
    sharedTestSetup.call(this);
  });

  teardown(function () {
    Blockly.Touch.clearTouchIdentifier();
    sharedTestTeardown.call(this);
  });

  suite('shouldHandleTouch', function () {
    test('handles pointerdown event', function () {
      const pointerEvent = new PointerEvent('pointerdown');
      assert.isTrue(Blockly.Touch.shouldHandleEvent(pointerEvent));
    });

    test('handles multiple pointerdown events', function () {
      const pointerEvent1 = new PointerEvent('pointerdown');
      const pointerEvent2 = new PointerEvent('pointerdown');
      Blockly.Touch.shouldHandleEvent(pointerEvent1);
      assert.isTrue(Blockly.Touch.shouldHandleEvent(pointerEvent2));
    });

    test('does not handle pointerup if not tracking touch', function () {
      const pointerEvent = new PointerEvent('pointerup');
      assert.isFalse(Blockly.Touch.shouldHandleEvent(pointerEvent));
    });

    test('handles pointerup if already tracking a touch', function () {
      const pointerdown = new PointerEvent('pointerdown');
      const pointerup = new PointerEvent('pointerup');
      // Register the pointerdown event first
      Blockly.Touch.shouldHandleEvent(pointerdown);
      assert.isTrue(Blockly.Touch.shouldHandleEvent(pointerup));
    });

    test('handles pointerdown if this is a new touch', function () {
      const pointerdown = new PointerEvent('pointerdown', {
        pointerId: 1,
        pointerType: 'touch',
      });
      assert.isTrue(Blockly.Touch.shouldHandleEvent(pointerdown));
    });

    test('does not handle pointerdown if part of a different touch', function () {
      const pointerdown1 = new PointerEvent('pointerdown', {
        pointerId: 1,
        pointerType: 'touch',
      });
      const pointerdown2 = new PointerEvent('pointerdown', {
        pointerId: 2,
        pointerType: 'touch',
      });
      Blockly.Touch.shouldHandleEvent(pointerdown1);
      assert.isFalse(Blockly.Touch.shouldHandleEvent(pointerdown2));
    });

    test('does not handle pointerup if not tracking touch', function () {
      const pointerup = new PointerEvent('pointerup', {
        pointerId: 1,
        pointerType: 'touch',
      });
      assert.isFalse(Blockly.Touch.shouldHandleEvent(pointerup));
    });

    test('handles pointerup if part of existing touch', function () {
      const pointerdown = new PointerEvent('pointerdown', {
        pointerId: 1,
        pointerType: 'touch',
      });
      const pointerup = new PointerEvent('pointerdown', {
        pointerId: 1,
        pointerType: 'touch',
      });
      Blockly.Touch.shouldHandleEvent(pointerdown);
      assert.isTrue(Blockly.Touch.shouldHandleEvent(pointerup));
    });
  });

  suite('getTouchIdentifierFromEvent', function () {
    test('is pointerId for mouse PointerEvents', function () {
      const pointerdown = new PointerEvent('pointerdown', {
        pointerId: 7,
        pointerType: 'mouse',
      });
      assert.equal(Blockly.Touch.getTouchIdentifierFromEvent(pointerdown), 7);
    });

    test('is pointerId for touch PointerEvents', function () {
      const pointerdown = new PointerEvent('pointerdown', {
        pointerId: 42,
        pointerType: 'touch',
      });
      assert.equal(Blockly.Touch.getTouchIdentifierFromEvent(pointerdown), 42);
    });
  });
});
