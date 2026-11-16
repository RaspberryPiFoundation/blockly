/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Block test.
 */

import * as Blockly from 'blockly';
import {
  toolboxTestBlocks as toolbox,
  toolboxTestBlocksInit as onInit,
} from '../src/index';

// Do not use the advanced playground here because it will create a circular
// dependency with the @blockly/dev-tools package.
document.addEventListener('DOMContentLoaded', function () {
  const workspace = Blockly.inject('root', {
    toolbox: toolbox,
    maxInstances: {
      test_basic_limit_instances: 3,
    },
  });
  onInit(workspace);
});
