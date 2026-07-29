/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Mocha root setup for running the Blockly unit suite headless
 * under Node using JSDom.
 *
 * It registers a JSDom DOM, browser globals the tests and Blockly
 * expect, installs the geometry stubs JSDom lacks, exposes sinon as a global,
 * loads Blockly + the standard blocks + the JavaScript generator, and installs
 * the shared DOM fixtures. The same fixtures and tests run in the browser via
 * `npm run test:mocha:interactive`.
 */

import {config as chaiConfig} from 'chai';
import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import sinon from 'sinon';
import {installFixtures} from './test_helpers/dom_fixtures.js';
import {
  HEADLESS_VIEWPORT_SIZE,
  installSvgLayoutStubs,
} from './test_helpers/svg_layout_stubs.js';

const buildDir = `${import.meta.dirname}/../../build`;

// Create the DOM. The "localhost" URL makes tests/scripts/load.mjs select
// uncompressed mode (importing build/src/**), matching the browser file:// run.
const dom = new JSDOM(
  '<!doctype html><html><body tabindex="-1"></body></html>',
  {
    pretendToBeVisual: true,
    url: 'http://localhost/tests/mocha/index.html',
  },
);
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
 *
 * @param {string} name The global name.
 * @return {boolean} Whether defineGlobal() can safely define it.
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
 * @return {!Array<string>} The interface names to install.
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

// Tests use sinon and chai's config as ambient globals (sinon) / shared config.
globalThis.sinon = sinon;
chaiConfig.showDiff = false;

// Silence console output from the tests and from Blockly itself.
//
// A number of tests deliberately drive error paths that log, or inadvertently
// trigger logging, and workspaceTeardown() reports the errors it swallows, so
// running the tests is quite noisy.
//
// Set BLOCKLY_TEST_CONSOLE=1 to see the output when debugging.
if (!process.env.BLOCKLY_TEST_CONSOLE) {
  for (const method of ['log', 'info', 'warn', 'error', 'debug', 'trace']) {
    console[method] = () => {};
  }
}

// Make sinon's fake clock advance with real time.
//
// sharedTestSetup() freezes the clock, and JSDom drives requestAnimationFrame
// off setTimeout, so frames only run when something advances the clock. The
// only thing that does so mid-test is the Events.fire stub's clock.runAll(), so
// a queueRender() landing after the last fired event leaves its frame unrun —
// and with it the finishQueuedRenders() promise it would resolve. Any test
// awaiting that promise then hangs until teardown. Advancing with real time
// keeps frames flowing without giving up the clock's manual tick/runAll
// control, which tests still rely on.
//
// Browsers do not need this: there, sinon fakes requestAnimationFrame itself
// rather than JSDom's setTimeout-backed one, so the browser harness (which does
// not load this file) is unaffected.
const createSandbox = sinon.createSandbox.bind(sinon);
sinon.createSandbox = function (...args) {
  const sandbox = createSandbox(...args);
  const useFakeTimers = sandbox.useFakeTimers.bind(sandbox);
  sandbox.useFakeTimers = (config = {}) =>
    useFakeTimers({...config, shouldAdvanceTime: true});
  return sandbox;
};

// Install geometry stubs (getBBox/getCTM/getScreenCTM/createSVGPoint, canvas
// text measurement) that JSDom does not implement.
installSvgLayoutStubs(window);

// Load Blockly, the standard blocks and the JavaScript generator, and expose
// them as globals, mirroring what tests/mocha/index.html does in the browser.
const Blockly = await import('../../build/blockly.loader.mjs');
await import('../../build/blocks.loader.mjs');
const {javascriptGenerator} = await import('../../build/javascript.loader.mjs');

globalThis.Blockly = Blockly;
globalThis.javascriptGenerator = javascriptGenerator;

// Load English messages. build/msg/en.js is a classic script (not a module)
// that augments the global Blockly.Msg, exactly as the browser harness loads it
// via a <script> tag. Run it in the global context so its top-level
// `var Blockly = Blockly || ...` picks up the global Blockly just set.
vm.runInThisContext(readFileSync(`${buildDir}/msg/en.js`, 'utf8'));

// Register the shared test blocks (test_fields_*, test_dropdowns_*, etc.) that
// many suites rely on.
const require = createRequire(import.meta.url);
vm.runInThisContext(
  readFileSync(require.resolve('@blockly/block-test'), 'utf8'),
);

// Install the shared DOM fixtures now that Blockly is loaded.
installFixtures(window.document);

// The browser harness sizes #blocklyDiv with CSS; JSDom applies no layout, so
// set it explicitly. Everything Blockly injects inside it is sized in
// percentages and resolves against this via the stubs installed above.
const blocklyDiv = window.document.getElementById('blocklyDiv');
blocklyDiv.style.width = `${HEADLESS_VIEWPORT_SIZE.width}px`;
blocklyDiv.style.height = `${HEADLESS_VIEWPORT_SIZE.height}px`;

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
