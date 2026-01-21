/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as eventUtils from '../../../build/src/core/events/utils.js';
import {FocusManager} from '../../../build/src/core/focus_manager.js';

/**
 * Safely disposes of Blockly workspace, logging any errors.
 * Assumes that sharedTestSetup has also been called. This should be called
 * using workspaceTeardown.call(this).
 * @param {!Blockly.Workspace} workspace The workspace to dispose.
 */
export function workspaceTeardown(workspace) {
  try {
    this.clock.runAll(); // Run all queued setTimeout calls.
    workspace.dispose();
    this.clock.runAll(); // Run all remaining queued setTimeout calls.
  } catch (e) {
    const testRef = this.currentTest || this.test;
    console.error(testRef.fullTitle() + '\n', e);
  }
}

/**
 * Creates stub for Blockly.Events.fire that advances the clock forward after
 * the event fires so it is processed immediately instead of on a timeout.
 * @param {!SinonClock} clock The sinon clock.
 * @return {!SinonStub} The created stub.
 * @private
 */
function createEventsFireStubFireImmediately_(clock) {
  const stub = sinon.stub(eventUtils.TEST_ONLY, 'fireInternal');
  stub.callsFake(function (event) {
    // Call original method.
    stub.wrappedMethod.call(this, ...arguments);
    // Advance clock forward to run any queued events.
    clock.runAll();
  });
  return stub;
}

/**
 * Adds message to shared cleanup object so that it is cleaned from
 *    Blockly.Messages global in sharedTestTeardown.
 * @param {!Object} sharedCleanupObj The shared cleanup object created in
 *    sharedTestSetup.
 * @param {string} message The message to add to shared cleanup object.
 */
export function addMessageToCleanup(sharedCleanupObj, message) {
  sharedCleanupObj.messagesCleanup_.push(message);
}

/**
 * Adds block type to shared cleanup object so that it is cleaned from
 *    Blockly.Blocks global in sharedTestTeardown.
 * @param {!Object} sharedCleanupObj The shared cleanup object created in
 *    sharedTestSetup.
 * @param {string} blockType The block type to add to shared cleanup object.
 */
export function addBlockTypeToCleanup(sharedCleanupObj, blockType) {
  sharedCleanupObj.blockTypesCleanup_.push(blockType);
}

/**
 * Wraps Blockly.defineBlocksWithJsonArray using stub in order to keep track of
 * block types passed in to method on shared cleanup object so they are cleaned
 * from Blockly.Blocks global in sharedTestTeardown.
 * @param {!Object} sharedCleanupObj The shared cleanup object created in
 *    sharedTestSetup.
 * @private
 */
function wrapDefineBlocksWithJsonArrayWithCleanup_(sharedCleanupObj) {
  const stub = sinon.stub(
    Blockly.common.TEST_ONLY,
    'defineBlocksWithJsonArrayInternal',
  );
  stub.callsFake(function (jsonArray) {
    if (jsonArray) {
      jsonArray.forEach((jsonBlock) => {
        if (jsonBlock) {
          addBlockTypeToCleanup(sharedCleanupObj, jsonBlock['type']);
        }
      });
    }
    // Calls original method.
    stub.wrappedMethod.call(this, ...arguments);
  });
}

/**
 * Shared setup method that sets up fake timer for clock so that pending
 * setTimeout calls can be cleared in test teardown along with other common
 * stubs. Should be called in setup of outermost suite using
 * sharedTestSetup.call(this).
 * The sinon fake timer defined on this.clock_ should not be reset in tests to
 * avoid causing issues with cleanup in sharedTestTeardown.
 *
 * Stubs created in this setup (unless disabled by options passed):
 *  - Blockly.Events.fire - this.eventsFireStub - wraps fire event to trigger
 *      fireNow_ call immediately, rather than on timeout
 *  - Blockly.defineBlocksWithJsonArray - thin wrapper that adds logic to keep
 *      track of block types defined so that they can be undefined in
 *      sharedTestTeardown and calls original method.
 *
 * @param {Object<string, boolean>} options Options to enable/disable setup
 *    of certain stubs.
 * @return {{clock: *}} The fake clock (as part of an object to make refactoring
 *     easier).
 */
