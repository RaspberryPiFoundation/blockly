/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import * as sinon from 'sinon';

/**
 * Returns a matcher that asserts that the actual object has the same properties
 * and values (shallowly equated) as the expected object.
 * @param {!Object} expected The expected set of properties we expect the
 *    actual object to have.
 * @returns {function(*): boolean} A matcher that returns true if the `actual`
 *     object has all of the properties of the `expected` param, with the same
 *     values.
 */
function shallowMatch(expected) {
  return (actual) => {
    for (const key in expected) {
      if (actual[key] !== expected[key]) {
        return false;
      }
    }
    return true;
  };
}

/**
 * Asserts that an event with the given values (shallowly evaluated) was fired.
 * @param {!sinon.SinonSpyCall|!sinon.SinonSpy} spy The spy or spy call to use.
 * @param {function(new:Blockly.Events.Abstract)} instanceType Expected instance
 *    type of event fired.
 * @param {!Object<string, *>} expectedProperties Map of of expected properties
 *    to check on fired event.
 * @param {string} expectedWorkspaceId Expected workspace id of event fired.
 * @param {?string=} expectedBlockId Expected block id of event fired.
 */
export function assertEventFiredShallow(
  spy,
  instanceType,
  expectedProperties,
  expectedWorkspaceId,
  expectedBlockId,
) {
  const properties = {
    ...expectedProperties,
    workspaceId: expectedWorkspaceId,
    blockId: expectedBlockId,
  };
  sinon.assert.match(
    /** @type {sinon.SinonSpy} */ (spy).getCalls()[0].firstArg,
    sinon.match
      .instanceOf(instanceType)
      .and(sinon.match(shallowMatch(properties))),
  );
  // TODO: Why does the above assert work but not this one???
  //   Also it does work when it's in the other pluging
  // sinon.assert.calledWith(
  //     spy,
  //     sinon.match.instanceOf(instanceType)
  //         .and(sinon.match(shallowMatch(properties))));
}

/**
 * Asserts that an event with the given values was not fired.
 * @param {!sinon.SinonSpy} spy The spy to use.
 * @param {function(new:Blockly.Events.Abstract)} instanceType Expected instance
 *    type of event fired.
 * @param {!Object<string, *>} expectedProperties Map of of expected properties
 *    to check on fired event.
 * @param {string=} expectedWorkspaceId Expected workspace id of event fired.
 * @param {?string=} expectedBlockId Expected block id of event fired.
 */
export function assertEventNotFired(
  spy,
  instanceType,
  expectedProperties,
  expectedWorkspaceId,
  expectedBlockId,
) {
  if (expectedWorkspaceId !== undefined) {
    expectedProperties.workspaceId = expectedWorkspaceId;
  }
  if (expectedBlockId !== undefined) {
    expectedProperties.blockId = expectedBlockId;
  }
  const expectedEvent = sinon.match
    .instanceOf(instanceType)
    .and(sinon.match(expectedProperties));
  sinon.assert.neverCalledWith(spy, expectedEvent);
}
