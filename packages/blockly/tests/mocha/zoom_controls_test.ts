/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import type sinon from 'sinon';
import {assertEventFired, assertEventNotFired} from './test_helpers/events.js';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';
import {simulateClick} from './test_helpers/user_input.js';

suite('Zoom Controls', function () {
  let workspace: Blockly.WorkspaceSvg;
  let eventsFireStub: sinon.SinonStub;

  setup(function (this: Mocha.Context) {
    ({eventsFireStub} = sharedTestSetup.call(this));
    workspace = Blockly.inject('blocklyDiv', {
      ...DEFAULT_INJECT_OPTIONS,
      'zoom': {'controls': true},
    });
  });
  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  suite('Events', function () {
    test('Zoom in', function () {
      const control = workspace.getSvgGroup().querySelector('.blocklyZoomIn');
      assert.isNotNull(control);
      simulateClick(control);

      assertEventFired(
        eventsFireStub,
        Blockly.Events.Click,
        {targetType: 'zoom_controls', type: Blockly.Events.CLICK},
        workspace.id,
        undefined,
      );
      assertEventNotFired(eventsFireStub, Blockly.Events.Click, {
        targetType: 'workspace',
        type: Blockly.Events.CLICK,
      });
      assert.closeTo(workspace.getScale(), 1.2, 0.05);
    });
    test('Zoom out', function () {
      const control = workspace.getSvgGroup().querySelector('.blocklyZoomOut');
      assert.isNotNull(control);
      simulateClick(control);

      assertEventFired(
        eventsFireStub,
        Blockly.Events.Click,
        {targetType: 'zoom_controls', type: Blockly.Events.CLICK},
        workspace.id,
        undefined,
      );
      assertEventNotFired(eventsFireStub, Blockly.Events.Click, {
        targetType: 'workspace',
        type: Blockly.Events.CLICK,
      });
      assert.closeTo(workspace.getScale(), 0.8, 0.05);
    });
    test('Reset zoom', function () {
      const control = workspace
        .getSvgGroup()
        .querySelector('.blocklyZoomReset');
      assert.isNotNull(control);
      simulateClick(control);

      assertEventFired(
        eventsFireStub,
        Blockly.Events.Click,
        {targetType: 'zoom_controls', type: Blockly.Events.CLICK},
        workspace.id,
        undefined,
      );
      assertEventNotFired(eventsFireStub, Blockly.Events.Click, {
        targetType: 'workspace',
        type: Blockly.Events.CLICK,
      });
      assert.equal(workspace.getScale(), 1);
    });
  });

  suite('Focus', function () {
    test('is not claimed as a workspace focus node', function () {
      const zoomIn = workspace
        .getParentSvg()
        .querySelector<HTMLElement>('.blocklyZoomIn');
      assert.isNotNull(zoomIn);
      assert.strictEqual(zoomIn.getAttribute('tabindex'), '0');
      assert.isNull(
        Blockly.FocusableTreeTraverser.findFocusableNodeFor(zoomIn, workspace),
      );
    });
  });
});
