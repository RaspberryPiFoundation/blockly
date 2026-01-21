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

suite('Toolbox Item Select Event', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = Blockly.inject('blocklyDiv', {
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

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Serialization', function () {
    test('events round-trip through JSON', function () {
      const items = this.workspace.getToolbox().getToolboxItems();
      const origEvent = new Blockly.Events.ToolboxItemSelect(
        items[0].getName(),
        items[1].getName(),
        this.workspace.id,
      );

      const json = origEvent.toJson();
      const newEvent = new Blockly.Events.fromJson(json, this.workspace);

      assert.deepEqual(newEvent, origEvent);
    });
  });
});
