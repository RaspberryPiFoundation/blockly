/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import { blocks } from './blocks/text';
import { mutatorBlocks } from './blocks/list';
import { LIST_MUTATOR } from './mutators/list_mutator';
import { forBlock } from './generators/javascript';
import { javascriptGenerator } from 'blockly/javascript';
import { save, load } from './serialization';
import { toolbox } from './toolbox';
import './index.css';

// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);
Blockly.common.defineBlocks(mutatorBlocks);
Blockly.Extensions.registerMutator('list_mutator', LIST_MUTATOR, function () {
  this.itemCount = 1;
});

Object.assign(javascriptGenerator.forBlock, forBlock);
registerAddItem();
registerRemoveItem();

// Set up UI elements and inject Blockly
const codeDiv = document.getElementById('generatedCode').firstChild;
const outputDiv = document.getElementById('output');
const blocklyDiv = document.getElementById('blocklyDiv');
const ws = Blockly.inject(blocklyDiv, { toolbox });

function registerAddItem() {
  const addItem = {
    displayText: 'Add Item',
    preconditionFn: function (scope) {
      if (
        scope.focusedNode instanceof Blockly.BlockSvg &&
        scope.focusedNode.type === 'resizable_list'
      ) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback: (scope) => {
      scope.focusedNode.addConnection();
    },
    id: 'add_item',
    weight: 100,
  };
  Blockly.ContextMenuRegistry.registry.register(addItem);
}

function registerRemoveItem() {
  const removeItem = {
    displayText: 'Remove Item',
    preconditionFn: function (scope) {
      if (
        scope.focusedNode instanceof Blockly.BlockSvg &&
        scope.focusedNode.type === 'resizable_list'
      ) {
        if (scope.focusedNode.itemCount <= 1) {
          return 'disabled';
        }
        return 'enabled';
      }
      return 'hidden';
    },
    callback: (scope) => {
      scope.focusedNode.removeConnection();
    },
    id: 'remove_item',
    weight: 110,
  };
  Blockly.ContextMenuRegistry.registry.register(removeItem);
}

// This function resets the code and output divs, shows the
// generated code from the workspace, and evals the code.
// In a real application, you probably shouldn't use `eval`.
const runCode = () => {
  const code = javascriptGenerator.workspaceToCode(ws);
  codeDiv.innerText = code;

  outputDiv.innerHTML = '';

  // Wrap `eval` in a `try/catch` so that any runtime errors are
  // logged to the console, instead of failing quietly.
  try {
    eval(code);
  } catch (error) {
    console.log(error);
  }
};

// Load the initial state from storage and run the code.
load(ws);
runCode();

// Every time the workspace changes state, save the changes to storage.
ws.addChangeListener((e) => {
  // UI events are things like scrolling, zooming, etc.
  // No need to save after one of these.
  if (e.isUiEvent) return;
  save(ws);
});

// Whenever the workspace changes meaningfully, run the code again.
ws.addChangeListener((e) => {
  // Don't run the code when the workspace finishes loading; we're
  // already running it once when the application starts.
  // Don't run the code during drags; we might have invalid state.
  if (
    e.isUiEvent ||
    e.type == Blockly.Events.FINISHED_LOADING ||
    ws.isDragging()
  ) {
    return;
  }
  runCode();
});
