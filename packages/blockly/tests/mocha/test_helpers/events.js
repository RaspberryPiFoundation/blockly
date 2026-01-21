/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../../node_modules/chai/index.js';

/**
 * Creates spy for workspace fireChangeListener
 * @param {!Blockly.Workspace} workspace The workspace to spy fireChangeListener
 *    calls on.
 * @return {!SinonSpy} The created spy.
 */
export function createChangeListenerSpy(workspace) {
  const spy = sinon.spy();
  workspace.addChangeListener(spy);
  return spy;
}

/**
 * Creates a mock event for testing if arbitrary events get fired/received.
 * @param {!Blockly.Workspace} workspace The workspace to create the mock in.
 * @return {!Object} A mock event that can be fired via Blockly.Events.fire
 */
export function createMockEvent(workspace) {
  return {
    isNull: () => false,
    workspaceId: workspace.id,
  };
}

/**
 * Asserts whether the given xml property has the expected property.
 * @param {!Node} xmlValue The xml value to check.
 * @param {!Node|string} expectedValue The expected value.
 * @param {string=} message Optional message to use in assert message.
 * @private
 */
function assertXmlPropertyEqual_(xmlValue, expectedValue, message) {
  const value = Blockly.Xml.domToText(xmlValue);
  if (expectedValue instanceof Node) {
    expectedValue = Blockly.Xml.domToText(expectedValue);
  }
  assert.equal(value, expectedValue, message);
}

/**
 * Asserts that the given object has the expected xml properties.
 * @param {Object} obj The object to check.
 * @param {Object<string, Node|string>} expectedXmlProperties The expected xml
 *    properties.
 * @private
 */
function assertXmlProperties_(obj, expectedXmlProperties) {
  Object.keys(expectedXmlProperties).map((key) => {
    const value = obj[key];
    const expectedValue = expectedXmlProperties[key];
    if (expectedValue === undefined) {
      assert.isUndefined(
        value,
        'Expected ' + key + ' property to be undefined',
      );
      return;
    }
    assert.exists(value, 'Expected ' + key + ' property to exist');
    assertXmlPropertyEqual_(value, expectedValue, 'Checking property ' + key);
  });
}

/**
 * Whether given key indicates that the property is xml.
 * @param {string} key The key to check.
 * @return {boolean} Whether the given key is for xml property.
 * @private
 */
function isXmlProperty_(key) {
  return key.toLowerCase().endsWith('xml');
}

/**
 * Asserts that the given event has the expected values.
 * @param {!Blockly.Events.Abstract} event The event to check.
 * @param {string} expectedType Expected type of event fired.
 * @param {string} expectedWorkspaceId Expected workspace id of event fired.
 * @param {?string} expectedBlockId Expected block id of event fired.
 * @param {!Object<string, *>} expectedProperties Map of of additional expected
 *    properties to check on fired event.
 * @param {boolean=} [isUiEvent=false] Whether the event is a UI event.
 * @param {string=} message Optional message to prepend assert messages.
 */
export function assertEventEquals(
  event,
  expectedType,
  expectedWorkspaceId,
  expectedBlockId,
  expectedProperties,
  isUiEvent = false,
  message,
) {
  let prependMessage = message ? message + ' ' : '';
  prependMessage += 'Event fired ';
  assert.equal(event.type, expectedType, prependMessage + 'type');
  assert.equal(
    event.workspaceId,
    expectedWorkspaceId,
    prependMessage + 'workspace id',
  );
  assert.equal(event.blockId, expectedBlockId, prependMessage + 'block id');
  Object.keys(expectedProperties).map((key) => {
    const value = event[key];
    const expectedValue = expectedProperties[key];
    if (expectedValue === undefined) {
      assert.isUndefined(value, prependMessage + key);
      return;
    }
    assert.exists(value, prependMessage + key);
    if (isXmlProperty_(key)) {
      assertXmlPropertyEqual_(value, expectedValue, prependMessage + key);
    } else {
      assert.equal(value, expectedValue, prependMessage + key);
    }
  });
  if (isUiEvent) {
    assert.isTrue(event.isUiEvent);
  } else {
    assert.isFalse(event.isUiEvent);
  }
}

