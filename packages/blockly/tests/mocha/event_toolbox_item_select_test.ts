/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Toolbox Item Select Event', function () {
  let workspace: Blockly.WorkspaceSvg;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    workspace = Blockly.inject('blocklyDiv', {
      ...DEFAULT_INJECT_OPTIONS,
      toolbox: {
        'kind': 'categoryToolbox',
        'contents': [
          {
            'kind': 'category',
            'name': 'Control',
            'contents': [
              {
                'kind': 'block',
                'type': 'controls_if',
              },
            ],
          },
          {
            'kind': 'category',
            'name': 'Logic',
            'contents': [
              {
                'kind': 'block',
                'type': 'logic_compare',
              },
            ],
          },
        ],
      },
    });
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  suite('Serialization', function () {
    test('events round-trip through JSON', function () {
      const items = workspace.getToolbox()?.getToolboxItems();
      const firstItem = items?.[0];
      const secondItem = items?.[1];
      assert.instanceOf(firstItem, Blockly.ToolboxCategory);
      assert.instanceOf(secondItem, Blockly.ToolboxCategory);
      const origEvent = new Blockly.Events.ToolboxItemSelect(
        firstItem.getName(),
        secondItem.getName(),
        workspace.id,
      );

      const json = origEvent.toJson();
      const newEvent = Blockly.Events.fromJson(json, workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
