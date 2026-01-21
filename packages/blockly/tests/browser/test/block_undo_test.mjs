/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Node.js script to run Automated tests in Chrome, via webdriver.
 */

import * as chai from 'chai';
import {Key} from 'webdriverio';
import {
  dragBlockTypeFromFlyout,
  getAllBlocks,
  screenDirection,
  testFileLocations,
  testSetup,
} from './test_setup.mjs';

suite('Testing undo block movement', function (done) {
  // Setting timeout to unlimited as the webdriver takes a longer time to run than most mocha test
  this.timeout(0);

  test('Undoing Block Movement LTR', async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);
    await testUndoBlock(this.browser, screenDirection.LTR);
  });

  test('Undoing Block Movement RTL', async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND_RTL);
    await testUndoBlock(this.browser, screenDirection.RTL);
  });
});

async function testUndoBlock(browser, direction) {
  // Drag out first function
  await dragBlockTypeFromFlyout(
    browser,
    'Functions',
    'procedures_defreturn',
    50 * direction,
    20,
  );

  await browser.keys([Key.Ctrl, 'z']);

  const allBlocks = await getAllBlocks(browser);
  chai.assert.equal(allBlocks.length, 0);
}