/**
 * Asserts that an event with the given values was fired.
 * @param {!SinonSpy|!SinonSpyCall} spy The spy or spy call to use.
 * @param {function(new:Blockly.Events.Abstract)} instanceType Expected instance
 *    type of event fired.
 * @param {!Object<string, *>} expectedProperties Map of of expected properties
 *    to check on fired event.
 * @param {string} expectedWorkspaceId Expected workspace id of event fired.
 * @param {?string=} expectedBlockId Expected block id of event fired.
 */
export function assertEventFired(
  spy,
  instanceType,
  expectedProperties,
  expectedWorkspaceId,
  expectedBlockId,
) {
  const baseProps = {};
  if (expectedWorkspaceId) baseProps.workspaceId = expectedWorkspaceId;
  if (expectedBlockId) baseProps.blockId = expectedBlockId;
  expectedProperties = Object.assign(baseProps, expectedProperties);
  const expectedEvent = sinon.match
    .instanceOf(instanceType)
    .and(sinon.match(expectedProperties));
  sinon.assert.calledWith(spy, expectedEvent);
}

/**
 * Returns a matcher that asserts that the actual object has the same properties
 * and values (shallowly equated) as the expected object.
 * @param {!Object} expected The expected set of properties we expect the
 *    actual object to have.
 * @return {function(*): boolean} A matcher that returns true if the `actual`
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
 * @param {!SinonSpy|!SinonSpyCall} spy The spy or spy call to use.
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
  sinon.assert.calledWith(
    spy,
    sinon.match.instanceOf(instanceType).and(shallowMatch(properties)),
  );
}

/**
 * Asserts that an event with the given values was not fired.
 * @param {!SpyCall} spy The spy to use.
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

/**
 * Filters out xml properties from given object based on key.
 * @param {Object<string, *>} properties The properties to filter.
 * @return {Array<Object<string, *>>} A list containing split non
 *    xml properties and xml properties. [Object<string, *>, Object<string, *>]
 * @private
 */
function splitByXmlProperties_(properties) {
  const xmlProperties = {};
  const nonXmlProperties = {};
  Object.keys(properties).forEach((key) => {
    if (isXmlProperty_(key)) {
      xmlProperties[key] = properties[key];
      return false;
    } else {
      nonXmlProperties[key] = properties[key];
    }
  });
  return [nonXmlProperties, xmlProperties];
}

/**
 * Asserts that the event passed to the nth call of the given spy has the
 * expected values. Assumes that the event is passed as the first argument.
 * @param {!SinonSpy} spy The spy to use.
 * @param {number} n Which call to check.
 * @param {function(new:Blockly.Events.Abstract)} instanceType Expected instance
 *    type of event fired.
 * @param {Object<string, *>} expectedProperties Map of of expected properties
 *    to check on fired event.
 * @param {string} expectedWorkspaceId Expected workspace id of event fired.
 * @param {?string=} expectedBlockId Expected block id of event fired.
 */
export function assertNthCallEventArgEquals(
  spy,
  n,
  instanceType,
  expectedProperties,
  expectedWorkspaceId,
  expectedBlockId,
) {
  const nthCall = spy.getCall(n);
  const splitProperties = splitByXmlProperties_(expectedProperties);
  const nonXmlProperties = splitProperties[0];
  const xmlProperties = splitProperties[1];

  assertEventFired(
    nthCall,
    instanceType,
    nonXmlProperties,
    expectedWorkspaceId,
    expectedBlockId,
  );
  const eventArg = nthCall.firstArg;
  assertXmlProperties_(eventArg, xmlProperties);
}
