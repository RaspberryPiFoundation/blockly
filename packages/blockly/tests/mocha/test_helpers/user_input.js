/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {KeyCodes} from '../../../build/src/core/utils/keycodes.js';

/**
 * Triggers pointer event on target.
 * @param {!EventTarget} target The object receiving the event.
 * @param {string} type The type of mouse event (eg: mousedown, mouseup,
 *    click).
 * @param {Object<string, string>=} properties Properties to pass into event
 *    constructor.
 */
export function dispatchPointerEvent(target, type, properties) {
  const eventInitDict = {
    cancelable: true,
    bubbles: true,
    isPrimary: true,
    pressure: 0.5,
    clientX: 10,
    clientY: 10,
  };
  if (properties) {
    Object.assign(eventInitDict, properties);
  }
  const event = new PointerEvent(type, eventInitDict);
  target.dispatchEvent(event);
}

/**
 * Creates a key down event used for testing.
 * @param {number} keyCode The keycode for the event. Use Blockly.utils.KeyCodes enum.
 * @param {!Array<number>=} modifiers A list of modifiers. Use Blockly.utils.KeyCodes enum.
 * @return {!KeyboardEvent} The mocked keydown event.
 */
export function createKeyDownEvent(keyCode, modifiers) {
  const event = {
    keyCode: keyCode,
  };
  if (modifiers && modifiers.length > 0) {
    event.altKey = modifiers.includes(KeyCodes.ALT);
    event.ctrlKey = modifiers.includes(KeyCodes.CTRL);
    event.metaKey = modifiers.includes(KeyCodes.META);
    event.shiftKey = modifiers.includes(KeyCodes.SHIFT);
  }
  return new KeyboardEvent('keydown', event);
}

/**
 * Simulates mouse click by triggering relevant mouse events.
 * @param {!EventTarget} target The object receiving the event.
 * @param {Object<string, string>=} properties Properties to pass into event
 *    constructor.
 */
export function simulateClick(target, properties) {
  dispatchPointerEvent(target, 'pointerdown', properties);
  dispatchPointerEvent(target, 'pointerup', properties);
  dispatchPointerEvent(target, 'click', properties);
}
