'use strict';

/**
 * Mocha configuration for running the Blockly unit suite headless under Node +
 * jsdom. See tests/mocha/node-setup.mjs for the DOM/global bootstrap.
 *
 * To run or debug a single file:
 *
 *   npx mocha --config tests/mocha/.mocharc.node.cjs tests/mocha/foo_test.js
 *
 * Console output from the tests is suppressed; set BLOCKLY_TEST_CONSOLE=1 to
 * see it. See tests/mocha/node-setup.mjs.
 */

module.exports = {
  ui: 'tdd',
  'node-option': ['enable-source-maps'],
  reporter: './tests/mocha/quiet_reporter.cjs',
  parallel: true,
  require: ['./tests/mocha/node-setup.mjs'],
  timeout: 10000,
  exit: true,
};
