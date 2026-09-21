/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';
import {testAWorkspace} from './test_helpers/workspace.ts';

suite('Workspace', function () {
  const wrapper: {
    workspace?: Blockly.Workspace;
    clock?: sinon.SinonFakeTimers;
  } = {};

  setup(function (this: Mocha.Context) {
    const {clock} = sharedTestSetup.call(this);
    wrapper.clock = clock;
    wrapper.workspace = new Blockly.Workspace();
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, wrapper.workspace);
  });

  testAWorkspace(wrapper);
});
