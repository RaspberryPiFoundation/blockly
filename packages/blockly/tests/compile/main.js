/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Main

// Core
// Either require 'Blockly.requires', or just the components you use:
/* eslint-disable-next-line no-unused-vars */
// TODO: I think we need to make sure these get exported?
// import type {BlocklyOptions} from '../../core/blockly_options.js';
import {inject} from '../../build/src/core/inject.js';
import {getMainWorkspace} from '../../build/src/core/common.js';
import {Msg} from '../../build/src/core/msg.js';
import '../../build/src/core/renderers/geras/renderer.js';
import '../../build/src/core/flyout_vertical.js';

// Needed to ensure internal monkey-patching of newBlock is done.
import '../../build/src/core/blockly.js';

// Blocks
import '../../build/src/blocks/logic.js';
import '../../build/src/blocks/loops.js';
import '../../build/src/blocks/math.js';
import '../../build/src/blocks/text.js';
import './test_blocks.js';


function init() {
  Object.assign(Msg, window['Blockly']['Msg']);
  inject('blocklyDiv', /** @type {BlocklyOptions} */ ({
           'toolbox': document.getElementById('toolbox')
         }));
}
window.addEventListener('load', init);


// Called externally from our test driver to see if Blockly loaded more or less
// correctly.  This is not a comprehensive test, but it will catch catastrophic
// fails (by far the most common cases).
window['healthCheck'] = function() {
  // Just check that we have a reasonable number of blocks in the flyout.
  // Expecting 8 blocks, but leave a wide margin.
  try {
    const blockCount =
        getMainWorkspace().getFlyout().getWorkspace().getTopBlocks().length;
    return (blockCount > 5 && blockCount < 100);
  } catch {
    return false;
  }
};