export function sharedTestSetup(options = {}) {
  this.sharedSetupCalled_ = true;
  // Sandbox created for greater control when certain stubs are cleared.
  this.sharedSetupSandbox_ = sinon.createSandbox();
  this.clock = this.sharedSetupSandbox_.useFakeTimers();
  if (options['fireEventsNow'] === undefined || options['fireEventsNow']) {
    // Stubs event firing unless passed option "fireEventsNow: false"
    this.eventsFireStub = createEventsFireStubFireImmediately_(this.clock);
  }
  this.sharedCleanup = {
    blockTypesCleanup_: [],
    messagesCleanup_: [],
  };
  this.blockTypesCleanup_ = this.sharedCleanup.blockTypesCleanup_;
  this.messagesCleanup_ = this.sharedCleanup.messagesCleanup_;

  // Set up FocusManager to run in isolation for this test.
  this.globalDocumentEventListeners = [];
  const testState = this;
  const addDocumentEventListener = function (type, listener) {
    testState.globalDocumentEventListeners.push({type, listener});
    document.addEventListener(type, listener);
  };
  const specificFocusManager = new FocusManager(addDocumentEventListener);
  this.oldGetFocusManager = FocusManager.getFocusManager;
  FocusManager.getFocusManager = () => specificFocusManager;

  wrapDefineBlocksWithJsonArrayWithCleanup_(this.sharedCleanup);
  return {
    clock: this.clock,
  };
}

/**
 * Shared cleanup method that clears up pending setTimeout calls, disposes of
 * workspace, and resets global variables. Should be called in setup of
 * outermost suite using sharedTestTeardown.call(this).
 */
export function sharedTestTeardown() {
  const testRef = this.currentTest || this.test;
  if (!this.sharedSetupCalled_) {
    console.error('"' + testRef.fullTitle() + '" did not call sharedTestSetup');
  }

  try {
    if (this.workspace) {
      workspaceTeardown.call(this, this.workspace);
      this.workspace = null;
    } else {
      this.clock.runAll(); // Run all queued setTimeout calls.
    }
  } catch (e) {
    console.error(testRef.fullTitle() + '\n', e);
  } finally {
    // Clear Blockly.Event state.
    eventUtils.setGroup(false);
    while (!eventUtils.isEnabled()) {
      eventUtils.enable();
    }
    eventUtils.setRecordUndo(true);
    if (eventUtils.TEST_ONLY.FIRE_QUEUE.length) {
      // If this happens, it may mean that some previous test is missing cleanup
      // (i.e. a previous test added an event to the queue on a timeout that
      // did not use a stubbed clock).
      eventUtils.TEST_ONLY.FIRE_QUEUE.length = 0;
      console.warn(
        '"' +
          testRef.fullTitle() +
          '" needed cleanup of Blockly.Events.TEST_ONLY.FIRE_QUEUE. This may ' +
          'indicate leakage from an earlier test',
      );
    }

    // Restore all stubbed methods.
    this.sharedSetupSandbox_.restore();
    sinon.restore();

    const blockTypes = this.sharedCleanup.blockTypesCleanup_;
    for (let i = 0; i < blockTypes.length; i++) {
      delete Blockly.Blocks[blockTypes[i]];
    }
    const messages = this.sharedCleanup.messagesCleanup_;
    for (let i = 0; i < messages.length; i++) {
      delete Blockly.Msg[messages[i]];
    }

    Blockly.WidgetDiv.testOnly_setDiv(null);

    // Remove the globally registered listener from FocusManager to avoid state
    // being shared across test boundaries.
    for (const registeredListener of this.globalDocumentEventListeners) {
      const eventType = registeredListener.type;
      const eventListener = registeredListener.listener;
      document.removeEventListener(eventType, eventListener);
    }
    this.globalDocumentEventListeners = [];
    FocusManager.getFocusManager = this.oldGetFocusManager;
  }
}

/**
 * Creates stub for Blockly.utils.idGenerator.genUid that returns the provided id or ids.
 * Recommended to also assert that the stub is called the expected number of
 * times.
 * @param {string|!Array<string>} returnIds The return values to use for the
 *    created stub. If a single value is passed, then the stub always returns
 *    that value.
 * @return {!SinonStub} The created stub.
 */
export function createGenUidStubWithReturns(returnIds) {
  const stub = sinon.stub(Blockly.utils.idGenerator.TEST_ONLY, 'genUid');
  if (Array.isArray(returnIds)) {
    for (let i = 0; i < returnIds.length; i++) {
      stub.onCall(i).returns(returnIds[i]);
    }
  } else {
    stub.returns(returnIds);
  }
  return stub;
}
