'use strict';

let workspace = null;

function start() {
  // Create main workspace.
  workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox-categories'),
  });
}
