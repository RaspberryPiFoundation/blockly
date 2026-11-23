/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';

/**
 * Triggers pointer event on target.
 *
 * @param target The object receiving the event.
 * @param type The type of mouse event (eg: mousedown, mouseup, click).
 * @param properties Properties to pass into event constructor.
 */
export function dispatchPointerEvent(
  target: Element,
  type: string,
  properties?: {[key: string]: string},
) {
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
 *
 * @param keyCode The keycode for the event. Use Blockly.utils.KeyCodes enum.
 * @param modifiers A list of modifiers. Use Blockly.utils.KeyCodes enum.
 * @return The mocked keydown event.
 */
export function createKeyDownEvent(keyCode: number, modifiers?: number[]) {
  modifiers = modifiers ?? [];
  const event = {
    keyCode: keyCode,
    bubbles: true,
    altKey: modifiers.includes(Blockly.utils.KeyCodes.ALT),
    ctrlKey: modifiers.includes(Blockly.utils.KeyCodes.CTRL),
    metaKey: modifiers.includes(Blockly.utils.KeyCodes.META),
    shiftKey: modifiers.includes(Blockly.utils.KeyCodes.SHIFT),
  };
  return new KeyboardEvent('keydown', event);
}

/**
 * Simulates mouse click by triggering relevant mouse events.
 *
 * @param target The object receiving the event.
 * @param properties Properties to pass into event constructor.
 */
export function simulateClick(
  target: Element,
  properties?: {[key: string]: string},
) {
  dispatchPointerEvent(target, 'pointerdown', properties);
  dispatchPointerEvent(target, 'pointerup', properties);
  dispatchPointerEvent(target, 'click', properties);
}
