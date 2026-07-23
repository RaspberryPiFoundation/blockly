/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Block test.
 */

import * as Blockly from 'blockly';
import {toolboxCategories} from '@blockly/dev-tools';
import {
  blocks,
  unregisterProcedureBlocks,
  registerProcedureSerializer,
} from '../src/index';
import {ProcedureBase} from '../src/events_procedure_base';

/* eslint no-unused-vars: "off" */

unregisterProcedureBlocks();
Blockly.common.defineBlocks(blocks);

registerProcedureSerializer();

let workspace1;
let workspace2;

document.addEventListener('DOMContentLoaded', function () {
  injectTwoWorkspaces();
});

/**
 * Injects two workspaces that share procedure models. Undo and redo are off.
 */
function injectTwoWorkspaces() {
  const options = {
    toolbox: toolboxCategories,
  };
  workspace1 = Blockly.inject('blockly1', options);
  workspace2 = Blockly.inject('blockly2', options);
  // If we allow undoing operations, it can create event loops when sharing
  // events between workspaces.
  workspace1.MAX_UNDO = 0;
  workspace2.MAX_UNDO = 0;
  workspace1.addChangeListener(createEventSharer(workspace2));
  workspace2.addChangeListener(createEventSharer(workspace1));

  workspace1.addChangeListener(
    createSerializationListener(workspace1, 'save1'),
  );
  workspace2.addChangeListener(
    createSerializationListener(workspace2, 'save2'),
  );

  document
    .getElementById('load')
    .addEventListener('click', () => reloadWorkspaces());
}

/** Injects one workspace with undo and redo enabled. */
function injectOneWorkspace() {
  const elem = document.getElementById('blockly2');
  elem.parentElement.removeChild(elem);

  const options = {
    toolbox: toolboxCategories,
  };
  workspace1 = Blockly.inject('blockly1', options);

  workspace1.addChangeListener(
    createSerializationListener(workspace1, 'save1'),
  );

  document
    .getElementById('load')
    .addEventListener('click', () => loadWorkspace());
}

/**
 * Returns an event listener that shares procedure and var events from the
 * connected workspace to the other workspace.
 * @param {!Blockly.Workspace} otherWorkspace The workspace to share events to.
 * @returns {function(Blockly.Events.Abstract)} The listener.
 */
function createEventSharer(otherWorkspace) {
  return (e) => {
    if (
      !(e instanceof ProcedureBase) &&
      !(e instanceof Blockly.Events.VarBase)
    ) {
      return;
    }
    let event;
    try {
      event = Blockly.Events.fromJson(e.toJson(), otherWorkspace);
    } catch (e) {
      // Could not deserialize event. This is expected to happen. E.g.
      // when round-tripping parameter deletes, the delete in the
      // secondary workspace cannot be deserialized into the original
      // workspace.
      return;
    }
    event.run(true);
  };
}

/**
 * Returns an event listener that serializes the given workspace to JSON and
 * outputs it to the text area with the given ID.
 * @param {!Blockly.Workspace} workspace The workspace to serialize.
 * @param {string} textAreaId The ID of the text area to output to.
 * @returns {function(Blockly.Events.Abstract)} The listener.
 */
function createSerializationListener(workspace, textAreaId) {
  const textArea = document.getElementById(textAreaId);
  return (e) => {
    if (workspace.isDragging()) return;
    textArea.value = JSON.stringify(
      Blockly.serialization.workspaces.save(workspace),
      undefined,
      2,
    );
  };
}

/**
 * Reloads both workspaces to showcase serialization working.
 */
async function reloadWorkspaces() {
  const save1 = Blockly.serialization.workspaces.save(workspace1);
  const save2 = Blockly.serialization.workspaces.save(workspace2);
  workspace1.clear();
  workspace2.clear();
  // Show people the cleared workspace so they know the reload did something.
  await new Promise((resolve) => setTimeout(resolve, 500));
  Blockly.serialization.workspaces.load(save1, workspace1);
  Blockly.serialization.workspaces.load(save2, workspace2);
}

/** Loads the workspace in single workspace mode. */
function loadWorkspace() {
  const save1 = JSON.parse(document.getElementById('save1').value);
  workspace1.clear();
  Blockly.serialization.workspaces.load(save1, workspace1);
}
