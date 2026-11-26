/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Mocha root setup for running the Blockly plugin tests headless
 * under Node using JSDom.
 *
 * It registers a JSDom DOM and defines the browser globals which the tests and
 * Blockly expect. It also stubs the canvas text measurement and resets focus
 * between tests.
 */

import {JSDOM} from 'jsdom';

// Create the DOM.
const dom = new JSDOM('<!doctype html><div id="blocklyDiv"></div>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
const {window} = dom;

/**
 * Defines a global property, overriding read-only Node built-ins (e.g.
 * navigator, location, Event) with the JSDom equivalents.
 * @param {string} name The global name.
 * @param {*} value The value to assign.
 */
function defineGlobal(name, value) {
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

/**
 * Whether a global of this name can be replaced.
 *
 * Some properties, like `Infinity` and `NaN` are non-configurable on Node's
 * global object, so attempting to overwrite them in defineGlobal() throws.
 * @param {string} name The global name.
 * @returns {boolean} Whether defineGlobal() can safely define it.
 */
function isRedefinableGlobal(name) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
  return !descriptor || descriptor.configurable;
}

/**
 * Window members that Blockly and the tests use unqualified.
 *
 * Blockly's source was written for a browser, where `window` is the global
 * object, so it uses `document`, `requestAnimationFrame(...)`, etc. without the
 * `window.` prefix. Under Node globalThis is not JSDom's window, so those names
 * have to be copied across for the code to resolve them.
 *
 * Unlike the DOM interfaces below, these are listed explicitly rather than
 * derived, because bulk-copying everything lowercase off the window would be
 * problematic, as some of them collide with globals Node already provides, and
 * may throw or conflict with sinon's patches. If a ReferenceError for something
 * that lives on window is encountered in the tests, it should likely be added
 * here.
 * @constant {!Array<string>}
 */
const WINDOW_MEMBERS = [
  'window',
  'document',
  'navigator',
  'location',
  'history',
  'customElements',
  'getComputedStyle',
  'getSelection',
  'requestAnimationFrame',
  'cancelAnimationFrame',
];

/**
 * Collects the DOM interfaces JSDom exposes (Node, Element, etc), so
 * that a test needing one does not first have to register it here.
 *
 * They are identified by their leading capital, which is the naming convention
 * for interfaces in every Web Interface Definition Language spec; everything
 * lowercase is a window member, handled by WINDOW_MEMBERS above.
 * @param {!Window} win The JSDom window.
 * @returns {!Array<string>} The interface names to install.
 */
function domInterfaceNames(win) {
  const names = new Set();
  // Walk the prototype chain too: JSDom defines some of these on
  // Window.prototype rather than on the window object itself.
  for (let obj = win; obj; obj = Object.getPrototypeOf(obj)) {
    for (const name of Object.getOwnPropertyNames(obj)) {
      if (/^[A-Z]/.test(name) && isRedefinableGlobal(name)) {
        names.add(name);
      }
    }
  }
  return [...names];
}

// Only what JSDom actually provides is installed; anything it does not
// implement (matchMedia, ResizeObserver, etc) is skipped, and a test
// that needs one has to stub it.
for (const name of [...domInterfaceNames(window), ...WINDOW_MEMBERS]) {
  if (window[name] !== undefined) {
    defineGlobal(name, window[name]);
  }
}

/** Approximate width in px of a single character, for text measurement. */
const CHAR_WIDTH = 8;

/**
 * Minimal 2D canvas context exposing only what Blockly's text measurement
 * uses.
 */
class FakeCanvasContext {
  font = '';

  /**
   * @param {string} text The text to measure.
   * @returns {{width: number}} An approximate text metrics object.
   */
  measureText(text) {
    return {width: (text ? text.length : 0) * CHAR_WIDTH};
  }
}

// JSDom's canvas has no 2D context (returns null and logs "Not
// implemented"). Provide a measurement-only context so text widths are
// non-zero and the noise is silenced.
const canvas = window.HTMLCanvasElement?.prototype;
if (canvas) {
  const originalGetContext = canvas.getContext;
  canvas.getContext = function (type, ...rest) {
    if (type === '2d') {
      return new FakeCanvasContext();
    }
    return originalGetContext
      ? originalGetContext.call(this, type, ...rest)
      : null;
  };
}

/**
 * Root hook plugin: reset DOM focus between tests.
 *
 * JSDom does not reset document.activeElement when the focused element is
 * removed from the document, so disposing a workspace can leave one of its
 * fields focused. The next test then starts with a stale activeElement, and
 * showing a popup fires a focusout from outside the current workspace, which
 * FocusManager reads as the popover losing focus and hides it mid-show.
 *
 * Browsers reset activeElement to <body> when the focused element is detached,
 * so the browser harness (which does not load this file) needs no equivalent.
 */
export const mochaHooks = {
  afterEach() {
    const active = window.document.activeElement;
    if (active && active !== window.document.body) active.blur?.();
  },
};
