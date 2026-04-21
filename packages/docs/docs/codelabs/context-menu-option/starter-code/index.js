'use strict';

let workspace = null;

function start() {
  Blockly.ContextMenuItems.registerCommentOptions();
  // Create main workspace.
  workspace = Blockly.inject('blocklyDiv', {
    toolbox: toolboxSimple,
  });
}
