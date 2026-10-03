/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import type {BlockSvg} from '#core/block_svg.js';
import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import type {SinonFakeTimers} from 'sinon';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

/**
 * Places `neighbour` so its previous connection occupies the same workspace
 * position as `connection`.
 */
function alignPreviousConnection(
  neighbour: BlockSvg,
  connection: Blockly.Connection,
) {
  const previous = neighbour.previousConnection;
  assert.isNotNull(previous);
  neighbour.moveBy(connection.x - previous.x, connection.y - previous.y);
}

suite('Expanding a block', function () {
  let workspace: Blockly.WorkspaceSvg;
  let clock: SinonFakeTimers;

  setup(function (this: Mocha.Context) {
    ({clock} = sharedTestSetup.call(this));
    workspace = Blockly.inject('blocklyDiv', DEFAULT_INJECT_OPTIONS);
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  test('bumps neighbouring blocks when uncollapsed', function () {
    const block = workspace.newBlock('controls_if');
    block.initSvg();
    block.render();

    const neighbour = workspace.newBlock('text_print');
    neighbour.initSvg();
    neighbour.render();

    block.setCollapsed(true);
    clock.runAll();

    const next = block.nextConnection;
    assert.isNotNull(next);
    // Place the neighbour against the collapsed block. Expanding moves this
    // connection by more than the snap radius, so bumping only after the
    // following render would miss it.
    alignPreviousConnection(neighbour, next);
    const positionAfterCollapse = neighbour.getRelativeToSurfaceXY();

    block.setCollapsed(false);
    clock.runAll();

    const positionAfterExpand = neighbour.getRelativeToSurfaceXY();
    assert.isFalse(
      positionAfterExpand.x === positionAfterCollapse.x &&
        positionAfterExpand.y === positionAfterCollapse.y,
      'Expected a neighbouring block to be bumped when the block is expanded',
    );
  });
});
