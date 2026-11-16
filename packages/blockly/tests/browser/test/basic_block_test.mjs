/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Node.js script to run Automated tests in Chrome, via
 * webdriver, of basic Blockly block functionality.
 */

import * as chai from 'chai';
import {
  dragNthBlockFromFlyout,
  getAllBlocks,
  testFileLocations,
  testSetup,
} from './test_setup.mjs';

suite('Basic block tests', function (done) {
  // Setting timeout to unlimited as the webdriver takes a longer time
  // to run than most mocha test
  this.timeout(0);

  // Setup Selenium for all of the tests
  suiteSetup(async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);
  });

  test('Drag three blocks into the workspace', async function () {
    for (let i = 1; i <= 3; i++) {
      await dragNthBlockFromFlyout(this.browser, 'Logic', 0, 50, 50);
      chai.assert.equal((await getAllBlocks(this.browser)).length, i);
    }
  });
});
