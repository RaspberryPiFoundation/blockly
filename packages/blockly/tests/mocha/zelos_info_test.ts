/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Zelos RenderInfo', function () {
  let workspace: Blockly.WorkspaceSvg;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    workspace = Blockly.inject('blocklyDiv', {renderer: 'zelos'});
    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'tall_round_reporter',
        'message0': '%1',
        'args0': [
          {
            'type': 'field_image',
            'name': 'IMG',
            // Layout uses width/height only; src need not resolve.
            'src': 'about:blank',
            'width': 75,
            'height': 75,
            'alt': 'A',
          },
        ],
        'output': null,
      },
    ]);
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  test('tall image on round reporter keeps corners inside the caps', function () {
    const block = workspace.newBlock('tall_round_reporter');
    block.initSvg();
    block.render();

    const size = block.getHeightWidth();
    const fieldSize = block.getField('IMG')!.getSize();
    const horizontalPad = size.width - fieldSize.width;

    // Height-aware round-cap clearance for a 75px field (radius 42) needs
    // more than the centerline-only pad (24px) but less than keeping the
    // full caps (84px), so the rectangle corners stay inside the curve.
    assert.isAbove(horizontalPad, 24);
    assert.isBelow(horizontalPad, 84);
  });
});
