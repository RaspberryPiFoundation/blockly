/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Browser harness for the Blockly unit suite.
 *
 * This is the browser counterpart to node-setup.mjs: it loads Blockly, exposes
 * the globals the tests expect, installs the shared DOM fixtures and configures
 * Mocha. It is bundled, along with every test module, into
 * build/tests/mocha-bundle.js, which is loaded by the test page.
 */

// Prevent Prettier from reordering imports to load blocks before Blockly.
// organize-imports-ignore
import * as Blockly from '#core/blockly.js';
import '#blocks/blocks.js';
import {javascriptGenerator} from '#generators/javascript.js';
import {config as chaiConfig} from 'chai';
import sinon from 'sinon';
import 'mocha/mocha.css';
import {installFixtures} from './test_helpers/dom_fixtures.js';
import '@blockly/block-test';

chaiConfig.showDiff = false;

// Load globals used by the JS tests. This uses Object.defineProperty to avoid
// Typescript inferring typings for these objects and allowing TS tests to
// typecheck without explicitly importing them. When all tests are converted to
// TS, this should be removed.
for (const [name, value] of Object.entries({
  Blockly,
  javascriptGenerator,
  sinon,
})) {
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

// The focusable trees, toolbox definitions and #blocklyDiv the tests expect.
// Shared with the Node harness so both run against identical markup.
installFixtures();

mocha.setup({
  ui: 'tdd',
  failZero: true,
});
